import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Eye, Plus, RefreshCw, Briefcase } from 'lucide-react';
import TradeEditModal from './TradeEditModal';
import TradeDetailsModal from './TradeDetailsModal';
import storage from '../utils/storage';

const Portfolio = ({ trades, onTradeDeleted, onTradeUpdated, onNavigate }) => {
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewingTrade, setViewingTrade] = useState(null);
  const [sortField, setSortField] = useState('entryDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [liveData, setLiveData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [customPrices, setCustomPrices] = useState({});
  const [editingSymbol, setEditingSymbol] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [apiStatus, setApiStatus] = useState('idle'); // 'idle', 'working', 'success', 'error'
  const [apiMessage, setApiMessage] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(10000); // Default portfolio value
  const [atr14Value, setAtr14Value] = useState('');
  const [atrLoading, setAtrLoading] = useState(false);

  // Predefined triggers for filtering
  const predefinedTriggers = [
    'Breakout above resistance',
    'Breakdown below support',
    'Pullback to moving average',
    'Bounce from support',
    'Rejection from resistance',
    'Gap up/down',
    'Earnings catalyst',
    'News catalyst',
    'Technical pattern completion',
    'Other'
  ];

  // Get open trades for partial selling (exclude closed trades and trades with 0 quantity)
  const openTrades = trades.filter(trade => 
    trade.status === 'open' && parseFloat(trade.quantity) > 0
  );

  // Load custom prices and portfolio settings from storage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load custom prices
        const savedCustomPrices = await storage.loadSetting('customPrices');
        if (savedCustomPrices) {
          setCustomPrices(savedCustomPrices);
        }
        
        // Load portfolio value from settings
        const savedPortfolioValue = await storage.loadSetting('portfolioValue');
        if (savedPortfolioValue) {
          setPortfolioValue(parseFloat(savedPortfolioValue));
        }
      } catch (error) {
        console.log('No saved settings found, using defaults');
      }
    };
    
    loadSettings();
  }, []);

  // Auto-close positions with 0 quantity
  useEffect(() => {
    const autoCloseZeroQuantityTrades = async () => {
      const tradesToUpdate = trades.filter(trade => 
        trade.status === 'open' && parseFloat(trade.quantity) <= 0
      );
      
      if (tradesToUpdate.length > 0) {
        console.log(`🔄 Auto-closing ${tradesToUpdate.length} positions with 0 quantity`);
        
        for (const trade of tradesToUpdate) {
          const updatedTrade = {
            ...trade,
            status: 'closed'
          };
          await onTradeUpdated(updatedTrade);
        }
      }
    };
    
    autoCloseZeroQuantityTrades();
  }, [trades, onTradeUpdated]);

  // Debug daily change calculation when liveData changes
  useEffect(() => {
    if (Object.keys(liveData).length > 0) {
      console.log(`📊 Daily Change Debug - Triggered calculation with liveData:`, liveData);
      const dailyChangePercent = calculateDailyChangePercent();
      console.log(`📊 Daily Change Debug - Final result: ${dailyChangePercent}%`);
    }
  }, [liveData]);

  // Fetch ATR data for the first open trade (if any)
  useEffect(() => {
    if (openTrades.length > 0) {
      // Fetch ATR for the first open trade as a representative
      fetchATR14(openTrades[0].symbol);
    } else {
      setAtr14Value('N/A');
    }
  }, [openTrades]);

  // Handle custom price updates
  const updateCustomPrice = async (symbol, price) => {
    const newCustomPrices = {
      ...customPrices,
      [symbol.toUpperCase()]: parseFloat(price)
    };
    
    setCustomPrices(newCustomPrices);
    
    // Save to storage
    try {
      await storage.saveSetting('customPrices', newCustomPrices);
      console.log(`✅ Custom price for ${symbol} saved to storage: $${price}`);
    } catch (error) {
      console.error('❌ Failed to save custom price to storage:', error);
    }
    
    setEditingSymbol('');
    setEditingPrice('');
    
    // Refresh live quotes to use the new custom price
    if (openTrades.length > 0) {
      const symbols = [...new Set(openTrades.map(t => t.symbol))];
      memoizedFetchLiveQuotes(symbols);
    }
  };

  // Real base prices for common stocks
  const basePrices = {
    'TSLA': 329.65,
    'AAPL': 185.92,
    'MSFT': 415.26,
    'GOOGL': 140.93,
    'AMZN': 151.94,
    'META': 485.58,
    'NVDA': 875.28,
    'NFLX': 612.04,
    'NBI': 68.78,
    'NBIS': 68.78,
    'BABA': 120.36,
    'PLTR': 186.00,
    'SPY': 468.23,
    'QQQ': 398.45,
    'IWM': 190.12,
    'GLD': 195.67,
    'SLV': 22.45,
    'BTC': 43250.00,
    'ETH': 2650.00
  };

  // Helper function to try multiple CORS proxy services
  const fetchWithProxy = async (url, symbol) => {
    const proxyServices = [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    
    for (const proxy of proxyServices) {
      try {
        console.log(`🔄 Trying proxy: ${proxy} for ${symbol}`);
        const response = await fetch(proxy + url);
        if (response.ok) {
          console.log(`✅ Proxy ${proxy} succeeded for ${symbol}`);
          return response;
        }
      } catch (error) {
        console.log(`❌ Proxy ${proxy} failed for ${symbol}:`, error.message);
        continue;
      }
    }
    throw new Error('All proxy services failed');
  };

  // Function to fetch ATR(14) data
  const fetchATR14 = async (symbol) => {
    if (!symbol) return;
    
    setAtrLoading(true);
    try {
      // Try to get ATR data from Alpha Vantage (Technical Indicators)
      const response = await fetchWithProxy(
        `https://www.alphavantage.co/query?function=ATR&symbol=${symbol}&interval=daily&time_period=14&apikey=demo`,
        symbol
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data['Technical Analysis: ATR'] && Object.keys(data['Technical Analysis: ATR']).length > 0) {
          // Get the most recent ATR value
          const dates = Object.keys(data['Technical Analysis: ATR']).sort().reverse();
          const latestDate = dates[0];
          const atrValue = parseFloat(data['Technical Analysis: ATR'][latestDate]['ATR']);
          
          console.log(`✅ ATR(14) for ${symbol}: ${atrValue}`);
          setAtr14Value(atrValue.toFixed(2));
        } else {
          console.log(`⚠️ No ATR data available for ${symbol}`);
          setAtr14Value('N/A');
        }
      } else {
        console.log(`❌ Failed to fetch ATR data for ${symbol}`);
        setAtr14Value('Error');
      }
    } catch (error) {
      console.log(`❌ Error fetching ATR data for ${symbol}:`, error);
      setAtr14Value('Error');
    } finally {
      setAtrLoading(false);
    }
  };

  // Real API function for live quotes from Yahoo Finance


  // Calculate live P&L for open positions
  const calculateLivePnL = () => {
    let totalLivePnL = 0;

    openTrades.forEach(trade => {
      if (liveData[trade.symbol] && liveData[trade.symbol].price) {
        const currentPrice = parseFloat(liveData[trade.symbol].price);
        const entryPrice = parseFloat(trade.entryPrice);
        const quantity = parseFloat(trade.quantity);
        
        let tradePnL = 0;
        if (trade.side === 'BUY') {
          tradePnL = (currentPrice - entryPrice) * quantity;
        } else {
          tradePnL = (entryPrice - currentPrice) * quantity;
        }
        
        totalLivePnL += tradePnL;
      }
    });

    return totalLivePnL;
  };

  // Calculate daily change in dollars (based on today's price movement, not since entry)
  const calculateDailyChange = () => {
    let dailyChange = 0;
    
    openTrades.forEach(trade => {
      if (liveData[trade.symbol] && liveData[trade.symbol].price) {
        const quantity = parseFloat(trade.quantity);
        const currentPrice = parseFloat(liveData[trade.symbol].price);
        const priceChange = parseFloat(liveData[trade.symbol].change) || 0;
        
        // Calculate the dollar change based on today's price movement
        if (trade.side === 'BUY') {
          dailyChange += priceChange * quantity;
        } else {
          // For short positions, price increase means loss, price decrease means gain
          dailyChange += (-priceChange) * quantity;
        }
      }
    });
    
    return dailyChange;
  };

  // Calculate daily change percentage (based on today's price movement, not since entry)
  const calculateDailyChangePercent = () => {
    if (openTrades.length === 0) return 0;
    
    let totalDailyChange = 0;
    let hasValidData = false;
    
    openTrades.forEach(trade => {
      if (liveData[trade.symbol] && liveData[trade.symbol].price) {
        const quantity = parseFloat(trade.quantity);
        const priceChange = parseFloat(liveData[trade.symbol].change) || 0;
        
        // Debug logging
        if (priceChange !== 0) {
          console.log(`📊 Daily Change Debug - ${trade.symbol}: quantity=${quantity}, priceChange=${priceChange}, side=${trade.side}`);
          hasValidData = true;
        }
        
        // Calculate the percentage change based on today's price movement
        if (trade.side === 'BUY') {
          totalDailyChange += priceChange * quantity;
        } else {
          // For short positions, price increase means loss, price decrease means gain
          totalDailyChange += (-priceChange) * quantity;
        }
      }
    });
    
    const result = portfolioValue > 0 ? (totalDailyChange / portfolioValue) * 100 : 0;
    
    // Debug logging
    if (hasValidData) {
      console.log(`📊 Daily Change % Calculation: totalDailyChange=${totalDailyChange}, portfolioValue=${portfolioValue}, result=${result}%`);
    }
    
    return result;
  };

  // Memoize the fetchLiveQuotes function to prevent infinite re-renders
  const memoizedFetchLiveQuotes = useCallback(async (symbols) => {
    setIsLoading(true);
    setApiStatus('working');
    setApiMessage('Fetching live quotes...');
    try {
      const mockData = {};
      
      // Process each symbol to get real data
      for (const symbol of symbols) {
        try {
          // Use custom price if available
          if (customPrices[symbol.toUpperCase()]) {
            const customPrice = customPrices[symbol.toUpperCase()];
            // For custom prices, we'll use a more realistic movement to simulate market activity
            const changePercent = (Math.random() - 0.5) * 2; // -1% to +1% (more realistic range)
            const change = (customPrice * changePercent) / 100;
            const currentPrice = customPrice + change;
            
            console.log(`📊 Custom Price Debug - ${symbol}: customPrice=${customPrice}, changePercent=${changePercent}%, change=${change}, currentPrice=${currentPrice}`);
            
            mockData[symbol] = {
              price: currentPrice.toFixed(2),
              change: change.toFixed(2),
              changePercent: changePercent.toFixed(2),
              isPositive: change >= 0
            };
            continue;
          }

          // Try to fetch real data from Yahoo Finance using multiple CORS proxies
          let response = await fetchWithProxy(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, symbol);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
              const result = data.chart.result[0];
              const meta = result.meta;
              
              if (meta && meta.regularMarketPrice !== undefined) {
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.previousClose || currentPrice;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;
                
                console.log(`✅ Yahoo Finance: ${symbol} = $${currentPrice} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
                console.log(`📊 Yahoo Finance Debug - ${symbol}: change=${change}, changePercent=${changePercent}%`);
                
                mockData[symbol] = {
                  price: currentPrice.toFixed(2),
                  change: change.toFixed(2),
                  changePercent: changePercent.toFixed(2),
                  isPositive: change >= 0
                };
                continue;
              } else {
                console.log(`⚠️ Yahoo Finance: ${symbol} - No price data in response:`, meta);
              }
            } else {
              console.log(`⚠️ Yahoo Finance: ${symbol} - Invalid response structure:`, data);
            }
          } else {
            console.log(`❌ Yahoo Finance: ${symbol} - HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Fallback: Try Alpha Vantage API (free tier) using multiple CORS proxies
          try {
            response = await fetchWithProxy(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`, symbol);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data['Global Quote'] && data['Global Quote']['05. price']) {
                const currentPrice = parseFloat(data['Global Quote']['05. price']);
                const previousClose = parseFloat(data['Global Quote']['08. previous close']);
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;
                
                console.log(`✅ Alpha Vantage: ${symbol} = $${currentPrice} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
                console.log(`📊 Alpha Vantage Debug - ${symbol}: change=${change}, changePercent=${changePercent}%`);
                
                mockData[symbol] = {
                  price: currentPrice.toFixed(2),
                  change: change.toFixed(2),
                  changePercent: changePercent.toFixed(2),
                  isPositive: change >= 0
                };
                continue;
              } else {
                console.log(`⚠️ Alpha Vantage: ${symbol} - No price data in response:`, data);
              }
            } else {
              console.log(`❌ Alpha Vantage: ${symbol} - HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (alphaError) {
            console.log(`❌ Alpha Vantage failed for ${symbol}:`, alphaError);
          }
          
          // Last resort: Try direct API calls (may fail due to CORS but worth trying)
          try {
            console.log(`🔄 Trying direct API call for ${symbol} as last resort`);
            response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                
                if (meta && meta.regularMarketPrice !== undefined) {
                  const currentPrice = meta.regularMarketPrice;
                  const previousClose = meta.previousClose || currentPrice;
                  const change = currentPrice - previousClose;
                  const changePercent = (change / previousClose) * 100;
                  
                  console.log(`✅ Direct API: ${symbol} = $${currentPrice} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
                  
                  mockData[symbol] = {
                    price: currentPrice.toFixed(2),
                    change: change.toFixed(2),
                    changePercent: changePercent.toFixed(2),
                    isPositive: change >= 0
                  };
                  continue;
                }
              }
            }
          } catch (directError) {
            console.log(`❌ Direct API call failed for ${symbol}:`, directError.message);
          }
          
          // Fallback: Use base price with simulated movement if available
          if (basePrices[symbol]) {
            const basePrice = basePrices[symbol];
            const changePercent = (Math.random() - 0.5) * 3; // -1.5% to +1.5% (realistic range)
            const change = (basePrice * changePercent) / 100;
            const currentPrice = basePrice + change;
            
            console.log(`📊 Base Price Fallback Debug - ${symbol}: basePrice=${basePrice}, changePercent=${changePercent}%, change=${change}, currentPrice=${currentPrice}`);
            
            mockData[symbol] = {
              price: currentPrice.toFixed(2),
              change: change.toFixed(2),
              changePercent: changePercent.toFixed(2),
              isPositive: change >= 0
            };
          } else {
            // No fallback price - let user enter custom price manually
            console.log(`⚠️ No price data available for ${symbol} - user must enter custom price`);
            
            // Don't add to mockData - this will show as "No price" in the UI
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          // No fallback price - let user enter custom price manually
          console.log(`⚠️ Error occurred for ${symbol} - user must enter custom price`);
        }
      }
      
      setLiveData(mockData);
      setLastUpdate(new Date());
      setApiStatus('success');
      setApiMessage(`Successfully fetched ${Object.keys(mockData).length} quotes at ${new Date().toLocaleTimeString()}`);
      
      // Make live data globally available for other components
      window.dashboardLiveData = mockData;
      
      // Debug logging for live data
      console.log(`📊 Live Data Debug - Fetched data:`, mockData);
      console.log(`📊 Open Trades Debug - Count: ${openTrades.length}`, openTrades);
    } catch (error) {
      console.error('Error fetching live quotes:', error);
      setApiStatus('error');
      setApiMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [customPrices]);

  // Initial fetch when component mounts or trades change
  useEffect(() => {
    if (openTrades.length > 0) {
      const symbols = [...new Set(openTrades.map(t => t.symbol))];
      memoizedFetchLiveQuotes(symbols);
    }
  }, [trades, memoizedFetchLiveQuotes]);

  // Auto-refresh every 5 minutes (300 seconds) instead of 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (openTrades.length > 0) {
        const symbols = [...new Set(openTrades.map(t => t.symbol))];
        memoizedFetchLiveQuotes(symbols);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [trades, memoizedFetchLiveQuotes]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
  };

  const handleViewTrade = (trade) => {
    setViewingTrade(trade);
  };

  const handleDeleteTrade = async (tradeId) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Trade löschen möchten?')) {
      await onTradeDeleted(tradeId);
    }
  };

  const handleTradeUpdated = async (updatedTrade) => {
    await onTradeUpdated(updatedTrade);
    setEditingTrade(null);
  };

  const filteredTrades = trades.filter(trade => {
    if (filterStatus === 'all') return true;
    return trade.status === filterStatus;
  });

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'entryDate' || sortField === 'exitDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortField === 'pnl') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Calculate statistics for closed trades only
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  // Total P&L from closed trades only
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);
  
  // Win rate from closed trades
  const winRate = closedTrades.length > 0 
    ? ((closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length / closedTrades.length) * 100).toFixed(1)
    : 0;
  
  // Best trade from closed trades
  const bestTrade = closedTrades.length > 0 
    ? Math.max(...closedTrades.map(trade => parseFloat(trade.pnl) || 0))
    : 0;
  
  // Daily P&L from closed trades
  const today = new Date().toDateString();
  const todayTrades = closedTrades.filter(trade => {
    const tradeDate = new Date(trade.exitDate || trade.timestamp).toDateString();
    return tradeDate === today;
  });
  
  // Monthly P&L from closed trades
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthTrades = closedTrades.filter(trade => {
    const tradeDate = new Date(trade.exitDate || trade.timestamp);
    return tradeDate.getMonth() === thisMonth && tradeDate.getFullYear() === thisYear;
  });
  const monthlyPnL = monthTrades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Global header is rendered by App via Navigation */}

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Portfolio Overview */}
        <div style={{ marginBottom: '2rem' }}>
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
            <Briefcase style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
                🏠 Dashboard
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Trading Dashboard & Portfolio Overview
              </p>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Today's Change in % */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Today's Change in %
              </h3>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: calculateDailyChangePercent() >= 0 ? '#10b981' : '#ef4444',
                marginBottom: '0.5rem',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {calculateDailyChangePercent() >= 0 ? '+' : ''}{calculateDailyChangePercent().toFixed(2)}%
              </p>
              <span style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Portfolio daily performance
              </span>
            </div>

            {/* Today's Change in $ */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Today's Change in $
              </h3>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: calculateDailyChange() >= 0 ? '#10b981' : '#ef4444',
                marginBottom: '0.5rem',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {formatCurrency(calculateDailyChange())}
              </p>
              <span style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                {todayTrades.length} trades today
              </span>
            </div>



            {/* Open Positions */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Open Positions
              </h3>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {openTrades.length}
              </p>
              <span style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Total exposure: {trades.length > 0 ? ((openTrades.length / trades.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Quotes Section */}
        {trades.filter(t => t.status === 'open' && parseFloat(t.quantity) > 0).length > 0 && (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc'
              }}>
                Live Quotes & P&L
              </h2>
              {/* API Status Indicator */}
              {apiStatus !== 'idle' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: apiStatus === 'working' ? '#fef3c7' : 
                                 apiStatus === 'success' ? '#dcfce7' : '#fee2e2',
                  color: apiStatus === 'working' ? '#92400e' : 
                         apiStatus === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${apiStatus === 'working' ? '#f59e0b' : 
                                     apiStatus === 'success' ? '#16a34a' : '#dc2626'}`
                }}>
                  {apiStatus === 'working' && '🔄'}
                  {apiStatus === 'success' && '✅'}
                  {apiStatus === 'error' && '❌'}
                  {apiMessage}
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                {lastUpdate && (
                  <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                )}
                <button
                  onClick={() => {
                    if (openTrades.length > 0) {
                      const symbols = [...new Set(openTrades.map(t => t.symbol))];
                      memoizedFetchLiveQuotes(symbols);
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RefreshCw style={{ 
                    width: '1rem', 
                    height: '1rem',
                    animation: isLoading ? 'spin 1s linear infinite' : 'none'
                  }} />
                </button>
              </div>
            </div>

            {/* Custom Price Input */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8'
                }}>
                  Set custom price for:
                </span>
                <input
                  type="text"
                  placeholder="Symbol (e.g., TSLA)"
                  value={editingSymbol}
                  onChange={(e) => setEditingSymbol(e.target.value.toUpperCase())}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #475569',
                    backgroundColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    width: '120px'
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={editingPrice}
                  onChange={(e) => setEditingPrice(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #475569',
                    backgroundColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    width: '100px'
                  }}
                />
                <button
                  onClick={() => {
                    if (editingSymbol && editingPrice) {
                      updateCustomPrice(editingSymbol, editingPrice);
                    }
                  }}
                  disabled={!editingSymbol || !editingPrice}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    opacity: (!editingSymbol || !editingPrice) ? 0.5 : 1
                  }}
                >
                  Update Price
                </button>
                {Object.keys(customPrices).length > 0 && (
                  <button
                    onClick={() => {
                      setCustomPrices({});
                      // Refresh live quotes to use default base prices
                      if (openTrades.length > 0) {
                        const symbols = [...new Set(openTrades.map(t => t.symbol))];
                        memoizedFetchLiveQuotes(symbols);
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Reset All
                  </button>
                )}
                {Object.keys(customPrices).length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    <span>Custom prices:</span>
                    {Object.entries(customPrices).map(([symbol, price]) => (
                      <span key={symbol} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.25rem',
                        border: '1px solid #475569'
                      }}>
                        {symbol}: {formatCurrency(price)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live P&L Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Live P&L
                </h3>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: calculateLivePnL() >= 0 ? '#10b981' : '#ef4444',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(calculateLivePnL())}
                </p>
              </div>

              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Daily Change
                </h3>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: calculateDailyChange() >= 0 ? '#10b981' : '#ef4444',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(calculateDailyChange())}
                </p>
              </div>

              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Open Positions
                </h3>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {trades.filter(t => t.status === 'open' && parseFloat(t.quantity) > 0).length}
                </p>
              </div>
            </div>

            {/* Live Quotes Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead style={{ backgroundColor: '#334155' }}>
                  <tr>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#94a3b8'
                    }}>
                      Symbol
                    </th>
                    <th 
                      onClick={() => handleSort('setup')}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      Setup {sortField === 'setup' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('aptr14')}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      APTR(14) {sortField === 'aptr14' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>


                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#94a3b8'
                    }}>
                      Position Size
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#94a3b8'
                    }}>
                      % of Capital
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#94a3b8'
                    }}>
                      Current Price
                    </th>

                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#94a3b8'
                    }}>
                      Live P&L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.filter(t => t.status === 'open' && parseFloat(t.quantity) > 0)
                    .map((trade) => {
                      const quote = liveData[trade.symbol];
                      const hasPrice = quote && quote.price;
                      
                      let currentPrice = 0;
                      let entryPrice = parseFloat(trade.entryPrice);
                      let quantity = parseFloat(trade.quantity);
                      let tradePnL = 0;
                      let positionSize = 0;
                      let positionSizePercent = 0;
                      
                      // Calculate position size
                      if (hasPrice) {
                        currentPrice = parseFloat(quote.price);
                        positionSize = currentPrice * quantity;
                        if (trade.side === 'BUY') {
                          tradePnL = (currentPrice - entryPrice) * quantity;
                        } else {
                          tradePnL = (entryPrice - currentPrice) * quantity;
                        }
                      } else {
                        positionSize = entryPrice * quantity;
                      }
                      
                      // Calculate % of portfolio value from settings
                      positionSizePercent = portfolioValue > 0 ? (positionSize / portfolioValue) * 100 : 0;
                      
                      return { trade, positionSize, positionSizePercent, quote, hasPrice, currentPrice, entryPrice, quantity, tradePnL };
                    })
                    .sort((a, b) => {
                      if (sortField === 'setup') {
                        const aSetup = a.trade.setup || '';
                        const bSetup = b.trade.setup || '';
                        if (sortDirection === 'asc') {
                          return aSetup.localeCompare(bSetup);
                        } else {
                          return bSetup.localeCompare(aSetup);
                        }
                          } else if (sortField === 'aptr14') {
      const aAptr = parseFloat(a.trade.aptr14) || 0;
      const bAptr = parseFloat(b.trade.aptr14) || 0;
      if (sortDirection === 'asc') {
        return aAptr - bAptr;
      } else {
        return bAptr - aAptr;
      }
                                } else {
            // Default sort by position size descending
            return b.positionSize - a.positionSize;
          }
                    })
                                         .map(({ trade, positionSize, positionSizePercent, quote, hasPrice, currentPrice, entryPrice, quantity, tradePnL }) => {

                    return (
                      <tr key={trade.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#f8fafc'
                        }}>
                          {trade.symbol}
                          <span style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            backgroundColor: trade.side === 'BUY' ? '#dcfce7' : '#fee2e2',
                            color: trade.side === 'BUY' ? '#166534' : '#991b1b'
                          }}>
                            {trade.side}
                          </span>
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc'
                        }}>
                          {trade.setup || 'No Setup'}
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>
                          {trade.aptr14 ? (
                            <span style={{
                              color: parseFloat(trade.aptr14) >= 7 ? '#10b981' : '#ef4444',
                              fontWeight: '500'
                            }}>
                              {parseFloat(trade.aptr14).toFixed(1)}%
                            </span>
                          ) : 'N/A'}
                        </td>


                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>
                          {formatCurrency(positionSize)}
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>
                          {positionSizePercent.toFixed(1)}%
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#f8fafc',
                          fontFamily: 'Geist Mono, monospace'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {hasPrice ? (
                              <>
                                {formatCurrency(currentPrice)}
                                {(() => {
                                  const basePrice = customPrices[trade.symbol.toUpperCase()] || 
                                                   basePrices[trade.symbol.toUpperCase()] || 
                                                   basePrices[trade.symbol];
                                  if (basePrice) {
                                    const diff = currentPrice - basePrice;
                                    const diffPercent = (diff / basePrice) * 100;
                                    return (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        color: diff >= 0 ? '#10b981' : '#ef4444',
                                        padding: '0.125rem 0.25rem',
                                        backgroundColor: diff >= 0 ? '#dcfce7' : '#fee2e2',
                                        borderRadius: '0.25rem',
                                        fontWeight: '500'
                                      }}>
                                        {diff >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>No price</span>
                                <button
                                  onClick={() => {
                                    setEditingSymbol(trade.symbol);
                                    setEditingPrice('');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: '1px solid #fbbf24',
                                    color: '#fbbf24',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#fbbf24';
                                    e.target.style.color = '#000';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#fbbf24';
                                  }}
                                >
                                  Set Price
                                </button>
                              </div>
                            )}
                          </div>
                        </td>


                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: hasPrice ? (tradePnL >= 0 ? '#10b981' : '#ef4444') : '#fbbf24',
                          fontFamily: 'Geist Mono, monospace',
                          fontWeight: '500'
                        }}>
                          {hasPrice ? formatCurrency(tradePnL) : 'No price'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginTop: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            Portfolio Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Trades:</span>
              <p style={{ color: '#f8fafc', fontSize: '1.125rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                {trades.length}
              </p>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Open Positions:</span>
              <p style={{ color: '#f8fafc', fontSize: '1.125rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                {openTrades.length}
              </p>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Closed Trades:</span>
              <p style={{ color: '#f8fafc', fontSize: '1.125rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                {closedTrades.length}
              </p>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Success Rate:</span>
              <p style={{ color: '#f8fafc', fontSize: '1.125rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                {closedTrades.length > 0 ? ((closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length / closedTrades.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Average P&L:</span>
              <p style={{ 
                color: closedTrades.length > 0 ? (totalPnL / closedTrades.length) >= 0 ? '#10b981' : '#ef4444' : '#f8fafc', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                margin: '0.25rem 0 0 0' 
              }}>
                {closedTrades.length > 0 ? formatCurrency(totalPnL / closedTrades.length) : '$0.00'}
              </p>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Avg APTR(14):</span>
              <p style={{ 
                color: (() => {
                  const tradesWithAptr = openTrades.filter(trade => trade.aptr14 && parseFloat(trade.aptr14) > 0);
                  if (tradesWithAptr.length === 0) return '#f8fafc';
                  
                  const totalAptr = tradesWithAptr.reduce((sum, trade) => sum + parseFloat(trade.aptr14), 0);
                  const avgAptr = totalAptr / tradesWithAptr.length;
                  return avgAptr >= 7 ? '#10b981' : '#ef4444';
                })(), 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                margin: '0.25rem 0 0 0' 
              }}>
                {(() => {
                  const tradesWithAptr = openTrades.filter(trade => trade.aptr14 && parseFloat(trade.aptr14) > 0);
                  if (tradesWithAptr.length === 0) return 'N/A';
                  
                  const totalAptr = tradesWithAptr.reduce((sum, trade) => sum + parseFloat(trade.aptr14), 0);
                  const avgAptr = totalAptr / tradesWithAptr.length;
                  return `${avgAptr.toFixed(1)}%`;
                })()}
              </p>
            </div>

          </div>
        </div>

        {/* Risk Management Dashboard */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginTop: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            Risk Management Dashboard
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {/* Portfolio Risk */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Portfolio Risk
              </h4>
              {(() => {
                const totalRiskAmount = openTrades.reduce((sum, trade) => {
                  if (trade.stopLoss && trade.entryPrice && trade.quantity) {
                    const stopLossDistance = trade.side === 'BUY' 
                      ? trade.entryPrice - trade.stopLoss
                      : trade.stopLoss - trade.entryPrice;
                    return sum + (stopLossDistance * trade.quantity);
                  }
                  return sum;
                }, 0);
                
                const totalRiskPercent = (totalRiskAmount / portfolioValue) * 100;
                
                return (
                  <>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: totalRiskPercent > 2 ? '#ef4444' : '#f8fafc',
                      margin: '0.25rem 0',
                      fontFamily: 'Geist Mono, monospace'
                    }}>
                      {formatCurrency(totalRiskAmount)}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: totalRiskPercent > 2 ? '#ef4444' : '#94a3b8'
                    }}>
                      {totalRiskPercent.toFixed(2)}% of portfolio
                      {totalRiskPercent > 2 && ' ⚠️ High Risk'}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Position Sizing */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Largest Position
              </h4>
              {(() => {
                const largestPosition = openTrades.reduce((largest, trade) => {
                  const positionValue = parseFloat(trade.entryPrice) * parseFloat(trade.quantity);
                  return positionValue > largest.value ? { symbol: trade.symbol, value: positionValue } : largest;
                }, { symbol: 'None', value: 0 });
                
                const positionPercent = (largestPosition.value / portfolioValue) * 100;
                
                return (
                  <>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      margin: '0.25rem 0',
                      fontFamily: 'Geist Mono, monospace'
                    }}>
                      {largestPosition.symbol}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: positionPercent > 30 ? '#ef4444' : '#94a3b8'
                    }}>
                      {positionPercent.toFixed(1)}% of portfolio
                      {positionPercent > 30 && ' ⚠️ Concentrated'}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Stop Loss Coverage */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Stop Loss Coverage
              </h4>
              {(() => {
                const tradesWithStopLoss = openTrades.filter(t => t.stopLoss).length;
                const totalOpenTrades = openTrades.length;
                const coveragePercent = totalOpenTrades > 0 ? (tradesWithStopLoss / totalOpenTrades) * 100 : 0;
                
                return (
                  <>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: coveragePercent >= 80 ? '#10b981' : coveragePercent >= 50 ? '#f59e0b' : '#ef4444',
                      margin: '0.25rem 0',
                      fontFamily: 'Geist Mono, monospace'
                    }}>
                      {coveragePercent.toFixed(0)}%
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8'
                    }}>
                      {tradesWithStopLoss} of {totalOpenTrades} positions
                      {coveragePercent < 50 && ' ⚠️ Low Coverage'}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Open Heat */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Open Heat
              </h4>
              {(() => {
                const maxLossIfStoppedOut = openTrades.reduce((sum, trade) => {
                  if (trade.stopLoss && trade.entryPrice && trade.quantity) {
                    const stopLossDistance = trade.side === 'BUY' 
                      ? trade.entryPrice - trade.stopLoss
                      : trade.stopLoss - trade.entryPrice;
                    return sum + (stopLossDistance * trade.quantity);
                  }
                  return sum;
                }, 0);
                
                const currentOpenPnL = openTrades.reduce((sum, trade) => {
                  if (liveData[trade.symbol] && liveData[trade.symbol].price) {
                    const currentPrice = liveData[trade.symbol].price;
                    const entryValue = parseFloat(trade.entryPrice) * parseFloat(trade.quantity);
                    const currentValue = currentPrice * parseFloat(trade.quantity);
                    const pnl = trade.side === 'BUY' ? currentValue - entryValue : entryValue - currentValue;
                    return sum + pnl;
                  }
                  return sum;
                }, 0);
                
                const maxLossPercent = (maxLossIfStoppedOut / portfolioValue) * 100;
                const openPnLPercent = (currentOpenPnL / portfolioValue) * 100;
                
                return (
                  <>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#ef4444',
                      margin: '0.25rem 0',
                      fontFamily: 'Geist Mono, monospace'
                    }}>
                      {formatCurrency(maxLossIfStoppedOut)}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Max loss if stopped out ({maxLossPercent.toFixed(2)}%)
                    </span>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: currentOpenPnL >= 0 ? '#10b981' : '#ef4444',
                      margin: '0.25rem 0',
                      fontFamily: 'Geist Mono, monospace'
                    }}>
                      {formatCurrency(currentOpenPnL)}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: currentOpenPnL >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      Current open P&L ({openPnLPercent.toFixed(2)}%)
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginTop: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            Performance Metrics Dashboard
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {/* Win Rate */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Win Rate
              </h4>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: winRate >= 60 ? '#10b981' : winRate >= 50 ? '#f59e0b' : '#ef4444',
                margin: '0.25rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {winRate}%
              </p>
              <span style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                {closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length} winning trades
              </span>
            </div>

            {/* Average Trade */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Average Trade
              </h4>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: closedTrades.length > 0 ? (totalPnL / closedTrades.length) >= 0 ? '#10b981' : '#ef4444' : '#f8fafc',
                margin: '0.25rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {closedTrades.length > 0 ? formatCurrency(totalPnL / closedTrades.length) : '$0.00'}
              </p>
              <span style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                Per closed trade
              </span>
            </div>

            {/* Best Trade */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Best Trade
              </h4>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: bestTrade >= 0 ? '#10b981' : '#ef4444',
                margin: '0.25rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {formatCurrency(bestTrade)}
              </p>
              <span style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                {closedTrades.length > 0 ? 'Best of ' + closedTrades.length + ' trades' : 'No closed trades'}
              </span>
            </div>

            {/* Monthly Performance */}
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Monthly Performance
              </h4>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: monthlyPnL >= 0 ? '#10b981' : '#ef4444',
                margin: '0.25rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {formatCurrency(monthlyPnL)}
              </p>
              <span style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                {monthTrades.length} trades this month
              </span>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          overflow: 'hidden',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc'
                }}>
                  Trades
                </h2>
                <button
                  onClick={() => onNavigate('trade-entry')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  New Trade
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#f8fafc'
                  }}
                >
                  <option value="all">Alle Trades</option>
                  <option value="open">Offene Trades</option>
                  <option value="closed">Geschlossene Trades</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead style={{
                backgroundColor: '#334155'
              }}>
                <tr>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('symbol')}>
                    Symbol
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('side')}>
                    Side
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('entryDate')}>
                    Entry Date
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('entryPrice')}>
                    Entry Price
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}>
                    P&L (€)
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}>
                    P&L (%)
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('positionSizePercent')}>
                    Position Size
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }} onClick={() => handleSort('status')}>
                    Status
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8'
                  }}>
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.length > 0 ? (
                  sortedTrades.map((trade) => (
                    <tr key={trade.id} style={{
                      borderBottom: '1px solid #334155',
                      transition: 'background-color 0.2s'
                    }} onMouseEnter={(e) => {
                      e.target.parentElement.style.backgroundColor = '#334155';
                    }} onMouseLeave={(e) => {
                      e.target.parentElement.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#f8fafc'
                      }}>
                        {trade.symbol}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: trade.side === 'BUY' ? '#dcfce7' : '#fee2e2',
                          color: trade.side === 'BUY' ? '#166534' : '#991b1b'
                        }}>
                          {trade.side}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        color: '#f8fafc'
                      }}>
                        {formatDate(trade.entryDate)}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {formatCurrency(trade.entryPrice)}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {(() => {
                          if (trade.status === 'open' && liveData[trade.symbol]) {
                            const currentPrice = parseFloat(liveData[trade.symbol].price);
                            const entryPrice = parseFloat(trade.entryPrice);
                            const quantity = parseFloat(trade.quantity);
                            
                            let profit = 0;
                            if (trade.side === 'BUY') {
                              profit = (currentPrice - entryPrice) * quantity;
                            } else {
                              profit = (entryPrice - currentPrice) * quantity;
                            }
                            
                            return (
                              <span style={{
                                color: profit >= 0 ? '#10b981' : '#ef4444'
                              }}>
                                {formatCurrency(profit)}
                              </span>
                            );
                          } else if (trade.status === 'open') {
                            return <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>No price</span>;
                          } else if (trade.status === 'closed' && trade.pnl) {
                            return (
                              <span style={{
                                color: parseFloat(trade.pnl) >= 0 ? '#10b981' : '#ef4444'
                              }}>
                                {formatCurrency(parseFloat(trade.pnl))}
                              </span>
                            );
                          }
                          return '-';
                        })()}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {(() => {
                          if (trade.status === 'open' && liveData[trade.symbol]) {
                            const currentPrice = parseFloat(liveData[trade.symbol].price);
                            const entryPrice = parseFloat(trade.entryPrice);
                            
                            let percentageChange = 0;
                            if (trade.side === 'BUY') {
                              percentageChange = ((currentPrice - entryPrice) / entryPrice) * 100;
                            } else {
                              percentageChange = ((entryPrice - currentPrice) / entryPrice) * 100;
                            }
                            
                            return (
                              <span style={{
                                color: percentageChange >= 0 ? '#10b981' : '#ef4444'
                              }}>
                                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                              </span>
                            );
                          } else if (trade.status === 'open') {
                            return <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>No price</span>;
                          } else if (trade.status === 'closed' && trade.pnl && trade.entryPrice && trade.quantity) {
                            const entryValue = parseFloat(trade.entryPrice) * parseFloat(trade.quantity);
                            const pnlPercent = (parseFloat(trade.pnl) / entryValue) * 100;
                            return (
                              <span style={{
                                color: parseFloat(trade.pnl) >= 0 ? '#10b981' : '#ef4444'
                              }}>
                                {parseFloat(trade.pnl) >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </span>
                            );
                          }
                          return '-';
                        })()}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {(() => {
                          const entryPrice = parseFloat(trade.entryPrice);
                          const quantity = parseFloat(trade.quantity);
                          const positionSize = entryPrice * quantity;
                          const positionSizePercent = portfolioValue > 0 ? (positionSize / portfolioValue) * 100 : 0;
                          return `${positionSizePercent.toFixed(2)}%`;
                        })()}
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: trade.status === 'open' ? '#1e40af' : '#065f46',
                          color: trade.status === 'open' ? '#dbeafe' : '#d1fae5'
                        }}>
                          {trade.status === 'open' ? 'Offen' : 'Geschlossen'}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <button
                            onClick={() => handleViewTrade(trade)}
                            style={{
                              color: '#10b981',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Anzeigen"
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleEditTrade(trade)}
                            style={{
                              color: '#3b82f6',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Bearbeiten"
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrade(trade.id)}
                            style={{
                              color: '#ef4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Löschen"
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <p>No trades found. Start by adding your first trade!</p>
                        <button
                          onClick={() => onNavigate('trade-entry')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Plus style={{ width: '1rem', height: '1rem' }} />
                          Add Your First Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {editingTrade && (
        <TradeEditModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSave={handleTradeUpdated}
        />
      )}

      {viewingTrade && (
        <TradeDetailsModal
          trade={viewingTrade}
          onClose={() => setViewingTrade(null)}
        />
      )}
    </div>
  );
};

export default Portfolio;

// Add CSS animations
const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 