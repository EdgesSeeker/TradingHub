import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Target, Shield, RefreshCw, Zap, FileText } from 'lucide-react';

const BigDayResetChecklist = () => {
  const [completedItems, setCompletedItems] = useState(new Set());

  const checklistSections = [
    {
      id: 'immediate-debrief',
      title: 'Immediate Debrief (Same Day)',
      icon: <FileText size={16} />,
      items: [
        'Write full retrospective (capture why the day worked)',
        'Note any luck/froth elements so you don\'t internalize them as skill',
        'Tag themes to carry forward'
      ]
    },
    {
      id: 'next-day-guardrails',
      title: 'Next-Day Guardrails',
      icon: <Shield size={16} />,
      items: [
        'Half-size rule → all new trades capped at 50% normal size for 1-2 days',
        'No pressing coupons. Cannot size monster positions immediately after a big day',
        'Accept if yesterday\'s winners run further — no revenge or FOMO trades'
      ]
    },
    {
      id: 'mindset-reset',
      title: 'Mindset Reset',
      icon: <RefreshCw size={16} />,
      items: [
        'Evening activity away from markets (workout, dinner, family, outdoors)',
        'Morning check: "Do I feel euphoric, fearful, or neutral?" Trade only if neutral',
        'Remind myself: "One big day ≠ permission to loosen discipline"'
      ]
    },
    {
      id: 'portfolio-check',
      title: 'Portfolio Check',
      icon: <Target size={16} />,
      items: [
        'Review current positions → trim down to comfort size',
        'Ask: "If this dropped 10-15% tomorrow, would I stay unemotional?" If not → reduce',
        'Confirm total exposure aligns with process, not P&L greed'
      ]
    },
    {
      id: 'reframe-win',
      title: 'Reframe the Win',
      icon: <CheckCircle size={16} />,
      items: [
        'Treat the day as **proof of process**, not a lotto ticket',
        'Anchor back to: scanning → journaling → catalysts → execution',
        'Remember: the next few weeks are about protecting the base, not swinging harder'
      ]
    },
    {
      id: 'cool-off-window',
      title: 'Cool-Off Window',
      icon: <AlertTriangle size={16} />,
      items: [
        '1-week no-press rule → pressing coupon locked',
        'Default back to singles/doubles until the next true asymmetric setup emerges'
      ]
    }
  ];

  const goldenRule = {
    title: 'Golden Rule',
    content: 'After a monster day, my only job is to return to **neutral**. Protect gains, reset sizing, and prove discipline — not repeat fireworks tomorrow.',
    icon: <Zap size={20} />
  };

  const toggleItem = (sectionId, itemIndex) => {
    const itemId = `${sectionId}-${itemIndex}`;
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getTotalItems = () => {
    return checklistSections.reduce((total, section) => total + section.items.length, 0);
  };

  const getCompletedCount = () => {
    return completedItems.size;
  };

  const getCompletionPercentage = () => {
    const total = getTotalItems();
    return total > 0 ? Math.round((getCompletedCount() / total) * 100) : 0;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getStatusText = (percentage) => {
    if (percentage >= 80) return '✅ Reset Complete';
    if (percentage >= 60) return '⚠️ Almost There';
    return '❌ Reset Needed';
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1400px',
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
              <Target size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Big Day Reset Checklist
            </h1>
          </div>
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Essential checklist to reset after a big trading day
          </p>
        </div>

        {/* Progress Overview */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #334155',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: 0,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Target size={20} />
                Reset Progress
              </h3>
            </div>
            
            {/* Progress Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: getStatusColor(getCompletionPercentage()) + '20',
                border: `1px solid ${getStatusColor(getCompletionPercentage())}`,
                borderRadius: '0.375rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: getStatusColor(getCompletionPercentage())
                }}>
                  {getStatusText(getCompletionPercentage())}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8'
                }}>
                  {getCompletedCount()}/{getTotalItems()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#334155',
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
                Completion Progress
              </span>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: getStatusColor(getCompletionPercentage())
              }}>
                {getCompletionPercentage()}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#1e293b',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${getCompletionPercentage()}%`,
                height: '100%',
                backgroundColor: getStatusColor(getCompletionPercentage()),
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Checklist Sections */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {checklistSections.map((section, sectionIndex) => (
            <div key={section.id} style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {section.icon}
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  margin: 0,
                  color: '#f8fafc'
                }}>
                  {sectionIndex + 1}. {section.title}
                </h4>
              </div>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {section.items.map((item, itemIndex) => {
                  const itemId = `${section.id}-${itemIndex}`;
                  const isCompleted = completedItems.has(itemId);
                  
                  return (
                    <label key={itemIndex} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#f8fafc',
                      padding: '0.75rem',
                      backgroundColor: isCompleted ? '#10b98120' : 'transparent',
                      borderRadius: '0.375rem',
                      border: isCompleted ? '1px solid #10b981' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleItem(section.id, itemIndex)}
                        style={{
                          width: '1.125rem',
                          height: '1.125rem',
                          accentColor: '#3b82f6',
                          marginTop: '0.125rem',
                          flexShrink: 0
                        }}
                      />
                      <span style={{
                        lineHeight: '1.5',
                        flex: 1,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.7 : 1
                      }}>
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Golden Rule */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#fbbf2420',
          border: '2px solid #fbbf24',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{
            color: '#fbbf24',
            marginTop: '0.125rem',
            flexShrink: 0
          }}>
            {goldenRule.icon}
          </div>
          <div>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              margin: '0 0 0.75rem 0',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚡ {goldenRule.title}
            </h4>
            <p style={{
              fontSize: '1rem',
              color: '#f8fafc',
              margin: 0,
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {goldenRule.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BigDayResetChecklist;





