import React, { useState } from 'react';
import { X, Download, FileText, Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

const WeeklyReportViewer = ({ report, onClose, onExport }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!report) return null;

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: TrendingUp },
    { id: 'trades', label: '📈 Trades', icon: FileText },
    { id: 'analysis', label: '🧠 Analysis', icon: Brain },
    { id: 'export', label: '💾 Export', icon: Download }
  ];

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Summary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {[
          { key: 'totalTrades', label: 'Total Trades', color: '#3b82f6', value: report.summary.totalTrades },
          { key: 'winningTrades', label: 'Winners', color: '#10b981', value: report.summary.winningTrades },
          { key: 'losingTrades', label: 'Losers', color: '#ef4444', value: report.summary.losingTrades },
          { key: 'openTrades', label: 'Open', color: '#f59e0b', value: report.summary.openTrades },
          { key: 'winRate', label: 'Win Rate', color: '#8b5cf6', value: `${report.summary.winRate.toFixed(1)}%` },
          { key: 'totalPnL', label: 'Total P&L', color: report.summary.totalPnL >= 0 ? '#10b981' : '#ef4444', value: `$${report.summary.totalPnL}` }
        ].map(metric => (
          <div key={metric.key} style={{
            backgroundColor: '#334155',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              {metric.label}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: metric.color
            }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
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
          📈 Weekly Performance
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          padding: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: report.summary.totalPnL >= 0 ? '#10b981' : '#ef4444'
            }}>
              {report.summary.totalPnL >= 0 ? '+' : ''}${report.summary.totalPnL}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Net P&L
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#8b5cf6'
            }}>
              {report.summary.winRate.toFixed(1)}%
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Win Rate
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#f59e0b'
            }}>
              {report.summary.ruleCompliance}/{report.summary.totalTrades}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Rules Followed
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#334155',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
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
            Mistakes & Errors ({report.mistakes.length})
          </h4>
          {report.mistakes.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No mistakes recorded</p>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
              {report.mistakes.slice(0, 3).map((mistake, index) => (
                <div key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{mistake.symbol}:</strong> {mistake.note.substring(0, 50)}...
                </div>
              ))}
              {report.mistakes.length > 3 && (
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  ... and {report.mistakes.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#334155',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
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
            Highlights ({report.highlights.length})
          </h4>
          {report.highlights.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No highlights recorded</p>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
              {report.highlights.slice(0, 3).map((highlight, index) => (
                <div key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{highlight.symbol}:</strong> {highlight.note.substring(0, 50)}...
                </div>
              ))}
              {report.highlights.length > 3 && (
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  ... and {report.highlights.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTrades = () => (
    <div>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: '1rem'
      }}>
        📈 All Trades (Week {report.weekNumber}/{report.year})
      </h3>
      
      {report.trades.length === 0 ? (
        <div style={{
          backgroundColor: '#334155',
          padding: '2rem',
          borderRadius: '0.5rem',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          No trades found for this week
        </div>
      ) : (
        <div style={{
          backgroundColor: '#334155',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '1px',
            backgroundColor: '#475569'
          }}>
            {[
              'Symbol', 'Date', 'Status', 'Entry', 'Exit', 'Shares', 'P&L', 'P&L %', 'Rules', 'Notes'
            ].map(header => (
              <div key={header} style={{
                padding: '0.75rem',
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
          
          {report.trades.map(trade => (
            <div key={trade.id} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '1px',
              backgroundColor: '#475569'
            }}>
              {[
                trade.symbol,
                new Date(trade.date).toLocaleDateString(),
                trade.status,
                `$${trade.entryPrice}`,
                trade.exitPrice ? `$${trade.exitPrice}` : '-',
                trade.shares,
                trade.pnl ? `$${trade.pnl}` : '-',
                trade.pnlPercent ? `${trade.pnlPercent}%` : '-',
                trade.ruleAdherence === 'followed' ? '✅' : '❌',
                trade.executionNotes ? '📝' : '-'
              ].map((value, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: '#334155',
                  fontSize: '0.875rem',
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
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Mistakes Analysis */}
      <div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#ef4444',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={20} />
          Mistakes & Errors Analysis ({report.mistakes.length})
        </h3>
        
        {report.mistakes.length === 0 ? (
          <div style={{
            backgroundColor: '#334155',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            No mistakes recorded this week - great job!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {report.mistakes.map((mistake, index) => (
              <div key={index} style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #ef4444'
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  {mistake.symbol} - {new Date(mistake.date).toLocaleDateString()}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  lineHeight: '1.5'
                }}>
                  {mistake.note}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlights Analysis */}
      <div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={20} />
          Highlights & Successes ({report.highlights.length})
        </h3>
        
        {report.highlights.length === 0 ? (
          <div style={{
            backgroundColor: '#334155',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            No highlights recorded this week
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {report.highlights.map((highlight, index) => (
              <div key={index} style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #10b981'
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  {highlight.symbol} - {new Date(highlight.date).toLocaleDateString()}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  lineHeight: '1.5'
                }}>
                  {highlight.note}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule Compliance Analysis */}
      <div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#f59e0b',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Brain size={20} />
          Rule Compliance Analysis
        </h3>
        
        <div style={{
          backgroundColor: '#334155',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {report.summary.ruleCompliance}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Rules Followed
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#ef4444'
              }}>
                {report.summary.ruleViolations}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Rules Violated
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {((report.summary.ruleCompliance / report.summary.totalTrades) * 100).toFixed(1)}%
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Compliance Rate
              </div>
            </div>
          </div>
          
          {report.ruleViolations.length > 0 && (
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f59e0b',
                marginBottom: '0.5rem'
              }}>
                Rule Violations Details:
              </h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {report.ruleViolations.map((violation, index) => (
                  <div key={index} style={{
                    backgroundColor: '#475569',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}>
                    <strong>{violation.symbol}</strong> ({new Date(violation.date).toLocaleDateString()}): {violation.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExport = () => (
    <div>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: '1rem'
      }}>
        💾 Export Options for AI Analysis
      </h3>
      
      <div style={{
        backgroundColor: '#334155',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        border: '1px solid #475569'
      }}>
        <p style={{
          color: '#94a3b8',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          lineHeight: '1.6'
        }}>
          Export this weekly report in various formats for AI analysis. The exported files will contain all trade details, 
          mental game notes, execution notes, and performance metrics.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <button
            onClick={() => onExport(report, 'csv')}
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
            onClick={() => onExport(report, 'text')}
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
        </div>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#475569',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#f8fafc'
        }}>
          <strong>AI Analysis Ready:</strong> The exported files contain structured data perfect for:
          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
            <li>Pattern recognition in trading behavior</li>
            <li>Mental game analysis</li>
            <li>Rule compliance tracking</li>
            <li>Performance optimization suggestions</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
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
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '95vh',
        overflow: 'hidden',
        border: '1px solid #334155'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#f8fafc',
              margin: 0
            }}>
              Weekly Report - Week {report.weekNumber}/{report.year}
            </h2>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #334155',
          backgroundColor: '#334155'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === tab.id ? '#475569' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#f8fafc' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          maxHeight: 'calc(95vh - 140px)',
          overflow: 'auto'
        }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'trades' && renderTrades()}
          {activeTab === 'analysis' && renderAnalysis()}
          {activeTab === 'export' && renderExport()}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportViewer;
