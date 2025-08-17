import React, { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Save, FileText, Target, AlertTriangle, Camera, X } from 'lucide-react';
import storage from '../utils/storage';

const TradePlanning = ({ onNavigate }) => {
  const [plan, setPlan] = useState({
    symbol: '',
    direction: 'LONG', // Add direction field
    setup: '',
    entryPrice: '',
    stopLoss: '',
    positionSizePercent: '',
    tradePlan: '',
    failureReasons: '',
    plannedDate: '',
    checklist: [],
    atr14: '',
    aptr14: '', // APTR for 14 days
    screenshotPre: ''
  });

  const [portfolioValue, setPortfolioValue] = useState(0);
  const [savedPlans, setSavedPlans] = useState([]);
  const [expandedDates, setExpandedDates] = useState(new Set());


  // Setup options
  const setupOptions = ['Breakout', 'SMA Touch', 'Mean Reversion', 'UnR', 'No Clear Setup'];

  // Breakout checklist items
  const breakoutChecklist = [
    '~30% move up in the last 30-days',
    'Linear pullback and undercut of the 10 and/or 20 day moving averages',
    'Reclaim of 10 and/or 20 DMAs',
    '>1 tight surf day above the 10/20 DMAs',
    'Clear and easily definable daily trend line'
  ];



  // Function to handle image upload
  const handleImageUpload = (name, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPlan(prev => ({ ...prev, [name]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Function to remove image
  const removeImage = (name) => {
    setPlan(prev => ({ ...prev, [name]: '' }));
  };

  useEffect(() => {
    // Load portfolio value from settings
    const loadPortfolioValue = async () => {
      try {
        const value = await storage.loadSetting('portfolioValue') || 3000; // Default to 3000 if not set
        console.log('Portfolio value loaded:', value);
        setPortfolioValue(parseFloat(value));
      } catch (error) {
        console.log('Error loading portfolio value, using default:', error);
        setPortfolioValue(3000);
      }
    };

    // Load saved plans
    const loadSavedPlans = async () => {
      try {
        const plans = await storage.loadSetting('tradePlans') || [];
        setSavedPlans(plans);
      } catch (error) {
        console.log('Error loading saved plans:', error);
        setSavedPlans([]);
      }
    };

    loadPortfolioValue();
    loadSavedPlans();
  }, []);



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlan(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChecklistChange = (item) => {
    setPlan(prev => ({
      ...prev,
      checklist: prev.checklist.includes(item)
        ? prev.checklist.filter(i => i !== item)
        : [...prev.checklist, item]
    }));
  };

  // Calculate position size and shares needed
  const calculatePosition = () => {
    const entry = parseFloat(plan.entryPrice) || 0;
    const stop = parseFloat(plan.stopLoss) || 0;
    const sizePercent = parseFloat(plan.positionSizePercent) || 0;

    console.log('Calculation inputs:', { entry, stop, sizePercent, portfolioValue, portfolioValueType: typeof portfolioValue });

    if (entry <= 0 || sizePercent <= 0) {
      console.log('Invalid inputs, returning null');
      return null;
    }

    if (portfolioValue <= 0) {
      console.log('Portfolio value is 0 or invalid, returning null');
      return null;
    }

    const positionSize = (portfolioValue * sizePercent) / 100;
    const exactShares = positionSize / entry;
    const sharesNeeded = Math.floor(exactShares);
    const actualPositionSize = sharesNeeded * entry;

    console.log('Calculation results:', { positionSize, exactShares, sharesNeeded, actualPositionSize });

    // Only calculate risk if stop loss is provided
    let riskPerShare = 0;
    let totalRisk = 0;
    let riskPercent = 0;

    if (stop > 0) {
      riskPerShare = entry - stop;
      totalRisk = sharesNeeded * riskPerShare;
      riskPercent = portfolioValue > 0 ? (totalRisk / portfolioValue) * 100 : 0;
    }

    return {
      positionSize,
      exactShares,
      sharesNeeded,
      actualPositionSize,
      totalRisk,
      riskPercent,
      hasStopLoss: stop > 0
    };
  };

     const handleSavePlan = async () => {
     if (!plan.symbol || !plan.entryPrice || !plan.positionSizePercent) {
       alert('Please fill in all required fields (Symbol, Trigger Price, Position Size)');
       return;
     }

    const newPlan = {
      ...plan,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      calculations: calculatePosition(),
      status: 'pending', // For AI review
      direction: plan.direction === 'LONG' ? 'BUY' : 'SELL', // Use the selected direction
      targets: plan.targets || [],
      thesis: plan.tradePlan || '',
      failureReasons: plan.failureReasons || '',
      trigger: plan.entryPrice,
      riskAmount: calculations.riskAmount,
      positionSize: calculations.positionSize
    };

    // Save to both old system and new AI system
    const updatedPlans = [...savedPlans, newPlan];
    storage.saveSetting('tradePlans', updatedPlans);
    setSavedPlans(updatedPlans);
    
    // Also save to new AI system
    try {
      await storage.saveTradePlan(newPlan);
    } catch (error) {
      console.error('Error saving to AI system:', error);
    }
    
    setPlan({
      symbol: '',
      direction: 'LONG', // Reset direction
      setup: '',
      entryPrice: '',
      stopLoss: '',
      positionSizePercent: '',
      tradePlan: '',
      failureReasons: '',
      plannedDate: '',
      checklist: [],
      atr14: '',
      aptr14: '',
      screenshotPre: ''
    });
  };

           const handleLoadPlan = (savedPlan) => {
      setPlan({
        symbol: savedPlan.symbol,
        direction: savedPlan.direction || 'LONG', // Load direction
        setup: savedPlan.setup,
        entryPrice: savedPlan.entryPrice,
        stopLoss: savedPlan.stopLoss,
        positionSizePercent: savedPlan.positionSizePercent,
        tradePlan: savedPlan.tradePlan,
        failureReasons: savedPlan.failureReasons || '',
        plannedDate: savedPlan.plannedDate || '',
        checklist: savedPlan.checklist || [],
        atr14: savedPlan.atr14 || '',
      aptr14: savedPlan.aptr14 || '',
        screenshotPre: savedPlan.screenshotPre || ''
      });
    };

  const handleExecutePlan = (savedPlan) => {
    // Save the plan data to localStorage so Trade Entry can access it
    localStorage.setItem('planToExecute', JSON.stringify(savedPlan));
    // Navigate to trade entry
    onNavigate('trade-entry');
  };

  const handleDeletePlan = (planId) => {
    const updatedPlans = savedPlans.filter(p => p.id !== planId);
    storage.saveSetting('tradePlans', updatedPlans);
    setSavedPlans(updatedPlans);
  };

  const toggleDateGroup = (date) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Group plans by date
  const groupedPlans = savedPlans.reduce((groups, plan) => {
    const date = plan.plannedDate || 'No Date';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(plan);
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedPlans).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a) - new Date(b);
  });

  const calculations = calculatePosition();

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
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
          <Target style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              🎯 Trade Planning
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Plan & Execute Trading Strategies
            </p>
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Trade Details */}
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            color: '#f8fafc'
          }}>
            Trade Details
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Symbol */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Symbol *
              </label>
                             <input
                 type="text"
                 name="symbol"
                 value={plan.symbol}
                 onChange={handleInputChange}
                 placeholder="e.g., AAPL"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               />
            </div>

            {/* Trade Direction */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Trade Direction *
              </label>
              <select
                name="direction"
                value={plan.direction}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              >
                <option value="LONG">LONG (Buy)</option>
                <option value="SHORT">SHORT (Sell)</option>
              </select>
            </div>

            {/* Setup */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Setup
              </label>
                             <select
                 name="setup"
                 value={plan.setup}
                 onChange={handleInputChange}
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               >
                <option value="">Select Setup</option>
                {setupOptions.map(setup => (
                  <option key={setup} value={setup}>{setup}</option>
                ))}
              </select>
            </div>

                         {/* Trigger */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Trigger *
               </label>
               <input
                 type="number"
                 name="entryPrice"
                 value={plan.entryPrice}
                 onChange={handleInputChange}
                 step="0.01"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               />
               <textarea
                 name="triggerNotes"
                 value={plan.triggerNotes}
                 onChange={handleInputChange}
                 rows="2"
                 placeholder="Add notes about your trigger..."
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem',
                   resize: 'vertical',
                   marginTop: '0.5rem'
                 }}
               />
             </div>



                         {/* Stop Loss */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Stop Loss *
               </label>
               <input
                 type="number"
                 name="stopLoss"
                 value={plan.stopLoss}
                 onChange={handleInputChange}
                 step="0.01"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               />
             </div>

                         {/* Position Size */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Position Size (% of Portfolio) *
               </label>
               <input
                 type="number"
                 name="positionSizePercent"
                 value={plan.positionSizePercent}
                 onChange={handleInputChange}
                 step="0.1"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               />
             </div>

             {/* ATR(14) Day */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 ATR(14) Day
               </label>
               <input
                 type="number"
                 name="atr14"
                 value={plan.atr14}
                 onChange={handleInputChange}
                 step="0.01"
                 min="0"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
                 placeholder="Enter ATR value (e.g., 2.45)"
               />
             </div>

             {/* APTR(14) Day */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 APTR(14) Day (%)
               </label>
               <input
                 type="number"
                 name="aptr14"
                 value={plan.aptr14}
                 onChange={handleInputChange}
                 step="0.01"
                 min="0"
                 max="100"
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
                 placeholder="Enter APTR percentage (e.g., 7.5)"
               />
             </div>

             {/* Planned Date */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Planned Date
               </label>
               <input
                 type="date"
                 name="plannedDate"
                 value={plan.plannedDate}
                 onChange={handleInputChange}
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem'
                 }}
               />
             </div>

            

                         {/* Trade Plan */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Trade Plan
               </label>
               <textarea
                 name="tradePlan"
                 value={plan.tradePlan}
                 onChange={handleInputChange}
                 rows="4"
                 placeholder="Describe your trade plan, reasoning, and strategy..."
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem',
                   resize: 'vertical'
                 }}
               />
             </div>

             {/* Why the Trade Could Fail */}
             <div>
               <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '500',
                 color: '#94a3b8',
                 marginBottom: '0.5rem'
               }}>
                 Why the Trade Could Fail
               </label>
               <textarea
                 name="failureReasons"
                 value={plan.failureReasons}
                 onChange={handleInputChange}
                 rows="3"
                 placeholder="e.g., Overhead resistance, earnings ahead, not tight enough, market conditions..."
                 style={{
                   width: '100%',
                   padding: '0.5rem',
                   backgroundColor: '#334155',
                   border: '1px solid #475569',
                   borderRadius: '0.5rem',
                   color: '#f8fafc',
                   fontSize: '0.875rem',
                   resize: 'vertical'
                 }}
               />
             </div>

                           {/* Pre-Trade Screenshot */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  <Camera size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Pre-Trade Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('screenshotPre', e.target.files?.[0])}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
                {plan.screenshotPre && (
                  <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                    <img
                      src={plan.screenshotPre}
                      alt="Pre-trade"
                      style={{
                        width: '100%',
                        borderRadius: '0.375rem',
                        border: '1px solid #475569'
                      }}
                    />
                    <button
                      onClick={() => removeImage('screenshotPre')}
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '1.5rem',
                        height: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#f8fafc'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>

                 {/* Right Column - Calculator & Checklist */}
         <div>
           <h2 style={{
             fontSize: '1.5rem',
             fontWeight: '600',
             marginBottom: '1.5rem',
             color: '#f8fafc'
           }}>
             <Calculator style={{ marginRight: '0.75rem', display: 'inline' }} />
             Position Calculator
           </h2>
           
           

                                           {/* Calculator Results */}
                        {calculations ? (
               <>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Calculation Results
                </label>
                <div style={{
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
               
                              <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.25rem'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Position Size:</span>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                      ${calculations.positionSize.toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.25rem'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Exact Shares:</span>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                      {calculations.exactShares.toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.25rem'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Shares to Buy:</span>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                      {calculations.sharesNeeded.toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.25rem'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Actual Position Size:</span>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                      ${calculations.actualPositionSize.toLocaleString()}
                    </span>
                  </div>
                  
                  {calculations.hasStopLoss && (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '0.25rem'
                      }}>
                        <span style={{ color: '#94a3b8' }}>Risk per Share:</span>
                        <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                          ${(calculations.totalRisk / calculations.sharesNeeded).toFixed(2)}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '0.25rem'
                      }}>
                        <span style={{ color: '#94a3b8' }}>Total Risk:</span>
                        <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                          ${calculations.totalRisk.toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '0.25rem'
                      }}>
                        <span style={{ color: '#94a3b8' }}>Risk % of Portfolio:</span>
                        <span style={{ 
                          color: calculations.riskPercent > 5 ? '#ef4444' : '#f8fafc', 
                          fontWeight: '600' 
                        }}>
                          {calculations.riskPercent.toFixed(2)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                              {calculations.hasStopLoss && calculations.riskPercent > 5 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#dc2626',
                    border: '1px solid #ef4444',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: '0.875rem' }}>
                      High risk! Consider reducing position size.
                    </span>
                  </div>
                                )}
                </div>
                </>
                       ) : (
               <>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Enter Symbol
                </label>
                <div style={{
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>
                  Enter symbol, trigger price, and position size to see calculations. Stop loss is optional.
                </div>
               </>
            )}

                     {/* Breakout Checklist */}
           {plan.setup === 'Breakout' && (
             <div style={{
               backgroundColor: '#334155',
               border: '1px solid #475569',
               borderRadius: '0.5rem',
               padding: '1.5rem',
               marginBottom: '1.5rem'
             }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#f8fafc'
              }}>
                Breakout Checklist
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {breakoutChecklist.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }} onClick={() => handleChecklistChange(item)}>
                    <input
                      type="checkbox"
                      checked={plan.checklist.includes(item)}
                      onChange={() => handleChecklistChange(item)}
                      style={{
                        marginRight: '0.75rem',
                        width: '1rem',
                        height: '1rem',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#f8fafc',
                      cursor: 'pointer'
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                textAlign: 'center'
              }}>
                Completed: {plan.checklist.length} / {breakoutChecklist.length} items
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSavePlan}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#059669',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Save size={20} />
            Save Trade Plan
          </button>
                 </div>
       </div>

               {/* Planned Trades by Date - Bottom Section */}
        <div style={{
          backgroundColor: '#334155',
          border: '1px solid #475569',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginTop: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Planned Trades by Date</h3>
          {savedPlans.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No saved plans yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {sortedDates.map(date => (
                <div key={date} style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => toggleDateGroup(date)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: expandedDates.has(date) ? '1px solid #475569' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        transform: expandedDates.has(date) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        fontSize: '1.2rem'
                      }}>
                        ▶
                      </span>
                      <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                        {date === 'No Date' ? 'No Date Assigned' : new Date(date).toLocaleDateString()}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#94a3b8',
                        backgroundColor: '#475569',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {groupedPlans[date].length} {groupedPlans[date].length === 1 ? 'trade' : 'trades'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedDates.has(date) && (
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {groupedPlans[date].map(plan => {
                          // Calculate shares for this plan
                          const planCalculations = plan.calculations || {};
                          const sharesToBuy = planCalculations.sharesNeeded || 0;
                          
                          return (
                            <div key={plan.id} style={{
                              backgroundColor: '#334155',
                              border: '1px solid #475569',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                                  {plan.symbol} - {plan.direction || 'LONG'} - {plan.setup || 'No Setup'}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                                  Entry: ${plan.entryPrice} | Shares: {sharesToBuy.toLocaleString()} | Size: {plan.positionSizePercent}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Created: {new Date(plan.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleLoadPlan(plan)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#059669',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => handleExecutePlan(plan)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Execute
                                </button>
                                <button
                                  onClick={() => handleDeletePlan(plan.id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc2626',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
     </div>
   );
 };

export default TradePlanning;
