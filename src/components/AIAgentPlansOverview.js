import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, Star, Target, AlertTriangle, CheckCircle, XCircle, Eye, FileText, BarChart3 } from 'lucide-react';
import storage from '../utils/storage';

const AIAgentPlansOverview = () => {
  const [tradePlans, setTradePlans] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [aiAnalysisData, setAiAnalysisData] = useState({});
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'detailed', 'raw'

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

  // Get unique dates with AI analysis
  const getDatesWithAIAnalysis = () => {
    const dates = new Set();
    tradePlans.forEach(plan => {
      if (plan.aiAnalysis) {
        const planDate = new Date(plan.createdAt || plan.date || Date.now()).toLocaleDateString('de-DE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        dates.add(planDate);
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  };

  // Get AI analysis for a specific date
  const getAIAnalysisForDate = (date) => {
    const plansForDate = tradePlans.filter(plan => {
      const planDate = new Date(plan.createdAt || plan.date || Date.now()).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return planDate === date;
    });

    if (plansForDate.length === 0) return null;

    return {
      date: date,
      plans: plansForDate,
      hasStructuredData: plansForDate.some(plan => plan.aiAnalysisStructured),
      hasRawData: plansForDate.some(plan => plan.aiAnalysis)
    };
  };

  useEffect(() => {
    if (selectedDate) {
      const analysis = getAIAnalysisForDate(selectedDate);
      setAiAnalysisData(analysis || {});
    }
  }, [selectedDate, tradePlans]);

  const datesWithAnalysis = getDatesWithAIAnalysis();

  const getRankingColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 7) return '#3b82f6'; // Blue
    if (score >= 6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRankingIcon = (score) => {
    if (score >= 8) return <CheckCircle size={16} />;
    if (score >= 7) return <Target size={16} />;
    if (score >= 6) return <AlertTriangle size={16} />;
    return <XCircle size={16} />;
  };

  // Extract ranking from AI analysis
  const extractRanking = (plan) => {
    if (plan.aiAnalysisStructured && plan.aiAnalysisStructured.overallRanking) {
      const scoreMatch = plan.aiAnalysisStructured.overallRanking.match(/(\d+(?:\.\d+)?)\/10/);
      return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    }
    
    if (plan.aiAnalysis) {
      const lines = plan.aiAnalysis.split('\n');
      for (const line of lines) {
        if (line.includes('Overall Ranking:') || line.includes('Ranking:')) {
          const scoreMatch = line.match(/(\d+(?:\.\d+)?)\/10/);
          return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        }
      }
    }
    
    return 0;
  };

  // Get plan summary for display
  const getPlanSummary = (plan) => {
    if (plan.aiAnalysisStructured) {
      return {
        catalysts: plan.aiAnalysisStructured.catalysts || 'N/A',
        sectorTheme: plan.aiAnalysisStructured.sectorTheme || 'N/A',
        fundamentals: plan.aiAnalysisStructured.fundamentals || 'N/A',
        technical: plan.aiAnalysisStructured.technical || 'N/A',
        planStructure: plan.aiAnalysisStructured.planStructure || 'N/A',
        ranking: plan.aiAnalysisStructured.overallRanking || 'N/A'
      };
    }
    
    // Fallback to parsing raw text
    if (plan.aiAnalysis) {
      const lines = plan.aiAnalysis.split('\n');
      const summary = {
        catalysts: 'N/A',
        sectorTheme: 'N/A',
        fundamentals: 'N/A',
        technical: 'N/A',
        planStructure: 'N/A',
        ranking: 'N/A'
      };
      
      let currentSection = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('Catalysts:')) {
          currentSection = 'catalysts';
          summary.catalysts = trimmedLine.replace('Catalysts:', '').trim();
        } else if (trimmedLine.startsWith('Sector/Theme:')) {
          currentSection = 'sectorTheme';
          summary.sectorTheme = trimmedLine.replace('Sector/Theme:', '').trim();
        } else if (trimmedLine.startsWith('Fundamentals:')) {
          currentSection = 'fundamentals';
          summary.fundamentals = trimmedLine.replace('Fundamentals:', '').trim();
        } else if (trimmedLine.startsWith('Technical:')) {
          currentSection = 'technical';
          summary.technical = trimmedLine.replace('Technical:', '').trim();
        } else if (trimmedLine.startsWith('Plan Structure:')) {
          currentSection = 'planStructure';
          summary.planStructure = trimmedLine.replace('Plan Structure:', '').trim();
        } else if (trimmedLine.startsWith('Overall Ranking:') || trimmedLine.startsWith('Ranking:')) {
          summary.ranking = trimmedLine.replace(/^(Overall Ranking:|Ranking:)/, '').trim();
        } else if (currentSection && trimmedLine && !trimmedLine.startsWith('PLAN')) {
          // Continue adding to current section
          summary[currentSection] += ' ' + trimmedLine;
        }
      }
      
      return summary;
    }
    
    return {
      catalysts: 'N/A',
      sectorTheme: 'N/A',
      fundamentals: 'N/A',
      technical: 'N/A',
      planStructure: 'N/A',
      ranking: 'N/A'
    };
  };

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
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155'
      }}>
        <Brain style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            🤖 AI Analysis Overview
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            Übersicht aller AI-generierten Analysen nach Datum
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Left Column - Date Selection */}
        <div>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #334155',
              backgroundColor: '#334155'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: 0,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={18} />
                Verfügbare Analysen
              </h2>
            </div>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {datesWithAnalysis.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>
                  <Brain size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    Keine AI-Analysen verfügbar
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {datesWithAnalysis.map(date => (
                    <div
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #334155',
                        cursor: 'pointer',
                        backgroundColor: selectedDate === date ? '#3b82f6' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#f8fafc',
                        marginBottom: '0.25rem'
                      }}>
                        {date}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}>
                        {getAIAnalysisForDate(date)?.plans.length || 0} Pläne analysiert
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Display */}
        <div>
          {!selectedDate ? (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              padding: '2rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '0.5rem', color: '#f8fafc' }}>
                Datum auswählen
              </h3>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Wählen Sie ein Datum aus der linken Spalte, um die AI-Analyse zu sehen.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              padding: '1.5rem'
            }}>
              {/* Header with View Mode Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #334155'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  🤖 AI-Analyse - {selectedDate}
                </h2>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.375rem',
                  padding: '0.25rem'
                }}>
                  <button
                    onClick={() => setViewMode('summary')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: viewMode === 'summary' ? '#3b82f6' : 'transparent',
                      color: viewMode === 'summary' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <BarChart3 size={16} />
                    Übersicht
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: viewMode === 'detailed' ? '#3b82f6' : 'transparent',
                      color: viewMode === 'detailed' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Eye size={16} />
                    Detailliert
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: viewMode === 'raw' ? '#3b82f6' : 'transparent',
                      color: viewMode === 'raw' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FileText size={16} />
                    Rohdaten
                  </button>
                </div>
              </div>

              {aiAnalysisData.plans && aiAnalysisData.plans.length > 0 && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {/* Summary View */}
                  {viewMode === 'summary' && (
                    <div>
                      {/* Quick Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                      }}>
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1.5rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#3b82f6',
                            marginBottom: '0.5rem'
                          }}>
                            {aiAnalysisData.plans.length}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8'
                          }}>
                            Analysierte Pläne
                          </div>
                        </div>
                        
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1.5rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: aiAnalysisData.hasStructuredData ? '#10b981' : '#f59e0b',
                            marginBottom: '0.5rem'
                          }}>
                            {aiAnalysisData.hasStructuredData ? '✓' : '⚠'}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8'
                          }}>
                            Strukturierte Daten
                          </div>
                        </div>
                      </div>

                      {/* Plans Overview */}
                      <div style={{
                        backgroundColor: '#334155',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #475569'
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
                          <Star size={20} />
                          Pläne Übersicht
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {aiAnalysisData.plans.map((plan, index) => {
                            const ranking = extractRanking(plan);
                            return (
                              <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: '#1e293b',
                                borderRadius: '0.375rem',
                                border: '1px solid #475569'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <span style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#f8fafc'
                                  }}>
                                    {plan.symbol}
                                  </span>
                                  <span style={{
                                    fontSize: '0.875rem',
                                    color: '#94a3b8'
                                  }}>
                                    {plan.title || 'Trade Plan'}
                                  </span>
                                </div>
                                {ranking > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: getRankingColor(ranking),
                                    borderRadius: '0.375rem',
                                    color: '#ffffff',
                                    fontWeight: '600'
                                  }}>
                                    {getRankingIcon(ranking)}
                                    {ranking}/10
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed View */}
                  {viewMode === 'detailed' && (
                    <div>
                      {aiAnalysisData.plans.map((plan, index) => {
                        const summary = getPlanSummary(plan);
                        const ranking = extractRanking(plan);
                        
                        return (
                          <div key={index} style={{
                            backgroundColor: '#334155',
                            padding: '1.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #475569',
                            marginBottom: '1.5rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '1rem'
                            }}>
                              <div>
                                <h4 style={{
                                  fontSize: '1.25rem',
                                  fontWeight: '600',
                                  color: '#f8fafc',
                                  margin: '0 0 0.5rem 0'
                                }}>
                                  {plan.symbol} - {plan.title || 'Trade Plan'}
                                </h4>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: '#94a3b8'
                                }}>
                                  Erstellt: {new Date(plan.createdAt || plan.date || Date.now()).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                              {ranking > 0 && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  backgroundColor: getRankingColor(ranking),
                                  borderRadius: '0.375rem',
                                  color: '#ffffff',
                                  fontWeight: '600'
                                }}>
                                  {getRankingIcon(ranking)}
                                  {ranking}/10
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                              {summary.catalysts !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#10b981',
                                    marginBottom: '0.5rem'
                                  }}>
                                    🚀 Katalysatoren
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.catalysts}
                                  </p>
                                </div>
                              )}

                              {summary.sectorTheme !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#3b82f6',
                                    marginBottom: '0.5rem'
                                  }}>
                                    📊 Sektor/Theme
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.sectorTheme}
                                  </p>
                                </div>
                              )}

                              {summary.fundamentals !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#f59e0b',
                                    marginBottom: '0.5rem'
                                  }}>
                                    💼 Fundamentaldaten
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.fundamentals}
                                  </p>
                                </div>
                              )}

                              {summary.technical !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#8b5cf6',
                                    marginBottom: '0.5rem'
                                  }}>
                                    📈 Technische Analyse
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.technical}
                                  </p>
                                </div>
                              )}

                              {summary.planStructure !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#06b6d4',
                                    marginBottom: '0.5rem'
                                  }}>
                                    🎯 Plan-Struktur
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.planStructure}
                                  </p>
                                </div>
                              )}

                              {summary.ranking !== 'N/A' && (
                                <div>
                                  <h5 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#ec4899',
                                    marginBottom: '0.5rem'
                                  }}>
                                    ⭐ Bewertung
                                  </h5>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    color: '#cbd5e1',
                                    lineHeight: '1.5',
                                    margin: 0
                                  }}>
                                    {summary.ranking}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Raw Data View */}
                  {viewMode === 'raw' && (
                    <div>
                      {aiAnalysisData.plans.map((plan, index) => (
                        <div key={index} style={{
                          backgroundColor: '#334155',
                          padding: '1.5rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569',
                          marginBottom: '1.5rem'
                        }}>
                          <h4 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#f8fafc',
                            margin: '0 0 1rem 0'
                          }}>
                            {plan.symbol} - Rohdaten
                          </h4>
                          <div style={{
                            backgroundColor: '#1e293b',
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #475569',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: '#cbd5e1',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}>
                            {plan.aiAnalysis || 'Keine AI-Analyse verfügbar'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgentPlansOverview;
