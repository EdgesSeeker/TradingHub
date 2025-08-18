import React, { useState } from 'react';
import { Calendar, Download, FileText, AlertTriangle, CheckCircle, Brain, Loader2 } from 'lucide-react';
import { analyzeWeeklyReport, exportAIAnalysis } from '../services/aiAnalysis';
import storage from '../utils/storage';

const WeeklyReportGenerator = ({ trades, onReportGenerated }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [generatedReport, setGeneratedReport] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  // Funktion um das Datum für eine bestimmte Woche zu berechnen
  function getWeekDateRange(year, weekNumber) {
    const startDate = new Date(year, 0, 1);
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() + (weekNumber - 1) * 7 - startDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek,
      end: endOfWeek
    };
  }

  // Funktion um das Datum für eine Woche zu formatieren
  function formatWeekDate(year, weekNumber) {
    const { start, end } = getWeekDateRange(year, weekNumber);
    const startStr = start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    const endStr = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    return `${startStr} - ${endStr}`;
  }

  function getWeekTrades(trades, year, weekNumber) {
    const startDate = new Date(year, 0, 1);
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() + (weekNumber - 1) * 7 - startDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    console.log(`🔍 Searching for trades between ${startOfWeek.toLocaleDateString()} and ${endOfWeek.toLocaleDateString()}`);
    console.log(`📊 Total trades available: ${trades.length}`);
    
    return trades.filter(trade => {
      // Try different date fields that might exist
      let tradeDate;
      if (trade.entryDate) {
        tradeDate = new Date(trade.entryDate);
      } else if (trade.date) {
        tradeDate = new Date(trade.date);
      } else if (trade.exitDate) {
        tradeDate = new Date(trade.exitDate);
      } else {
        console.log(`⚠️ Trade ${trade.symbol} has no date field:`, trade);
        return false;
      }
      
      const isInWeek = tradeDate >= startOfWeek && tradeDate <= endOfWeek;
      if (isInWeek) {
        console.log(`✅ Found trade: ${trade.symbol} on ${tradeDate.toLocaleDateString()}`);
      }
      return isInWeek;
    });
  }

  function generateWeeklyReport(trades, year, weekNumber) {
    const weekTrades = getWeekTrades(trades, year, weekNumber);
    
    if (weekTrades.length === 0) {
      return {
        year,
        weekNumber,
        generatedAt: new Date().toISOString(),
        summary: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          openTrades: 0,
          totalPnL: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          maxWin: 0,
          maxLoss: 0,
          ruleCompliance: 0,
          ruleViolations: 0
        },
        trades: [],
        mistakes: [],
        highlights: [],
        ruleViolations: [],
        detailedTrades: []
      };
    }

    // Sammle alle Trade-Details aus dem Book of Truth
    const detailedTrades = weekTrades.map(trade => ({
      ...trade,
      // Alle verfügbaren Felder aus dem Book of Truth
      setupNotes: trade.setupNotes || '',
      entryNotes: trade.entryNotes || '',
      exitNotes: trade.exitNotes || '',
      executionNotes: trade.executionNotes || '',
      mentalGame: trade.mentalGame || {},
      lessonsLearned: trade.lessonsLearned || '',
      nextTimeActions: trade.nextTimeActions || '',
      riskManagement: trade.riskManagement || '',
      marketConditions: trade.marketConditions || '',
      technicalAnalysis: trade.technicalAnalysis || '',
      fundamentalAnalysis: trade.fundamentalAnalysis || '',
      emotionalState: trade.emotionalState || '',
      entryTime: trade.entryTime || '',
      exitTime: trade.exitTime || '',
      holdDuration: trade.holdDuration || '',
      stopLoss: trade.stopLoss || '',
      takeProfit: trade.takeProfit || '',
      riskRewardRatio: trade.riskRewardRatio || '',
      positionSize: trade.positionSize || '',
      marketTrend: trade.marketTrend || '',
      sectorPerformance: trade.sectorPerformance || '',
      newsEvents: trade.newsEvents || '',
      personalNotes: trade.personalNotes || '',
      tradeJournal: trade.tradeJournal || '',
      postTradeReview: trade.postTradeReview || ''
    }));

    // Helper function to get PnL from various possible fields
    const getTradePnL = (trade) => {
      const toNum = (v) => {
        if (v === undefined || v === null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return parseFloat(v.replace(/[^0-9.-]/g, '')) || 0;
        return 0;
      };

      if (trade.pnl !== undefined && trade.pnl !== null) return toNum(trade.pnl);
      if (trade.profit !== undefined && trade.profit !== null) return toNum(trade.profit);
      if (trade.profitLoss !== undefined && trade.profitLoss !== null) return toNum(trade.profitLoss);
      if (trade.realizedPnL !== undefined && trade.realizedPnL !== null) return toNum(trade.realizedPnL);
      if (trade.unrealizedPnL !== undefined && trade.unrealizedPnL !== null) return toNum(trade.unrealizedPnL);
      
      // Calculate from entry/exit prices if available
      const entry = toNum(trade.entryPrice);
      const exit = toNum(trade.exitPrice);
      const size = toNum(trade.positionSize || trade.shares || trade.quantity || trade.size);
      if (entry && exit && size) {
        const priceDiff = exit - entry;
        const sign = trade.direction && trade.direction.toLowerCase() === 'short' ? -1 : 1;
        return priceDiff * size * sign;
      }
      
      return 0;
    };

    // Helper function to get rule adherence
    const getRuleAdherence = (trade) => {
      // Check multiple possible fields for rule adherence
      if (trade.ruleAdherence) {
        if (typeof trade.ruleAdherence === 'string') {
          return trade.ruleAdherence.toLowerCase();
        }
        return trade.ruleAdherence;
      }
      if (trade.ruleCompliance) {
        if (typeof trade.ruleCompliance === 'string') {
          return trade.ruleCompliance.toLowerCase();
        }
        return trade.ruleCompliance;
      }
      if (trade.rulesFollowed !== undefined) {
        return trade.rulesFollowed ? 'followed' : 'violated';
      }
      if (trade.ruleAdherence === true || trade.ruleAdherence === false) {
        return trade.ruleAdherence ? 'followed' : 'violated';
      }
      return 'unknown';
    };

    const winningTrades = weekTrades.filter(t => t.status === 'closed' && getTradePnL(t) > 0);
    const losingTrades = weekTrades.filter(t => t.status === 'closed' && getTradePnL(t) < 0);
    const openTrades = weekTrades.filter(t => t.status === 'open');
    
    const totalPnL = weekTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + getTradePnL(t), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + getTradePnL(t), 0) / losingTrades.length : 0;
    const maxWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => getTradePnL(t))) : 0;
    const maxLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => getTradePnL(t))) : 0;
    
    // Count rule compliance for ALL trades (including open ones)
    const ruleCompliance = weekTrades.filter(t => getRuleAdherence(t) === 'followed').length;
    const ruleViolations = weekTrades.filter(t => getRuleAdherence(t) === 'violated').length;
    
    // Debug logging for rule compliance
    console.log('🔍 Rule Compliance Debug:');
    weekTrades.forEach((trade, index) => {
      const adherence = getRuleAdherence(trade);
      console.log(`Trade ${index + 1}: ${trade.symbol} - Rule Adherence: ${adherence} (${trade.ruleAdherence})`);
    });
    console.log(`📊 Total Rule Compliance: ${ruleCompliance}/${weekTrades.length}`);

    // Sammle Mistakes und Highlights
    const mistakes = weekTrades
      .filter(t => t.mistakes && t.mistakes.length > 0)
      .flatMap(t => t.mistakes.map(m => ({ ...m, symbol: t.symbol, date: t.date })));

    const highlights = weekTrades
      .filter(t => t.highlights && t.highlights.length > 0)
      .flatMap(t => t.highlights.map(h => ({ ...h, symbol: t.symbol, date: t.date })));

    const ruleViolationsList = weekTrades
      .filter(t => getRuleAdherence(t) === 'violated')
      .map(t => ({
        symbol: t.symbol,
        date: t.date || t.entryDate || t.exitDate || '',
        reason: t.ruleViolationReason || 'No reason specified'
      }));

    return {
      year,
      weekNumber,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTrades: weekTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        openTrades: openTrades.length,
        totalPnL,
        winRate: weekTrades.length > 0 ? (winningTrades.length / weekTrades.length) * 100 : 0,
        avgWin,
        avgLoss,
        maxWin,
        maxLoss,
        ruleCompliance,
        ruleViolations
      },
      trades: weekTrades,
      mistakes,
      highlights,
      ruleViolations: ruleViolationsList,
      detailedTrades
    };
  }

  const handleGenerateReport = async () => {
    // Automatisch alle Trades der ausgewählten Woche laden
    const weekTrades = getWeekTrades(trades, selectedYear, selectedWeek);
    
    if (weekTrades.length === 0) {
      alert(`Keine Trades für Woche ${selectedWeek} (${formatWeekDate(selectedYear, selectedWeek)}) gefunden.`);
      return;
    }
    
    console.log(`📊 Lade ${weekTrades.length} Trades für Woche ${selectedWeek} (${formatWeekDate(selectedYear, selectedWeek)})`);
    
    const report = generateWeeklyReport(trades, selectedYear, selectedWeek);
    setGeneratedReport(report);
    
    // Automatisch KI-Analyse starten
    if (weekTrades.length > 0) {
      console.log('🤖 Starte automatische KI-Analyse...');
      await handleAIAnalysis();
    }
    
    if (onReportGenerated) {
      onReportGenerated(report);
    }
  };

  const handleExportCSV = (report) => {
    if (!report || report.trades.length === 0) {
      alert('Kein Report zum Exportieren verfügbar');
      return;
    }

    try {
      console.log('Exporting CSV for report:', report);
      
      // Erweiterte CSV-Export mit allen Book of Truth Details
      const headers = [
        'Symbol', 'Date', 'Status', 'Entry Price', 'Exit Price', 'Shares', 
        'P&L', 'P&L %', 'Rule Adherence', 'Rule Violation Reason', 
        'Execution Notes', 'Mental Game Notes', 'Setup Notes', 'Entry Notes', 'Exit Notes',
        'Risk Management', 'Market Conditions', 'Technical Analysis', 'Fundamental Analysis',
        'Emotional State', 'Lessons Learned', 'Next Time Actions', 'Entry Time', 'Exit Time',
        'Hold Duration', 'Stop Loss', 'Take Profit', 'Risk/Reward Ratio', 'Position Size',
        'Market Trend', 'Sector Performance', 'News Events', 'Personal Notes', 'Trade Journal',
        'Post Trade Review'
      ];
      
      const csvContent = [
        headers.join(','),
        ...report.detailedTrades.map(trade => [
          trade.symbol,
          trade.date,
          trade.status,
          trade.entryPrice,
          trade.exitPrice || '',
          trade.shares,
          trade.pnl || '',
          trade.pnlPercent || '',
          trade.ruleAdherence || '',
          trade.ruleViolationReason || '',
          `"${(trade.executionNotes || '').replace(/"/g, '""')}"`,
          `"${JSON.stringify(trade.mentalGame || {}).replace(/"/g, '""')}"`,
          `"${(trade.setupNotes || '').replace(/"/g, '""')}"`,
          `"${(trade.entryNotes || '').replace(/"/g, '""')}"`,
          `"${(trade.exitNotes || '').replace(/"/g, '""')}"`,
          `"${(trade.riskManagement || '').replace(/"/g, '""')}"`,
          `"${(trade.marketConditions || '').replace(/"/g, '""')}"`,
          `"${(trade.technicalAnalysis || '').replace(/"/g, '""')}"`,
          `"${(trade.fundamentalAnalysis || '').replace(/"/g, '""')}"`,
          `"${(trade.emotionalState || '').replace(/"/g, '""')}"`,
          `"${(trade.lessonsLearned || '').replace(/"/g, '""')}"`,
          `"${(trade.nextTimeActions || '').replace(/"/g, '""')}"`,
          trade.entryTime || '',
          trade.exitTime || '',
          trade.holdDuration || '',
          trade.stopLoss || '',
          trade.takeProfit || '',
          trade.riskRewardRatio || '',
          trade.positionSize || '',
          trade.marketTrend || '',
          trade.sectorPerformance || '',
          `"${(trade.newsEvents || '').replace(/"/g, '""')}"`,
          `"${(trade.personalNotes || '').replace(/"/g, '""')}"`,
          `"${(trade.tradeJournal || '').replace(/"/g, '""')}"`,
          `"${(trade.postTradeReview || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      console.log('CSV Content length:', csvContent.length);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log('Blob created:', blob);
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `weekly_report_${selectedYear}_week_${selectedWeek}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV export completed');
      alert('CSV erfolgreich exportiert!');
      
    } catch (error) {
      console.error('CSV Export error:', error);
      alert(`CSV Export fehlgeschlagen: ${error.message}`);
    }
  };

  const handleExportText = (report) => {
    if (!report || report.trades.length === 0) {
      alert('Kein Report zum Exportieren verfügbar');
      return;
    }

    try {
      console.log('Exporting Text for report:', report);
      
      let textContent = `WEEKLY TRADING REPORT - Week ${selectedWeek}/${selectedYear}\n`;
      textContent += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n`;
      textContent += `Total Trades: ${report.summary.totalTrades}\n`;
      textContent += `Win Rate: ${report.summary.winRate.toFixed(1)}%\n`;
      textContent += `Total P&L: $${report.summary.totalPnL}\n`;
      textContent += `Rule Compliance: ${report.summary.ruleCompliance}/${report.summary.totalTrades}\n\n`;
      
      textContent += 'DETAILED TRADES:\n';
      textContent += '='.repeat(80) + '\n';
      
      report.detailedTrades.forEach((trade, index) => {
        textContent += `\n${index + 1}. ${trade.symbol} (${trade.date})\n`;
        textContent += `   Status: ${trade.status}\n`;
        textContent += `   Entry: $${trade.entryPrice} | Exit: ${trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}\n`;
        textContent += `   Shares: ${trade.shares}\n`;
        textContent += `   P&L: ${trade.pnl ? `$${trade.pnl}` : 'N/A'}\n`;
        textContent += `   Rules: ${trade.ruleAdherence === 'followed' ? 'Followed' : 'Violated'}\n`;
        if (trade.ruleViolationReason) {
          textContent += `   Violation: ${trade.ruleViolationReason}\n`;
        }
        
        // Book of Truth details
        if (trade.setupNotes) textContent += `   Setup Notes: ${trade.setupNotes}\n`;
        if (trade.entryNotes) textContent += `   Entry Notes: ${trade.entryNotes}\n`;
        if (trade.exitNotes) textContent += `   Exit Notes: ${trade.exitNotes}\n`;
        if (trade.executionNotes) textContent += `   Execution Notes: ${trade.executionNotes}\n`;
        if (trade.mentalGame && Object.keys(trade.mentalGame).length > 0) textContent += `   Mental Game: ${JSON.stringify(trade.mentalGame)}\n`;
        if (trade.lessonsLearned) textContent += `   Lessons Learned: ${trade.lessonsLearned}\n`;
        if (trade.nextTimeActions) textContent += `   Next Time Actions: ${trade.nextTimeActions}\n`;
        if (trade.riskManagement) textContent += `   Risk Management: ${trade.riskManagement}\n`;
        if (trade.marketConditions) textContent += `   Market Conditions: ${trade.marketConditions}\n`;
        if (trade.technicalAnalysis) textContent += `   Technical Analysis: ${trade.technicalAnalysis}\n`;
        if (trade.fundamentalAnalysis) textContent += `   Fundamental Analysis: ${trade.fundamentalAnalysis}\n`;
        if (trade.emotionalState) textContent += `   Emotional State: ${trade.emotionalState}\n`;
        if (trade.entryTime) textContent += `   Entry Time: ${trade.entryTime}\n`;
        if (trade.exitTime) textContent += `   Exit Time: ${trade.exitTime}\n`;
        if (trade.holdDuration) textContent += `   Hold Duration: ${trade.holdDuration}\n`;
        if (trade.stopLoss) textContent += `   Stop Loss: ${trade.stopLoss}\n`;
        if (trade.takeProfit) textContent += `   Take Profit: ${trade.takeProfit}\n`;
        if (trade.riskRewardRatio) textContent += `   Risk/Reward: ${trade.riskRewardRatio}\n`;
        if (trade.positionSize) textContent += `   Position Size: ${trade.positionSize}\n`;
        if (trade.marketTrend) textContent += `   Market Trend: ${trade.marketTrend}\n`;
        if (trade.sectorPerformance) textContent += `   Sector Performance: ${trade.sectorPerformance}\n`;
        if (trade.newsEvents) textContent += `   News Events: ${trade.newsEvents}\n`;
        if (trade.personalNotes) textContent += `   Personal Notes: ${trade.personalNotes}\n`;
        if (trade.tradeJournal) textContent += `   Trade Journal: ${trade.tradeJournal}\n`;
        if (trade.postTradeReview) textContent += `   Post Trade Review: ${trade.postTradeReview}\n`;
        
        textContent += '-'.repeat(40) + '\n';
      });
      
      if (report.mistakes.length > 0) {
        textContent += '\nMISTAKES & ERRORS:\n';
        textContent += '='.repeat(80) + '\n';
        report.mistakes.forEach(mistake => {
          textContent += `• ${mistake.symbol} (${mistake.date}): ${mistake.note}\n`;
        });
      }
      
      if (report.highlights.length > 0) {
        textContent += '\nHIGHLIGHTS & SUCCESSES:\n';
        textContent += '='.repeat(80) + '\n';
        report.highlights.forEach(highlight => {
          textContent += `• ${highlight.symbol} (${highlight.date}): ${highlight.note}\n`;
        });
      }
      
      if (report.ruleViolations.length > 0) {
        textContent += '\nRULE VIOLATIONS:\n';
        textContent += '='.repeat(80) + '\n';
        report.ruleViolations.forEach(violation => {
          textContent += `• ${violation.symbol} (${violation.date}): ${violation.reason}\n`;
        });
      }
      
      console.log('Text Content length:', textContent.length);
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      console.log('Text Blob created:', blob);
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `weekly_report_${selectedYear}_week_${selectedWeek}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Text export completed');
      alert('Text-Report erfolgreich exportiert!');
      
    } catch (error) {
      console.error('Text Export error:', error);
      alert(`Text Export fehlgeschlagen: ${error.message}`);
    }
  };

  const handleAIAnalysis = async () => {
    if (!generatedReport) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeWeeklyReport(generatedReport);
      setAiAnalysis(analysis);
      
      // Automatically create weekly review entry
      if (analysis && analysis.rawText) {
        await createWeeklyReviewFromAI(analysis, generatedReport);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      alert('AI-Analyse fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createWeeklyReviewFromAI = async (aiAnalysis, report) => {
    try {
      const aiText = aiAnalysis.rawText;
      
      // Extract data from AI analysis
      const extractValue = (text, pattern) => {
        const match = text.match(pattern);
        return match ? parseFloat(match[1]) : 0;
      };
      
      const extractString = (text, pattern) => {
        const match = text.match(pattern);
        return match ? match[1].trim() : '';
      };
      
      // Extract statistics from AI analysis
      const winRate = extractValue(aiText, /Win rate:\s*([\d.]+)%/);
      const totalPnL = extractValue(aiText, /Total net profit\/loss:\s*\$([\d.-]+)/);
      const avgPnL = extractValue(aiText, /Average profit\/loss per trade:\s*\$([\d.-]+)/);
      const maxWinner = extractString(aiText, /Maximum winner:\s*([^,]+)/);
      const maxLoser = extractString(aiText, /Maximum loser:\s*([^,]+)/);
      const ruleCompliance = extractValue(aiText, /Rule compliance count:\s*(\d+)/);
      const totalTrades = extractValue(aiText, /Total number of trades:\s*(\d+)/);
      
      // Create weekly review entry
      const weeklyReviewEntry = {
        weekNumber: report.weekNumber.toString(),
        year: report.year,
        weekReport: {
          trades: report.trades,
          winRate: winRate,
          riskReward: (report.summary.avgWin / Math.abs(report.summary.avgLoss) || 0).toFixed(2),
          avgPnL: avgPnL,
          maxDrawdown: Math.abs(extractValue(aiText, /Maximum loser.*?\$([\d.-]+)/))
        },
        highlights: '', // Leave empty for manual entry
        challenges: '', // Leave empty for manual entry
        workflowAudit: '', // Leave empty for manual entry
        setupReview: '', // Leave empty for manual entry
        riskAudit: '', // Leave empty for manual entry
        nextWeekGoals: '', // Leave empty for manual entry
        insights: `AI Analysis Summary:
${aiText.includes('Main Observations') ? aiText.split('Main Observations')[1] : 'AI analysis completed successfully'}`
      };

      // Save to storage
      const existingReviews = await storage.getWeeklyReviews() || [];
      const newReview = {
        ...weeklyReviewEntry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedReviews = [newReview, ...existingReviews];
      await storage.saveWeeklyReviews(updatedReviews);
      
      // Show success message
      alert(`✅ Weekly Review für Woche ${report.weekNumber}/${report.year} automatisch erstellt!
      
Die wichtigsten Statistiken wurden aus der KI-Analyse übernommen. Du kannst jetzt deine persönlichen Gedanken und Insights hinzufügen.`);
      
      // Don't reload the page - stay on current page
      
    } catch (error) {
      console.error('Error creating weekly review:', error);
      alert('Fehler beim Erstellen des Weekly Review: ' + error.message);
    }
  };

  const handleExportAIAnalysis = () => {
    if (aiAnalysis && generatedReport) {
      exportAIAnalysis(aiAnalysis, selectedWeek, selectedYear);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1e293b',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #334155'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Calendar size={20} />
        Weekly Report Generator
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginBottom: '0.5rem'
          }}>
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.375rem',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginBottom: '0.5rem'
          }}>
            Week Number
            <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
              (mit Datumsangabe)
            </span>
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.375rem',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          >
            {Array.from({ length: 53 }, (_, i) => i + 1).map(week => {
              const weekDate = formatWeekDate(selectedYear, week);
              const hasTrades = getWeekTrades(trades, selectedYear, week).length > 0;
              return (
                <option key={week} value={week}>
                  Week {week} ({weekDate}) {hasTrades ? `📊 ${getWeekTrades(trades, selectedYear, week).length} Trades` : '📭 Keine Trades'}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#1e40af',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid #3b82f6'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <Brain size={16} color="#fbbf24" />
          <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.875rem' }}>
            Automatische Funktionen
          </span>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
          Beim Generieren wird automatisch: Alle Trades der Woche geladen → Report erstellt → KI-Analyse gestartet → Weekly Review automatisch erstellt mit allen Statistiken
        </p>
      </div>

      <button
        onClick={handleGenerateReport}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '0.5rem',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <Calendar size={16} />
        Generate Report & Create Weekly Review
      </button>
      
      {generatedReport && (
        <div style={{
          backgroundColor: '#334155',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            📊 Report Summary - Week {selectedWeek}/{selectedYear}
            <span style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              fontWeight: '400',
              marginLeft: '0.5rem'
            }}>
              ({formatWeekDate(selectedYear, selectedWeek)})
            </span>
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                {generatedReport.summary.totalTrades}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Trades</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                {generatedReport.summary.winRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Win Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: generatedReport.summary.totalPnL >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {generatedReport.summary.totalPnL >= 0 ? '+' : ''}${generatedReport.summary.totalPnL}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total P&L</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {generatedReport.summary.ruleCompliance}/{generatedReport.summary.totalTrades}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rules Followed</div>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => handleExportCSV(generatedReport)}
              style={{
                padding: '1rem',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText size={16} />
              Export to CSV
            </button>
            
            <button
              onClick={() => handleExportText(generatedReport)}
              style={{
                padding: '1rem',
                backgroundColor: '#8b5cf6',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText size={16} />
              Export to Text
            </button>

            <button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              style={{
                padding: '1rem',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isAnalyzing ? 0.6 : 1
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  KI-Analyse läuft...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  KI-Analyse (manuell)
                </>
              )}
            </button>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div style={{
              marginTop: '1.5rem',
              backgroundColor: '#475569',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #64748b'
            }}>
              <h5 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Brain size={16} />
                KI-Generierte Analyse
              </h5>
              
              <div style={{
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#f8fafc',
                whiteSpace: 'pre-wrap'
              }}>
                {aiAnalysis.rawText}
              </div>
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#475569',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#f8fafc'
              }}>
                <strong>Export contains:</strong> All trade details, mental game notes, execution notes, 
                risk management, market conditions, and performance metrics from the Book of Truth.
              </div>

              <button
                onClick={handleExportAIAnalysis}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={16} />
                KI-Analyse Exportieren
              </button>
            </div>
          )}
          
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#475569',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#f8fafc'
          }}>
            <strong>Export contains:</strong> All trade details, mental game notes, execution notes, 
            risk management, market conditions, and performance metrics from the Book of Truth.
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WeeklyReportGenerator;
