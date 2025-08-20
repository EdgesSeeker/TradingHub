import React, { useState, useEffect } from 'react';
import { Search, Settings, BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import TradingViewMiniChart from './TradingViewMiniChart';
import CompanyInfo from './CompanyInfo';

const ChartAnalysis = ({ trades, onNavigate }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [chartInterval, setChartInterval] = useState('1D');
  const [chartTheme, setChartTheme] = useState('dark');
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique symbols from trades
  const tradeSymbols = [...new Set(trades.map(trade => trade.symbol))];

  // Common symbols for quick access
  const commonSymbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
    'SPY', 'QQQ', 'IWM', 'VIX', 'GLD', 'SLV', 'USO', 'TLT'
  ];

  // Intervals for chart
  const intervals = [
    { value: '1', label: '1m', icon: <Clock size={14} /> },
    { value: '5', label: '5m', icon: <Clock size={14} /> },
    { value: '15', label: '15m', icon: <Clock size={14} /> },
    { value: '30', label: '30m', icon: <Clock size={14} /> },
    { value: '60', label: '1h', icon: <Clock size={14} /> },
    { value: '1D', label: '1D', icon: <Calendar size={14} /> },
    { value: '1W', label: '1W', icon: <Calendar size={14} /> },
    { value: '1M', label: '1M', icon: <Calendar size={14} /> }
  ];

  // Add symbol to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  // Remove symbol from watchlist
  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  // Get trade data for selected symbol
  const getTradeData = (symbol) => {
    return trades.filter(trade => trade.symbol === symbol);
  };

  // Get current open positions
  const getCurrentPositions = () => {
    return trades.filter(trade => 
      trade.status === 'open' && parseFloat(trade.quantity) > 0
    );
  };

  const selectedTradeData = getTradeData(selectedSymbol);
  const currentPositions = getCurrentPositions();

  return (
    <div style={{ padding: '1rem', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BarChart3 size={24} color="#3b82f6" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            Chart Analysis
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCompanyInfo(!showCompanyInfo)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showCompanyInfo ? '#3b82f6' : '#475569',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={16} />
            {showCompanyInfo ? 'Hide' : 'Show'} Analysis
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)' }}>
        {/* Left Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Symbol Search */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
              Symbol Search
            </h3>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 0.5rem 2rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
                         {/* Current Portfolio Positions */}
             <div style={{ marginBottom: '1rem' }}>
               <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>
                 Portfolio
               </h4>
               {currentPositions.length === 0 ? (
                 <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                   No open positions
                 </p>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                   {currentPositions.map(trade => (
                     <div key={trade.id} style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                       padding: '0.5rem',
                       backgroundColor: selectedSymbol === trade.symbol ? '#3b82f6' : '#334155',
                       borderRadius: '0.375rem',
                       border: '1px solid #475569',
                       cursor: 'pointer'
                     }}
                     onClick={() => setSelectedSymbol(trade.symbol)}
                     >
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                         <span style={{
                           fontSize: '0.875rem',
                           fontWeight: '600',
                           color: '#f8fafc'
                         }}>
                           {trade.symbol}
                         </span>
                         <span style={{
                           fontSize: '0.75rem',
                           color: '#94a3b8'
                         }}>
                           {trade.quantity} shares @ ${parseFloat(trade.entryPrice).toFixed(2)}
                         </span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                         <span style={{
                           fontSize: '0.75rem',
                           fontWeight: '500',
                           color: trade.side === 'BUY' ? '#10b981' : '#ef4444'
                         }}>
                           {trade.side}
                         </span>
                         <span style={{
                           fontSize: '0.75rem',
                           color: '#94a3b8'
                         }}>
                           {trade.entryDate}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

            {/* Trade Symbols */}
            {tradeSymbols.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>
                  Your Trades
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {tradeSymbols.map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: selectedSymbol === symbol ? '#3b82f6' : '#475569',
                        border: 'none',
                        borderRadius: '0.25rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart Controls */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #475569'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
              Chart Settings
            </h3>
            
            {/* Interval Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>
                Timeframe
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {intervals.map(interval => (
                  <button
                    key={interval.value}
                    onClick={() => setChartInterval(interval.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: chartInterval === interval.value ? '#3b82f6' : '#475569',
                      border: 'none',
                      borderRadius: '0.25rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {interval.icon}
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>
                Theme
              </h4>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => setChartTheme('dark')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: chartTheme === 'dark' ? '#3b82f6' : '#475569',
                    border: 'none',
                    borderRadius: '0.25rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => setChartTheme('light')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: chartTheme === 'light' ? '#3b82f6' : '#475569',
                    border: 'none',
                    borderRadius: '0.25rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Light
                </button>
              </div>
            </div>
          </div>

          {/* Watchlist */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #475569',
            flex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                Watchlist
              </h3>
              <button
                onClick={() => addToWatchlist(selectedSymbol)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#475569',
                  border: 'none',
                  borderRadius: '0.25rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                Add {selectedSymbol}
              </button>
            </div>
            
            {watchlist.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                No symbols in watchlist
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {watchlist.map(symbol => (
                  <div key={symbol} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    borderRadius: '0.375rem',
                    border: '1px solid #475569'
                  }}>
                    <button
                      onClick={() => setSelectedSymbol(symbol)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {symbol}
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(symbol)}
                      style={{
                        padding: '0.125rem 0.25rem',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: '0.25rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.625rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chart Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Chart */}
          <div style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #475569',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
                             <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc' }}>
                 {selectedSymbol} Chart
               </h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                   {selectedTradeData.length} trades • {currentPositions.length} open positions
                 </span>
                <button
                  onClick={() => onNavigate('portfolio')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#475569',
                    border: 'none',
                    borderRadius: '0.25rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  View Trades
                </button>
              </div>
            </div>
            
            <div style={{ height: 'calc(100% - 80px)' }}>
              <TradingViewChart
                symbol={selectedSymbol}
                interval={chartInterval}
                theme={chartTheme}
                height="100%"
              />
            </div>
          </div>

          {/* Company Info Panel */}
          {showCompanyInfo && (
            <div style={{
              height: '300px',
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              border: '1px solid #475569',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #475569'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                  Company Analysis - {selectedSymbol}
                </h3>
              </div>
              <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
                <CompanyInfo symbol={selectedSymbol} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartAnalysis;
