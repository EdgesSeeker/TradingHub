import React, { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Save, FileText, Target, AlertTriangle, Camera, X, Calendar } from 'lucide-react';
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
    aptr14: '', // APTR for 14 days
    screenshotPre: '',
    ranking: '', // Add ranking field
    companyAnalysis: '' // Add company analysis field
  });

  const [portfolioValue, setPortfolioValue] = useState(0);
  const [savedPlans, setSavedPlans] = useState([]);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState('all');


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
      direction: plan.direction, // Keep the original direction (LONG/SHORT)
      targets: plan.targets || [],
      thesis: plan.tradePlan || '',
      failureReasons: plan.failureReasons || '',
      trigger: plan.entryPrice,
      riskAmount: calculations.riskAmount,
      positionSize: calculations.positionSize,
      companyAnalysis: plan.companyAnalysis || '' // Ensure company analysis is saved
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

    // Auto-save company analysis to Company Info if analysis exists
    if (plan.companyAnalysis && plan.companyAnalysis.trim()) {
      try {
        const existingAnalyses = await storage.loadSetting('companyAnalyses') || [];
        
        // Check if analysis for this symbol already exists
        const existingIndex = existingAnalyses.findIndex(analysis => 
          analysis.symbol === plan.symbol.toUpperCase()
        );

        const newAnalysis = {
          id: existingIndex >= 0 ? existingAnalyses[existingIndex].id : Date.now().toString(),
          symbol: plan.symbol.toUpperCase(),
          analysis: plan.companyAnalysis,
          createdAt: existingIndex >= 0 ? existingAnalyses[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'trade_planning'
        };

        let updatedAnalyses;
        if (existingIndex >= 0) {
          // Update existing analysis
          updatedAnalyses = [...existingAnalyses];
          updatedAnalyses[existingIndex] = newAnalysis;
        } else {
          // Add new analysis
          updatedAnalyses = [...existingAnalyses, newAnalysis];
        }

        await storage.saveSetting('companyAnalyses', updatedAnalyses);
        console.log('Company analysis auto-saved to Company Info');
      } catch (error) {
        console.error('Error auto-saving company analysis:', error);
      }
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
      aptr14: '',
      screenshotPre: '',
      ranking: '', // Reset ranking
      companyAnalysis: '' // Reset company analysis
    });
  };

           const handleLoadPlan = (savedPlan) => {
      setPlan({
        symbol: savedPlan.symbol || '',
        direction: savedPlan.direction === 'BUY' ? 'LONG' : savedPlan.direction === 'SELL' ? 'SHORT' : savedPlan.direction || 'LONG',
        setup: savedPlan.setup || '',
        entryPrice: savedPlan.entryPrice || '',
        stopLoss: savedPlan.stopLoss || '',
        positionSizePercent: savedPlan.positionSizePercent || '',
        tradePlan: savedPlan.tradePlan || '',
        failureReasons: savedPlan.failureReasons || '',
        plannedDate: savedPlan.plannedDate || '',
        checklist: savedPlan.checklist || [],
        aptr14: savedPlan.aptr14 || '',
        screenshotPre: savedPlan.screenshotPre || '',
        ranking: savedPlan.ranking || '', // Load ranking
        companyAnalysis: savedPlan.companyAnalysis || '' // Load company analysis
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
    const date = new Date(plan.createdAt).toLocaleDateString('de-DE', { 
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric' 
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(plan);
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedPlans).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('.');
    const [dayB, monthB, yearB] = b.split('.');
    return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
  });

  // Filter plans by selected date
  const filteredPlans = selectedDate === 'all' 
    ? savedPlans 
    : savedPlans.filter(plan => {
        const planDate = new Date(plan.createdAt).toLocaleDateString('de-DE', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
        return planDate === selectedDate;
      });

  const filteredGroupedPlans = selectedDate === 'all' 
    ? groupedPlans 
    : { [selectedDate]: filteredPlans };

  const filteredSortedDates = selectedDate === 'all' 
    ? sortedDates 
    : [selectedDate];

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
              Trade Planning
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
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
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
                {setupOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
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
                Trigger Price *
              </label>
              <input
                type="number"
                name="entryPrice"
                value={plan.entryPrice}
                onChange={handleInputChange}
                step="0.01"
                placeholder="e.g., 150.00"
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

            {/* Stop Loss */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Stop Loss
              </label>
              <input
                type="number"
                name="stopLoss"
                value={plan.stopLoss}
                onChange={handleInputChange}
                step="0.01"
                placeholder="e.g., 145.00"
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
                placeholder="e.g., 5.0"
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
                rows={3}
                placeholder="Describe your trade plan..."
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

            {/* Failure Reasons */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Why the trade could fail
              </label>
              <textarea
                name="failureReasons"
                value={plan.failureReasons}
                onChange={handleInputChange}
                rows={3}
                placeholder="List potential failure reasons..."
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

            {/* Ranking */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Ranking (1-10)
              </label>
              <input
                type="number"
                name="ranking"
                min="1"
                max="10"
                value={plan.ranking || ''}
                onChange={handleInputChange}
                placeholder="1-10"
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

            {/* Screenshots */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Screenshots
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

            {/* Save Button */}
            <button
              onClick={handleSavePlan}
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
              Save Trade Plan
            </button>
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
            Position Calculator
          </h2>

          {/* Portfolio Value */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Portfolio Value ($)
            </label>
            <input
              type="number"
              value={portfolioValue}
              onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
              step="100"
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

          {/* Calculations */}
          {calculations ? (
            <>
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid #334155'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f8fafc'
                }}>
                  <Calculator size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Position Calculations
                </h3>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
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

          {/* Checklist */}
          {plan.setup === 'Breakout' && (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #334155'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#f8fafc'
              }}>
                <FileText size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Breakout Checklist
              </h3>
              
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {breakoutChecklist.map(item => (
                  <label key={item} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#f8fafc'
                  }}>
                    <input
                      type="checkbox"
                      checked={plan.checklist.includes(item)}
                      onChange={() => handleChecklistChange(item)}
                      style={{
                        width: '1rem',
                        height: '1rem',
                        accentColor: '#3b82f6'
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Company Analysis */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #334155',
            marginTop: '1rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc'
            }}>
              <TrendingUp size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Company Analysis
            </h3>
            
            <textarea
              name="companyAnalysis"
              value={plan.companyAnalysis}
              onChange={handleInputChange}
              placeholder="Enter your company analysis here... (Business model, financials, growth prospects, risks, etc.)"
                              style={{
                  width: '90%',
                  minHeight: '120px',
                  maxHeight: '300px',
                padding: '0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      </div>

      {/* Trade Plans by Date - Full Width at Bottom */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            color: '#f8fafc'
          }}>
            Planned Trades by Date
          </h2>
          
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Filter by Date:
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Dates</option>
              {sortedDates.map(date => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {savedPlans.length === 0 ? (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            No trade plans saved yet. Create your first plan above.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredSortedDates.map(date => (
              <div key={date} style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <div 
                  onClick={() => toggleDateGroup(date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    backgroundColor: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={20} color="#10b981" />
                    <h4 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      margin: 0,
                      color: '#f8fafc'
                    }}>
                      {date}
                    </h4>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#94a3b8'
                    }}>
                      {filteredGroupedPlans[date].length} {filteredGroupedPlans[date].length === 1 ? 'trade' : 'trades'}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease'
                  }}>
                    {expandedDates.has(date) ? '−' : '+'}
                  </div>
                </div>
                
                {expandedDates.has(date) && (
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {filteredGroupedPlans[date].map(plan => {
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
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                color: '#f8fafc',
                                fontSize: '1rem',
                                marginBottom: '0.25rem'
                              }}>
                                {plan.symbol} - {plan.direction || 'LONG'} - {plan.setup || 'No Setup'}
                                {plan.ranking && <span style={{ color: '#fbbf24', marginLeft: '0.5rem' }}>⭐ {plan.ranking}/10</span>}
                              </div>
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: '#94a3b8',
                                marginBottom: '0.125rem'
                              }}>
                                Entry: ${parseFloat(plan.entryPrice).toFixed(2)} | Shares: {sharesToBuy.toLocaleString()} | Size: {plan.positionSizePercent}%
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#64748b'
                              }}>
                                Created: {new Date(plan.createdAt).toLocaleDateString('de-DE', { 
                                  day: 'numeric', 
                                  month: 'numeric', 
                                  year: 'numeric' 
                                })}
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
