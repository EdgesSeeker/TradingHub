import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, Star, Target, AlertTriangle, CheckCircle, XCircle, Download, Upload, Trash2, Play, Eye } from 'lucide-react';
import storage from '../utils/storage';

const AIAgents = ({ trades, onTradeUpdated, onNavigate }) => {
  const [tradePlans, setTradePlans] = useState([]);
  const [selectedDate, setSelectedDate] = useState('all');
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  const [selectedDateForAI, setSelectedDateForAI] = useState('');
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [showAIReviewModal, setShowAIReviewModal] = useState(false);
  const [selectedPlanForReview, setSelectedPlanForReview] = useState(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [exportDateFilter, setExportDateFilter] = useState('all');

  useEffect(() => {
    loadTradePlans();
  }, []);

  const loadTradePlans = async () => {
    try {
      const plans = await storage.loadSetting('tradePlans') || [];
      setTradePlans(plans);
    } catch (error) {
      console.error('Error loading trade plans:', error);
      setTradePlans([]);
    }
  };

  // Group plans by date
  const getGroupedTradePlans = () => {
    const grouped = tradePlans.reduce((groups, plan) => {
      const dateString = plan.createdAt || plan.plannedDate || new Date().toISOString();
      const date = new Date(dateString).toLocaleDateString('de-DE', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(plan);
      return groups;
    }, {});
    
    return grouped;
  };

  // Get sorted dates
  const getSortedDates = () => {
    const grouped = getGroupedTradePlans();
    return Object.keys(grouped).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('.');
      const [dayB, monthB, yearB] = b.split('.');
      return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
    });
  };

  // Toggle date group expansion
  const toggleDateGroup = (date) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Extract AI ranking from analysis text
  const extractAIRanking = (plan) => {
    if (!plan.aiAnalysis) return 0;
    
    // If we have structured data, use it
    if (plan.aiAnalysisStructured && plan.aiAnalysisStructured.overallRanking) {
      const rankingMatch = plan.aiAnalysisStructured.overallRanking.match(/(\d+(?:\.\d+)?)\/10/);
      return rankingMatch ? parseFloat(rankingMatch[1]) : 0;
    }
    
    const lines = plan.aiAnalysis.split('\n');
    const symbol = plan.symbol;
    
    // First try to find "Overall Ranking:" (new format)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('Overall Ranking:')) {
        const scoreMatch = line.match(/(\d+(?:\.\d+)?)\/10/);
        return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      }
    }
    
    // Fallback to old format: look for symbol-specific ranking
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('PLAN') && line.includes(symbol)) {
        // Find the ranking for this specific symbol
        for (let j = i; j < lines.length; j++) {
          const rankingLine = lines[j].trim();
          if (rankingLine.startsWith('Ranking:')) {
            const scoreMatch = rankingLine.match(/(\d+(?:\.\d+)?)\/10/);
            return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
          }
        }
      }
    }
    return 0;
  };

  // Export trade plans to text file for AI analysis
  const exportTradePlansForAI = () => {
    // Filter plans based on selected date
    let plansToExport = tradePlans;
    if (exportDateFilter !== 'all') {
      plansToExport = tradePlans.filter(plan => {
        const planDate = new Date(plan.createdAt).toLocaleDateString('de-DE', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
        return planDate === exportDateFilter;
      });
    }

    if (plansToExport.length === 0) {
      alert('No trade plans to export for the selected date');
      return;
    }

    let exportText = `TRADE PLANS EXPORT FOR AI ANALYSIS
Generated on: ${new Date().toLocaleString('de-DE')}
Export Date: ${exportDateFilter === 'all' ? 'All Dates' : exportDateFilter}
Total Plans: ${plansToExport.length}

${'='.repeat(80)}

`;

    plansToExport.forEach((plan, index) => {
      const planCalculations = plan.calculations || {};
      const sharesToBuy = planCalculations.sharesNeeded || 0;
      
      exportText += `PLAN ${index + 1}: ${plan.symbol} - ${plan.direction || 'LONG'}
${'='.repeat(50)}

BASIC INFO:
- Symbol: ${plan.symbol}
- Direction: ${plan.direction || 'LONG'}
- Setup: ${plan.setup || 'No Setup'}
- Ranking: ${plan.ranking || 'Not Rated'}/10
- Created: ${new Date(plan.createdAt).toLocaleDateString('de-DE')}

ENTRY & RISK:
- Entry Price: $${parseFloat(plan.entryPrice).toFixed(2)}
- Stop Loss: ${plan.stopLoss ? `$${parseFloat(plan.stopLoss).toFixed(2)}` : 'Not Set'}
- Position Size: ${plan.positionSizePercent}% of portfolio
- Shares to Buy: ${sharesToBuy.toLocaleString()}
- Position Value: $${planCalculations.actualPositionSize ? planCalculations.actualPositionSize.toLocaleString() : 'N/A'}

TRADE PLAN & ANALYSIS:
${plan.tradePlan || 'No trade plan provided'}

FAILURE REASONS:
${plan.failureReasons || 'No failure reasons provided'}

COMPANY ANALYSIS:
${plan.companyAnalysis || 'No company analysis provided'}

CHECKLIST ITEMS:
${plan.checklist && plan.checklist.length > 0 ? plan.checklist.join('\n- ') : 'No checklist items'}

${'='.repeat(80)}

`;
    });

    // Create and download the file
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateSuffix = exportDateFilter === 'all' ? 'all_dates' : exportDateFilter.replace(/\./g, '-');
    link.setAttribute('download', `trade_plans_export_${dateSuffix}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Trade plans exported for AI analysis: ${plansToExport.length} plans for ${exportDateFilter === 'all' ? 'all dates' : exportDateFilter}`);
  };

  // Handle AI analysis result input
  const handleAIAnalysisInput = (e) => {
    setAiAnalysisResult(e.target.value);
  };

  // Parse AI analysis and match to specific trade plans
  const parseAndSaveAIAnalysis = async () => {
    if (!aiAnalysisResult.trim()) {
      alert('Please enter AI analysis result');
      return;
    }

    try {
      const analysisText = aiAnalysisResult.trim();
      const updatedPlans = [...tradePlans];
      let analysisCount = 0;

      // Split the analysis into individual plan analyses
      const planAnalyses = analysisText.split(/(?=Symbol:)/).filter(part => part.trim());

      planAnalyses.forEach(planAnalysis => {
        // Extract symbol from the analysis
        const symbolMatch = planAnalysis.match(/Symbol:\s*([A-Z]+)/);
        if (symbolMatch) {
          const symbol = symbolMatch[1];
          
          // Find matching trade plan
          const planIndex = updatedPlans.findIndex(plan => 
            plan.symbol && plan.symbol.toUpperCase() === symbol.toUpperCase()
          );

          if (planIndex !== -1) {
            // Extract structured data from the analysis
            const structuredAnalysis = extractStructuredAnalysis(planAnalysis);
            
            // Update the plan with structured analysis
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              aiAnalysis: planAnalysis.trim(),
              aiAnalysisStructured: structuredAnalysis
            };
            analysisCount++;
          }
        }
      });

      await storage.saveSetting('tradePlans', updatedPlans);
      setTradePlans(updatedPlans);
      setAiAnalysisResult('');
      
      if (analysisCount > 0) {
        alert(`AI analysis saved to ${analysisCount} trade plan(s)!`);
      } else {
        alert('No matching trade plans found for the provided analysis.');
      }
    } catch (error) {
      console.error('Error saving AI analysis:', error);
      alert('Error saving AI analysis');
    }
  };

  // Extract structured data from AI analysis
  const extractStructuredAnalysis = (analysisText) => {
    const structured = {
      catalysts: '',
      sectorTheme: '',
      fundamentals: '',
      technical: '',
      planStructure: '',
      overallRanking: '',
      catalystsRating: '',
      sectorRating: '',
      fundamentalsRating: '',
      technicalRating: '',
      planStructureRating: ''
    };

    const lines = analysisText.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('Catalysts:')) {
        currentSection = 'catalysts';
        structured.catalysts = line.replace('Catalysts:', '').trim();
      } else if (line.startsWith('Sector/Theme:')) {
        currentSection = 'sectorTheme';
        structured.sectorTheme = line.replace('Sector/Theme:', '').trim();
      } else if (line.startsWith('Fundamentals:')) {
        currentSection = 'fundamentals';
        structured.fundamentals = line.replace('Fundamentals:', '').trim();
      } else if (line.startsWith('Technical:')) {
        currentSection = 'technical';
        structured.technical = line.replace('Technical:', '').trim();
      } else if (line.startsWith('Plan Structure:')) {
        currentSection = 'planStructure';
        structured.planStructure = line.replace('Plan Structure:', '').trim();
             } else if (line.startsWith('Overall Ranking:')) {
         currentSection = 'overallRanking';
         structured.overallRanking = line.replace('Overall Ranking:', '').trim();
       } else if (line.includes('Rating:') && line.includes('/10') && !line.startsWith('Overall Ranking:')) {
        // Extract rating for current section
        const ratingMatch = line.match(/Rating:\s*(\d+(?:\.\d+)?)\/10/);
        if (ratingMatch) {
          const rating = ratingMatch[1];
          switch (currentSection) {
            case 'catalysts':
              structured.catalystsRating = rating;
              break;
            case 'sectorTheme':
              structured.sectorRating = rating;
              break;
            case 'fundamentals':
              structured.fundamentalsRating = rating;
              break;
            case 'technical':
              structured.technicalRating = rating;
              break;
            case 'planStructure':
              structured.planStructureRating = rating;
              break;
          }
        }
      } else if (currentSection && line && !line.startsWith('Symbol:') && !line.startsWith('Overall Ranking')) {
        // Continue adding to current section
        switch (currentSection) {
          case 'catalysts':
            structured.catalysts += ' ' + line;
            break;
          case 'sectorTheme':
            structured.sectorTheme += ' ' + line;
            break;
          case 'fundamentals':
            structured.fundamentals += ' ' + line;
            break;
          case 'technical':
            structured.technical += ' ' + line;
            break;
          case 'planStructure':
            structured.planStructure += ' ' + line;
            break;
          case 'overallRanking':
            structured.overallRanking += ' ' + line;
            break;
        }
      }
    }

    return structured;
  };

  // Save AI analysis to trade plans (legacy function for backward compatibility)
  const saveAIAnalysis = async () => {
    await parseAndSaveAIAnalysis();
  };

  // Calculate combined ranking
  const getCombinedRanking = (plan) => {
    const userRanking = parseFloat(plan.ranking) || 0;
    const aiRanking = extractAIRanking(plan);
    
    if (userRanking > 0 && aiRanking > 0) {
      return ((userRanking + aiRanking) / 2).toFixed(1);
    } else if (userRanking > 0) {
      return userRanking;
    } else if (aiRanking > 0) {
      return aiRanking;
    }
    return 0;
  };

  // Get AI-only ranking for display in AI Agents
  const getAIRanking = (plan) => {
    const aiRanking = extractAIRanking(plan);
    return aiRanking > 0 ? aiRanking : 0;
  };

  // Get ranking color
  const getRankingColor = (score) => {
    if (score >= 7) return '#10b981'; // Green
    if (score >= 6) return '#3b82f6'; // Blue
    if (score >= 5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // Handle Load Plan
  const handleLoadPlan = (plan) => {
    // Navigate to Trade Planning with the plan loaded
    if (onTradeUpdated) {
      onTradeUpdated(plan);
    }
  };

  // Handle Execute Plan
  const handleExecutePlan = (plan) => {
    // Create a trade from the plan
    const newTrade = {
      id: Date.now().toString(),
      symbol: plan.symbol,
      side: plan.direction === 'SHORT' ? 'SELL' : 'BUY',
      quantity: plan.calculations?.sharesNeeded || 0,
      entryPrice: plan.entryPrice,
      entryDate: new Date().toISOString().split('T')[0],
      status: 'open',
      notes: `Executed from trade plan: ${plan.setup || 'No setup'}`,
      stopLoss: plan.stopLoss,
      takeProfit: plan.takeProfit
    };

    if (onTradeUpdated) {
      onTradeUpdated(newTrade);
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this trade plan?')) {
      try {
        const updatedPlans = tradePlans.filter(plan => plan.id !== planId);
        await storage.saveSetting('tradePlans', updatedPlans);
        setTradePlans(updatedPlans);
      } catch (error) {
        console.error('Error deleting trade plan:', error);
        alert('Error deleting trade plan. Please try again.');
      }
    }
  };

  // Handle AI Review
  const handleAIReview = (plan) => {
    setSelectedPlanForReview(plan);
    setShowAIReviewModal(true);
  };

  // Extract AI analysis data for review
  const extractAIAnalysisData = (plan) => {
    if (!plan.aiAnalysis) return null;

    // If we have structured data, use it
    if (plan.aiAnalysisStructured) {
      return {
        catalysts: plan.aiAnalysisStructured.catalysts,
        sectorTheme: plan.aiAnalysisStructured.sectorTheme,
        fundamentals: plan.aiAnalysisStructured.fundamentals,
        technical: plan.aiAnalysisStructured.technical,
        planStructure: plan.aiAnalysisStructured.planStructure,
        ranking: plan.aiAnalysisStructured.overallRanking,
        catalystsRating: plan.aiAnalysisStructured.catalystsRating,
        sectorRating: plan.aiAnalysisStructured.sectorRating,
        fundamentalsRating: plan.aiAnalysisStructured.fundamentalsRating,
        technicalRating: plan.aiAnalysisStructured.technicalRating,
        planStructureRating: plan.aiAnalysisStructured.planStructureRating
      };
    }

    // Fallback to old parsing method for backward compatibility
    const lines = plan.aiAnalysis.split('\n');
    const symbol = plan.symbol;
    let catalysts = '';
    let sectorTheme = '';
    let fundamentals = '';
    let technical = '';
    let planStructure = '';
    let ranking = '';
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('PLAN') && line.includes(symbol)) {
        // Find sections for this specific symbol
        for (let j = i; j < lines.length; j++) {
          const sectionLine = lines[j].trim();
          
          if (sectionLine.startsWith('Catalysts:')) {
            currentSection = 'catalysts';
            catalysts = sectionLine.replace('Catalysts:', '').trim();
          } else if (sectionLine.startsWith('Sector/Theme:')) {
            currentSection = 'sectorTheme';
            sectorTheme = sectionLine.replace('Sector/Theme:', '').trim();
          } else if (sectionLine.startsWith('Fundamentals:')) {
            currentSection = 'fundamentals';
            fundamentals = sectionLine.replace('Fundamentals:', '').trim();
          } else if (sectionLine.startsWith('Technical:')) {
            currentSection = 'technical';
            technical = sectionLine.replace('Technical:', '').trim();
          } else if (sectionLine.startsWith('Plan Structure:')) {
            currentSection = 'planStructure';
            planStructure = sectionLine.replace('Plan Structure:', '').trim();
          } else if (sectionLine.startsWith('Ranking:')) {
            currentSection = 'ranking';
            ranking = sectionLine.replace('Ranking:', '').trim();
          } else if (currentSection && sectionLine && !sectionLine.startsWith('PLAN') && !sectionLine.startsWith('Relative Ranking') && !sectionLine.startsWith('✅')) {
            // Continue adding to current section
            switch (currentSection) {
              case 'catalysts':
                catalysts += ' ' + sectionLine;
                break;
              case 'sectorTheme':
                sectorTheme += ' ' + sectionLine;
                break;
              case 'fundamentals':
                fundamentals += ' ' + sectionLine;
                break;
              case 'technical':
                technical += ' ' + sectionLine;
                break;
              case 'planStructure':
                planStructure += ' ' + sectionLine;
                break;
              case 'ranking':
                ranking += ' ' + sectionLine;
                break;
            }
          }
        }
        break;
      }
    }
    
    return { catalysts, sectorTheme, fundamentals, technical, planStructure, ranking };
  };

  const groupedPlans = getGroupedTradePlans();
  const sortedDates = getSortedDates();

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Brain style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              AI Agents
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              AI-Powered Trade Analysis & Execution
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('trading-routine')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            ← Zurück zur Routine
          </button>
        )}
      </div>

      {/* Trade Plans by Date */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        padding: '1.5rem'
      }}>
                  <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#f8fafc',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={20} />
              Trade Plans by Date
            </h2>
            
            {/* Export Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Date Filter for Export */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: '500'
                }}>
                  Export Date:
                </label>
                <select
                  value={exportDateFilter}
                  onChange={(e) => setExportDateFilter(e.target.value)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Dates</option>
                  {sortedDates.map(date => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Export Button */}
              <button
                onClick={exportTradePlansForAI}
                disabled={tradePlans.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: tradePlans.length > 0 ? '#10b981' : '#64748b',
                  border: 'none',
                  borderRadius: '0.375rem',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: tradePlans.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📄 Export for AI
              </button>
            </div>
          </div>

        {sortedDates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#94a3b8'
          }}>
            <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '1rem' }}>
              No trade plans found. Create plans in Trade Planning first.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedDates.map(date => {
              const plansForDate = groupedPlans[date];
              
              return (
                <div key={date} style={{
                  backgroundColor: '#334155',
                  borderRadius: '0.5rem',
                  border: '1px solid #475569',
                  overflow: 'hidden'
                }}>
                  {/* Date Header */}
                  <div
                    onClick={() => toggleDateGroup(date)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <h3 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#f8fafc'
                    }}>
                      {date} ({plansForDate.length} plans)
                    </h3>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#cbd5e1'
                    }}>
                      {expandedDates.has(date) ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Plans List */}
                  {expandedDates.has(date) && (
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {plansForDate.map(plan => {
                          const planCalculations = plan.calculations || {};
                          const sharesToBuy = planCalculations.sharesNeeded || 0;
                          const combinedRanking = getCombinedRanking(plan);
                          const aiRanking = extractAIRanking(plan);
                          
                          return (
                            <div key={plan.id} style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #475569',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontWeight: '600', 
                                  color: '#f8fafc',
                                  fontSize: '1rem',
                                  marginBottom: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span>{plan.symbol} - {plan.direction || 'LONG'} - {plan.setup || 'No Setup'}</span>
                                  {(() => {
                                    const combinedRanking = getCombinedRanking(plan);
                                    if (combinedRanking > 0) {
                                      return (
                                        <span style={{
                                          color: '#ffffff',
                                          backgroundColor: getRankingColor(combinedRanking),
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.75rem',
                                          fontWeight: '600'
                                        }}>
                                          ⭐ {combinedRanking}/10
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div style={{ 
                                  fontSize: '0.875rem', 
                                  color: '#94a3b8',
                                  marginBottom: '0.125rem'
                                }}>
                                  Entry: ${parseFloat(plan.entryPrice).toFixed(2)} | Shares: {sharesToBuy.toLocaleString()} | Size: {plan.positionSizePercent}%
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#64748b'
                                }}>
                                  Created: {new Date(plan.createdAt).toLocaleDateString('de-DE', { 
                                    day: 'numeric', 
                                    month: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleLoadPlan(plan)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#059669',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Download size={12} />
                                  Load
                                </button>
                                <button
                                  onClick={() => handleExecutePlan(plan)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Play size={12} />
                                  Execute
                                </button>
                                {plan.aiAnalysis && (
                                  <button
                                    onClick={() => handleAIReview(plan)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      backgroundColor: '#8b5cf6',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      color: '#f8fafc',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <Eye size={12} />
                                    AI Review
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePlan(plan.id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc2626',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Review Modal */}
      {showAIReviewModal && selectedPlanForReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
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
                🤖 AI Review - {selectedPlanForReview.symbol}
              </h2>
              <button
                onClick={() => setShowAIReviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>

            {/* Gesamt-Rating */}
            {(() => {
              const combinedRanking = getCombinedRanking(selectedPlanForReview);
              
              if (combinedRanking > 0) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.375rem',
                    border: '2px solid #fbbf24'
                  }}>
                    <span style={{
                      color: '#fbbf24',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>
                      ⭐ Gesamt-Rating:
                    </span>
                    <span style={{
                      color: '#ffffff',
                      backgroundColor: getRankingColor(combinedRanking),
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {combinedRanking}/10
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {(() => {
              const aiData = extractAIAnalysisData(selectedPlanForReview);
              
              if (!aiData) {
                return (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#94a3b8'
                  }}>
                    <Brain size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No AI analysis available for this trade plan.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {aiData.catalysts && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#10b981',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🚀 Catalysts
                        {aiData.catalystsRating && (
                          <span style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {aiData.catalystsRating}/10
                          </span>
                        )}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.catalysts}
                      </p>
                    </div>
                  )}

                  {aiData.sectorTheme && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#3b82f6',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📊 Sector/Theme
                        {aiData.sectorRating && (
                          <span style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {aiData.sectorRating}/10
                          </span>
                        )}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.sectorTheme}
                      </p>
                    </div>
                  )}

                  {aiData.fundamentals && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#f59e0b',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        💼 Fundamentals
                        {aiData.fundamentalsRating && (
                          <span style={{
                            backgroundColor: '#f59e0b',
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {aiData.fundamentalsRating}/10
                          </span>
                        )}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.fundamentals}
                      </p>
                    </div>
                  )}

                  {aiData.technical && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#8b5cf6',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📈 Technical
                        {aiData.technicalRating && (
                          <span style={{
                            backgroundColor: '#8b5cf6',
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {aiData.technicalRating}/10
                          </span>
                        )}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.technical}
                      </p>
                    </div>
                  )}

                  {aiData.planStructure && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#06b6d4',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🎯 Plan Structure
                        {aiData.planStructureRating && (
                          <span style={{
                            backgroundColor: '#06b6d4',
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {aiData.planStructureRating}/10
                          </span>
                        )}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.planStructure}
                      </p>
                    </div>
                  )}

                  {aiData.ranking && (
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#ec4899',
                        marginBottom: '0.5rem'
                      }}>
                        ⭐ KI Analysis Summary
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {aiData.ranking}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        border: '1px solid #334155',
        marginTop: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#f8fafc'
        }}>
          🤖 AI Analysis Results
        </h2>
        
        <div style={{
          display: 'grid',
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
              Paste AI Analysis Result Here:
            </label>
            <textarea
              value={aiAnalysisResult}
              onChange={handleAIAnalysisInput}
              placeholder="Paste the AI analysis result from your exported trade plans here..."
              rows={8}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={saveAIAnalysis}
              disabled={!aiAnalysisResult.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: aiAnalysisResult.trim() ? '#10b981' : '#64748b',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: aiAnalysisResult.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              💾 Save AI Analysis
            </button>
            
            <span style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontStyle: 'italic'
            }}>
              This will save the AI analysis to all trade plans for review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgents;
