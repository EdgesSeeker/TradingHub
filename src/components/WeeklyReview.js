import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Target, Plus, X, Save, Edit, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import storage from '../utils/storage';
import WeeklyReportGenerator from './WeeklyReportGenerator';
import WeeklyReportViewer from './WeeklyReportViewer';

const WeeklyReview = ({ trades, onTradeUpdated }) => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentEntry, setCurrentEntry] = useState({
    weekNumber: '',
    year: new Date().getFullYear(),
    weekReport: {
      trades: [],
      winRate: 0,
      riskReward: 0,
      avgPnL: 0,
      maxDrawdown: 0
    },
    highlights: '',
    challenges: '',
    workflowAudit: '',
    setupReview: '',
    riskAudit: '',
    nextWeekGoals: '',
    insights: ''
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const loadedEntries = await storage.getWeeklyReviews();
      setEntries(loadedEntries || []);
    } catch (error) {
      console.error('Error loading weekly reviews:', error);
      setEntries([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEntry) {
        const updatedEntries = entries.map(entry => 
          entry.id === editingEntry.id ? { ...currentEntry, id: entry.id } : entry
        );
        await storage.saveWeeklyReviews(updatedEntries);
        setEntries(updatedEntries);
        setEditingEntry(null);
      } else {
        const newEntry = {
          ...currentEntry,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        const updatedEntries = [newEntry, ...entries];
        await storage.saveWeeklyReviews(updatedEntries);
        setEntries(updatedEntries);
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving weekly review:', error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry);
    setShowForm(true);
  };

  const resetForm = () => {
    setCurrentEntry({
      weekNumber: '',
      year: new Date().getFullYear(),
      weekReport: {
        trades: [],
        winRate: 0,
        riskReward: 0,
        avgPnL: 0,
        maxDrawdown: 0
      },
      highlights: '',
      challenges: '',
      workflowAudit: '',
      setupReview: '',
      riskAudit: '',
      nextWeekGoals: '',
      insights: ''
    });
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
  };

  const handleExportReport = (report, format) => {
    if (format === 'csv') {
      // CSV export logic
      const headers = [
        'Symbol', 'Date', 'Status', 'Entry Price', 'Exit Price', 'Shares', 
        'P&L', 'P&L %', 'Rule Adherence', 'Rule Violation Reason', 
        'Execution Notes', 'Mental Game Notes'
      ];
      
      const csvContent = [
        headers.join(','),
        ...report.trades.map(trade => [
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
          `"${JSON.stringify(trade.mentalGame || {}).replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `weekly_report_${report.year}_week_${report.weekNumber}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'text') {
      // Text export logic
      let textContent = `WEEKLY TRADING REPORT - Week ${report.weekNumber}/${report.year}\n`;
      textContent += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n`;
      textContent += `Total Trades: ${report.summary.totalPnL}\n`;
      textContent += `Win Rate: ${report.summary.winRate.toFixed(1)}%\n`;
      textContent += `Total P&L: $${report.summary.totalPnL}\n\n`;
      
      textContent += 'TRADES:\n';
      textContent += '='.repeat(80) + '\n';
      
      report.trades.forEach((trade, index) => {
        textContent += `\n${index + 1}. ${trade.symbol} (${trade.date})\n`;
        textContent += `   Status: ${trade.status}\n`;
        textContent += `   Entry: $${trade.entryPrice} | Exit: ${trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}\n`;
        textContent += `   Shares: ${trade.shares}\n`;
        textContent += `   P&L: ${trade.pnl ? `$${trade.pnl}` : 'N/A'}\n`;
        textContent += `   Rules: ${trade.ruleAdherence === 'followed' ? 'Followed' : 'Violated'}\n`;
        if (trade.ruleViolationReason) {
          textContent += `   Violation: ${trade.ruleViolationReason}\n`;
        }
        if (trade.executionNotes) {
          textContent += `   Notes: ${trade.executionNotes}\n`;
        }
        textContent += '-'.repeat(40) + '\n';
      });
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `weekly_report_${report.year}_week_${report.weekNumber}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderTradingMatrix = () => {
    if (!currentEntry?.weekReport?.trades || currentEntry.weekReport.trades.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Keine Trades für diese Woche verfügbar
        </div>
      );
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('de-DE');
      } catch {
        return 'N/A';
      }
    };

    const getTradeStatus = (trade) => {
      if (trade.status) return trade.status;
      if (trade.exitDate && trade.exitPrice) return 'Closed';
      if (trade.entryDate && trade.entryPrice && !trade.exitDate) return 'Open';
      return 'Unknown';
    };

    return (
      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>📊 Trading Matrix - Alle Trades der Woche</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#334155' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#f8fafc', fontSize: '0.875rem' }}>Symbol</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#f8fafc', fontSize: '0.875rem' }}>Entry Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#f8fafc', fontSize: '0.875rem' }}>Exit Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#f8fafc', fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#f8fafc', fontSize: '0.875rem' }}>Entry Price</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#f8fafc', fontSize: '0.875rem' }}>Exit Price</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#f8fafc', fontSize: '0.875rem' }}>Shares</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#f8fafc', fontSize: '0.875rem' }}>P&L</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#f8fafc', fontSize: '0.875rem' }}>Rules Followed</th>
              </tr>
            </thead>
            <tbody>
              {currentEntry.weekReport.trades.map((trade, index) => {
                const pnl = parseFloat(trade.pnl || trade.profit || trade.profitLoss || 0);
                const isPositive = pnl > 0;
                const status = getTradeStatus(trade);
                const isOpen = status === 'Open';
                
                return (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #334155',
                    backgroundColor: index % 2 === 0 ? '#1e293b' : '#0f172a'
                  }}>
                    <td style={{ padding: '0.75rem', color: '#f8fafc', fontSize: '0.875rem', fontWeight: '600' }}>
                      {trade.symbol}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {formatDate(trade.entryDate || trade.date)}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {formatDate(trade.exitDate)}
                    </td>
                    <td style={{ padding: '0.75rem', color: isOpen ? '#fbbf24' : '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                      {status}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1', fontSize: '0.875rem' }}>
                      ${trade.entryPrice ? parseFloat(trade.entryPrice).toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1', fontSize: '0.875rem' }}>
                      ${trade.exitPrice ? parseFloat(trade.exitPrice).toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {trade.shares || trade.positionSize || 'N/A'}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      color: isPositive ? '#10b981' : '#ef4444', 
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      ${pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {trade.ruleAdherence === 'followed' || trade.ruleCompliance === 'followed' || trade.rulesFollowed === true ? (
                        <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓</span>
                      ) : trade.ruleAdherence === 'violated' || trade.ruleCompliance === 'violated' || trade.rulesFollowed === false ? (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>✗</span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleFieldChange = (field, value) => {
    setCurrentEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Page Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 2rem 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <BarChart3 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              Weekly Review
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Comprehensive weekly trading performance analysis and insights
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem'
      }}>
        {/* Weekly Report Generator */}
        <div style={{ marginBottom: '2rem' }}>
          <WeeklyReportGenerator 
            trades={trades} 
            onReportGenerated={(report, aiAnalysis) => {
              // Auto-fill the weekly review form with report data
              setCurrentEntry(prev => ({
                ...prev,
                weekNumber: report.weekNumber.toString(),
                year: report.year,
                weekReport: {
                  trades: report.trades,
                  winRate: report.summary.winRate,
                  riskReward: report.summary.avgWin / Math.abs(report.summary.avgLoss) || 0,
                  avgPnL: report.summary.totalPnL / report.summary.totalTrades || 0,
                  maxDrawdown: report.summary.maxLoss
                }
              }));
              
              // If AI analysis is available, auto-fill with AI data
              if (aiAnalysis && aiAnalysis.rawText) {
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
                
                // Update the weekly review form with AI data
                setCurrentEntry(prev => ({
                  ...prev,
                  weekReport: {
                    ...prev.weekReport,
                    winRate: winRate,
                    avgPnL: avgPnL,
                    maxDrawdown: Math.abs(extractValue(aiText, /Maximum loser.*?\$([\d.-]+)/))
                  },
                  highlights: `AI Analysis Highlights:
• Win Rate: ${winRate}%
• Total P&L: $${totalPnL}
• Average P&L per Trade: $${avgPnL}
• Best Trade: ${maxWinner}
• Worst Trade: ${maxLoser}
• Rule Compliance: ${ruleCompliance}/${totalTrades} (${totalTrades > 0 ? ((ruleCompliance / totalTrades) * 100).toFixed(1) : 0}%)`,
                  challenges: `AI Analysis Challenges:
${aiText.includes('Common Mistakes') ? aiText.split('Common Mistakes')[1].split('Trade Status')[0] : 'No specific challenges identified in AI analysis'}`,
                  insights: `AI Analysis Summary:
${aiText.includes('Main Observations') ? aiText.split('Main Observations')[1] : 'AI analysis completed successfully'}`
                }));
              }
            }}
            onViewReport={handleViewReport}
          />
        </div>

        {/* Add New Entry Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setEditingEntry(null);
            }}
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
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            Add Weekly Review
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '1000px',
              width: '95%',
              maxHeight: '95vh',
              overflow: 'auto',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  {editingEntry ? 'Edit Weekly Review' : 'New Weekly Review'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                    resetForm();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'grid',
                  gap: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  {/* Week Info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Week Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="53"
                        value={currentEntry.weekNumber}
                        onChange={(e) => handleFieldChange('weekNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#334155',
                          border: '1px solid #475569',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Year
                      </label>
                      <input
                        type="number"
                        value={currentEntry.year}
                        onChange={(e) => handleFieldChange('year', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#334155',
                          border: '1px solid #475569',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Trading Matrix */}
                  {renderTradingMatrix()}

                  {/* 1️⃣ Week Metrics & Highlights */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      1️⃣ Week Metrics & Highlights 📊✨
                    </label>
                    <textarea
                      value={currentEntry.weekMetrics || ''}
                      onChange={(e) => handleFieldChange('weekMetrics', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Win Rate, Risk/Reward, Average P&L, Max Drawdown, Total P&L, Best/Worst Trade, Rule Compliance..."
                    />
                  </div>

                  {/* 2️⃣ Audit: System & Rule Adherence */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      2️⃣ Audit: System & Rule Adherence
                    </label>
                    <textarea
                      value={currentEntry.systemAudit || ''}
                      onChange={(e) => handleFieldChange('systemAudit', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Alle Entries und Exits, Setup/Ziel dokumentiert? Regelverletzungen/Deviations: Number + kurze Beschreibung. Identified emotional trades: [List, Ursache]..."
                    />
                  </div>

                  {/* 3️⃣ Log Verification */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      3️⃣ Log Verification
                    </label>
                    <textarea
                      value={currentEntry.logVerification || ''}
                      onChange={(e) => handleFieldChange('logVerification', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Trade logs reviewed for accuracy: Stimmt Entry/Exit mit Journal/Historie überein? Fehlende Dokumentation auffallen?..."
                    />
                  </div>

                  {/* 4️⃣ Workflow Efficiency */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      4️⃣ Workflow Efficiency 🔧
                    </label>
                    <textarea
                      value={currentEntry.workflowEfficiency || ''}
                      onChange={(e) => handleFieldChange('workflowEfficiency', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Workflow Steps audited: Bottlenecks, zeitraubende Tasks, ausgelassene Schritte notiert. Vorschläge für Vereinfachung..."
                    />
                  </div>

                  {/* 5️⃣ Performance Metrics Comparison */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      5️⃣ Performance Metrics Comparison
                    </label>
                    <textarea
                      value={currentEntry.performanceComparison || ''}
                      onChange={(e) => handleFieldChange('performanceComparison', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Verglichen mit Vorwoche: Entwicklung Win Rate / RRR / Drawdown. Fortschritt, Stagnation oder Rückschritt?..."
                    />
                  </div>

                  {/* 6️⃣ Workspace/Environment Audit */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      6️⃣ Workspace/Environment Audit
                    </label>
                    <textarea
                      value={currentEntry.workspaceAudit || ''}
                      onChange={(e) => handleFieldChange('workspaceAudit', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Workspace audited for distraction/clutter: Unnötige Indikatoren entfernt? Layout unterstützt schnellen Einstieg, Review, Fokus?..."
                    />
                  </div>

                  {/* 7️⃣ Setup & Scan Review */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      7️⃣ Setup & Scan Review 📈
                    </label>
                    <textarea
                      value={currentEntry.setupScanReview || ''}
                      onChange={(e) => handleFieldChange('setupScanReview', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Fokus/NMS-Liste & Scanning: Hat Scanning die richtigen Stocks geliefert? Setup-Win Rates und Failure-Setups dokumentiert?..."
                    />
                  </div>

                  {/* 8️⃣ Risk & Rule Audit */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      8️⃣ Risk & Rule Audit ⚖️
                    </label>
                    <textarea
                      value={currentEntry.riskRuleAudit || ''}
                      onChange={(e) => handleFieldChange('riskRuleAudit', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Risiko-Management geprüft: Risiko je Trade, -Compliance, Sizing analysiert. Systemlücken gefunden? Anpassung oder neue Regel nötig?..."
                    />
                  </div>

                  {/* 9️⃣ Adjustments & Week Goals */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      9️⃣ Adjustments & Week Goals 🎯
                    </label>
                    <textarea
                      value={currentEntry.adjustmentsGoals || ''}
                      onChange={(e) => handleFieldChange('adjustmentsGoals', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Pläne/Anpassungen für kommende Woche: Was muss angepasst werden? Ein Ziel (operativ, prozessual, disziplinarisch). Eine Gewohnheit oder Verbesserung (Kaizen). Next Project Step..."
                    />
                  </div>

                  {/* 10️⃣ Insights & Learnings */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>
                      10️⃣ Insights & Learnings 📚
                    </label>
                    <textarea
                      value={currentEntry.insights || ''}
                      onChange={(e) => handleFieldChange('insights', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="KI-/Mentor Insights: KI-Auto-Highlights (z.B. Win Rate, Regelbrüche, Setup-Statistik, Red Flags). Persönliches Learning/Fokus: Eigene Erkenntnis, die du priorisieren willst..."
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#475569',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#10b981',
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
                    <Save size={16} />
                    {editingEntry ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {entries.length === 0 ? (
            <div style={{
              backgroundColor: '#1e293b',
              padding: '3rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              textAlign: 'center'
            }}>
              <BarChart3 style={{
                width: '3rem',
                height: '3rem',
                color: '#94a3b8',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>
                No Weekly Reviews Yet
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                Start tracking your weekly trading performance and insights
              </p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #334155'
              }}>
                {/* Entry Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Weekly Trading Review (KW {entry.weekNumber}/{entry.year})
                    </h3>
                    
                    {/* Week Report Metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      {[
                        { key: 'winRate', label: 'Win Rate', suffix: '%', color: '#10b981' },
                        { key: 'riskReward', label: 'Risk/Reward', suffix: '', color: '#3b82f6' },
                        { key: 'avgPnL', label: 'Avg P&L', suffix: '$', color: '#f59e0b' },
                        { key: 'maxDrawdown', label: 'Max DD', suffix: '$', color: '#ef4444' }
                      ].map(metric => (
                        <div key={metric.key} style={{
                          backgroundColor: '#334155',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            marginBottom: '0.25rem'
                          }}>
                            {metric.label}
                          </div>
                          <div style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: metric.color
                          }}>
                            {entry.weekReport[metric.key]}{metric.suffix}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => handleEdit(entry)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '0.375rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this weekly review?')) {
                          const updatedEntries = entries.filter(e => e.id !== entry.id);
                          setEntries(updatedEntries);
                          storage.saveWeeklyReviews(updatedEntries);
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#ef4444',
                        border: 'none',
                        borderRadius: '0.375rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Entry Content */}
                <div style={{
                  display: 'grid',
                  gap: '1.5rem'
                }}>
                  {entry.highlights && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#10b981',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <CheckCircle size={16} />
                        Highlights ✨
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.highlights}
                      </p>
                    </div>
                  )}

                  {entry.challenges && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#ef4444',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <AlertTriangle size={16} />
                        Challenges 🚧
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.challenges}
                      </p>
                    </div>
                  )}

                  {entry.workflowAudit && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        🔧 Workflow Audit
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.workflowAudit}
                      </p>
                    </div>
                  )}

                  {entry.setupReview && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        📈 Setup Review
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.setupReview}
                      </p>
                    </div>
                  )}

                  {entry.riskAudit && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        ⚖️ Risk Audit
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.riskAudit}
                      </p>
                    </div>
                  )}

                  {entry.nextWeekGoals && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#3b82f6',
                        marginBottom: '0.5rem'
                      }}>
                        🎯 Next Week Goals
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.nextWeekGoals}
                      </p>
                    </div>
                  )}

                  {entry.insights && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#8b5cf6',
                        marginBottom: '0.5rem'
                      }}>
                        📚 Insights
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.insights}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Report Viewer Modal */}
      {selectedReport && (
        <WeeklyReportViewer
          report={selectedReport}
          onClose={handleCloseReport}
          onExport={handleExportReport}
        />
      )}
    </div>
  );
};

export default WeeklyReview;
