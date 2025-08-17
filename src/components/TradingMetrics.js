import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { BarChart3 } from 'lucide-react';

const TradingMetrics = ({ trades, settings }) => {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [tickerData, setTickerData] = useState([]);

  // Get unique tickers from trades
  const tickers = [...new Set(trades.map(trade => trade.symbol))].sort();

  // Calculate risk-reward data for selected ticker
  useEffect(() => {
    if (selectedTicker) {
      const tickerTrades = trades.filter(trade => 
        trade.symbol === selectedTicker && trade.exitPrice && trade.exitDate
      );

      const riskRewardData = tickerTrades.map(trade => {
        const entryPrice = parseFloat(trade.entryPrice);
        const exitPrice = parseFloat(trade.exitPrice);
        const stopLoss = parseFloat(trade.stopLoss);
        
        // Calculate risk and reward
        const risk = Math.abs(entryPrice - stopLoss);
        const reward = Math.abs(exitPrice - entryPrice);
        const riskRewardRatio = reward / risk;
        
        // Calculate P&L
        const pnl = trade.side === 'BUY' 
          ? (exitPrice - entryPrice) * trade.shares
          : (entryPrice - exitPrice) * trade.shares;
        
        return {
          date: new Date(trade.exitDate).toLocaleDateString(),
          risk,
          reward,
          riskRewardRatio: riskRewardRatio.toFixed(2),
          pnl: pnl.toFixed(2),
          result: pnl > 0 ? 'Win' : 'Loss',
          tradeId: trade.id
        };
      });

      setTickerData(riskRewardData);
    }
  }, [selectedTicker, trades]);

  // Calculate portfolio performance over time
  const portfolioPerformance = trades
    .filter(trade => trade.exitPrice && trade.exitDate)
    .sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate))
    .reduce((acc, trade) => {
      const pnl = trade.side === 'BUY' 
        ? (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * trade.shares
        : (parseFloat(trade.entryPrice) - parseFloat(trade.exitPrice)) * trade.shares;
      
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : settings.portfolioValue;
      const newBalance = lastBalance + pnl;
      
      acc.push({
        date: new Date(trade.exitDate).toLocaleDateString(),
        balance: newBalance,
        pnl,
        tradeId: trade.id
      });
      
      return acc;
    }, []);

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
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
          <BarChart3 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              📊 Trading Metrics
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Analytics & Performance Insights
            </p>
          </div>
        </div>

        {/* Risk-Reward Analysis */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#f8fafc'
          }}>
            Risk-Reward Analysis by Ticker
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            alignItems: 'center'
          }}>
            <label style={{
              fontSize: '1rem',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Select Ticker:
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '1rem',
                minWidth: '150px'
              }}
            >
              <option value="">Choose a ticker...</option>
              {tickers.map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </select>
          </div>

          {selectedTicker && tickerData.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Risk-Reward Scatter Plot */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f8fafc',
                  textAlign: 'center'
                }}>
                  Risk vs Reward Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={tickerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="risk" 
                      name="Risk" 
                      stroke="#94a3b8"
                      label={{ value: 'Risk ($)', position: 'bottom', offset: 0 }}
                    />
                    <YAxis 
                      dataKey="reward" 
                      name="Reward" 
                      stroke="#94a3b8"
                      label={{ value: 'Reward ($)', angle: -90, position: 'left' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Scatter 
                      dataKey="reward" 
                      fill="#10b981" 
                      stroke="#059669"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Risk-Reward Ratio Bar Chart */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f8fafc',
                  textAlign: 'center'
                }}>
                  Risk-Reward Ratios by Trade
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tickerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc'
                      }}
                    />
                    <Bar 
                      dataKey="riskRewardRatio" 
                      fill="#3b82f6" 
                      stroke="#2563eb"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trade Details Table */}
          {selectedTicker && tickerData.length > 0 && (
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#f8fafc'
              }}>
                Trade Details for {selectedTicker}
              </h3>
              <div style={{
                overflowX: 'auto'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: '1px solid #475569'
                    }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>Date</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>Risk ($)</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>Reward ($)</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>R:R Ratio</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>P&L ($)</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickerData.map((trade, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #475569'
                      }}>
                        <td style={{
                          padding: '0.75rem',
                          color: '#f8fafc'
                        }}>{trade.date}</td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>${trade.risk.toFixed(2)}</td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>${trade.reward.toFixed(2)}</td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>{trade.riskRewardRatio}</td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          color: parseFloat(trade.pnl) > 0 ? '#10b981' : '#ef4444',
                          fontFamily: 'Geist Mono, monospace',
                          fontWeight: '600'
                        }}>${trade.pnl}</td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: trade.result === 'Win' ? '#10b981' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {trade.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Performance */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#f8fafc'
          }}>
            Portfolio Performance Over Time
          </h2>
          
          {portfolioPerformance.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={portfolioPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Placeholder for Future Charts */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#f8fafc'
          }}>
            📈 More Analytics Coming Soon
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem'
          }}>
            Additional charts and metrics will be added here, including:
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#334155',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>Setup Performance</h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>Performance breakdown by setup type</p>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#334155',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>Time Analysis</h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>Performance by time of day/week</p>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#334155',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>Drawdown Analysis</h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>Maximum drawdown and recovery periods</p>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#334155',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>Correlation Matrix</h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>Correlations between different setups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingMetrics;
