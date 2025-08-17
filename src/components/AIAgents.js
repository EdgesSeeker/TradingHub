import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Shield, Target, Zap, CheckCircle, XCircle, AlertTriangle, Clock, Star, BarChart3, MessageSquare, Trash2, DollarSign, Layers, Calendar, Play, RefreshCw } from 'lucide-react';
import storage from '../utils/storage';
import marketDataService from '../services/marketData';

const AIAgents = ({ trades = [], onTradeUpdated }) => {
  const [tradePlans, setTradePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiResults, setAiResults] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, reviewed, approved, rejected
  const [apiStatus, setApiStatus] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set());

  useEffect(() => {
    // Initialize storage and load trade plans
    const initializeAndLoad = async () => {
      try {
        await storage.init(); // Ensure database is initialized
        await loadTradePlans();
        
        // Update API status
        setApiStatus(marketDataService.getApiStatus());
      } catch (error) {
        console.error('Error initializing storage:', error);
        // Still try to load from old system
        await loadTradePlans();
      }
    };
    
    initializeAndLoad();
    
    // Update API status every 30 seconds
    const interval = setInterval(() => {
      setApiStatus(marketDataService.getApiStatus());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [trades]);

  const loadTradePlans = async () => {
    try {
      // Get trade plans from both new AI system and old settings system
      const [aiPlans, oldPlans] = await Promise.all([
        storage.loadTradePlans().catch((error) => {
          console.log('AI system not ready yet, using empty array:', error.message);
          return [];
        }),
        storage.getAllSettings().then(settings => settings.tradePlans || []).catch(() => [])
      ]);
      
      // Combine and deduplicate plans
      const allPlans = [...aiPlans];
      
      // Add old plans that don't exist in new system
      oldPlans.forEach(oldPlan => {
        const exists = allPlans.some(plan => plan.id === oldPlan.id);
        if (!exists) {
          // Convert old plan format to new format
          const convertedPlan = {
            ...oldPlan,
            status: oldPlan.status || 'pending',
            direction: oldPlan.direction || (oldPlan.setup?.toLowerCase().includes('short') ? 'SELL' : 'BUY'),
            targets: oldPlan.targets || [],
            thesis: oldPlan.thesis || oldPlan.tradePlan || '',
            trigger: oldPlan.trigger || oldPlan.entryPrice,
            riskAmount: oldPlan.riskAmount || (oldPlan.calculations?.riskAmount || 0),
            positionSize: oldPlan.positionSize || (oldPlan.calculations?.positionSize || 0)
          };
          allPlans.push(convertedPlan);
        }
      });
      
      console.log('Loaded trade plans:', allPlans);
      setTradePlans(allPlans);
    } catch (error) {
      console.error('Error loading trade plans:', error);
      setTradePlans([]);
    }
  };

  // Reload and re-evaluate all trade plans with new approval logic
  const reloadAndReevaluatePlans = async () => {
    try {
      console.log('Reloading and re-evaluating trade plans...');
      
      // Get trade plans from both systems
      const [aiPlans, oldPlans] = await Promise.all([
        storage.loadTradePlans().catch((error) => {
          console.log('AI system not ready yet, using empty array:', error.message);
          return [];
        }),
        storage.getAllSettings().then(settings => settings.tradePlans || []).catch(() => [])
      ]);
      
      // Combine and deduplicate plans
      const allPlans = [...aiPlans];
      
      // Add old plans that don't exist in new system
      oldPlans.forEach(oldPlan => {
        const exists = allPlans.some(plan => plan.id === oldPlan.id);
        if (!exists) {
          // Convert old plan format to new format
          const convertedPlan = {
            ...oldPlan,
            status: oldPlan.status || 'pending',
            direction: oldPlan.direction || (oldPlan.setup?.toLowerCase().includes('short') ? 'SELL' : 'BUY'),
            targets: oldPlan.targets || [],
            thesis: oldPlan.thesis || oldPlan.tradePlan || '',
            trigger: oldPlan.trigger || oldPlan.entryPrice,
            riskAmount: oldPlan.riskAmount || (oldPlan.calculations?.riskAmount || 0),
            positionSize: oldPlan.positionSize || (oldPlan.calculations?.positionSize || 0)
          };
          allPlans.push(convertedPlan);
        }
      });
      
      // Reset all plans to pending status
      const resetPlans = allPlans.map(plan => ({
            ...plan,
        status: 'pending',
        aiReview: null,
        approvalStatus: 'pending'
      }));
      
      // Save reset plans
      await Promise.all([
        storage.saveTradePlans(resetPlans).catch(() => {}),
        storage.updateSetting('tradePlans', resetPlans).catch(() => {})
      ]);
      
      setTradePlans(resetPlans);
      console.log('Trade plans reset and ready for re-evaluation');
      } catch (error) {
      console.error('Error reloading trade plans:', error);
    }
  };

  // Reset trade plan status
  const resetTradePlanStatus = async (planId) => {
    try {
      const updatedPlans = tradePlans.map(plan => 
        plan.id === planId 
          ? { ...plan, status: 'pending', aiReview: null, approvalStatus: 'pending' }
          : plan
      );
      
      // Update both storage systems
      await Promise.all([
        storage.saveTradePlans(updatedPlans).catch(() => {}),
        storage.updateSetting('tradePlans', updatedPlans).catch(() => {})
      ]);
      
      setTradePlans(updatedPlans);
      console.log(`Trade plan ${planId} status reset`);
    } catch (error) {
      console.error('Error resetting trade plan status:', error);
    }
  };

  // Execute trade plan
  const executeTradePlan = async (plan) => {
    try {
      // Save executed plan to localStorage for Trade Entry component
      const executedPlan = {
        ...plan,
        executedAt: new Date().toISOString(),
        status: 'executed'
      };
      
      localStorage.setItem('executedTradePlan', JSON.stringify(executedPlan));
      
      // Update plan status
      const updatedPlans = tradePlans.map(p => 
        p.id === plan.id ? { ...p, status: 'executed' } : p
      );
      
      await Promise.all([
        storage.saveTradePlans(updatedPlans).catch(() => {}),
        storage.updateSetting('tradePlans', updatedPlans).catch(() => {})
      ]);
      
      setTradePlans(updatedPlans);
      
      // Prompt user to navigate to Trade Entry
      if (window.confirm('Trade Plan erfolgreich ausgeführt! Möchten Sie jetzt zum Trade Entry wechseln, um den Trade zu öffnen?')) {
        // Navigate to Trade Entry (this will be handled by parent component)
        window.location.hash = '#trade-entry';
      }
    } catch (error) {
      console.error('Error executing trade plan:', error);
      alert('Fehler beim Ausführen des Trade Plans: ' + error.message);
    }
  };

  // Filter plans by status
  const filteredPlans = tradePlans.filter(plan => {
    if (filterStatus === 'all') return true;
    return plan.status === filterStatus;
  });

  // Group plans by date
  const groupedPlans = filteredPlans.reduce((groups, plan) => {
      const date = new Date(plan.createdAt || plan.date || Date.now()).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(plan);
    return groups;
      }, {});

  // Toggle date expansion
  const toggleDateExpansion = (date) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
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
        <Brain style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            AI Agents
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            AI-Powered Trade Analysis & Execution
          </p>
        </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Reload Button */}
          <button
            onClick={reloadAndReevaluatePlans}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="AI-Bewertungen zurücksetzen für neue Bewertung"
          >
            <RefreshCw size={16} />
            Reload
          </button>
          
          {/* API Status */}
          {apiStatus && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: apiStatus.remainingCalls > 0 ? '#10b981' : '#ef4444',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: apiStatus.remainingCalls > 0 ? '#f8fafc' : '#f8fafc' }}></div>
              API: {apiStatus.remainingCalls}/5 calls
            </div>
          )}
          
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filterStatus === 'all' ? '#10b981' : 'transparent',
              border: `1px solid ${filterStatus === 'all' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: filterStatus === 'all' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filterStatus === 'pending' ? '#10b981' : 'transparent',
              border: `1px solid ${filterStatus === 'pending' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: filterStatus === 'pending' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Ausstehend
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filterStatus === 'approved' ? '#10b981' : 'transparent',
              border: `1px solid ${filterStatus === 'approved' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: filterStatus === 'approved' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Genehmigt
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filterStatus === 'rejected' ? '#10b981' : 'transparent',
              border: `1px solid ${filterStatus === 'rejected' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: filterStatus === 'rejected' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Abgelehnt
          </button>
      </div>

      {/* Trade Plans Overview */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #334155'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Trade Plans ({filteredPlans.length})
        </h3>
        
        {filteredPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Keine Trade Plans gefunden.</p>
            <p style={{ fontSize: '0.875rem' }}>Erstellen Sie Trade Plans in der Trade Planning Sektion.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(groupedPlans).map(([date, plans]) => (
              <div key={date}>
                {/* Date Header - Clickable */}
                <div 
                  onClick={() => toggleDateExpansion(date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    backgroundColor: '#334155',
                    borderRadius: '0.5rem',
                    border: '1px solid #475569',
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
                      {plans.length} {plans.length === 1 ? 'Trade Plan' : 'Trade Plans'}
                    </span>
                  </div>
                  
                  {/* Expand/Collapse Icon */}
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
                
                {/* Trade Plans for this date - Collapsible */}
                {expandedDates.has(date) && (
                  <div style={{ 
                    display: 'grid', 
                    gap: '1rem',
                    marginTop: '1rem',
                    paddingLeft: '1rem',
                    borderLeft: '2px solid #475569'
                  }}>
                    {plans.map(plan => (
              <div key={plan.id} style={{
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1rem',
                        border: '1px solid #475569'
                      }}>
                        {/* Plan Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              margin: '0 0 0.5rem 0',
                              color: '#f8fafc'
                            }}>
                              {plan.symbol} - {plan.setup || 'Setup'}
                    </h4>
                            <div style={{
                      display: 'flex',
                              gap: '1rem',
                              flexWrap: 'wrap',
                              fontSize: '0.875rem',
                              color: '#94a3b8'
                            }}>
                              <span>Direction: {plan.direction || 'N/A'}</span>
                              <span>Status: {plan.status || 'pending'}</span>
                              {plan.entryPrice && <span>Entry: ${plan.entryPrice}</span>}
                              {plan.stopLoss && <span>Stop: ${plan.stopLoss}</span>}
                            </div>
                  </div>
                  
                          {/* Status Badge */}
                       <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                         fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            ...(plan.status === 'approved' ? {
                              backgroundColor: '#10b981',
                              color: '#ffffff'
                            } : plan.status === 'rejected' ? {
                              backgroundColor: '#ef4444',
                              color: '#ffffff'
                            } : plan.status === 'executed' ? {
                              backgroundColor: '#3b82f6',
                              color: '#ffffff'
                            } : {
                              backgroundColor: '#f59e0b',
                              color: '#ffffff'
                            })
                          }}>
                            {plan.status}
                       </div>
                        </div>
                        
                        {/* Plan Details */}
                        {plan.thesis && (
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#94a3b8',
                              marginBottom: '0.5rem'
                            }}>
                              Thesis
                            </h5>
                            <p style={{
                              fontSize: '0.875rem',
                         color: '#f8fafc',
                              lineHeight: '1.5',
                              margin: 0
                       }}>
                              {plan.thesis}
                            </p>
                       </div>
                     )}
                     
                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          {plan.status === 'approved' && (
                       <button
                              onClick={() => executeTradePlan(plan)}
                         style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#10b981',
                           border: 'none',
                                borderRadius: '0.375rem',
                                color: '#ffffff',
                           cursor: 'pointer',
                                fontSize: '0.875rem',
                           fontWeight: '500',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.25rem'
                         }}
                       >
                              <Play size={16} />
                         Execute
                       </button>
                     )}
                     
                          {plan.status === 'executed' && (
                       <button
                              onClick={() => resetTradePlanStatus(plan.id)}
                         style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#f59e0b',
                           border: 'none',
                                borderRadius: '0.375rem',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                           fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                         }}
                       >
                              <RefreshCw size={16} />
                              Reset
                       </button>
                     )}
                     
                     <button
                            onClick={() => setSelectedPlan(plan)}
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
                         gap: '0.25rem'
                       }}
                     >
                            <MessageSquare size={16} />
                            Review
                     </button>
                   </div>
              </div>
            ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Review Modal */}
      {selectedPlan && (
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
            maxWidth: '800px',
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
                AI Review: {selectedPlan.symbol}
              </h2>
                 <button
                   onClick={() => setSelectedPlan(null)}
                   style={{
                     background: 'none',
                     border: 'none',
                     color: '#94a3b8',
                     cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <XCircle size={24} />
                 </button>
             </div>

            {/* Plan Details */}
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem'
              }}>
                Trade Plan Details
              </h3>
              <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                  <label style={{
                       fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Symbol
                  </label>
                     <div style={{ 
                    fontSize: '1rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.symbol}
                     </div>
                   </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Setup
                  </label>
                    <div style={{
                    fontSize: '1rem',
                      color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.setup || 'N/A'}
                    </div>
                  </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Direction
                  </label>
                    <div style={{
                    fontSize: '1rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.direction || 'N/A'}
                      </div>
                      </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Entry Price
                  </label>
                      <div style={{
                    fontSize: '1rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.entryPrice ? `$${selectedPlan.entryPrice}` : 'N/A'}
                      </div>
                    </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Stop Loss
                  </label>
                      <div style={{
                    fontSize: '1rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.stopLoss ? `$${selectedPlan.stopLoss}` : 'N/A'}
                      </div>
                    </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Risk Amount
                  </label>
                       <div style={{
                    fontSize: '1rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    {selectedPlan.riskAmount ? `$${selectedPlan.riskAmount}` : 'N/A'}
                  </div>
                       </div>
                     </div>
                     
              {selectedPlan.thesis && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    Thesis
                  </label>
                       <div style={{
                    fontSize: '0.875rem',
                    color: '#f8fafc',
                    lineHeight: '1.5',
                    marginTop: '0.25rem',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.375rem',
                    border: '1px solid #475569'
                  }}>
                    {selectedPlan.thesis}
                       </div>
                </div>
              )}
                     </div>
                     
            {/* AI Review Results */}
            {aiResults[selectedPlan.id] && (
                     <div style={{
                       backgroundColor: '#334155',
                       padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem'
                }}>
                  AI Analysis Results
                </h3>
                  <div style={{
                    display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                      Confidence Score
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      color: '#f8fafc',
                      fontWeight: '600'
                    }}>
                      {aiResults[selectedPlan.id].confidence}%
                    </div>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                        Risk Assessment
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      color: '#f8fafc',
                      fontWeight: '600'
                    }}>
                      {aiResults[selectedPlan.id].riskLevel}
                    </div>
                     </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                      Recommendation
                    </label>
                     <div style={{
                      fontSize: '1rem',
                      color: '#f8fafc',
                      fontWeight: '600'
                    }}>
                      {aiResults[selectedPlan.id].recommendation}
                    </div>
                     </div>
                   </div>

                {aiResults[selectedPlan.id].reasoning && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                      AI Reasoning
                    </label>
                      <div style={{
                      fontSize: '0.875rem',
                      color: '#f8fafc',
                      lineHeight: '1.5',
                      marginTop: '0.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#1e293b',
                      borderRadius: '0.375rem',
                      border: '1px solid #475569'
                    }}>
                      {aiResults[selectedPlan.id].reasoning}
                    </div>
                      </div>
                    )}
                      </div>
                    )}
                    
            {/* Action Buttons */}
                      <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
                  <button
                onClick={() => setSelectedPlan(null)}
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
                Close
                  </button>
              
              {selectedPlan.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      // Approve plan logic
                      const updatedPlans = tradePlans.map(p => 
                        p.id === selectedPlan.id ? { ...p, status: 'approved' } : p
                      );
                      setTradePlans(updatedPlans);
                      setSelectedPlan(null);
                    }}
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
                    <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => {
                      // Reject plan logic
                      const updatedPlans = tradePlans.map(p => 
                        p.id === selectedPlan.id ? { ...p, status: 'rejected' } : p
                      );
                      setTradePlans(updatedPlans);
                      setSelectedPlan(null);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <XCircle size={16} style={{ marginRight: '0.5rem' }} />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
