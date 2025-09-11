import React, { useState, useEffect } from 'react';
import { Plus, Camera, X } from 'lucide-react';
import storage from '../utils/storage';
import TradeLogModal from './TradeLogModal';

const NewTradeEntry = ({ onTradeAdded, openTrades, onNavigate }) => {
  const [settings, setSettings] = useState({ portfolioValue: 10000 });
  const [trade, setTrade] = useState({
    symbol: '',
    side: 'BUY',
    entryPrice: '',
    stopLoss: '',
    quantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    setup: '',
    commission: '',
    notes: '',
    tradePlan: '',
    triggerUsed: false,
    triggerNotes: '',
    ruleAdherence: true,
    ruleAdherenceNotes: '',
    tradeGrade: '',
    psychology: {
      ruleCompliance: 7,
      emotionControl: 7
    },
    mentalGame: {
      tradeReasoning: '',
      emotionsThoughts: '',
      strengthsMistakes: '',
      nextTimeFix: ''
    },
    trailingMA: '', // New field for Moving Average selection
    plannedTarget: '',
    aptr14: '' // APTR for 14 days
  });

  // New state for adding to existing position
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);
  const [selectedExistingTrade, setSelectedExistingTrade] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const [riskMetrics, setRiskMetrics] = useState({
    riskAmount: 0,
    riskPercent: 0,
    positionSize: 0,
    stopLossDistance: 0
  });

  const [showTradeLog, setShowTradeLog] = useState(false);
  const [tradeLogPhase, setTradeLogPhase] = useState('pre'); // 'pre' or 'post'
  const [tradeLogInitial, setTradeLogInitial] = useState(null);


  // Predefined options
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

  // Breakout checklist items
  const breakoutChecklist = [
    '~30% move up in the last 30-days',
    'Linear pullback and undercut of the 10 and/or 20 day moving averages',
    'Reclaim of 10 and/or 20 DMAs',
    '>1 tight surf day above the 10/20 DMAs',
    'Clear and easily definable daily trend line'
  ];

  // Pre-Trade Entry Checklist (from Trade Planning)
  const preTradeChecklist = [
    'Market trend determined (Green/Yellow/Red)',
    'Volume > 30 million',
    'ADR > 5%',
    'Sector verified as "hot"',
    'Stock moved approx. +30% in last 30 days',
    'Linear pullback & undercut/reclaim of 10/20 SMA',
    'At least 1 surf day above 10/20 SMA',
    'Clear daily trendline visible in chart',
    'Setup type precisely chosen (e.g., Breakout, SMA Touch)',
    'Position size calculated properly for equity and risk (max 2%)',
    'Stop loss logically defined (below structure)',
    'Mental Game: Do I have rational reasons for this trade? (yes=1/no=0)',
    'Pre-trade screenshot taken for documentation'
  ];

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



  // Function to handle image upload
  const handleImageUpload = (category, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setTrade(prev => ({
        ...prev,
        screenshots: {
          ...prev.screenshots,
          [category]: e.target.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Function to remove image
  const removeImage = (category) => {
    setTrade(prev => ({
      ...prev,
      screenshots: {
        ...prev.screenshots,
        [category]: ''
      }
    }));
  };

  useEffect(() => {
    loadSettings();
    
    // Check if there's a plan to execute
    const loadPlanToExecute = () => {
      const planData = localStorage.getItem('executedTradePlan');
      if (planData) {
        try {
          const plan = JSON.parse(planData);
          console.log('Loading plan data:', plan);
          
          // Calculate quantity from plan calculations if available
          let quantity = '';
          if (plan.calculations && plan.calculations.sharesNeeded) {
            quantity = plan.calculations.sharesNeeded.toString();
          }
          
          setTrade(prev => ({
            ...prev,
            symbol: plan.symbol || '',
            side: plan.direction === 'SHORT' ? 'SELL' : 'BUY', // Convert direction to side
            setup: plan.setup || '',
            entryPrice: plan.entryPrice || '',
            stopLoss: plan.stopLoss || '',
            quantity: quantity,
            notes: plan.tradePlan || '',
            aptr14: plan.aptr14 || '',
            triggerUsed: plan.triggerUsed || false,
            triggerNotes: plan.triggerNotes || '',
            ruleAdherence: plan.ruleAdherence,
            ruleAdherenceNotes: plan.ruleAdherenceNotes || '',
            tradeGrade: plan.tradeGrade || '',
            psychology: plan.psychology || {
              ruleCompliance: 7,
              emotionControl: 7,
            },
            checklist: plan.checklist || [],
            screenshots: {
              preTrade: plan.screenshotPre || '',
              execution: '',
              postTrade: ''
            }
          }));
          
          console.log('Plan data loaded successfully');
          // Clear the plan data from localStorage
          localStorage.removeItem('executedTradePlan');
        } catch (error) {
          console.error('Error loading plan:', error);
          localStorage.removeItem('executedTradePlan');
        }
      }
    };

    loadPlanToExecute();
  }, []);



  const loadSettings = async () => {
    const userSettings = await storage.getAllSettings();
    if (userSettings && userSettings.portfolioValue) {
      setSettings(userSettings);
    }
  };

  const calculateRiskMetrics = () => {
    const entryPrice = parseFloat(trade.entryPrice) || 0;
    const stopLoss = parseFloat(trade.stopLoss) || 0;
    const quantity = parseFloat(trade.quantity) || 0;
    const portfolioValue = settings.portfolioValue || 10000;

    if (entryPrice > 0 && quantity > 0) {
      const positionValue = entryPrice * quantity;
      const positionSizePercent = (positionValue / portfolioValue) * 100;
      
      let riskAmount = 0;
      let riskPercent = 0;
      let stopLossDistance = 0;

      // Calculate risk based on stop loss
      if (stopLoss > 0) {
        if (trade.side === 'BUY') {
          stopLossDistance = entryPrice - stopLoss;
          riskAmount = stopLossDistance * quantity;
        } else {
          stopLossDistance = stopLoss - entryPrice;
          riskAmount = stopLossDistance * quantity;
        }
        riskPercent = (riskAmount / portfolioValue) * 100;
      } else {
        // If no stop loss is set, show a default 2% risk calculation
        const defaultRiskPercent = 2; // 2% default risk
        if (trade.side === 'BUY') {
          stopLossDistance = entryPrice * (defaultRiskPercent / 100);
          riskAmount = stopLossDistance * quantity;
        } else {
          stopLossDistance = entryPrice * (defaultRiskPercent / 100);
          riskAmount = stopLossDistance * quantity;
        }
        riskPercent = (riskAmount / portfolioValue) * 100;
      }

      setRiskMetrics({
        riskAmount,
        riskPercent,
        positionSize: positionValue,
        stopLossDistance
      });

      setTrade(prev => ({
        ...prev,
        positionSizePercent
      }));
    }
  };

  useEffect(() => {
    calculateRiskMetrics();
  }, [trade.entryPrice, trade.stopLoss, trade.quantity, trade.side, settings.portfolioValue, calculateRiskMetrics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested mentalGame fields
    if (name.startsWith('mentalGame.')) {
      const field = name.split('.')[1];
      setTrade(prev => ({
        ...prev,
        mentalGame: {
          ...prev.mentalGame,
          [field]: value
        }
      }));
    } else {
      setTrade(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleChecklistChange = (item) => {
    setTrade(prev => ({
      ...prev,
      checklist: (prev.checklist || []).includes(item)
        ? (prev.checklist || []).filter(i => i !== item)
        : [...(prev.checklist || []), item]
    }));
  };





  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    
    if (isAddingToExisting) {
      // Handle adding to existing position
      if (!selectedExistingTrade || !newQuantity || !newPrice) {
        alert('Please fill in all required fields');
        return;
      }

      try {
        // Calculate new average price
        const existingQuantity = parseFloat(selectedExistingTrade.quantity);
        const existingPrice = parseFloat(selectedExistingTrade.entryPrice);
        const additionalQuantity = parseFloat(newQuantity);
        const additionalPrice = parseFloat(newPrice);
        
        const totalQuantity = existingQuantity + additionalQuantity;
        const newAveragePrice = ((existingQuantity * existingPrice) + (additionalQuantity * additionalPrice)) / totalQuantity;
        
        // Update the existing trade
        const updatedTrade = {
          ...selectedExistingTrade,
          quantity: totalQuantity.toFixed(2),
          entryPrice: newAveragePrice.toFixed(2),
          positionSize: (newAveragePrice * totalQuantity).toFixed(2),
          notes: selectedExistingTrade.notes ? 
            `${selectedExistingTrade.notes}\n\n--- Additional Purchase ---\nDate: ${trade.entryDate}\nQuantity: ${newQuantity}\nPrice: ${newPrice}€\nNotes: ${trade.notes || 'No additional notes'}` :
            `--- Additional Purchase ---\nDate: ${trade.entryDate}\nQuantity: ${newQuantity}\nPrice: ${newPrice}€\nNotes: ${trade.notes || 'No additional notes'}`
        };

        await onTradeAdded(updatedTrade);
        
        // Reset form
        setIsAddingToExisting(false);
        setSelectedExistingTrade(null);
        setNewQuantity('');
        setNewPrice('');
        resetForm();
        
        alert('Position updated successfully!');
      } catch (error) {
        console.error('Error updating position:', error);
        alert('Error updating position. Please try again.');
      }
    } else {
      // Handle new trade
      if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
        alert('Please fill in all required fields');
        return;
      }

      const newTrade = {
        ...trade,
        id: Date.now().toString(),
        status: 'open',
        pnl: null,
        positionSizePercent: trade.positionSizePercent || 0,
        stopLoss: trade.stopLoss || null
      };

      onTradeAdded(newTrade);
      // Open trade log (pre-trade)
      setTradeLogPhase('pre');
      setTradeLogInitial({
        date: trade.entryDate,
        symbol: trade.symbol,
        direction: trade.side === 'BUY' ? 'Long' : 'Short',
      });
      setShowTradeLog(true);
      resetForm();
    }
  };

  const resetForm = () => {
    setTrade({
      symbol: '',
      side: 'BUY',
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: '',
      stopLoss: '',
      exitDate: '',
      exitPrice: '',
      quantity: '',
      commission: '',
      notes: '',
      setup: '',
      triggerUsed: false,
      triggerNotes: '',
      ruleAdherence: undefined,
      ruleAdherenceNotes: '',
      tradeGrade: '',
      psychology: {
        ruleCompliance: 0,
        emotionControl: 0,
      },
      screenshots: {
        preTrade: '',
        execution: '',
        postTrade: ''
      },
      positionSizePercent: 0,
      checklist: [],
      mentalGame: {
        tradeReasoning: '',
        emotionsThoughts: '',
        strengthsMistakes: '',
        nextTimeFix: ''
      }
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

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
        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Plus style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
                Trade Entry
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Open New Trades & Manage Positions
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('trading-routine')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
              }}
            >
              ← Zurück zur Routine
            </button>
          )}
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem'
        }}>
          {/* Trade Form */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                {isAddingToExisting ? 'Add to Existing Position' : 'Trade Details'}
              </h2>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingToExisting(false);
                    setSelectedExistingTrade(null);
                    setNewQuantity('');
                    setNewPrice('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: !isAddingToExisting ? '#3b82f6' : '#475569',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  New Trade
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingToExisting(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isAddingToExisting ? '#3b82f6' : '#475569',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Add to Existing
                </button>
              </div>
            </div>

            <form onSubmit={handleEntrySubmit}>
              {isAddingToExisting && (
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Select Existing Position
                      </label>
                      <select
                        value={selectedExistingTrade ? selectedExistingTrade.id : ''}
                        onChange={(e) => {
                          const selected = openTrades.find(t => t.id === e.target.value);
                          setSelectedExistingTrade(selected);
                          if (selected) {
                            setTrade(prev => ({ ...prev, symbol: selected.symbol, side: selected.side }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Choose a position...</option>
                        {openTrades.map(trade => (
                          <option key={trade.id} value={trade.id}>
                            {trade.symbol} - {trade.quantity} shares @ {parseFloat(trade.entryPrice).toFixed(2)}€
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
                        Additional Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Additional Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Enter price"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                  
                  {selectedExistingTrade && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#1e293b',
                      borderRadius: '0.5rem',
                      border: '1px solid #475569'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        New Average Price Preview:
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#f8fafc',
                        fontWeight: '500'
                      }}>
                        {(() => {
                          if (!newQuantity || !newPrice) return 'Enter quantity and price to see new average';
                          const existingQuantity = parseFloat(selectedExistingTrade.quantity);
                          const existingPrice = parseFloat(selectedExistingTrade.entryPrice);
                          const additionalQuantity = parseFloat(newQuantity);
                          const additionalPrice = parseFloat(newPrice);
                          const totalQuantity = existingQuantity + additionalQuantity;
                          const newAveragePrice = ((existingQuantity * existingPrice) + (additionalQuantity * additionalPrice)) / totalQuantity;
                          return `${newAveragePrice.toFixed(2)}€ (was ${existingPrice.toFixed(2)}€)`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                    Symbol
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={trade.symbol}
                    onChange={handleInputChange}
                    required={!isAddingToExisting}
                    disabled={isAddingToExisting}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: isAddingToExisting ? '#1e293b' : '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: isAddingToExisting ? '#64748b' : '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Side
                  </label>
                  <select
                    name="side"
                    value={trade.side}
                    onChange={handleInputChange}
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
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
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
                    Entry Date
                  </label>
                  <input
                    type="date"
                    name="entryDate"
                    value={trade.entryDate}
                    onChange={handleInputChange}
                    required
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Entry Price
                  </label>
                  <input
                    type="number"
                    name="entryPrice"
                    value={trade.entryPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    required
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
                    value={trade.stopLoss}
                    onChange={handleInputChange}
                    step="0.01"
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={trade.quantity}
                    onChange={handleInputChange}
                    required
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Commission
                  </label>
                  <input
                    type="number"
                    name="commission"
                    value={trade.commission}
                    onChange={handleInputChange}
                    step="0.01"
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Setup Type
                  </label>
                  <select
                    name="setup"
                    value={trade.setup}
                    onChange={handleInputChange}
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
                    <option value="">Select Setup Type</option>
                    <option value="Breakout">Breakout</option>
                    <option value="SMA Touch">SMA Touch</option>
                    <option value="Mean Reversion">Mean Reversion</option>
                    <option value="UnR">UnR</option>
                    <option value="No Clear Setup">No Clear Setup</option>
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
                    Trailing Moving Average
                  </label>
                  <select
                    name="trailingMA"
                    value={trade.trailingMA}
                    onChange={handleInputChange}
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
                    <option value="">Select MA for profit taking</option>
                    <option value="5">5-Day Moving Average</option>
                    <option value="10">10-Day Moving Average</option>
                    <option value="20">20-Day Moving Average</option>
                    <option value="50">50-Day Moving Average</option>
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
                    APTR(14) Day (%)
                  </label>
                  <input
                    type="number"
                    name="aptr14"
                    value={trade.aptr14}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter APTR percentage (e.g., 7.5)"
                  />
                </div>
              </div>

              {/* Mental Game Snapshot */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🧠 Mental Game Snapshot
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Why did I take this trade? */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Why did I take this trade?
                    </label>
                    <textarea
                      name="mentalGame.tradeReasoning"
                      value={trade.mentalGame.tradeReasoning}
                      onChange={handleInputChange}
                      rows="2"
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
                      placeholder="Briefly note the reasoning (e.g., technical setup, plan, or impulse)."
                    />
                  </div>

                  {/* What emotions or thoughts influenced my actions? */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      What emotions or thoughts influenced my actions?
                    </label>
                    <textarea
                      name="mentalGame.emotionsThoughts"
                      value={trade.mentalGame.emotionsThoughts}
                      onChange={handleInputChange}
                      rows="2"
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
                      placeholder="Note key emotions or distractions (e.g., confidence, fear, hesitation)."
                    />
                  </div>

                  {/* What did I do well, and what was a mistake? */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      What did I do well, and what was a mistake?
                    </label>
                    <textarea
                      name="mentalGame.strengthsMistakes"
                      value={trade.mentalGame.strengthsMistakes}
                      onChange={handleInputChange}
                      rows="2"
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
                      placeholder="List one strength (A-Game) and one error (C-Game)."
                    />
                  </div>

                  {/* What's one fix for next time? */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      What's one fix for next time?
                    </label>
                    <textarea
                      name="mentalGame.nextTimeFix"
                      value={trade.mentalGame.nextTimeFix}
                      onChange={handleInputChange}
                      rows="2"
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
                      placeholder="Suggest a simple correction to improve (e.g., 'Stick to stop-loss' or 'Pause after a loss')."
                    />
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Camera size={20} />
                  Screenshots
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Pre-Trade Screenshot */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Pre-Trade Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('preTrade', e.target.files?.[0])}
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
                    {trade.screenshots?.preTrade && (
                      <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                        <img
                          src={trade.screenshots.preTrade}
                          alt="Pre-trade"
                          style={{
                            width: '100%',
                            borderRadius: '0.375rem',
                            border: '1px solid #475569'
                          }}
                        />
                        <button
                          onClick={() => removeImage('preTrade')}
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

                  {/* Execution Screenshot (5min chart) */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Execution Screenshot (5min Chart)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('execution', e.target.files?.[0])}
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
                    {trade.screenshots?.execution && (
                      <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                        <img
                          src={trade.screenshots.execution}
                          alt="Execution"
                          style={{
                            width: '100%',
                            borderRadius: '0.375rem',
                            border: '1px solid #475569'
                          }}
                        />
                        <button
                          onClick={() => removeImage('execution')}
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

                  {/* Post-Trade Screenshot */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Post-Trade Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('postTrade', e.target.files?.[0])}
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
                    {trade.screenshots?.postTrade && (
                      <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                        <img
                          src={trade.screenshots.postTrade}
                          alt="Post-trade"
                          style={{
                            width: '100%',
                            borderRadius: '0.375rem',
                            border: '1px solid #475569'
                          }}
                        />
                        <button
                          onClick={() => removeImage('postTrade')}
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



              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    name="triggerUsed"
                    checked={trade.triggerUsed}
                    onChange={(e) => setTrade(prev => ({ ...prev, triggerUsed: e.target.checked }))}
                    style={{
                      marginRight: '0.75rem',
                      width: '1rem',
                      height: '1rem',
                      cursor: 'pointer'
                    }}
                  />
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}>
                    Trigger Used
                  </label>
                </div>
                {trade.triggerUsed && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Trigger Details (Price & Type)
                    </label>
                    <textarea
                      name="triggerNotes"
                      value={trade.triggerNotes}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="e.g., Breakout above $50 resistance, Pullback to 20 SMA at $45"
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
                )}
              </div>

              {/* Rule Adherence */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Rule Adherence
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setTrade(prev => ({ ...prev, ruleAdherence: true, ruleAdherenceNotes: '' }))}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: trade.ruleAdherence === true ? '#10b981' : '#334155',
                      color: trade.ruleAdherence === true ? '#ffffff' : '#94a3b8',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Followed Rules
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrade(prev => ({ ...prev, ruleAdherence: false }))}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: trade.ruleAdherence === false ? '#ef4444' : '#334155',
                      color: trade.ruleAdherence === false ? '#ffffff' : '#94a3b8',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Didn't Follow Rules
                  </button>
                </div>
                {trade.ruleAdherence === false && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Rule Adherence Notes
                    </label>
                    <textarea
                      name="ruleAdherenceNotes"
                      value={trade.ruleAdherenceNotes}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Which rule, why not followed..."
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
                )}
              </div>

              {/* Trade Grade (A/B/C) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Trade Grade (Decision Making & Rule Compliance)
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setTrade(prev => ({ ...prev, tradeGrade: 'A' }))}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: trade.tradeGrade === 'A' ? '#10b981' : '#334155',
                      color: trade.tradeGrade === 'A' ? '#ffffff' : '#94a3b8',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    A-Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrade(prev => ({ ...prev, tradeGrade: 'B' }))}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: trade.tradeGrade === 'B' ? '#f59e0b' : '#334155',
                      color: trade.tradeGrade === 'B' ? '#ffffff' : '#94a3b8',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    B-Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrade(prev => ({ ...prev, tradeGrade: 'C' }))}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: trade.tradeGrade === 'C' ? '#ef4444' : '#334155',
                      color: trade.tradeGrade === 'C' ? '#ffffff' : '#94a3b8',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    C-Game
                  </button>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  lineHeight: '1.4'
                }}>
                  <strong>A-Game:</strong> Perfect decision making, followed all rules, excellent execution<br/>
                  <strong>B-Game:</strong> Good decision making, mostly followed rules, minor mistakes<br/>
                  <strong>C-Game:</strong> Poor decision making, broke rules, emotional trading
                </div>
              </div>

              {/* Psychology Tracking */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🧠 Psychology Tracking
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Rule Compliance Rating */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Rule Compliance (1-10)
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      flexWrap: 'wrap'
                    }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setTrade(prev => ({
                            ...prev,
                            psychology: {
                              ...prev.psychology,
                              ruleCompliance: rating
                            }
                          }))}
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            backgroundColor: trade.psychology.ruleCompliance === rating ? '#10b981' : '#334155',
                            color: trade.psychology.ruleCompliance === rating ? '#ffffff' : '#94a3b8',
                            border: '1px solid #475569',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.5rem'
                    }}>
                      1 = Broke all rules, 10 = Perfect rule compliance
                    </div>
                  </div>

                  {/* Emotion Control Rating */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Emotion Control (1-10)
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      flexWrap: 'wrap'
                    }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setTrade(prev => ({
                            ...prev,
                            psychology: {
                              ...prev.psychology,
                              emotionControl: rating
                            }
                          }))}
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            backgroundColor: trade.psychology.emotionControl === rating ? '#10b981' : '#334155',
                            color: trade.psychology.emotionControl === rating ? '#ffffff' : '#94a3b8',
                            border: '1px solid #475569',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.5rem'
                    }}>
                      1 = Emotional trading, 10 = Perfect emotional control
                    </div>
                  </div>


                </div>
              </div>





              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
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
                  Open Trade
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Risk Metrics & Breakout Checklist */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Risk Metrics */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: 'fit-content'
            }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc'
            }}>
              Risk Metrics
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Position Size
                </label>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: riskMetrics.positionSize < (settings.portfolioValue * 0.3) ? '#10b981' : '#ef4444',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(riskMetrics.positionSize)}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: riskMetrics.positionSize < (settings.portfolioValue * 0.3) ? '#10b981' : '#ef4444',
                  margin: 0
                }}>
                  {trade.positionSizePercent ? `${trade.positionSizePercent.toFixed(2)}%` : '0%'} of portfolio
                </p>
              </div>

              <div>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Risk Amount
                </label>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#ef4444',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(Math.abs(riskMetrics.riskAmount))}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: riskMetrics.riskPercent > 2 ? '#ef4444' : '#94a3b8',
                  margin: 0,
                  fontWeight: riskMetrics.riskPercent > 2 ? '600' : '400'
                }}>
                  {riskMetrics.riskPercent.toFixed(2)}% of portfolio
                  {riskMetrics.riskPercent > 2 && (
                    <span style={{ color: '#ef4444', fontWeight: '600' }}> ⚠️ High Risk!</span>
                  )}
                </p>
              </div>

              <div>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Stop Loss Distance
                </label>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(Math.abs(riskMetrics.stopLossDistance))}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  {riskMetrics.stopLossDistance > 0 ? `${((Math.abs(riskMetrics.stopLossDistance) / parseFloat(trade.entryPrice || 1)) * 100).toFixed(2)}%` : '0%'} from entry
                </p>
              </div>

              <div>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Portfolio Value
                </label>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {formatCurrency(settings.portfolioValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Pre-Trade Entry Checklist */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ✅ Pre-Trade Entry Checklist
            </h3>
            
            <div style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              padding: '1rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {preTradeChecklist.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: (trade.checklist || []).includes(item) ? '#10b98120' : 'transparent',
                  borderRadius: '0.25rem',
                  border: (trade.checklist || []).includes(item) ? '1px solid #10b981' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }} onClick={() => handleChecklistChange(item)}>
                  <input
                    type="checkbox"
                    checked={(trade.checklist || []).includes(item)}
                    onChange={() => handleChecklistChange(item)}
                    style={{
                      marginRight: '0.75rem',
                      width: '1rem',
                      height: '1rem',
                      cursor: 'pointer',
                      marginTop: '0.125rem',
                      flexShrink: 0
                    }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    lineHeight: '1.4',
                    flex: 1
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: '#3b82f6',
                      marginRight: '0.5rem'
                    }}>
                      {index + 1}.
                    </span>
                    {item}
                  </span>
                </div>
              ))}
              
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.375rem',
                border: '1px solid #475569'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#f8fafc'
                  }}>
                    Checklist Progress
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: (trade.checklist || []).length >= 10 ? '#10b981' : 
                           (trade.checklist || []).length >= 7 ? '#f59e0b' : '#ef4444'
                  }}>
                    {(trade.checklist || []).length}/{preTradeChecklist.length}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${((trade.checklist || []).length / preTradeChecklist.length) * 100}%`,
                    height: '100%',
                    backgroundColor: (trade.checklist || []).length >= 10 ? '#10b981' : 
                                   (trade.checklist || []).length >= 7 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}>
                  {(trade.checklist || []).length >= 10 ? '✅ Ready to trade!' : 
                   (trade.checklist || []).length >= 7 ? '⚠️ Almost ready' : 
                   '❌ Review checklist items'}
                </div>
              </div>
            </div>
          </div>

            {/* Breakout Checklist - only show when Breakout is selected */}
            {trade.setup === 'Breakout' && (
              <div style={{
                backgroundColor: '#1e293b',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #334155',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                height: 'fit-content'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#f8fafc'
                }}>
                  ✅ Breakout Checklist
                </h3>
                <div style={{
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  {breakoutChecklist.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      cursor: 'pointer'
                    }} onClick={() => handleChecklistChange(item)}>
                      <input
                        type="checkbox"
                        checked={(trade.checklist || []).includes(item)}
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
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.5rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    Completed: {(trade.checklist || []).length} / {breakoutChecklist.length} items
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {showTradeLog && (
        <TradeLogModal
          isOpen={showTradeLog}
          phase={tradeLogPhase}
          initialData={tradeLogInitial}
          onClose={() => setShowTradeLog(false)}
          onSave={(data) => {
            console.log('Trade Log Saved:', data);
          }}
        />
      )}
    </div>
  );
};

export default NewTradeEntry; 