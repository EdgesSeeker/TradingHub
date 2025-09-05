import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  Edit3, 
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Target,
  RefreshCw,
  XCircle
} from 'lucide-react';
import storage from '../utils/storage';

const TradingRoutine = () => {
  const [routines, setRoutines] = useState({
    prePostMarket: [
      { id: 1, text: "Marktüberblick & News checken", completed: false },
      { id: 2, text: "Watchlist aktualisieren", completed: false },
      { id: 3, text: "PNL-Log & Spreadsheet-Update", completed: false },
      { id: 4, text: "Nightly Scan: Watchlist bauen", completed: false },
      { id: 5, text: "Triggers setzen", completed: false }
    ],
    duringSession: [
      { id: 1, text: "Live-Monitoring der Positionen", completed: false },
      { id: 2, text: "Trigger ausführen", completed: false },
      { id: 3, text: "Risk Management prüfen", completed: false },
      { id: 4, text: "Trade-Entscheidungen dokumentieren", completed: false },
      { id: 5, text: "Marktbewegungen analysieren", completed: false }
    ]
  });

  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [stats, setStats] = useState({
    prePostMarket: { completed: 0, total: 0, streak: 0 },
    duringSession: { completed: 0, total: 0, streak: 0 }
  });
  const [dailyLog, setDailyLog] = useState([]);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRoutines = await storage.loadSetting('tradingRoutines');
        const savedStats = await storage.loadSetting('tradingRoutineStats');
        const savedDailyLog = await storage.loadSetting('tradingRoutineDailyLog');
        
        if (savedRoutines) {
          setRoutines(savedRoutines);
        }
        
        if (savedStats) {
          setStats(savedStats);
        }

        if (savedDailyLog) {
          setDailyLog(savedDailyLog);
        }

        // Check if today is already completed
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = savedDailyLog?.find(entry => entry.date === today);
        setTodayCompleted(!!todayEntry?.completed);
    } catch (error) {
        console.error('Error loading trading routine data:', error);
      }
    };
    
    loadData();
  }, []);

  // Manual save function - only saves when button is clicked
  const saveData = async () => {
    try {
      await storage.saveSetting('tradingRoutines', routines);
      await storage.saveSetting('tradingRoutineStats', stats);
      await storage.saveSetting('tradingRoutineDailyLog', dailyLog);
      alert('✅ Routine erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving trading routines:', error);
      alert('❌ Fehler beim Speichern! Bitte versuche es erneut.');
    }
  };

  // Auto-save disabled - only manual save via button

  // Calculate stats
  useEffect(() => {
    const newStats = {
      prePostMarket: {
        completed: routines.prePostMarket.filter(item => item.completed).length,
        total: routines.prePostMarket.length,
        streak: stats.prePostMarket.streak
      },
      duringSession: {
        completed: routines.duringSession.filter(item => item.completed).length,
        total: routines.duringSession.length,
        streak: stats.duringSession.streak
      }
    };
    setStats(newStats);
  }, [routines]);

  const toggleTask = (routineType, itemId) => {
    setRoutines(prev => ({
      ...prev,
      [routineType]: prev[routineType].map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const startEditing = (routineType, item) => {
    setEditingItem({ routineType, id: item.id });
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    
    setRoutines(prev => ({
      ...prev,
      [editingItem.routineType]: prev[editingItem.routineType].map(item =>
        item.id === editingItem.id ? { ...item, text: editingText } : item
      )
    }));
    
    setEditingItem(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingText('');
  };

  const addTask = (routineType) => {
    const newId = Math.max(...routines[routineType].map(item => item.id), 0) + 1;
    const newTask = {
      id: newId,
      text: "Neue Aufgabe",
      completed: false
    };
    
    setRoutines(prev => ({
      ...prev,
      [routineType]: [...prev[routineType], newTask]
    }));
    
    // Start editing the new task
    setEditingItem({ routineType, id: newId });
    setEditingText("Neue Aufgabe");
  };

  const deleteTask = (routineType, itemId) => {
    setRoutines(prev => ({
      ...prev,
      [routineType]: prev[routineType].filter(item => item.id !== itemId)
    }));
  };

  const resetDaily = () => {
    setRoutines(prev => ({
      prePostMarket: prev.prePostMarket.map(item => ({ ...item, completed: false })),
      duringSession: prev.duringSession.map(item => ({ ...item, completed: false }))
    }));
  };

  // Restore default routines if lost
  const restoreDefaults = () => {
    if (window.confirm('Möchtest du die Standard-Routine wiederherstellen? Dies überschreibt deine aktuellen Einstellungen.')) {
      const defaultRoutines = {
        prePostMarket: [
          { id: 1, text: "Marktüberblick & News checken", completed: false },
          { id: 2, text: "Watchlist aktualisieren", completed: false },
          { id: 3, text: "PNL-Log & Spreadsheet-Update", completed: false },
          { id: 4, text: "Nightly Scan: Watchlist bauen", completed: false },
          { id: 5, text: "Triggers setzen", completed: false }
        ],
        duringSession: [
          { id: 1, text: "Live-Monitoring der Positionen", completed: false },
          { id: 2, text: "Trigger ausführen", completed: false },
          { id: 3, text: "Risk Management prüfen", completed: false },
          { id: 4, text: "Trade-Entscheidungen dokumentieren", completed: false },
          { id: 5, text: "Marktbewegungen analysieren", completed: false }
        ]
      };
      setRoutines(defaultRoutines);
      alert('✅ Standard-Routine wiederhergestellt! Vergiss nicht zu speichern.');
    }
  };

  // Mark today as completed
  const markTodayCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = {
      date: today,
      completed: true,
      timestamp: new Date().toISOString(),
      prePostMarketCompleted: stats.prePostMarket.completed,
      duringSessionCompleted: stats.duringSession.completed
    };

    const updatedLog = dailyLog.filter(entry => entry.date !== today);
    updatedLog.push(todayEntry);
    updatedLog.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    setDailyLog(updatedLog);
    setTodayCompleted(true);
    saveData();
  };

  // Mark today as not completed
  const markTodayNotCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedLog = dailyLog.filter(entry => entry.date !== today);
    setDailyLog(updatedLog);
    setTodayCompleted(false);
    saveData();
  };

  // Get streak statistics
  const getStreakStats = () => {
    const sortedLog = [...dailyLog].sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCompleted = 0;

    for (let i = 0; i < sortedLog.length; i++) {
      if (sortedLog[i].completed) {
        totalCompleted++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // Count current streak from today backwards
        if (i === 0 || (i > 0 && sortedLog[i-1].completed)) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        if (i === 0) currentStreak = 0; // If today is not completed, streak is 0
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalCompleted,
      totalDays: sortedLog.length
    };
  };

  const getMotivationMessage = (completed, total) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    if (percentage === 100) {
      return "🎉 Perfekt! Alle Aufgaben erledigt!";
    } else if (percentage >= 80) {
      return "🔥 Fast geschafft! Weiter so!";
    } else if (percentage >= 60) {
      return "💪 Gut dabei! Bleib dran!";
    } else if (percentage >= 40) {
      return "📈 Auf dem richtigen Weg!";
    } else if (percentage > 0) {
      return "🚀 Erste Schritte gemacht!";
    } else {
      return "⏰ Zeit zu starten!";
    }
  };

  const getProgressColor = (completed, total) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    if (percentage === 100) return '#10b981'; // Green
    if (percentage >= 80) return '#059669'; // Dark green
    if (percentage >= 60) return '#0d9488'; // Teal
    if (percentage >= 40) return '#0891b2'; // Cyan
    if (percentage > 0) return '#0284c7'; // Blue
    return '#64748b'; // Gray
  };

  const streakStats = getStreakStats();

      return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
              Trading Routine
            </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            marginBottom: '2rem'
          }}>
            Deine tägliche Trading-Routine für mehr Erfolg
          </p>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
          <button
              onClick={saveData}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#10b981';
            }}
          >
            <Save size={16} />
              Speichern
          </button>
            
        <button
              onClick={resetDaily}
          style={{
                backgroundColor: '#1e293b',
                  color: '#f8fafc',
                border: '1px solid #334155',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
            cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#334155';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#1e293b';
              }}
            >
              <Calendar size={16} />
              Tages-Reset
        </button>

        <button
              onClick={restoreDefaults}
          style={{
                backgroundColor: '#f59e0b',
            color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
            cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#d97706';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
              }}
            >
              <RefreshCw size={16} />
              Wiederherstellen
        </button>
      </div>
        </div>

        {/* Daily Completion Log */}
    <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #334155',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
      color: '#f8fafc',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            📅 Tägliche Routine - {new Date().toLocaleDateString('de-DE')}
          </h3>
          
        <div style={{
          display: 'flex',
            justifyContent: 'center',
          alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '1rem',
                color: '#94a3b8'
              }}>
                Heute abgeschlossen:
              </span>
              {todayCompleted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#065f46',
                  borderRadius: '1rem',
                  border: '1px solid #10b981'
              }}>
                <CheckCircle size={20} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: '600' }}>JA</span>
              </div>
              ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                  backgroundColor: '#7f1d1d',
                  borderRadius: '1rem',
                  border: '1px solid #ef4444'
                }}>
                  <XCircle size={20} color="#ef4444" />
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>NEIN</span>
              </div>
              )}
            </div>
            
            <div style={{
                  display: 'flex',
              gap: '1rem'
            }}>
              {!todayCompleted ? (
                <button
                  onClick={markTodayCompleted}
                    style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                      cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  <CheckCircle size={16} />
                  Als erledigt markieren
                </button>
              ) : (
                <button
                  onClick={markTodayNotCompleted}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  <XCircle size={16} />
                  Als nicht erledigt markieren
                </button>
              )}
            </div>
          </div>

          {/* Streak Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #475569',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#f59e0b',
                marginBottom: '0.5rem'
              }}>
                {streakStats.currentStreak}
                </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Aktuelle Serie
              </div>
            </div>
              
              <div style={{
              backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #475569',
              textAlign: 'center'
              }}>
                <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#8b5cf6',
                marginBottom: '0.5rem'
              }}>
                {streakStats.longestStreak}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Längste Serie
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #475569',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#10b981',
                marginBottom: '0.5rem'
              }}>
                {streakStats.totalCompleted}
                </div>
                <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Tage erledigt
              </div>
            </div>
            
            <div style={{
                  backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #475569',
              textAlign: 'center'
                }}>
                  <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {streakStats.totalDays > 0 ? Math.round((streakStats.totalCompleted / streakStats.totalDays) * 100) : 0}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Erfolgsrate
              </div>
            </div>
          </div>

          {/* Recent Log */}
          {dailyLog.length > 0 && (
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                📊 Letzte 7 Tage
              </h4>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {dailyLog.slice(0, 7).map((entry, index) => (
                  <div
                    key={entry.date}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      backgroundColor: entry.completed ? '#065f46' : '#7f1d1d',
                      borderRadius: '0.5rem',
                      border: `1px solid ${entry.completed ? '#10b981' : '#ef4444'}`,
                      minWidth: '80px'
                    }}
                  >
                    <div style={{
                      fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: '500'
                }}>
                      {new Date(entry.date).toLocaleDateString('de-DE', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                </div>
                    <div style={{
                      fontSize: '1.25rem'
                    }}>
                      {entry.completed ? (
                        <CheckCircle size={20} color="#10b981" />
                      ) : (
                        <XCircle size={20} color="#ef4444" />
                      )}
              </div>
            </div>
                ))}
              </div>
            </div>
          )}
          </div>
          
        {/* Routine Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Pre- and Post-Market Routine */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #334155',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
                }}>
                <Clock size={20} />
                Pre- & Post-Market Routine
                </h2>
              <button
                onClick={() => addTask('prePostMarket')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {routines.prePostMarket.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: item.completed ? '#065f46' : '#334155',
                  borderRadius: '0.5rem',
                    border: item.completed ? '1px solid #10b981' : '1px solid #475569',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => toggleTask('prePostMarket', item.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: item.completed ? '#10b981' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <CheckCircle size={20} />
                  </button>
                  
                  {editingItem?.routineType === 'prePostMarket' && editingItem?.id === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          border: '1px solid #475569',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{
                        flex: 1,
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? '#10b981' : '#f8fafc',
                        fontSize: '0.875rem'
                      }}>
                        {item.text}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => startEditing('prePostMarket', item)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '0.25rem'
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTask('prePostMarket', item.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* During-Session Routine */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #334155',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
                }}>
                <Target size={20} />
                During-Session Routine
                </h2>
              <button
                onClick={() => addTask('duringSession')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {routines.duringSession.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: item.completed ? '#065f46' : '#334155',
                  borderRadius: '0.5rem',
                    border: item.completed ? '1px solid #10b981' : '1px solid #475569',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => toggleTask('duringSession', item.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: item.completed ? '#10b981' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <CheckCircle size={20} />
                  </button>
                  
                  {editingItem?.routineType === 'duringSession' && editingItem?.id === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          border: '1px solid #475569',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{
                        flex: 1,
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? '#10b981' : '#f8fafc',
                        fontSize: '0.875rem'
                      }}>
                        {item.text}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => startEditing('duringSession', item)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '0.25rem'
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTask('duringSession', item.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Motivation Status Bar */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            📊 Dein Fortschritt heute
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
          }}>
            {/* Pre-Post Market Progress */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Pre- & Post-Market
                </span>
                <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: '500' }}>
                  {stats.prePostMarket.completed}/{stats.prePostMarket.total}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: `${stats.prePostMarket.total > 0 ? (stats.prePostMarket.completed / stats.prePostMarket.total) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(stats.prePostMarket.completed, stats.prePostMarket.total),
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#10b981',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {getMotivationMessage(stats.prePostMarket.completed, stats.prePostMarket.total)}
              </p>
            </div>

            {/* During Session Progress */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  During Session
                </span>
                <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: '500' }}>
                  {stats.duringSession.completed}/{stats.duringSession.total}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: `${stats.duringSession.total > 0 ? (stats.duringSession.completed / stats.duringSession.total) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(stats.duringSession.completed, stats.duringSession.total),
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#10b981',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {getMotivationMessage(stats.duringSession.completed, stats.duringSession.total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingRoutine;