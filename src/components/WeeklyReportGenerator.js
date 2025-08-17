import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Download, Calendar } from 'lucide-react';

const WeeklyReportGenerator = ({ trades, onReportGenerated }) => {
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    return {
      year: now.getFullYear(),
      weekNumber: weekNumber
    };
  }

  function getWeekTrades(trades, year, weekNumber) {
    if (!trades || trades.length === 0) return [];
    
    const startOfYear = new Date(year, 0, 1);
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfYear.getDate() + (weekNumber - 1) * 7);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= startOfWeek && tradeDate <= endOfWeek;
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
        ruleViolations: []
      };
    }

    const closedTrades = weekTrades.filter(trade => trade.status === 'closed');
    const openTrades = weekTrades.filter(trade => trade.status === 'open');
    const winningTrades = closedTrades.filter(trade => trade.pnl > 0);
    const losingTrades = closedTrades.filter(trade => trade.pnl < 0);

    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length : 0;
    const maxWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(trade => trade.pnl)) : 0;
    const maxLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(trade => trade.pnl)) : 0;

    // Rule compliance analysis
    const ruleCompliance = weekTrades.filter(trade => trade.ruleAdherence === 'followed').length;
    const ruleViolations = weekTrades.filter(trade => trade.ruleAdherence === 'violated').length;

    // Collect mistakes and highlights
    const mistakes = [];
    const highlights = [];
    const ruleViolationsList = [];

    weekTrades.forEach(trade => {
      if (trade.ruleAdherence === 'violated' && trade.ruleViolationReason) {
        ruleViolationsList.push({
          symbol: trade.symbol,
          date: trade.date,
          reason: trade.ruleViolationReason
        });
      }

      if (trade.executionNotes) {
        if (trade.executionNotes.toLowerCase().includes('mistake') || 
            trade.executionNotes.toLowerCase().includes('error') ||
            trade.executionNotes.toLowerCase().includes('fomo')) {
          mistakes.push({
            symbol: trade.symbol,
            date: trade.date,
            note: trade.executionNotes
          });
        }
      }

      if (trade.executionNotes) {
        if (trade.executionNotes.toLowerCase().includes('good') || 
            trade.executionNotes.toLowerCase().includes('perfect') ||
            trade.executionNotes.toLowerCase().includes('excellent')) {
          highlights.push({
            symbol: trade.symbol,
            date: trade.date,
            note: trade.executionNotes
          });
        }
      }
    });

    return {
      year,
      weekNumber,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTrades: weekTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        openTrades: openTrades.length,
        totalPnL: totalPnL,
        winRate: winRate,
        avgWin: avgWin,
        avgLoss: avgLoss,
        maxWin: maxWin,
        maxLoss: maxLoss,
        ruleCompliance: ruleCompliance,
        ruleViolations: ruleViolations
      },
      trades: weekTrades.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        date: trade.date,
        status: trade.status,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        shares: trade.shares,
        pnl: trade.pnl,
        pnlPercent: trade.pnlPercent,
        ruleAdherence: trade.ruleAdherence,
        ruleViolationReason: trade.ruleViolationReason,
        executionNotes: trade.executionNotes,
        mentalGame: trade.mentalGame
      })),
      mistakes,
      highlights,
      ruleViolations: ruleViolationsList
    };
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const report = generateWeeklyReport(trades, currentWeek.year, currentWeek.weekNumber);
      setWeeklyReport(report);
      
      if (onReportGenerated) {
        onReportGenerated(report);
      }
    } catch (error) {
      console.error('Error generating weekly report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWeekChange = (field, value) => {
    setCurrentWeek(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  useEffect(() => {
    if (trades && trades.length > 0) {
      handleGenerateReport();
    }
  }, [trades, currentWeek]);

  if (!weeklyReport) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        padding: '2rem',
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
          Weekly Report Generator
        </h3>
        <p style={{
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Select a week to generate a trading report
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      border: '1px solid #334155'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            margin: '0 0 0.5rem 0'
          }}>
            Weekly Trading Report
          </h3>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginRight: '0.5rem'
              }}>
                Week:
              </label>
              <input
                type="number"
                min="1"
                max="53"
                value={currentWeek.weekNumber}
                onChange={(e) => handleWeekChange('weekNumber', e.target.value)}
                style={{
                  width: '60px',
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginRight: '0.5rem'
              }}>
                Year:
              </label>
              <input
                type="number"
                value={currentWeek.year}
                onChange={(e) => handleWeekChange('year', e.target.value)}
                style={{
                  width: '80px',
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#ffffff',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isGenerating ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
              {isGenerating ? 'Generating...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          Generated: {new Date(weeklyReport.generatedAt).toLocaleString()}
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { key: 'totalTrades', label: 'Total Trades', color: '#3b82f6' },
          { key: 'winningTrades', label: 'Winners', color: '#10b981' },
          { key: 'losingTrades', label: 'Losers', color: '#ef4444' },
          { key: 'openTrades', label: 'Open', color: '#f59e0b' },
          { key: 'winRate', label: 'Win Rate', suffix: '%', color: '#8b5cf6' },
          { key: 'totalPnL', label: 'Total P&L', suffix: '$', color: '#06b6d4' }
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
              {metric.key === 'winRate' 
                ? weeklyReport.summary[metric.key].toFixed(1)
                : weeklyReport.summary[metric.key]
              }{metric.suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Trading Matrix */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#f8fafc',
          marginBottom: '1rem'
        }}>
          📊 Trading Matrix (Week {weeklyReport.weekNumber}/{weeklyReport.year})
        </h4>
        {weeklyReport.trades.length === 0 ? (
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
            {weeklyReport.trades.map(trade => (
              <div key={trade.id} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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

      {/* Analysis Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Mistakes */}
        <div>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '1rem'
          }}>
            ❌ Mistakes & Errors ({weeklyReport.mistakes.length})
          </h4>
          {weeklyReport.mistakes.length === 0 ? (
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              No mistakes recorded this week
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {weeklyReport.mistakes.map((mistake, index) => (
                <div key={index} style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #ef4444'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    marginBottom: '0.25rem'
                  }}>
                    {mistake.symbol} - {new Date(mistake.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    {mistake.note}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Highlights */}
        <div>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '1rem'
          }}>
            ✨ Highlights ({weeklyReport.highlights.length})
          </h4>
          {weeklyReport.highlights.length === 0 ? (
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              No highlights recorded this week
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {weeklyReport.highlights.map((highlight, index) => (
                <div key={index} style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #10b981'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    marginBottom: '0.25rem'
                  }}>
                    {highlight.symbol} - {new Date(highlight.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    {highlight.note}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rule Violations */}
        <div>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '1rem'
          }}>
            ⚠️ Rule Violations ({weeklyReport.ruleViolations.length})
          </h4>
          {weeklyReport.ruleViolations.length === 0 ? (
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              All rules followed this week
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {weeklyReport.ruleViolations.map((violation, index) => (
                <div key={index} style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #f59e0b'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    marginBottom: '0.25rem'
                  }}>
                    {violation.symbol} - {new Date(violation.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    {violation.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
