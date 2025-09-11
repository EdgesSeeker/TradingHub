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
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import storage from '../utils/storage';

const TradingRoutine = ({ onNavigate }) => {
  const [routines, setRoutines] = useState({
    prePostMarket: [
      { id: 1, text: "Enter Portfolio Value and Cash Balance", completed: false, navigateTo: "trading-equity-curve" },
      { id: 2, text: "Logging Trades", completed: false, navigateTo: "trade-entry" },
      { id: 3, text: "Run Scans", completed: false, navigateTo: null },
      { id: 4, text: "Check Open Positions", completed: false, navigateTo: null },
      { id: 5, text: "Enter Trades in Trade Planning", completed: false, navigateTo: "trade-planning" },
      { id: 6, text: "Run AI Agents", completed: false, navigateTo: "ai-agents" }
    ],
    duringSession: [
      { id: 1, text: "Live-Monitoring der Positionen", completed: false, navigateTo: null },
      { id: 2, text: "Trigger ausführen", completed: false, navigateTo: null },
      { id: 3, text: "Risk Management prüfen", completed: false, navigateTo: null },
      { id: 4, text: "Trade-Entscheidungen dokumentieren", completed: false, navigateTo: null },
      { id: 5, text: "Marktbewegungen analysieren", completed: false, navigateTo: null }
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
  const [dailyCompletions, setDailyCompletions] = useState({});
  const [completedDays, setCompletedDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRoutines = await storage.loadSetting('tradingRoutines');
        const savedStats = await storage.loadSetting('tradingRoutineStats');
        const savedDailyLog = await storage.loadSetting('tradingRoutineDailyLog');
        const savedDailyCompletions = await storage.loadSetting('tradingRoutineDailyCompletions') || {};
        const savedCompletedDays = await storage.loadSetting('tradingRoutineCompletedDays') || [];
        
        if (savedRoutines && savedRoutines.prePostMarket && savedRoutines.duringSession) {
          console.log('✅ Loaded saved routines from storage');
          
          // Check if routines need to be updated with navigateTo property
          const needsUpdate = savedRoutines.prePostMarket.some(item => !item.hasOwnProperty('navigateTo'));
          
          if (needsUpdate) {
            console.log('🔄 Updating routines with navigation properties');
                const updatedRoutines = {
                  prePostMarket: savedRoutines.prePostMarket.map(item => {
                    // Map items by ID to ensure correct navigation
                    const navigationByID = {
                      1: "trading-equity-curve", // Enter Portfolio Value and Cash Balance
                      2: "trade-entry",          // Logging Trades
                      3: null,                   // Run Scans
                      4: null,                   // Check Open Positions
                      5: "trade-planning",       // Enter Trades in Trade Planning
                      6: "ai-agents"             // Run AI Agents
                    };
                    
                    return {
                      ...item,
                      navigateTo: navigationByID[item.id] || null
                    };
                  }),
              duringSession: savedRoutines.duringSession.map(item => ({
                ...item,
                navigateTo: null
              }))
            };
            
            setRoutines(updatedRoutines);
            await storage.saveSetting('tradingRoutines', updatedRoutines);
            console.log('✅ Updated routines with navigation properties');
          } else {
          setRoutines(savedRoutines);
          }
        } else {
          console.log('📝 No saved routines found, using defaults and saving them');
          // Save the default routines to storage
          const defaultRoutines = {
            prePostMarket: [
              { id: 1, text: "Enter Portfolio Value and Cash Balance", completed: false, navigateTo: "trading-equity-curve" },
              { id: 2, text: "Logging Trades", completed: false, navigateTo: "trade-entry" },
              { id: 3, text: "Run Scans", completed: false, navigateTo: null },
              { id: 4, text: "Check Open Positions", completed: false, navigateTo: null },
              { id: 5, text: "Enter Trades in Trade Planning", completed: false, navigateTo: "trade-planning" },
              { id: 6, text: "Run AI Agents", completed: false, navigateTo: "ai-agents" }
            ],
            duringSession: [
              { id: 1, text: "Live-Monitoring der Positionen", completed: false, navigateTo: null },
              { id: 2, text: "Trigger ausführen", completed: false, navigateTo: null },
              { id: 3, text: "Risk Management prüfen", completed: false, navigateTo: null },
              { id: 4, text: "Trade-Entscheidungen dokumentieren", completed: false, navigateTo: null },
              { id: 5, text: "Marktbewegungen analysieren", completed: false, navigateTo: null }
            ]
          };
          await storage.saveSetting('tradingRoutines', defaultRoutines);
          setRoutines(defaultRoutines);
        }
        
        if (savedStats) {
          setStats(savedStats);
        }

        if (savedDailyLog) {
          setDailyLog(savedDailyLog);
        }

        setDailyCompletions(savedDailyCompletions);
        setCompletedDays(savedCompletedDays);

        // Load today's completions immediately after setting dailyCompletions
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayCompletions = savedDailyCompletions[todayString] || {};
        
        console.log('📅 Loading today\'s completions for:', todayString);
        console.log('📅 Today\'s completions:', todayCompletions);
        
        if (todayCompletions.prePostMarket || todayCompletions.duringSession) {
          console.log('🔄 Applying today\'s completions to routines');
          setRoutines(prev => {
            const updated = { ...prev };
            
            // Update prePostMarket completions
            if (todayCompletions.prePostMarket) {
              updated.prePostMarket = prev.prePostMarket.map(item => ({
                ...item,
                completed: todayCompletions.prePostMarket[item.id] || false
              }));
            }
            
            // Update duringSession completions
            if (todayCompletions.duringSession) {
              updated.duringSession = prev.duringSession.map(item => ({
                ...item,
                completed: todayCompletions.duringSession[item.id] || false
              }));
            }
            
            console.log('✅ Updated routines with today\'s completions:', updated);
            return updated;
          });
        } else {
          console.log('ℹ️ No completions found for today, using default state');
        }

        // Check if today is already completed based on daily completions
        const isTodayCompleted = todayCompletions && 
          Object.keys(todayCompletions.prePostMarket || {}).length > 0 && 
          Object.keys(todayCompletions.duringSession || {}).length > 0;
        
        // Also check old daily log for backward compatibility
        const todayEntry = savedDailyLog?.find(entry => entry.date === todayString);
        const isTodayCompletedOld = !!todayEntry?.completed;
        
        setTodayCompleted(isTodayCompleted || isTodayCompletedOld);
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

    
  // Auto-save when routines change
  useEffect(() => {
      const autoSave = async () => {
        try {
          await storage.saveSetting('tradingRoutines', routines);
          console.log('✅ Auto-saved trading routines');
        } catch (error) {
          console.error('Error auto-saving trading routines:', error);
        }
      };
      
    // Only auto-save if routines are not empty (avoid saving on initial load)
    if (routines.prePostMarket.length > 0 || routines.duringSession.length > 0) {
      autoSave();
    }
  }, [routines]);

  // Calculate stats and check if today is fully completed
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

    // Check if today is fully completed
    const today = new Date().toISOString().split('T')[0];
    const totalTasks = routines.prePostMarket.length + routines.duringSession.length;
    const completedTasks = routines.prePostMarket.filter(item => item.completed).length + 
                          routines.duringSession.filter(item => item.completed).length;
    
    if (totalTasks > 0 && completedTasks === totalTasks) {
      // Mark today as completed
      setCompletedDays(prev => {
        if (!prev.includes(today)) {
          const updated = [...prev, today].sort().reverse();
          
          // Auto-save completed days
          (async () => {
            try {
              await storage.saveSetting('tradingRoutineCompletedDays', updated);
              console.log('✅ Auto-saved completed day');
            } catch (error) {
              console.error('Error auto-saving completed day:', error);
            }
          })();
          
          return updated;
        }
        return prev;
      });
    }
  }, [routines]);

  const toggleTask = (routineType, itemId) => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('🔄 Toggling task:', { routineType, itemId, today: todayString });
    
    setRoutines(prev => {
      const updated = {
      ...prev,
      [routineType]: prev[routineType].map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
      };
      console.log('📝 Updated routines state:', updated);
      return updated;
    });

    // Update daily completions
    setDailyCompletions(prev => {
      const newCompletionStatus = !prev[todayString]?.[routineType]?.[itemId];
      const updated = {
        ...prev,
        [todayString]: {
          ...prev[todayString],
          [routineType]: {
            ...prev[todayString]?.[routineType],
            [itemId]: newCompletionStatus
          }
        }
      };
      
      console.log('💾 Updated daily completions:', updated);
      
      // Auto-save daily completions
      (async () => {
        try {
          await storage.saveSetting('tradingRoutineDailyCompletions', updated);
          console.log('✅ Auto-saved daily completion for', todayString, ':', newCompletionStatus);
        } catch (error) {
          console.error('Error auto-saving daily completion:', error);
        }
      })();
      
      return updated;
    });
  };

  const handleTaskClick = (routineType, item) => {
    // First toggle the completion status
    toggleTask(routineType, item.id);
    
    // If the item has a navigation target, navigate to it after a short delay
    if (item.navigateTo && onNavigate) {
      setTimeout(() => {
        onNavigate(item.navigateTo);
      }, 200); // Give time for state to update
    }
  };

  const startEditing = (routineType, item) => {
    setEditingItem({ routineType, id: item.id });
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    
    setRoutines(prev => {
      const updated = {
      ...prev,
      [editingItem.routineType]: prev[editingItem.routineType].map(item =>
        item.id === editingItem.id ? { ...item, text: editingText } : item
      )
      };
      
      
      return updated;
    });
    
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
      completed: false,
      navigateTo: null
    };
    
    setRoutines(prev => {
      const updated = {
      ...prev,
      [routineType]: [...prev[routineType], newTask]
      };
      
      
      return updated;
    });
    
    // Start editing the new task
    setEditingItem({ routineType, id: newId });
    setEditingText("Neue Aufgabe");
  };

  const deleteTask = (routineType, itemId) => {
    setRoutines(prev => {
      const updated = {
      ...prev,
      [routineType]: prev[routineType].filter(item => item.id !== itemId)
      };
      
      
      return updated;
    });
  };

  const resetDaily = async () => {
    if (window.confirm('Möchtest du wirklich den Tages-Reset durchführen? Alle Aufgaben werden auf "nicht erledigt" gesetzt.')) {
      const resetRoutines = {
        prePostMarket: routines.prePostMarket.map(item => ({ ...item, completed: false })),
        duringSession: routines.duringSession.map(item => ({ ...item, completed: false }))
      };
      
      setRoutines(resetRoutines);
      
      // Automatisch speichern nach dem Reset
      try {
        await storage.saveSetting('tradingRoutines', resetRoutines);
        alert('✅ Tages-Reset durchgeführt und automatisch gespeichert!');
      } catch (error) {
        console.error('Error saving after reset:', error);
        alert('❌ Reset durchgeführt, aber Fehler beim Speichern! Bitte manuell speichern.');
      }
    }
  };

  // Restore default routines if lost
  const restoreDefaults = () => {
    if (window.confirm('Möchtest du die Standard-Routine wiederherstellen? Dies überschreibt deine aktuellen Einstellungen.')) {
      const defaultRoutines = {
        prePostMarket: [
          { id: 1, text: "Enter Portfolio Value and Cash Balance", completed: false, navigateTo: "trading-equity-curve" },
          { id: 2, text: "Logging Trades", completed: false, navigateTo: "trade-entry" },
          { id: 3, text: "Run Scans", completed: false, navigateTo: null },
          { id: 4, text: "Check Open Positions", completed: false, navigateTo: null },
          { id: 5, text: "Enter Trades in Trade Planning", completed: false, navigateTo: "trade-planning" },
          { id: 6, text: "Run AI Agents", completed: false, navigateTo: "ai-agents" }
        ],
        duringSession: [
          { id: 1, text: "Live-Monitoring der Positionen", completed: false, navigateTo: null },
          { id: 2, text: "Trigger ausführen", completed: false, navigateTo: null },
          { id: 3, text: "Risk Management prüfen", completed: false, navigateTo: null },
          { id: 4, text: "Trade-Entscheidungen dokumentieren", completed: false, navigateTo: null },
          { id: 5, text: "Marktbewegungen analysieren", completed: false, navigateTo: null }
        ]
      };
      setRoutines(defaultRoutines);
      alert('✅ Standard-Routine wiederhergestellt! Vergiss nicht zu speichern.');
    }
  };

  // Mark today as completed
  const markTodayCompleted = async () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('🎯 Marking today as completed:', todayString);
    
    // Create today's completions based on current routine state
    const todayCompletions = {
      prePostMarket: {},
      duringSession: {}
    };
    
    // Mark all prePostMarket items as completed
    routines.prePostMarket.forEach(item => {
      todayCompletions.prePostMarket[item.id] = true;
    });
    
    // Mark all duringSession items as completed
    routines.duringSession.forEach(item => {
      todayCompletions.duringSession[item.id] = true;
    });
    
    // Update daily completions
    setDailyCompletions(prev => {
      const updated = {
        ...prev,
        [todayString]: todayCompletions
      };
      
      // Auto-save daily completions
      (async () => {
        try {
          await storage.saveSetting('tradingRoutineDailyCompletions', updated);
          console.log('✅ Auto-saved today\'s completions:', todayCompletions);
        } catch (error) {
          console.error('Error auto-saving today\'s completions:', error);
        }
      })();
      
      return updated;
    });
    
    // Update completed days
    setCompletedDays(prev => {
      if (!prev.includes(todayString)) {
        const updated = [...prev, todayString].sort().reverse();
        
        // Auto-save completed days
        (async () => {
          try {
            await storage.saveSetting('tradingRoutineCompletedDays', updated);
            console.log('✅ Auto-saved completed day:', todayString);
          } catch (error) {
            console.error('Error auto-saving completed day:', error);
          }
        })();
        
        return updated;
      }
      return prev;
    });
    
    // Update today's completion status
    setTodayCompleted(true);
    
    // Also update the old daily log for backward compatibility
    const todayEntry = {
      date: todayString,
      completed: true,
      timestamp: new Date().toISOString(),
      prePostMarketCompleted: stats.prePostMarket.completed,
      duringSessionCompleted: stats.duringSession.completed
    };

    const updatedLog = dailyLog.filter(entry => entry.date !== todayString);
    updatedLog.push(todayEntry);
    updatedLog.sort((a, b) => new Date(b.date) - new Date(a.date));

    setDailyLog(updatedLog);
    
    // Save the daily log
    try {
      await storage.saveSetting('tradingRoutineDailyLog', updatedLog);
      console.log('✅ Auto-saved daily log');
    } catch (error) {
      console.error('Error auto-saving daily log:', error);
    }
  };

  // Mark today as not completed
  const markTodayNotCompleted = async () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('❌ Marking today as not completed:', todayString);
    
    // Remove today from daily completions
    setDailyCompletions(prev => {
      const updated = { ...prev };
      delete updated[todayString];
      
      // Auto-save daily completions
      (async () => {
        try {
          await storage.saveSetting('tradingRoutineDailyCompletions', updated);
          console.log('✅ Removed today\'s completions');
        } catch (error) {
          console.error('Error auto-saving daily completions:', error);
        }
      })();
      
      return updated;
    });
    
    // Remove today from completed days
    setCompletedDays(prev => {
      const updated = prev.filter(date => date !== todayString);
      
      // Auto-save completed days
      (async () => {
        try {
          await storage.saveSetting('tradingRoutineCompletedDays', updated);
          console.log('✅ Removed today from completed days');
        } catch (error) {
          console.error('Error auto-saving completed days:', error);
        }
      })();
      
      return updated;
    });
    
    // Update today's completion status
    setTodayCompleted(false);
    
    // Also update the old daily log for backward compatibility
    const updatedLog = dailyLog.filter(entry => entry.date !== todayString);
    setDailyLog(updatedLog);
    
    // Save the daily log
    try {
      await storage.saveSetting('tradingRoutineDailyLog', updatedLog);
      console.log('✅ Auto-saved daily log');
    } catch (error) {
      console.error('Error auto-saving daily log:', error);
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDayCompleted = (date) => {
    // Use local date string instead of ISO to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('🔍 Checking if day is completed:', { dateString, completedDays });
    return completedDays.includes(dateString);
  };

  const isToday = (date) => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    const checkYear = date.getFullYear();
    const checkMonth = date.getMonth();
    const checkDate = date.getDate();
    
    const isTodayResult = todayYear === checkYear && todayMonth === checkMonth && todayDate === checkDate;
    console.log('🔍 Checking if is today:', { 
      today: `${todayYear}-${todayMonth + 1}-${todayDate}`, 
      check: `${checkYear}-${checkMonth + 1}-${checkDate}`,
      result: isTodayResult 
    });
    
    return isTodayResult;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  const getDayName = (dayIndex) => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[dayIndex];
  };

  // Restore yesterday's progress if accidentally lost
  const restoreYesterdayProgress = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayEntry = dailyLog.find(entry => entry.date === yesterdayStr);
    
    if (yesterdayEntry && yesterdayEntry.completed) {
      if (window.confirm(`Möchtest du den Fortschritt von gestern (${yesterday.toLocaleDateString('de-DE')}) wiederherstellen?`)) {
        // Restore the routine completion state from yesterday
        const restoredRoutines = {
          prePostMarket: routines.prePostMarket.map((item, index) => ({
            ...item,
            completed: index < yesterdayEntry.prePostMarketCompleted
          })),
          duringSession: routines.duringSession.map((item, index) => ({
            ...item,
            completed: index < yesterdayEntry.duringSessionCompleted
          }))
        };
        
        setRoutines(restoredRoutines);
        alert('✅ Gestern Fortschritt wiederhergestellt! Vergiss nicht zu speichern.');
      }
    } else {
      alert('❌ Kein Fortschritt von gestern gefunden oder gestern nicht abgeschlossen.');
    }
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
          marginBottom: '2rem'
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
            marginBottom: '0'
          }}>
            Deine tägliche Trading-Routine für mehr Erfolg
          </p>
        </div>

        {/* Routine Boxes - Moved to top */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
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
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick('prePostMarket', item);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                cursor: 'pointer',
                      color: item.completed ? '#10b981' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                transition: 'all 0.2s'
              }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <CheckCircle size={20} />
                  </div>
                  
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
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {item.text}
                        {item.navigateTo && (
                          <ExternalLink size={14} style={{ color: '#3b82f6' }} />
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing('prePostMarket', item);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask('prePostMarket', item.id);
                          }}
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
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick('duringSession', item);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
            cursor: 'pointer',
                      color: item.completed ? '#10b981' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                transition: 'all 0.2s'
              }}
                    onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#334155';
              }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <CheckCircle size={20} />
                  </div>
                  
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
                fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {item.text}
                        {item.navigateTo && (
                          <ExternalLink size={14} style={{ color: '#3b82f6' }} />
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing('duringSession', item);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask('duringSession', item.id);
                          }}
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

        {/* Routine Completion Status */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {todayCompleted ? (
              <button
                onClick={markTodayNotCompleted}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                <CheckCircle size={20} />
                Routine Abgeschlossen
              </button>
            ) : (
              <button
                onClick={markTodayCompleted}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                <XCircle size={20} />
                Routine nicht abgeschlossen
              </button>
            )}
          </div>
        </div>

        {/* Calendar View */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={20} />
            Routine Kalender
          </h3>

          <div style={{
            backgroundColor: '#0f172a',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155'
          }}>
            {/* Calendar Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => navigateMonth(-1)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                {getMonthName(currentMonth)}
              </h4>
              
              <button
                onClick={() => navigateMonth(1)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={16} />
        </button>
      </div>

            {/* Calendar Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.25rem'
            }}>
              {/* Day headers */}
              {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
                <div
                  key={day}
                  style={{
                    padding: '0.75rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#94a3b8',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.375rem'
                  }}
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentMonth).map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={index}
                      style={{
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  );
                }

                const completed = isDayCompleted(day);
                const today = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    style={{
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: completed ? '#065f46' : today ? '#1e40af' : 'transparent',
                      border: completed ? '1px solid #10b981' : today ? '1px solid #3b82f6' : '1px solid transparent',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!completed && !today) {
                        e.target.style.backgroundColor = '#334155';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!completed && !today) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{
                      color: completed ? '#10b981' : today ? '#3b82f6' : '#f8fafc',
                      fontSize: '0.875rem',
                      fontWeight: today ? '600' : '400'
                    }}>
                      {day.getDate()}
                    </span>
                    
                    {completed && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#065f46',
                  borderRadius: '2px',
                  border: '1px solid #10b981'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Routine abgeschlossen
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#1e40af',
                  borderRadius: '2px',
                  border: '1px solid #3b82f6'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Heute
                </span>
              </div>
            </div>
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
          

            
        {/* Completed Days List */}
        {completedDays.length > 0 && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #334155',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
              marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
                }}>
              <CheckCircle size={20} />
              Abgeschlossene Tage
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem'
            }}>
              {completedDays.map((date, index) => (
                <div
                  key={date}
                  style={{
                    backgroundColor: '#065f46',
                    color: '#10b981',
                    padding: '0.75rem',
                  borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: '1px solid #10b981'
                  }}
                >
                  {new Date(date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </div>
              ))}
            </div>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.875rem',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              {completedDays.length} Tag{completedDays.length !== 1 ? 'e' : ''} abgeschlossen
            </p>
          </div>
        )}

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

        {/* Action Buttons - Moved to bottom */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '2rem',
          padding: '2rem',
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          border: '1px solid #334155'
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
              Standard wiederherstellen
        </button>

        <button
              onClick={restoreYesterdayProgress}
          style={{
                backgroundColor: '#8b5cf6',
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
                e.target.style.backgroundColor = '#7c3aed';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#8b5cf6';
              }}
            >
              <Clock size={16} />
              Gestern wiederherstellen
        </button>
        </div>
      </div>
    </div>
  );
};

export default TradingRoutine;