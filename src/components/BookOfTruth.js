import React, { useState, useEffect } from 'react';
import { BookOpen, Filter, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Camera, X, Edit, Layers, List } from 'lucide-react';

const BookOfTruth = ({ trades, onTradeUpdated }) => {
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [setupFilter, setSetupFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTrade, setEditingTrade] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [groupedView, setGroupedView] = useState(true); // New state for grouped view

  // Get unique setup types from trades
  const setupTypes = ['all', ...new Set(trades.map(trade => trade.setup).filter(Boolean))];

  // Function to group trades with their profit-taking entries
  const groupTradesWithProfitTaking = (tradesList) => {
    const originalTrades = tradesList.filter(trade => !trade.originalTradeId && !trade.isPartialSale);
    const profitTakingTrades = tradesList.filter(trade => trade.originalTradeId || trade.isPartialSale);
    
    return originalTrades.map(originalTrade => {
      const relatedTrades = profitTakingTrades.filter(trade => 
        trade.originalTradeId === originalTrade.id
      );
      
      // Combine notes from original trade and all related trades
      const allNotes = [
        originalTrade.notes,
        ...relatedTrades.map(trade => trade.notes)
      ].filter(Boolean).join('\n\n--- Profit Taking Entry ---\n\n');
      
      // For grouped view, show the original trade P&L and indicate if there are partial sales
      // Don't try to recalculate P&L as it's complex and error-prone
      
      return {
        ...originalTrade,
        relatedTrades,
        combinedNotes: allNotes,
        hasProfitTaking: relatedTrades.length > 0
      };
    });
  };

  useEffect(() => {
    let filtered = [...trades];

    // Apply filters
    if (setupFilter !== 'all') {
      filtered = filtered.filter(trade => trade.setup === setupFilter);
    }

    if (resultFilter !== 'all') {
      if (resultFilter === 'win') {
        filtered = filtered.filter(trade => trade.status === 'closed' && parseFloat(trade.pnl || 0) > 0);
      } else if (resultFilter === 'loss') {
        filtered = filtered.filter(trade => trade.status === 'closed' && parseFloat(trade.pnl || 0) < 0);
      } else if (resultFilter === 'open') {
        filtered = filtered.filter(trade => trade.status === 'open');
      }
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(trade => trade.tradeGrade === gradeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(term) ||
        trade.notes?.toLowerCase().includes(term) ||
        trade.tradePlan?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.entryDate);
          bValue = new Date(b.entryDate);
          break;
        case 'pnl':
          aValue = parseFloat(a.pnl || 0);
          bValue = parseFloat(b.pnl || 0);
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'setup':
          aValue = a.setup || '';
          bValue = b.setup || '';
          break;
        default:
          aValue = new Date(a.entryDate);
          bValue = new Date(b.entryDate);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply grouping if enabled
    if (groupedView) {
      filtered = groupTradesWithProfitTaking(filtered);
    }

    setFilteredTrades(filtered);
  }, [trades, setupFilter, resultFilter, gradeFilter, searchTerm, sortBy, sortOrder, groupedView]);

  // Helper functions
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPnlColor = (pnl) => {
    if (pnl === null || pnl === undefined) return '#94a3b8';
    return parseFloat(pnl) > 0 ? '#10b981' : parseFloat(pnl) < 0 ? '#ef4444' : '#94a3b8';
  };

  const getResultBadge = (pnl, status) => {
    if (status === 'open') {
      return (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          color: '#1e293b',
          backgroundColor: '#94a3b8'
        }}>
          OPEN
        </span>
      );
    }
    
    const pnlValue = parseFloat(pnl || 0);
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#1e293b',
        backgroundColor: pnlValue > 0 ? '#10b981' : pnlValue < 0 ? '#ef4444' : '#94a3b8'
      }}>
        {pnlValue > 0 ? 'WIN' : pnlValue < 0 ? 'LOSS' : 'BREAKEVEN'}
      </span>
    );
  };

  const getSetupBadge = (setup) => {
    if (!setup) return null;
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#1e293b',
        backgroundColor: '#3b82f6'
      }}>
        {setup}
      </span>
    );
  };

  const getTradeGradeBadge = (grade) => {
    if (!grade) return null;
    const colors = {
      'A': '#10b981',
      'B': '#f59e0b',
      'C': '#ef4444'
    };
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#1e293b',
        backgroundColor: colors[grade] || '#94a3b8'
      }}>
        {grade}
      </span>
    );
  };

  // Edit trade functions
  const handleEditTrade = (trade) => {
    setEditingTrade({ ...trade });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingTrade && onTradeUpdated) {
      onTradeUpdated(editingTrade);
      setShowEditModal(false);
      setEditingTrade(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingTrade(null);
  };

  const handleInputChange = (field, value) => {
    setEditingTrade(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate statistics
  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  const openTrades = filteredTrades.filter(trade => trade.status === 'open');
  const winningTrades = closedTrades.filter(trade => parseFloat(trade.pnl || 0) > 0);
  const aGradeTrades = filteredTrades.filter(trade => trade.tradeGrade === 'A');

  const totalPnL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
  const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

  // Calculate revenue per trade based on rule adherence
  const calculateRevenuePerTrade = (rulesFollowed) => {
    // Debug: Log all closed trades and their ruleAdherence
    console.log('All closed trades:', closedTrades);
    console.log('Closed trades with ruleAdherence:', closedTrades.filter(trade => trade.ruleAdherence !== undefined));
    
    const relevantTrades = closedTrades.filter(trade => 
      trade.ruleAdherence === rulesFollowed
    );
    
    console.log(`Trades with rulesFollowed=${rulesFollowed}:`, relevantTrades);
    
    if (relevantTrades.length === 0) return 0;
    
    const totalRevenue = relevantTrades.reduce((sum, trade) => 
      sum + parseFloat(trade.pnl || 0), 0
    );
    
    const average = totalRevenue / relevantTrades.length;
    console.log(`Average revenue for rulesFollowed=${rulesFollowed}:`, average);
    
    return average;
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
          <BookOpen style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              Book of Truth
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Your complete trading history and analysis
            </p>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Total P&L</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: getPnlColor(totalPnL)
            }}>
              {formatCurrency(totalPnL)}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Win Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            {(winRate * 100).toFixed(1)}%
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Open Trades</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              {openTrades.length}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>A-Game Trades</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
              {aGradeTrades.length}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>RevenueRulesFollowed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
              {formatCurrency(calculateRevenuePerTrade(true))}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>RevenueRulesViolated</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
              {formatCurrency(calculateRevenuePerTrade(false))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 2rem 1rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          
          {/* View Toggle */}
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#334155',
            borderRadius: '0.5rem',
            border: '1px solid #475569',
            marginBottom: '1rem'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8'
            }}>
              View Mode:
            </span>
            <button
              onClick={() => setGroupedView(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: groupedView ? '#3b82f6' : '#475569',
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
              <Layers size={16} />
              Grouped (Original + Profit Taking)
            </button>
            <button
              onClick={() => setGroupedView(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: !groupedView ? '#3b82f6' : '#475569',
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
              <List size={16} />
              All Individual Trades
            </button>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Setup Filter
            </label>
            <select
              value={setupFilter}
              onChange={(e) => setSetupFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              {setupTypes.map(setup => (
                <option key={setup} value={setup}>
                  {setup === 'all' ? 'All Setups' : setup}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Result Filter
            </label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Results</option>
              <option value="win">Winners</option>
              <option value="loss">Losers</option>
              <option value="open">Open Trades</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Grade Filter
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Grades</option>
              <option value="A">A Grade</option>
              <option value="B">B Grade</option>
              <option value="C">C Grade</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="date">Date</option>
              <option value="pnl">P&L</option>
              <option value="symbol">Symbol</option>
              <option value="setup">Setup</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search symbols, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
      </div>

      {/* Trades Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem'
      }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredTrades.length === 0 ? (
            <div style={{
              backgroundColor: '#1e293b',
              padding: '3rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              textAlign: 'center'
            }}>
              <BookOpen style={{
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
                No Trades Found
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            filteredTrades.map((trade) => (
                <div key={trade.id} style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '0.5rem',
                  border: '1px solid #334155',
                  overflow: 'hidden'
                }}>
                  {/* Trade Header */}
                  <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <h3 style={{
                          fontSize: '1.5rem',
                          fontWeight: '600',
                          color: '#f8fafc'
                        }}>
                          {trade.symbol}
                        </h3>
                        {getResultBadge(trade.pnl, trade.status)}
                        {getSetupBadge(trade.setup)}
                        {getTradeGradeBadge(trade.tradeGrade)}
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: trade.side === 'BUY' ? '#10b981' : '#ef4444',
                          backgroundColor: trade.side === 'BUY' ? '#065f46' : '#7f1d1d'
                        }}>
                          {trade.side === 'BUY' ? 'LONG' : 'SHORT'}
                        </span>
                        {groupedView && trade.hasProfitTaking && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#fbbf24',
                            backgroundColor: '#92400e'
                          }}>
                            💰 Profit Taking ({trade.relatedTrades.length})
                          </span>
                        )}
                      </div>
                                                                                                                                         {/* Trading Details - Organized in columns */}
                                              <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '2rem',
                          fontSize: '0.875rem',
                          color: '#94a3b8',
                          padding: '1rem',
                          backgroundColor: '#334155',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          {/* Column 1: Entry Details */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span><strong>Entry:</strong> {trade.entryDate}</span>
                            <span><strong>Entry Price:</strong> {formatCurrency(trade.entryPrice)}</span>
                            <span><strong>Shares:</strong> {trade.quantity || trade.shares || 'N/A'}</span>
                          </div>
                          
                          {/* Column 2: Risk Management */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span><strong>Stop Loss:</strong> {formatCurrency(trade.stopLoss)}</span>
                            {trade.trailingMA && (
                              <span><strong>Trailing:</strong> {trade.trailingMA}-Day MA</span>
                            )}
                            {trade.status === 'closed' && (
                              <>
                                <span><strong>Exit:</strong> {trade.exitDate}</span>
                                <span><strong>Exit Price:</strong> {formatCurrency(trade.exitPrice)}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Column 3: Position Analysis */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span><strong>Position Size:</strong> {formatCurrency((trade.quantity || trade.shares || 0) * (trade.entryPrice || 0))}</span>
                            <span><strong>% of Capital:</strong> {((((trade.quantity || trade.shares || 0) * (trade.entryPrice || 0)) / 10000) * 100).toFixed(2)}%</span>
                            <span><strong>P&L in $:</strong> {formatCurrency(trade.pnl || 0)}</span>
                          </div>
                        </div>
                    </div>
                    
                                         <div style={{
                       textAlign: 'right',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'flex-end',
                       gap: '0.5rem'
                     }}>
                       <button
                         onClick={() => handleEditTrade(trade)}
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
                                               <div style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: getPnlColor(trade.pnl),
                          marginBottom: '0.5rem'
                        }}>
                          {trade.status === 'open' ? 'Open Position' : `${((parseFloat(trade.pnl || 0) / ((trade.quantity || trade.shares || 0) * (trade.entryPrice || 0))) * 100).toFixed(2)}%`}
                        </div>
                     </div>
                  </div>

                                     {/* Trade Details */}
                   <div style={{
                     padding: '1rem 1.5rem 1.5rem',
                     display: 'grid',
                     gap: '1rem'
                   }}>
                                     {/* Rule Adherence - GANZ OBEN */}
                   {trade.ruleAdherence !== undefined && (
                     <div style={{ 
                       backgroundColor: '#334155', 
                       padding: '1rem', 
                       borderRadius: '0.5rem',
                       border: '1px solid #475569'
                     }}>
                       <h5 style={{
                         fontSize: '1rem',
                         fontWeight: '600',
                         color: '#f8fafc',
                         marginBottom: '0.75rem'
                       }}>
                         📋 Rule Adherence
                       </h5>
                       <div style={{ 
                         fontSize: '0.875rem', 
                         color: trade.ruleAdherence ? '#10b981' : '#ef4444',
                         fontWeight: '600',
                         marginBottom: '0.5rem'
                       }}>
                         {trade.ruleAdherence ? '✅ Rules Followed' : '❌ Rules Violated'}
                       </div>
                       {!trade.ruleAdherence && trade.ruleViolationReason && (
                         <div style={{ 
                           fontSize: '0.875rem', 
                           color: '#f8fafc',
                           fontStyle: 'italic',
                           padding: '0.5rem',
                           backgroundColor: '#475569',
                           borderRadius: '0.375rem'
                         }}>
                           <strong>Warum nicht befolgt:</strong> {trade.ruleViolationReason}
                         </div>
                       )}
                     </div>
                   )}

                   {/* Mental Game Snapshot - ZWEITER */}
                   {trade.mentalGame && (
                     <div style={{ 
                       backgroundColor: '#334155', 
                       padding: '1rem', 
                       borderRadius: '0.5rem',
                       border: '1px solid #475569'
                     }}>
                       <h5 style={{
                         fontSize: '1rem',
                         fontWeight: '600',
                         color: '#f8fafc',
                         marginBottom: '0.75rem'
                       }}>
                         🧠 Mental Game Snapshot
                       </h5>
                       <div style={{ 
                         fontSize: '0.875rem', 
                         color: '#f8fafc',
                         lineHeight: '1.5',
                         whiteSpace: 'pre-wrap'
                       }}>
                         {trade.mentalGame.tradeReasoning && (
                           <div style={{ marginBottom: '1rem' }}>
                             <strong>Why did I take this trade?</strong><br />
                             {trade.mentalGame.tradeReasoning}
                           </div>
                         )}
                         {trade.mentalGame.emotionsThoughts && (
                           <div style={{ marginBottom: '1rem' }}>
                             <strong>What emotions or thoughts influenced my actions?</strong><br />
                             {trade.mentalGame.emotionsThoughts}
                           </div>
                         )}
                         {trade.mentalGame.strengthsMistakes && (
                           <div style={{ marginBottom: '1rem' }}>
                             <strong>What did I do well, and what was a mistake?</strong><br />
                             {trade.mentalGame.strengthsMistakes}
                           </div>
                         )}
                         {trade.mentalGame.nextTimeFix && (
                           <div style={{ marginBottom: '1rem' }}>
                             <strong>What's one fix for next time?</strong><br />
                             {trade.mentalGame.nextTimeFix}
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                                       {/* Profit Taking Entries - Show in grouped view */}
                    {groupedView && trade.hasProfitTaking && (
                      <div style={{ 
                        backgroundColor: '#1e40af', 
                        padding: '1rem', 
                        borderRadius: '0.5rem',
                        border: '1px solid #3b82f6'
                      }}>
                        <h5 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#f8fafc',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          💰 Partial Sales ({trade.relatedTrades.length})
                        </h5>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#cbd5e1',
                          lineHeight: '1.5',
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: '#334155',
                            borderRadius: '0.375rem',
                            border: '1px solid #475569',
                            fontSize: '0.75rem',
                            color: '#94a3b8'
                          }}>
                            💡 <strong>Note:</strong> P&L shown above is for the original position. Partial sales are listed below with their individual P&L.
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#cbd5e1',
                          lineHeight: '1.5'
                        }}>
                          {trade.relatedTrades.map((ptTrade, index) => (
                            <div key={ptTrade.id} style={{
                              padding: '0.75rem',
                              backgroundColor: '#334155',
                              borderRadius: '0.375rem',
                              marginBottom: '0.5rem',
                              border: '1px solid #475569'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                                  Partial Sale {index + 1}: {ptTrade.entryDate}
                                </span>
                                <span style={{ 
                                  color: getPnlColor(ptTrade.pnl),
                                  fontWeight: '600'
                                }}>
                                  {formatCurrency(ptTrade.pnl)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                <span><strong>Quantity:</strong> {ptTrade.quantity} shares</span>
                                <span style={{ marginLeft: '1rem' }}>
                                  <strong>Price:</strong> {formatCurrency(ptTrade.entryPrice)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                   {/* Trade Planning - DRITTER (statt "Notes") */}
                   {(groupedView ? trade.combinedNotes : trade.notes) && (
                     <div style={{ 
                       backgroundColor: '#334155', 
                       padding: '1rem', 
                       borderRadius: '0.5rem',
                       border: '1px solid #475569'
                     }}>
                       <h5 style={{
                         fontSize: '1rem',
                         fontWeight: '600',
                         color: '#f8fafc',
                         marginBottom: '0.75rem'
                       }}>
                         📝 {groupedView && trade.hasProfitTaking ? 'Complete Trade Notes (Original + Profit Taking)' : 'Trade Planning'}
                       </h5>
                       <div style={{ 
                         fontSize: '0.875rem', 
                         color: '#f8fafc',
                         lineHeight: '1.5',
                         whiteSpace: 'pre-wrap'
                       }}>
                         {groupedView ? trade.combinedNotes : trade.notes}
                       </div>
                     </div>
                   )}

                  

                   {/* Screenshots - GANZ UNTEN */}
                                            {trade.screenshots && (trade.screenshots.preTrade || trade.screenshots.execution || trade.screenshots.postTrade) && (
                         <div style={{ 
                           backgroundColor: '#334155', 
                       padding: '1rem', 
                           borderRadius: '0.5rem',
                           border: '1px solid #475569'
                         }}>
                                                                               <h5 style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#f8fafc',
                              marginBottom: '0.75rem'
                            }}>
                              📸 Screenshots
                            </h5>
                          <div style={{ 
                            display: 'grid', 
                            gap: '1.5rem',
                            justifyContent: 'start'
                          }}>
                            {trade.screenshots.preTrade && (
                           <div>
                                                                <div style={{ 
                                   color: '#94a3b8', 
                                   fontSize: '0.875rem', 
                                   fontWeight: '600',
                               marginBottom: '0.75rem'
                                 }}>
                                   Pre-Trade Analysis
                                 </div>
                                                                <img 
                                   src={trade.screenshots.preTrade} 
                                   alt="Pre-trade screenshot"
                                   style={{
                                     width: '100%',
                                 maxHeight: '400px',
                                     objectFit: 'contain',
                                     borderRadius: '0.5rem'
                                   }}
                                 />
                              </div>
                            )}
                            {trade.screenshots.execution && (
                           <div>
                                                                <div style={{ 
                                   color: '#94a3b8', 
                                   fontSize: '0.875rem', 
                                   fontWeight: '600',
                               marginBottom: '0.75rem'
                                 }}>
                                   Trade Execution
                                 </div>
                                                                <img 
                                   src={trade.screenshots.execution} 
                                   alt="Execution screenshot"
                                   style={{
                                     width: '100%',
                                 maxHeight: '400px',
                                     objectFit: 'contain',
                                     borderRadius: '0.5rem'
                                   }}
                                 />
                              </div>
                            )}
                            {trade.screenshots.postTrade && (
                           <div>
                                                                <div style={{ 
                                   color: '#94a3b8', 
                                   fontSize: '0.875rem', 
                                   fontWeight: '600',
                               marginBottom: '0.75rem'
                                 }}>
                                   Post-Trade Review
                                 </div>
                                                                <img 
                                   src={trade.screenshots.postTrade} 
                                   alt="Post-trade screenshot"
                                   style={{
                                     width: '100%',
                                 maxHeight: '400px',
                                     objectFit: 'contain',
                                     borderRadius: '0.5rem'
                                   }}
                                 />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                                           {/* Plan & Trigger Notes */}
                      {trade.tradePlan && (
                        <div style={{ 
                          backgroundColor: '#334155', 
                          padding: '1rem', 
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h5 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#f8fafc',
                            marginBottom: '0.75rem'
                          }}>
                            🎯 Plan & Trigger Notes
                          </h5>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#f8fafc',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {trade.tradePlan}
                          </div>
                        </div>
                      )}

                     {/* Execution Notes */}
                     {trade.executionNotes && (
                       <div style={{ 
                         backgroundColor: '#334155', 
                         padding: '1rem', 
                         borderRadius: '0.5rem',
                         border: '1px solid #475569'
                       }}>
                         <h5 style={{
                           fontSize: '1rem',
                           fontWeight: '600',
                           color: '#f8fafc',
                           marginBottom: '0.75rem'
                         }}>
                           ⚡ Execution Notes
                         </h5>
                         <div style={{ 
                           fontSize: '0.875rem', 
                           color: '#f8fafc',
                           lineHeight: '1.5',
                           whiteSpace: 'pre-wrap'
                         }}>
                           {trade.executionNotes}
                         </div>
                       </div>
                     )}

                     {/* Profit-Taking Notes */}
                     {trade.profitTakingNotes && (
                       <div style={{ 
                         backgroundColor: '#334155', 
                         padding: '1rem', 
                         borderRadius: '0.5rem',
                         border: '1px solid #475569'
                       }}>
                         <h5 style={{
                           fontSize: '1rem',
                           fontWeight: '600',
                           color: '#f8fafc',
                           marginBottom: '0.75rem'
                         }}>
                           💰 Profit-Taking Notes
                         </h5>
                         <div style={{ 
                           fontSize: '0.875rem', 
                           color: '#f8fafc',
                           lineHeight: '1.5',
                           whiteSpace: 'pre-wrap'
                         }}>
                           {trade.profitTakingNotes}
                         </div>
                       </div>
                     )}

                     {/* Psychology Tracking */}
                     {trade.psychologyTracking && (
                       <div style={{ 
                         backgroundColor: '#334155', 
                         padding: '1rem', 
                         borderRadius: '0.5rem',
                         border: '1px solid #475569'
                       }}>
                         <h5 style={{
                           fontSize: '1rem',
                           fontWeight: '600',
                           color: '#f8fafc',
                           marginBottom: '0.75rem'
                         }}>
                           🧘 Psychology Tracking
                         </h5>
                         <div style={{ 
                           fontSize: '0.875rem', 
                           color: '#f8fafc',
                           lineHeight: '1.5',
                           whiteSpace: 'pre-wrap'
                         }}>
                           {trade.psychologyTracking}
                         </div>
                       </div>
                     )}
                              </div>
                              </div>
            ))
          )}
                 </div>
       </div>

       {/* Edit Trade Modal */}
       {showEditModal && editingTrade && (
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
             maxWidth: '600px',
             width: '90%',
             maxHeight: '90vh',
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
                 Edit Trade: {editingTrade.symbol}
               </h2>
               <button
                 onClick={handleCancelEdit}
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

             <div style={{
               display: 'grid',
               gap: '1rem',
               marginBottom: '1.5rem'
            }}>
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '500',
                   color: '#94a3b8',
                   marginBottom: '0.5rem'
                 }}>
                   Notes
                 </label>
                 <textarea
                   value={editingTrade.notes || ''}
                   onChange={(e) => handleInputChange('notes', e.target.value)}
                   rows={3}
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
                 onClick={handleCancelEdit}
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
                 onClick={handleSaveEdit}
                 style={{
                   padding: '0.75rem 1.5rem',
                   backgroundColor: '#10b981',
                   border: 'none',
                   borderRadius: '0.5rem',
                   color: '#ffffff',
                   cursor: 'pointer',
                   fontSize: '0.875rem',
                   fontWeight: '500'
                 }}
               >
                 Save Changes
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default BookOfTruth;
