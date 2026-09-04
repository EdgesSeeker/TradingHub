import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, CheckCircle, XCircle, MinusCircle, BarChart3, Target, Smartphone } from 'lucide-react';
import storage from '../utils/storage';

const MarketMonitorMobile = () => {
  const [marketConditions, setMarketConditions] = useState({
    qqqTrend: false,
    spyTrend: false,
    iwmTrend: false,
    distributionDaysSpy: 'low',
    distributionDaysQqq: 'low',
    manualStatus: 'neutral'
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [smaData, setSmaData] = useState({
    QQQ: { sma10: null, sma20: null, trend: null },
    SPY: { sma10: null, sma20: null, trend: null },
    IWM: { sma10: null, sma20: null, trend: null }
  });

  // Load saved data when component mounts
  useEffect(() => {
    loadMarketData();
    fetchSMAData();
  }, []);

  // Auto-refresh SMA data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSMAData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Load market data from storage
  const loadMarketData = async () => {
    try {
      const savedConditions = await storage.loadSetting('marketMonitorConditions');
      const savedLastUpdate = await storage.loadSetting('marketMonitorLastUpdate');
      
      if (savedConditions) {
        setMarketConditions(savedConditions);
      }
      
      const healthStatus = calculateOverallMarketHealth();
      await storage.saveSetting('marketHealthStatus', healthStatus);
      
      if (savedLastUpdate) {
        setLastUpdate(new Date(savedLastUpdate));
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  // Save market data to storage
  const saveMarketData = async (newConditions) => {
    try {
      await storage.saveSetting('marketMonitorConditions', newConditions);
      await storage.saveSetting('marketMonitorLastUpdate', new Date().toISOString());
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error saving market data:', error);
    }
  };

  // Fetch SMA data using Yahoo Finance API
  const fetchSMAData = async () => {
    setIsLoading(true);
    const symbols = ['QQQ', 'SPY', 'IWM'];
    const newSmaData = { ...smaData };
    const newMarketConditions = { ...marketConditions };

    try {
      for (const symbol of symbols) {
        try {
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=30d`;
          
          const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const quotes = result.indicators.quote[0];
            const closes = quotes.close.filter(price => price !== null);
            
            if (closes.length >= 20) {
              const sma10 = closes.slice(-10).reduce((sum, price) => sum + price, 0) / 10;
              const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
              const trend = sma10 > sma20;
              
              newSmaData[symbol] = {
                sma10: sma10,
                sma20: sma20,
                trend: trend
              };

              if (symbol === 'QQQ') {
                newMarketConditions.qqqTrend = trend;
              } else if (symbol === 'SPY') {
                newMarketConditions.spyTrend = trend;
              } else if (symbol === 'IWM') {
                newMarketConditions.iwmTrend = trend;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching Yahoo data for ${symbol}:`, error);
        }
      }

      setSmaData(newSmaData);
      setMarketConditions(newMarketConditions);
      await saveMarketData(newMarketConditions);
      
      const healthStatus = calculateOverallMarketHealth();
      await storage.saveSetting('marketHealthStatus', healthStatus);
      
    } catch (error) {
      console.error('Error fetching SMA data from Yahoo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarketCondition = (condition, value) => {
    const newConditions = { ...marketConditions, [condition]: value };
    setMarketConditions(newConditions);
    saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const updateDistributionDays = (index, value) => {
    const newConditions = { ...marketConditions };
    if (index === 'spy') {
      newConditions.distributionDaysSpy = value;
    } else if (index === 'qqq') {
      newConditions.distributionDaysQqq = value;
    }
    setMarketConditions(newConditions);
    saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    storage.saveSetting('marketHealthStatus', healthStatus);
  };

  // Quick action functions
  const setAllBullish = async () => {
    const newConditions = {
      qqqTrend: true,
      spyTrend: true,
      iwmTrend: true,
      distributionDaysSpy: 'low',
      distributionDaysQqq: 'low',
      manualStatus: 'neutral'
    };
    setMarketConditions(newConditions);
    await saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const setAllBearish = async () => {
    const newConditions = {
      qqqTrend: false,
      spyTrend: false,
      iwmTrend: false,
      distributionDaysSpy: 'high',
      distributionDaysQqq: 'high',
      manualStatus: 'neutral'
    };
    setMarketConditions(newConditions);
    await saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const resetAll = async () => {
    const newConditions = {
      qqqTrend: false,
      spyTrend: false,
      iwmTrend: false,
      distributionDaysSpy: 'low',
      distributionDaysQqq: 'low',
      manualStatus: 'neutral'
    };
    setMarketConditions(newConditions);
    await saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const setManualStatus = async (status) => {
    const newConditions = { ...marketConditions, manualStatus: status };
    setMarketConditions(newConditions);
    await saveMarketData(newConditions);
    
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const getTrendStatus = (isValid) => {
    return {
      icon: isValid ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />,
      color: isValid ? '#10b981' : '#ef4444',
      text: isValid ? 'Yes' : 'No'
    };
  };

  const getDistributionStatus = (value) => {
    switch (value) {
      case 'low':
        return { color: '#10b981', text: '<3', icon: <CheckCircle size={14} color="#10b981" /> };
      case 'medium':
        return { color: '#f59e0b', text: '3-5', icon: <MinusCircle size={14} color="#f59e0b" /> };
      case 'high':
        return { color: '#ef4444', text: '>6', icon: <XCircle size={14} color="#ef4444" /> };
      default:
        return { color: '#94a3b8', text: 'Select', icon: <MinusCircle size={14} color="#94a3b8" /> };
    }
  };

  const calculateOverallMarketHealth = () => {
    if (marketConditions.manualStatus !== 'neutral') {
      const status = marketConditions.manualStatus;
      const colors = {
        bullish: '#10b981',
        neutral: '#f59e0b',
        bearish: '#ef4444'
      };
      const texts = {
        bullish: 'BULLISH',
        neutral: 'NEUTRAL',
        bearish: 'BEARISH'
      };
      return { 
        status: status, 
        color: colors[status], 
        text: texts[status],
        isManual: true 
      };
    }

    const trendConditions = [
      marketConditions.qqqTrend,
      marketConditions.spyTrend,
      marketConditions.iwmTrend
    ];
    
    const distributionConditions = [
      marketConditions.distributionDaysSpy === 'low',
      marketConditions.distributionDaysQqq === 'low'
    ];
    
    const trendScore = (trendConditions.filter(Boolean).length / trendConditions.length) * 0.8;
    const distributionScore = (distributionConditions.filter(Boolean).length / distributionConditions.length) * 0.2;
    
    const totalScore = trendScore + distributionScore;
    const percentage = totalScore * 100;
    
    if (percentage >= 80) return { status: 'bullish', color: '#10b981', text: 'BULLISH', isManual: false };
    if (percentage >= 60) return { status: 'neutral', color: '#f59e0b', text: 'NEUTRAL', isManual: false };
    return { status: 'bearish', color: '#ef4444', text: 'BEARISH', isManual: false };
  };

  const overallHealth = calculateOverallMarketHealth();

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Mobile Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        padding: '1rem 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Smartphone size={24} color="white" />
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Market Monitor
          </h1>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8',
          margin: 0
        }}>
          Mobile Market Dashboard
        </p>
      </div>

      {/* Overall Market Health - Mobile Optimized */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '1px solid #334155',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#94a3b8',
          marginBottom: '0.75rem'
        }}>
          Market Health
          {overallHealth.isManual && (
            <span style={{
              fontSize: '0.75rem',
              color: '#f59e0b',
              marginLeft: '0.5rem',
              fontWeight: '400'
            }}>
              (Manual)
            </span>
          )}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: overallHealth.color + '20',
          border: `2px solid ${overallHealth.color}`,
          borderRadius: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {overallHealth.status === 'bullish' && <TrendingUp size={24} color={overallHealth.color} />}
          {overallHealth.status === 'neutral' && <MinusCircle size={24} color={overallHealth.color} />}
          {overallHealth.status === 'bearish' && <TrendingDown size={24} color={overallHealth.color} />}
          <span style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: overallHealth.color
          }}>
            {overallHealth.text}
          </span>
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: '#64748b',
          margin: 0
        }}>
          Updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Manual Status Override - Mobile */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid #334155'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#f8fafc',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} color="#f59e0b" />
          Manual Override
        </h3>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setManualStatus('bullish')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              backgroundColor: marketConditions.manualStatus === 'bullish' ? '#10b981' : '#1e293b',
              color: marketConditions.manualStatus === 'bullish' ? '#ffffff' : '#10b981',
              border: `1px solid #10b981`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <TrendingUp size={12} />
            BULL
          </button>
          <button
            onClick={() => setManualStatus('neutral')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              backgroundColor: marketConditions.manualStatus === 'neutral' ? '#f59e0b' : '#1e293b',
              color: marketConditions.manualStatus === 'neutral' ? '#ffffff' : '#f59e0b',
              border: `1px solid #f59e0b`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <MinusCircle size={12} />
            NEUTRAL
          </button>
          <button
            onClick={() => setManualStatus('bearish')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              backgroundColor: marketConditions.manualStatus === 'bearish' ? '#ef4444' : '#1e293b',
              color: marketConditions.manualStatus === 'bearish' ? '#ffffff' : '#ef4444',
              border: `1px solid #ef4444`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <TrendingDown size={12} />
            BEAR
          </button>
        </div>
      </div>

      {/* Trend Validity - Mobile Cards */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid #334155'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#f8fafc',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUp size={16} color="#3b82f6" />
            Trends (10SMA > 20SMA)
          </h3>
          <button
            onClick={fetchSMAData}
            disabled={isLoading}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: isLoading ? '#64748b' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={12} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'Loading' : 'Refresh'}
          </button>
        </div>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {/* QQQ */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#f8fafc'
              }}>
                QQQ
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getTrendStatus(marketConditions.qqqTrend).icon}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: getTrendStatus(marketConditions.qqqTrend).color
                }}>
                  {getTrendStatus(marketConditions.qqqTrend).text}
                </span>
              </div>
            </div>
            {smaData.QQQ.sma10 && smaData.QQQ.sma20 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                <span>10SMA: ${smaData.QQQ.sma10.toFixed(2)}</span>
                <span>20SMA: ${smaData.QQQ.sma20.toFixed(2)}</span>
              </div>
            )}
            <input
              type="checkbox"
              checked={marketConditions.qqqTrend}
              onChange={(e) => updateMarketCondition('qqqTrend', e.target.checked)}
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#10b981'
              }}
            />
          </div>

          {/* SPY */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#f8fafc'
              }}>
                SPY
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getTrendStatus(marketConditions.spyTrend).icon}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: getTrendStatus(marketConditions.spyTrend).color
                }}>
                  {getTrendStatus(marketConditions.spyTrend).text}
                </span>
              </div>
            </div>
            {smaData.SPY.sma10 && smaData.SPY.sma20 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                <span>10SMA: ${smaData.SPY.sma10.toFixed(2)}</span>
                <span>20SMA: ${smaData.SPY.sma20.toFixed(2)}</span>
              </div>
            )}
            <input
              type="checkbox"
              checked={marketConditions.spyTrend}
              onChange={(e) => updateMarketCondition('spyTrend', e.target.checked)}
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#10b981'
              }}
            />
          </div>

          {/* IWM */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#f8fafc'
              }}>
                IWM
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getTrendStatus(marketConditions.iwmTrend).icon}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: getTrendStatus(marketConditions.iwmTrend).color
                }}>
                  {getTrendStatus(marketConditions.iwmTrend).text}
                </span>
              </div>
            </div>
            {smaData.IWM.sma10 && smaData.IWM.sma20 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                <span>10SMA: ${smaData.IWM.sma10.toFixed(2)}</span>
                <span>20SMA: ${smaData.IWM.sma20.toFixed(2)}</span>
              </div>
            )}
            <input
              type="checkbox"
              checked={marketConditions.iwmTrend}
              onChange={(e) => updateMarketCondition('iwmTrend', e.target.checked)}
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#10b981'
              }}
            />
          </div>
        </div>
      </div>

      {/* Distribution Days - Mobile */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid #334155'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#f8fafc',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Target size={16} color="#f59e0b" />
          Distribution Days
        </h3>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {/* SPY Distribution */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '0.5rem'
            }}>
              SPY Distribution
            </h4>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {['low', 'medium', 'high'].map((value) => {
                const status = getDistributionStatus(value);
                return (
                  <label key={value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#cbd5e1'
                  }}>
                    <input
                      type="radio"
                      name="distributionDaysSpy"
                      value={value}
                      checked={marketConditions.distributionDaysSpy === value}
                      onChange={(e) => updateDistributionDays('spy', e.target.value)}
                      style={{
                        accentColor: status.color
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {status.icon}
                      <span style={{ color: status.color }}>{status.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* QQQ Distribution */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '0.5rem'
            }}>
              QQQ Distribution
            </h4>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {['low', 'medium', 'high'].map((value) => {
                const status = getDistributionStatus(value);
                return (
                  <label key={value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#cbd5e1'
                  }}>
                    <input
                      type="radio"
                      name="distributionDaysQqq"
                      value={value}
                      checked={marketConditions.distributionDaysQqq === value}
                      onChange={(e) => updateDistributionDays('qqq', e.target.value)}
                      style={{
                        accentColor: status.color
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {status.icon}
                      <span style={{ color: status.color }}>{status.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid #334155',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#f8fafc',
          marginBottom: '0.75rem'
        }}>
          Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem'
        }}>
          <button
            onClick={setAllBullish}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🚀 All Bull
          </button>
          <button
            onClick={setAllBearish}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📉 All Bear
          </button>
          <button
            onClick={resetAll}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#64748b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              gridColumn: '1 / -1'
            }}
          >
            🔄 Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitorMobile;
