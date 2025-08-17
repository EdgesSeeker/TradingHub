import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Camera } from 'lucide-react';
import storage from '../utils/storage';

const TradeEditModal = ({ trade, onSave, onCancel }) => {
  const [editedTrade, setEditedTrade] = useState({
    ...trade,
    mentalGame: trade.mentalGame || {
      tradeReasoning: '',
      emotionsThoughts: '',
      strengthsMistakes: '',
      nextTimeFix: ''
    }
  });
  const [settings, setSettings] = useState({ portfolioValue: 0 });

  useEffect(() => {
    setEditedTrade({
      ...trade,
      mentalGame: trade.mentalGame || {
        tradeReasoning: '',
        emotionsThoughts: '',
        strengthsMistakes: '',
        nextTimeFix: ''
      }
    });
    loadSettings();
  }, [trade]);

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getAllSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const calculatePositionSize = () => {
    const entryPrice = parseFloat(editedTrade.entryPrice) || 0;
    const quantity = parseFloat(editedTrade.quantity) || 0;
    const positionSize = entryPrice * quantity;
    const positionSizePercent = settings.portfolioValue > 0 ? (positionSize / settings.portfolioValue) * 100 : 0;
    return { positionSize, positionSizePercent };
  };

  const handleInputChange = (field, value) => {
    // Handle nested mentalGame fields
    if (field.startsWith('mentalGame.')) {
      const mentalField = field.split('.')[1];
      setEditedTrade(prev => ({
        ...prev,
        mentalGame: {
          ...prev.mentalGame,
          [mentalField]: value
        }
      }));
    } else {
      setEditedTrade(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Auto-calculate PnL when trade is closed and has exit price
  useEffect(() => {
    if (editedTrade.status === 'closed' && 
        editedTrade.exitPrice && 
        editedTrade.entryPrice && 
        editedTrade.quantity && 
        editedTrade.side) {
      
      const entryPrice = parseFloat(editedTrade.entryPrice);
      const exitPrice = parseFloat(editedTrade.exitPrice);
      const quantity = parseFloat(editedTrade.quantity);
      
      let calculatedPnL = 0;
      if (editedTrade.side === 'BUY') {
        // Long position: profit = (exit - entry) * quantity
        calculatedPnL = (exitPrice - entryPrice) * quantity;
      } else {
        // Short position: profit = (entry - exit) * quantity
        calculatedPnL = (entryPrice - exitPrice) * quantity;
      }
      
      setEditedTrade(prev => ({
        ...prev,
        pnl: calculatedPnL.toFixed(2)
      }));
    }
  }, [editedTrade.status, editedTrade.exitPrice, editedTrade.entryPrice, editedTrade.quantity, editedTrade.side]);

  // Auto-set exit date when trade is closed
  useEffect(() => {
    if (editedTrade.status === 'closed' && !editedTrade.exitDate) {
      setEditedTrade(prev => ({
        ...prev,
        exitDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [editedTrade.status, editedTrade.exitDate]);

  // Function to handle image upload
  const handleImageUpload = (category, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditedTrade(prev => ({
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
    setEditedTrade(prev => ({
      ...prev,
      screenshots: {
        ...prev.screenshots,
        [category]: ''
      }
    }));
  };

  const handleSave = () => {
    const { positionSize, positionSizePercent } = calculatePositionSize();
    const quantity = parseFloat(editedTrade.quantity) || 0;
    
    // Validate closed trades have required fields
    if (editedTrade.status === 'closed') {
      if (!editedTrade.exitPrice) {
        alert('Bitte geben Sie einen Exit-Preis für geschlossene Trades ein.');
        return;
      }
      if (!editedTrade.exitDate) {
        alert('Bitte geben Sie ein Exit-Datum für geschlossene Trades ein.');
        return;
      }
      if (!editedTrade.pnl && editedTrade.pnl !== 0) {
        alert('Bitte geben Sie den P&L für geschlossene Trades ein oder stellen Sie sicher, dass alle Preise korrekt sind.');
        return;
      }
    }
    
    const updatedTrade = {
      ...editedTrade,
      positionSize,
      positionSizePercent,
      // Automatically close the position if quantity is 0 or less
      status: quantity <= 0 ? 'closed' : editedTrade.status
    };
    onSave(updatedTrade);
  };

  const { positionSize, positionSizePercent } = calculatePositionSize();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '800px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #334155'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            margin: 0
          }}>
            Trade bearbeiten
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                value={editedTrade.symbol || ''}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
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
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Richtung
              </label>
              <select
                value={editedTrade.side || 'BUY'}
                onChange={(e) => handleInputChange('side', e.target.value)}
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
                <option value="BUY">Long</option>
                <option value="SELL">Short</option>
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
                Status
              </label>
              <select
                value={editedTrade.status || 'open'}
                onChange={(e) => handleInputChange('status', e.target.value)}
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
                <option value="open">Offen</option>
                <option value="closed">Geschlossen</option>
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
                Trailing MA
              </label>
              <select
                value={editedTrade.trailingMA || ''}
                onChange={(e) => handleInputChange('trailingMA', e.target.value)}
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
                <option value="">Kein Trailing MA</option>
                <option value="5">5-Day Moving Average</option>
                <option value="10">10-Day Moving Average</option>
                <option value="20">20-Day Moving Average</option>
                <option value="50">50-Day Moving Average</option>
                <option value="200">200-Day Moving Average</option>
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
                step="0.01"
                min="0"
                max="100"
                value={editedTrade.aptr14 || ''}
                onChange={(e) => handleInputChange('aptr14', e.target.value)}
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
          </div>

          {/* Prices and Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Menge
              </label>
              <input
                type="number"
                value={editedTrade.quantity || ''}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
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
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Entry Preis
              </label>
              <input
                type="number"
                step="0.01"
                value={editedTrade.entryPrice || ''}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
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
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Exit Preis
              </label>
              <input
                type="number"
                step="0.01"
                value={editedTrade.exitPrice || ''}
                onChange={(e) => handleInputChange('exitPrice', e.target.value)}
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
                step="0.01"
                value={editedTrade.stopLoss || ''}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
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
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Entry Datum
              </label>
              <input
                type="date"
                value={editedTrade.entryDate || ''}
                onChange={(e) => handleInputChange('entryDate', e.target.value)}
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
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                Exit Datum
              </label>
              <input
                type="date"
                value={editedTrade.exitDate || ''}
                onChange={(e) => handleInputChange('exitDate', e.target.value)}
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
          </div>

          {/* Position Size Display */}
          <div style={{
            backgroundColor: '#334155',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <DollarSign size={16} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#94a3b8'
              }}>
                Positionsgröße
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f8fafc'
                }}>
                  ${positionSize.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  Absolut
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f8fafc'
                }}>
                  {positionSizePercent.toFixed(1)}%
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  Vom Depot
                </div>
              </div>
            </div>
          </div>

          {/* P&L */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              P&L ($)
              {editedTrade.status === 'closed' && editedTrade.exitPrice && editedTrade.entryPrice && editedTrade.quantity && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#10b981',
                  marginLeft: '0.5rem'
                }}>
                  (Auto-berechnet)
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                step="0.01"
                value={editedTrade.pnl || ''}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
              {editedTrade.status === 'closed' && editedTrade.exitPrice && editedTrade.entryPrice && editedTrade.quantity && (
                <button
                  type="button"
                  onClick={() => {
                    const entryPrice = parseFloat(editedTrade.entryPrice);
                    const exitPrice = parseFloat(editedTrade.exitPrice);
                    const quantity = parseFloat(editedTrade.quantity);
                    
                    let calculatedPnL = 0;
                    if (editedTrade.side === 'BUY') {
                      calculatedPnL = (exitPrice - entryPrice) * quantity;
                    } else {
                      calculatedPnL = (entryPrice - exitPrice) * quantity;
                    }
                    
                    setEditedTrade(prev => ({
                      ...prev,
                      pnl: calculatedPnL.toFixed(2)
                    }));
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="P&L neu berechnen"
                >
                  Neu berechnen
                </button>
              )}
            </div>
            {editedTrade.status === 'closed' && editedTrade.pnl && (
              <div style={{
                fontSize: '0.75rem',
                color: parseFloat(editedTrade.pnl) >= 0 ? '#10b981' : '#ef4444',
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                {parseFloat(editedTrade.pnl) >= 0 ? '+' : ''}{editedTrade.pnl} USD
                {editedTrade.entryPrice && editedTrade.exitPrice && (
                  <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>
                    ({(() => {
                      const entryPrice = parseFloat(editedTrade.entryPrice);
                      const exitPrice = parseFloat(editedTrade.exitPrice);
                      const percentage = editedTrade.side === 'BUY' 
                        ? ((exitPrice - entryPrice) / entryPrice) * 100
                        : ((entryPrice - exitPrice) / entryPrice) * 100;
                      return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
                    })()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Screenshots */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Camera size={20} />
              Screenshots
            </h4>
            
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
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
                {editedTrade.screenshots?.preTrade && (
                  <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                    <img
                      src={editedTrade.screenshots.preTrade}
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
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
                {editedTrade.screenshots?.execution && (
                  <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                    <img
                      src={editedTrade.screenshots.execution}
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
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
                {editedTrade.screenshots?.postTrade && (
                  <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                    <img
                      src={editedTrade.screenshots.postTrade}
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

          {/* Mental Game Snapshot */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🧠 Mental Game Snapshot
            </h4>
            
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
                  value={editedTrade.mentalGame?.tradeReasoning || ''}
                  onChange={(e) => handleInputChange('mentalGame.tradeReasoning', e.target.value)}
                  rows="2"
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
                  value={editedTrade.mentalGame?.emotionsThoughts || ''}
                  onChange={(e) => handleInputChange('mentalGame.emotionsThoughts', e.target.value)}
                  rows="2"
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
                  value={editedTrade.mentalGame?.strengthsMistakes || ''}
                  onChange={(e) => handleInputChange('mentalGame.strengthsMistakes', e.target.value)}
                  rows="2"
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
                  value={editedTrade.mentalGame?.nextTimeFix || ''}
                  onChange={(e) => handleInputChange('mentalGame.nextTimeFix', e.target.value)}
                  rows="2"
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
                  placeholder="Suggest a simple correction to improve (e.g., 'Stick to stop-loss' or 'Pause after a loss')."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #334155'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: '#059669',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Save size={16} style={{ marginRight: '0.5rem' }} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeEditModal; 