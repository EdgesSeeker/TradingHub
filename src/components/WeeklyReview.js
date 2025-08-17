import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Target, Plus, X, Save, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import storage from '../utils/storage';
import WeeklyReportGenerator from './WeeklyReportGenerator';

const WeeklyReview = ({ trades, onTradeUpdated }) => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
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
            onReportGenerated={(report) => {
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
            }}
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
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, weekNumber: e.target.value }))}
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
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, year: parseInt(e.target.value) }))}
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

                  {/* Week Report Metrics */}
                  <div style={{
                    backgroundColor: '#334155',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #475569'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      marginBottom: '1rem'
                    }}>
                      📊 Week Report Metrics
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem'
                    }}>
                      {[
                        { key: 'winRate', label: 'Win Rate (%)', type: 'number', step: '0.1' },
                        { key: 'riskReward', label: 'Risk/Reward Ratio', type: 'number', step: '0.1' },
                        { key: 'avgPnL', label: 'Average P&L ($)', type: 'number', step: '0.01' },
                        { key: 'maxDrawdown', label: 'Max Drawdown ($)', type: 'number', step: '0.01' }
                      ].map(metric => (
                        <div key={metric.key}>
                          <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#94a3b8',
                            marginBottom: '0.5rem'
                          }}>
                            {metric.label}
                          </label>
                          <input
                            type={metric.type}
                            step={metric.step}
                            value={currentEntry.weekReport[metric.key]}
                            onChange={(e) => setCurrentEntry(prev => ({
                              ...prev,
                              weekReport: {
                                ...prev.weekReport,
                                [metric.key]: parseFloat(e.target.value) || 0
                              }
                            }))}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              backgroundColor: '#475569',
                              border: '1px solid #64748b',
                              borderRadius: '0.5rem',
                              color: '#f8fafc',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trading Matrix Summary */}
                  {currentEntry.weekReport.trades && currentEntry.weekReport.trades.length > 0 && (
                    <div style={{
                      backgroundColor: '#334155',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #475569'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#f8fafc',
                        marginBottom: '1rem'
                      }}>
                        📊 Trading Matrix Summary ({currentEntry.weekReport.trades.length} trades)
                      </h3>
                      <div style={{
                        backgroundColor: '#475569',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                          gap: '1px',
                          backgroundColor: '#64748b'
                        }}>
                          {[
                            'Symbol', 'Date', 'Status', 'P&L', 'Rules'
                          ].map(header => (
                            <div key={header} style={{
                              padding: '0.5rem',
                              backgroundColor: '#1e293b',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#94a3b8',
                              textAlign: 'center'
                            }}>
                              {header}
                            </div>
                          ))}
                        </div>
                        {currentEntry.weekReport.trades.slice(0, 5).map((trade, index) => (
                          <div key={index} style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: '1px',
                            backgroundColor: '#64748b'
                          }}>
                            {[
                              trade.symbol,
                              new Date(trade.date).toLocaleDateString(),
                              trade.status,
                              trade.pnl ? `$${trade.pnl}` : '-',
                              trade.ruleAdherence === 'followed' ? '✅' : '❌'
                            ].map((value, index) => (
                              <div key={index} style={{
                                padding: '0.5rem',
                                backgroundColor: '#334155',
                                fontSize: '0.75rem',
                                color: '#f8fafc',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {value}
                              </div>
                            ))}
                          </div>
                        ))}
                        {currentEntry.weekReport.trades.length > 5 && (
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: '#334155',
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            textAlign: 'center'
                          }}>
                            ... and {currentEntry.weekReport.trades.length - 5} more trades
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      ✨ Highlights der Woche
                    </label>
                    <textarea
                      value={currentEntry.highlights}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, highlights: e.target.value }))}
                      rows={4}
                      placeholder="Was lief besonders gut? Welche Gewohnheit hat sich gefestigt? Projekt-Fortschritt?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Challenges */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      🚧 Fehleranalyse & Herausforderungen
                    </label>
                    <textarea
                      value={currentEntry.challenges}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, challenges: e.target.value }))}
                      rows={4}
                      placeholder="Wo bin ich von meinen Zielen abgewichen? Emotionale Trades? Hauptursache für Regelbrüche?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Workflow Audit */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      🔧 Workflow & Prozess-Audit
                    </label>
                    <textarea
                      value={currentEntry.workflowAudit}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, workflowAudit: e.target.value }))}
                      rows={3}
                      placeholder="Welche Schritte haben Zeit gekostet? Was hat abgelenkt? Workspace-Design-Audit?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Setup Review */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      📈 Setup- & Scan-Review
                    </label>
                    <textarea
                      value={currentEntry.setupReview}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, setupReview: e.target.value }))}
                      rows={4}
                      placeholder="Fokus-/NMS-Liste: Was gefunden? Was gefehlt? Bestes/Schlechtestes Setup? Bottlenecks?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Risk Audit */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      ⚖️ Risiko- und Regel-Audit
                    </label>
                    <textarea
                      value={currentEntry.riskAudit}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, riskAudit: e.target.value }))}
                      rows={3}
                      placeholder="Risiko-Konformität? Änderungen nötig? Systemlücken/Regelverletzungen?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Next Week Goals */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      🎯 Anpassungen & Ziele für die nächste Woche
                    </label>
                    <textarea
                      value={currentEntry.nextWeekGoals}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, nextWeekGoals: e.target.value }))}
                      rows={4}
                      placeholder="Top-Ziel, Gewohnheit verbessern, Subprojekt, Mindset-Reminder"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Auto-generated Insights from Trades */}
                  {currentEntry.weekReport.trades && currentEntry.weekReport.trades.length > 0 && (
                    <div style={{
                      backgroundColor: '#334155',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #475569'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#f8fafc',
                        marginBottom: '1rem'
                      }}>
                        🤖 Auto-generated Insights from Trades
                      </h3>
                      
                      {/* Mistakes Summary */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#ef4444',
                          marginBottom: '0.5rem'
                        }}>
                          ❌ Common Mistakes Found:
                        </h4>
                        <div style={{
                          backgroundColor: '#475569',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc'
                        }}>
                          {(() => {
                            const mistakes = currentEntry.weekReport.trades
                              .filter(trade => trade.executionNotes && 
                                (trade.executionNotes.toLowerCase().includes('mistake') || 
                                 trade.executionNotes.toLowerCase().includes('error') ||
                                 trade.executionNotes.toLowerCase().includes('fomo')))
                              .map(trade => `${trade.symbol}: ${trade.executionNotes}`)
                              .slice(0, 3);
                            
                            return mistakes.length > 0 
                              ? mistakes.join('\n')
                              : 'No mistakes recorded in execution notes';
                          })()}
                        </div>
                      </div>

                      {/* Highlights Summary */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#10b981',
                          marginBottom: '0.5rem'
                        }}>
                          ✨ Highlights Found:
                        </h4>
                        <div style={{
                          backgroundColor: '#475569',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc'
                        }}>
                          {(() => {
                            const highlights = currentEntry.weekReport.trades
                              .filter(trade => trade.executionNotes && 
                                (trade.executionNotes.toLowerCase().includes('good') || 
                                 trade.executionNotes.toLowerCase().includes('perfect') ||
                                 trade.executionNotes.toLowerCase().includes('excellent')))
                              .map(trade => `${trade.symbol}: ${trade.executionNotes}`)
                              .slice(0, 3);
                            
                            return highlights.length > 0 
                              ? highlights.join('\n')
                              : 'No highlights recorded in execution notes';
                          })()}
                        </div>
                      </div>

                      {/* Rule Compliance Summary */}
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#f59e0b',
                          marginBottom: '0.5rem'
                        }}>
                          ⚖️ Rule Compliance Summary:
                        </h4>
                        <div style={{
                          backgroundColor: '#475569',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc'
                        }}>
                          {(() => {
                            const followed = currentEntry.weekReport.trades.filter(t => t.ruleAdherence === 'followed').length;
                            const violated = currentEntry.weekReport.trades.filter(t => t.ruleAdherence === 'violated').length;
                            const total = currentEntry.weekReport.trades.length;
                            const complianceRate = total > 0 ? ((followed / total) * 100).toFixed(1) : 0;
                            
                            return `Rules followed: ${followed}/${total} (${complianceRate}%)\nRules violated: ${violated}/${total}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Insights */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      📚 Additional Trading Insights
                    </label>
                    <textarea
                      value={currentEntry.insights}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, insights: e.target.value }))}
                      rows={3}
                      placeholder="Additional insights, lessons learned, or observations not captured above"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
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
    </div>
  );
};

export default WeeklyReview;
