import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, CheckCircle, XCircle, MinusCircle, BarChart3, Target } from 'lucide-react';
import storage from '../utils/storage';

const MarketMonitor = () => {
  const [marketConditions, setMarketConditions] = useState({
    qqqTrend: false,
    spyTrend: false,
    iwmTrend: false,
    distributionDaysSpy: 'low', // 'low', 'medium', 'high'
    distributionDaysQqq: 'low', // 'low', 'medium', 'high'
    manualStatus: 'neutral' // 'bullish', 'neutral', 'bearish'
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
    fetchSMAData(); // Auto-fetch SMA data on load
  }, []);

  // Auto-refresh SMA data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSMAData();
    }, 5 * 60 * 1000); // 5 minutes

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
      
      // Always calculate and save current market health status
      const healthStatus = calculateOverallMarketHealth();
      await storage.saveSetting('marketHealthStatus', healthStatus);
      console.log('Market health status saved:', healthStatus);
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

  // Fetch SMA data using Yahoo Finance API (more reliable)
  const fetchSMAData = async () => {
    setIsLoading(true);
    const symbols = ['QQQ', 'SPY', 'IWM'];
    const newSmaData = { ...smaData };
    const newMarketConditions = { ...marketConditions };

    try {
      for (const symbol of symbols) {
        try {
          // Using Yahoo Finance API via CORS proxy
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
              // Calculate 10-day and 20-day SMA
              const sma10 = closes.slice(-10).reduce((sum, price) => sum + price, 0) / 10;
              const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
              const trend = sma10 > sma20;
              
              newSmaData[symbol] = {
                sma10: sma10,
                sma20: sma20,
                trend: trend
              };

              // Update market conditions based on trend
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
          // Continue with other symbols
        }
      }

      setSmaData(newSmaData);
      setMarketConditions(newMarketConditions);
      await saveMarketData(newMarketConditions);
      
      // Save market health status for other components
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
    
    // Update market health status
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
    
    // Update market health status
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
    
    // Update market health status
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
    
    // Update market health status
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
    
    // Update market health status
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const setManualStatus = async (status) => {
    const newConditions = { ...marketConditions, manualStatus: status };
    setMarketConditions(newConditions);
    await saveMarketData(newConditions);
    
    // Update market health status
    const healthStatus = calculateOverallMarketHealth();
    await storage.saveSetting('marketHealthStatus', healthStatus);
  };

  const getTrendStatus = (isValid) => {
    return {
      icon: isValid ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />,
      color: isValid ? '#10b981' : '#ef4444',
      text: isValid ? 'Yes' : 'No'
    };
  };


  const getDistributionStatus = (value) => {
    switch (value) {
      case 'low':
        return { color: '#10b981', text: '<3', icon: <CheckCircle size={16} color="#10b981" /> };
      case 'medium':
        return { color: '#f59e0b', text: '3-5', icon: <MinusCircle size={16} color="#f59e0b" /> };
      case 'high':
        return { color: '#ef4444', text: '>6 (red No)', icon: <XCircle size={16} color="#ef4444" /> };
      default:
        return { color: '#94a3b8', text: 'Select', icon: <MinusCircle size={16} color="#94a3b8" /> };
    }
  };

  const calculateOverallMarketHealth = () => {
    // If manual status is set, use it
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

    // Auto-calculate if manual status is neutral
    // Trend conditions (80% weight)
    const trendConditions = [
      marketConditions.qqqTrend,
      marketConditions.spyTrend,
      marketConditions.iwmTrend
    ];
    
    // Distribution conditions (20% weight)
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
      padding: '2rem',
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
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '3rem',
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
            fontSize: '1.125rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Real-time market conditions and technical analysis dashboard
          </p>
        </div>

        {/* Overall Market Health */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#94a3b8',
            marginBottom: '1rem'
          }}>
            Overall Market Health
            {overallHealth.isManual && (
              <span style={{
                fontSize: '0.75rem',
                color: '#f59e0b',
                marginLeft: '0.5rem',
                fontWeight: '400'
              }}>
                (Manual Override)
              </span>
            )}
          </h2>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem 2rem',
            backgroundColor: overallHealth.color + '20',
            border: `2px solid ${overallHealth.color}`,
            borderRadius: '1rem',
            marginBottom: '1rem'
          }}>
            {overallHealth.status === 'bullish' && <TrendingUp size={32} color={overallHealth.color} />}
            {overallHealth.status === 'neutral' && <MinusCircle size={32} color={overallHealth.color} />}
            {overallHealth.status === 'bearish' && <TrendingDown size={32} color={overallHealth.color} />}
            <span style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: overallHealth.color
            }}>
              {overallHealth.text}
            </span>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0
          }}>
            Last updated: {lastUpdate.toLocaleString()}
          </p>
        </div>

        {/* Manual Status Override */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #334155'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={20} color="#f59e0b" />
            Manual Status Override
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginBottom: '1rem'
          }}>
            Override automatic calculation and set market status manually
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setManualStatus('bullish')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: marketConditions.manualStatus === 'bullish' ? '#10b981' : '#1e293b',
                color: marketConditions.manualStatus === 'bullish' ? '#ffffff' : '#10b981',
                border: `2px solid #10b981`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (marketConditions.manualStatus !== 'bullish') {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseOut={(e) => {
                if (marketConditions.manualStatus !== 'bullish') {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.color = '#10b981';
                }
              }}
            >
              <TrendingUp size={16} />
              BULLISH
            </button>
            <button
              onClick={() => setManualStatus('neutral')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: marketConditions.manualStatus === 'neutral' ? '#f59e0b' : '#1e293b',
                color: marketConditions.manualStatus === 'neutral' ? '#ffffff' : '#f59e0b',
                border: `2px solid #f59e0b`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (marketConditions.manualStatus !== 'neutral') {
                  e.target.style.backgroundColor = '#f59e0b';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseOut={(e) => {
                if (marketConditions.manualStatus !== 'neutral') {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.color = '#f59e0b';
                }
              }}
            >
              <MinusCircle size={16} />
              NEUTRAL
            </button>
            <button
              onClick={() => setManualStatus('bearish')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: marketConditions.manualStatus === 'bearish' ? '#ef4444' : '#1e293b',
                color: marketConditions.manualStatus === 'bearish' ? '#ffffff' : '#ef4444',
                border: `2px solid #ef4444`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (marketConditions.manualStatus !== 'bearish') {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseOut={(e) => {
                if (marketConditions.manualStatus !== 'bearish') {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.color = '#ef4444';
                }
              }}
            >
              <TrendingDown size={16} />
              BEARISH
            </button>
          </div>
        </div>

        {/* Market Conditions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Trend Validity Section */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={20} color="#3b82f6" />
                Trend Validity (10SMA &gt; 20SMA)
              </h3>
              <button
                onClick={fetchSMAData}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isLoading ? '#64748b' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                <RefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* QQQ */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.75rem',
                border: '1px solid #475569'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#f8fafc'
                  }}>
                    QQQ
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTrendStatus(marketConditions.qqqTrend).icon}
                    <span style={{
                      fontSize: '0.875rem',
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
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#10b981'
                  }}
                />
              </div>

              {/* SPY */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.75rem',
                border: '1px solid #475569'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#f8fafc'
                  }}>
                    SPY
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTrendStatus(marketConditions.spyTrend).icon}
                    <span style={{
                      fontSize: '0.875rem',
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
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#10b981'
                  }}
                />
              </div>

              {/* IWM */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.75rem',
                border: '1px solid #475569'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#f8fafc'
                  }}>
                    IWM
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTrendStatus(marketConditions.iwmTrend).icon}
                    <span style={{
                      fontSize: '0.875rem',
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
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#10b981'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Distribution Days Section */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={20} color="#f59e0b" />
              Distribution Days
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* SPY Distribution Days */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.75rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '0.75rem'
                }}>
                  Distribution Days: SPY
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {['low', 'medium', 'high'].map((value) => {
                    const status = getDistributionStatus(value);
                    return (
                      <label key={value} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
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

              {/* QQQ Distribution Days */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.75rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '0.75rem'
                }}>
                  Distribution Days: QQQ
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {['low', 'medium', 'high'].map((value) => {
                    const status = getDistributionStatus(value);
                    return (
                      <label key={value} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
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
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={setAllBullish}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              🚀 Set All Bullish
            </button>
            <button
              onClick={setAllBearish}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              📉 Set All Bearish
            </button>
            <button
              onClick={resetAll}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#64748b'}
            >
              🔄 Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitor;

