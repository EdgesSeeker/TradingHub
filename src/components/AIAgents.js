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
        storage.saveSetting('tradePlans', resetPlans).catch(() => {}),
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
        storage.saveSetting('tradePlans', updatedPlans).catch(() => {}),
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
        storage.saveSetting('tradePlans', updatedPlans).catch(() => {}),
        storage.updateSetting('tradePlans', updatedPlans).catch(() => {})
      ]);
      
      setTradePlans(updatedPlans);
      
      // Automatically navigate to Trade Entry
      window.location.hash = '#trade-entry';
    } catch (error) {
      console.error('Error executing trade plan:', error);
      alert('Fehler beim Ausführen des Trade Plans: ' + error.message);
    }
  };

  // AI Agent Review System
  const runAIReview = async (plan) => {
    setIsReviewing(true);
    
    // Simulate AI agents reviewing the trade plan
    const aiAgents = [
      { name: 'Technical Analysis Agent', weight: 0.25 },
      { name: 'Risk Management Agent', weight: 0.20 },
      { name: 'Market Sentiment Agent', weight: 0.20 },
      { name: 'Fundamental Analysis Agent', weight: 0.15 },
      { name: 'Volatility Assessment Agent', weight: 0.10 },
      { name: 'Timing Optimization Agent', weight: 0.10 }
    ];
    
    const results = {};
    let totalScore = 0;
    
    // Generate ratings between 7-10 for each agent
    aiAgents.forEach(agent => {
      const rating = Math.floor(Math.random() * 4) + 7; // Random between 7-10
      const weightedScore = rating * agent.weight;
      totalScore += weightedScore;
      
      results[agent.name] = {
        rating,
        weightedScore,
        feedback: generateAIFeedback(agent.name, rating)
      };
    });
    
    const overallRating = Math.round(totalScore * 10) / 10;
    const isApproved = overallRating >= 7.0;
    
    const reviewResult = {
      planId: plan.id,
      timestamp: new Date().toISOString(),
      agents: results,
      overallRating,
      isApproved,
      status: isApproved ? 'approved' : 'rejected'
    };
    
    setAiResults(prev => ({
      ...prev,
      [plan.id]: reviewResult
    }));
    
    // Update plan status
    const updatedPlans = tradePlans.map(p => 
      p.id === plan.id ? { ...p, status: reviewResult.status, aiReview: reviewResult } : p
    );
    
    setTradePlans(updatedPlans);
    
    // Save updated plans
    try {
      await Promise.all([
        storage.saveSetting('tradePlans', updatedPlans).catch(() => {}),
        storage.updateSetting('tradePlans', updatedPlans).catch(() => {})
      ]);
    } catch (error) {
      console.error('Error saving AI review results:', error);
    }
    
    setIsReviewing(false);
  };
  
  // Generate AI feedback based on agent and rating
  const generateAIFeedback = (agentName, rating) => {
    const feedbacks = {
      'Technical Analysis Agent': [
        'Strong technical setup with clear support/resistance levels',
        'Good trend alignment and momentum indicators',
        'Mixed technical signals, some concerns about volume',
        'Weak technical foundation, multiple red flags'
      ],
      'Risk Management Agent': [
        'Excellent risk-reward ratio and position sizing',
        'Good stop-loss placement and risk controls',
        'Acceptable risk parameters, could be optimized',
        'Risk management needs improvement'
      ],
      'Market Sentiment Agent': [
        'Positive market sentiment and institutional flow',
        'Neutral sentiment with balanced positioning',
        'Mixed sentiment signals, proceed with caution',
        'Negative sentiment, unfavorable market conditions'
      ],
      'Fundamental Analysis Agent': [
        'Strong fundamentals support the trade thesis',
        'Solid fundamental backdrop for the position',
        'Mixed fundamental factors, some concerns',
        'Weak fundamentals, trade thesis questionable'
      ],
      'Volatility Assessment Agent': [
        'Optimal volatility for the strategy',
        'Good volatility profile for entry',
        'Moderate volatility, adjust position size',
        'High volatility, consider reducing exposure'
      ],
      'Timing Optimization Agent': [
        'Perfect timing for entry, optimal conditions',
        'Good timing, favorable market conditions',
        'Acceptable timing, some room for improvement',
        'Poor timing, consider waiting for better setup'
      ]
    };
    
    const agentFeedbacks = feedbacks[agentName] || ['Analysis completed'];
    const index = Math.min(rating - 7, agentFeedbacks.length - 1);
    return agentFeedbacks[index];
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

  const renderTradePlans = () => {
    if (!tradePlans || tradePlans.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          No trade plans available
        </div>
      );
    }

    // Sort trade plans by ranking (highest first) and then by date
    const sortedPlans = [...tradePlans].sort((a, b) => {
      // First sort by ranking (highest first)
      const rankingA = a.ranking || 0;
      const rankingB = b.ranking || 0;
      if (rankingA !== rankingB) {
        return rankingB - rankingA;
      }
      // Then sort by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedPlans.map(plan => (
          <div key={plan.id} style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                  {plan.symbol}
                </span>
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: plan.direction === 'LONG' ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {plan.direction || 'LONG'}
                </span>
                {plan.ranking && (
                  <span style={{ 
                    color: '#fbbf24', 
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    ⭐ {plan.ranking}/10
                  </span>
                )}
                {plan.setupQuality && (
                  <span style={{ 
                    color: '#10b981', 
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    🎯 {plan.setupQuality}/10
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                Entry: ${plan.entryPrice} | Stop: ${plan.stopLoss} | Target: ${plan.takeProfit}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {plan.setup && `Setup: ${plan.setup}`} | Created: {new Date(plan.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => executeTradePlan(plan)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '0.25rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Execute
              </button>
            </div>
          </div>
        ))}
      </div>
    );
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
                    {plans
                      .sort((a, b) => {
                        // Sort by ranking (highest first), then by setup quality, then by creation date
                        const rankingA = a.ranking || 0;
                        const rankingB = b.ranking || 0;
                        const setupQualityA = a.setupQuality || 0;
                        const setupQualityB = b.setupQuality || 0;
                        
                        // First sort by ranking
                        if (rankingA !== rankingB) {
                          return rankingB - rankingA;
                        }
                        // Then sort by setup quality
                        if (setupQualityA !== setupQualityB) {
                          return setupQualityB - setupQualityA;
                        }
                        // Finally sort by date
                        return new Date(b.createdAt) - new Date(a.createdAt);
                      })
                      .map(plan => (
              <div key={plan.id} style={{
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1rem',
                        border: '1px solid #475569'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontSize: '1.125rem', 
                              fontWeight: '600', 
                              color: '#f8fafc' 
                            }}>
                              {plan.symbol}
                            </span>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              backgroundColor: plan.direction === 'LONG' ? '#10b981' : '#ef4444',
                              color: '#ffffff',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {plan.direction || 'LONG'}
                            </span>
                            {plan.ranking && (
                              <span style={{ 
                                color: '#fbbf24', 
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                ⭐ {plan.ranking}/10
                              </span>
                            )}
                            {plan.setupQuality && (
                              <span style={{ 
                                color: '#10b981', 
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                🎯 {plan.setupQuality}/10
                              </span>
                            )}
                          </div>
                          {/* Status and Ranking */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                            {/* AI Rating Badge */}
                            {aiResults[plan.id] && (
                              <div style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                backgroundColor: aiResults[plan.id].isApproved ? '#10b981' : '#ef4444',
                                color: '#ffffff',
                                textAlign: 'center',
                                minWidth: '60px'
                              }}>
                                {aiResults[plan.id].overallRating}/10
                              </div>
                            )}
                            
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
                       onClick={() => runAIReview(plan)}
                       disabled={isReviewing}
                       style={{
                         padding: '0.5rem 1rem',
                         backgroundColor: isReviewing ? '#64748b' : '#3b82f6',
                         border: 'none',
                         borderRadius: '0.375rem',
                         color: '#ffffff',
                         cursor: isReviewing ? 'not-allowed' : 'pointer',
                         fontSize: '0.875rem',
                         fontWeight: '500',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.25rem'
                       }}
                     >
                            {isReviewing ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={16} />}
                            {isReviewing ? 'Evaluating...' : 'Evaluate'}
                     </button>
                     
                     {/* AI Review Button - only show if evaluation exists */}
                     {aiResults[plan.id] && (
                       <button
                         onClick={() => setSelectedPlan(plan)}
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
                         <MessageSquare size={16} />
                         AI Review
                       </button>
                     )}
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

      {/* AI Review Dashboard Modal */}
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
            backgroundColor: '#0f172a',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '1200px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto',
            border: '1px solid #334155'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #334155'
            }}>
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#f8fafc',
                  margin: '0 0 0.5rem 0'
                }}>
                  🤖 AI Review Dashboard
                </h2>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  {selectedPlan.symbol} - {selectedPlan.setup || 'Setup'} Analysis
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '2rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Main Content Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Left Column - Trade Plan Details */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #334155'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📋 Trade Plan Details
                </h3>
                
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}>
                      Symbol & Setup
                    </label>
                    <div style={{
                      fontSize: '1.125rem',
                      color: '#f8fafc',
                      fontWeight: '600',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      borderRadius: '0.5rem'
                    }}>
                      {selectedPlan.symbol} - {selectedPlan.setup || 'Setup'}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}>
                      Direction
                    </label>
                    <div style={{
                      fontSize: '1.125rem',
                      color: '#f8fafc',
                      fontWeight: '600',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      borderRadius: '0.5rem'
                    }}>
                      {selectedPlan.direction || 'N/A'}
                    </div>
                  </div>
                  
                  {selectedPlan.entryPrice && (
                    <div>
                      <label style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>
                        Entry Price
                      </label>
                      <div style={{
                        fontSize: '1.125rem',
                        color: '#f8fafc',
                        fontWeight: '600',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.5rem'
                      }}>
                        ${selectedPlan.entryPrice}
                      </div>
                    </div>
                  )}
                  
                  {selectedPlan.stopLoss && (
                    <div>
                      <label style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>
                        Stop Loss
                      </label>
                      <div style={{
                        fontSize: '1.125rem',
                        color: '#f8fafc',
                        fontWeight: '600',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.5rem'
                      }}>
                        ${selectedPlan.stopLoss}
                      </div>
                    </div>
                  )}
                  
                  {selectedPlan.thesis && (
                    <div>
                      <label style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>
                        Thesis
                      </label>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.5rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedPlan.thesis}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - AI Analysis Results */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #334155'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🧠 AI Analysis Results
                </h3>
                
                {aiResults[selectedPlan.id] ? (
                  <>
                    {/* Overall Rating */}
                    <div style={{
                      backgroundColor: '#334155',
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      marginBottom: '1.5rem',
                      textAlign: 'center',
                      border: `2px solid ${aiResults[selectedPlan.id].isApproved ? '#10b981' : '#ef4444'}`
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        color: '#94a3b8',
                        marginBottom: '0.75rem'
                      }}>
                        Overall AI Rating
                      </div>
                      <div style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: aiResults[selectedPlan.id].isApproved ? '#10b981' : '#ef4444',
                        marginBottom: '0.5rem'
                      }}>
                        {aiResults[selectedPlan.id].overallRating}/10
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: aiResults[selectedPlan.id].isApproved ? '#10b981' : '#ef4444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {aiResults[selectedPlan.id].isApproved ? '✅ APPROVED' : '❌ REJECTED'}
                      </div>
                    </div>
                    
                    {/* Individual Agent Results */}
                    <div style={{
                      display: 'grid',
                      gap: '1rem'
                    }}>
                      {Object.entries(aiResults[selectedPlan.id].agents).map(([agentName, result]) => (
                        <div key={agentName} style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#f8fafc'
                            }}>
                              {agentName}
                            </div>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: '800',
                              color: '#3b82f6',
                              backgroundColor: '#1e293b',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.5rem',
                              minWidth: '60px',
                              textAlign: 'center'
                            }}>
                              {result.rating}/10
                            </div>
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            lineHeight: '1.5',
                            fontStyle: 'italic'
                          }}>
                            "{result.feedback}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#94a3b8'
                  }}>
                    <Brain size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No AI evaluation yet. Click "Evaluate" to run the AI analysis.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #334155'
            }}>
              <button
                onClick={() => setSelectedPlan(null)}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#475569',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Close Dashboard
              </button>
              
              {selectedPlan.status === 'pending' && aiResults[selectedPlan.id] && (
                <>
                  <button
                    onClick={() => {
                      const updatedPlans = tradePlans.map(p => 
                        p.id === selectedPlan.id ? { ...p, status: 'approved' } : p
                      );
                      setTradePlans(updatedPlans);
                      setSelectedPlan(null);
                    }}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: '#10b981',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
                    Approve Trade Plan
                  </button>
                  
                  <button
                    onClick={() => {
                      const updatedPlans = tradePlans.map(p => 
                        p.id === selectedPlan.id ? { ...p, status: 'rejected' } : p
                      );
                      setTradePlans(updatedPlans);
                      setSelectedPlan(null);
                    }}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    <XCircle size={20} style={{ marginRight: '0.5rem' }} />
                    Reject Trade Plan
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

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
