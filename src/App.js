import React, { useState, useEffect } from 'react';
import './styles/web.css';
import './styles/mobile-pwa.css';
import responsiveManager from './utils/responsive';
import pwaManager from './utils/pwa';
import Navigation from './components/Navigation';
import MobileNavigation from './components/MobileNavigation';
import NewTradeEntry from './components/NewTradeEntry';
import Portfolio from './components/Portfolio';
import ProfitTaking from './components/ProfitTaking';
import TradePlanning from './components/TradePlanning';
import CompanyInfo from './components/CompanyInfo';
import SystemOverview from './components/SystemOverview';
import TradingRoutine from './components/TradingRoutine';
import WeeklyTask from './components/WeeklyTask';
import SectorDashboard from './components/SectorDashboard';
import BookOfTruth from './components/BookOfTruth';
import DailyReview from './components/DailyReview';
import WeeklyReview from './components/WeeklyReview';
import MonthlyReview from './components/MonthlyReview';
import YearlyReview from './components/YearlyReview';
import AIAgents from './components/AIAgents';
import AIAgentPlansOverview from './components/AIAgentPlansOverview';
import TopOps from './components/TopOps';
import Best100ChartsStudy from './components/Best100ChartsStudy';
import TradingMetrics from './components/TradingMetrics';
import TradingEquityCurve from './components/TradingEquityCurve';
import Trash from './components/Trash';
import Settings from './components/Settings';
import ChartAnalysis from './components/ChartAnalysis';
import MarketMonitor from './components/MarketMonitor';
import MarketMonitorMobile from './components/MarketMonitorMobile';
import TradeUpload from './components/TradeUpload';
// import TradingLogExport from './components/TradingLogExport';
import storage from './utils/storage';
import advancedStorage from './utils/advancedStorage';
import BackupManager from './components/BackupManager';
import ScreenshotManager from './components/ScreenshotManager';
import EmergencyRecovery from './components/EmergencyRecovery';
import BigDayResetChecklist from './components/BigDayResetChecklist';
import './styles/dashboard.css';
import './styles/trading-theme.css';

function App() {
  // Load activeTab from localStorage or default to 'portfolio'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || 'portfolio';
  });

  // Force refresh cache for development
  useEffect(() => {
    // Clear any cached data that might cause issues
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 App loaded - Cache cleared for development');
    }
  }, []);
  
  // Save activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  
  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  const [trades, setTrades] = useState([]);
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  const [dateRange, setDateRange] = useState('all');
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Define filterTrades function before it's used in useEffect
  const filterTrades = async () => {
    try {
      let filtered = [];
      
      if (dateRange === 'all') {
        filtered = trades;
      } else {
        const startDate = new Date();
        const endDate = new Date();
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            filtered = trades;
        }
        
        // Filter trades based on exit date for closed trades, entry date for open trades
        filtered = trades.filter(trade => {
          const tradeDate = new Date(trade.status === 'closed' ? trade.exitDate : trade.entryDate);
          return tradeDate >= startDate && tradeDate <= endDate;
        });
      }
      
      setFilteredTrades(filtered);
    } catch (error) {
      console.error('Error filtering trades:', error);
      setError('Fehler beim Filtern der Trades: ' + error.message);
    }
  };

  // Load trades and PnL sales on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Additional useEffect for other setup
  useEffect(() => {
    // Make backup functions globally available
    window.createBackup = createBackup;
    window.restoreFromBackup = restoreFromBackup;
    
    // Setup PWA connection listeners
    pwaManager.setupConnectionListeners();
    
    // Setup routine reminders
    setupRoutineReminders();
    
    // Setup responsive breakpoint listener
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
      // Cleanup global functions
      delete window.createBackup;
      delete window.restoreFromBackup;
    };
  }, []);
  
  const setupRoutineReminders = () => {
    // Send routine reminder at 9:00 AM every day
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    
    // If it's past 9 AM today, set for tomorrow
    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    setTimeout(() => {
      pwaManager.sendRoutineReminder();
      // Set up daily recurring reminder
      setInterval(() => {
        pwaManager.sendRoutineReminder();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilReminder);
  };

  // Filter trades when date range changes
  useEffect(() => {
    if (!isLoading) {
      filterTrades();
    }
  }, [trades, dateRange, isLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Initialize storage first
      await storage.init();
      await advancedStorage.init();
      
      const loadedTrades = await storage.loadTrades();
      
      console.log('Loaded trades from storage:', loadedTrades);
      console.log('Open trades:', (loadedTrades || []).filter(t => 
      t.status === 'open' && parseFloat(t.quantity) > 0
    ));
      
      setTrades(loadedTrades || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Fehler beim Laden der Daten: ' + error.message);
      setIsLoading(false);
      // Set empty arrays as fallback
      setTrades([]);
    }
  };

  // Backup-Funktionen
  const createBackup = async () => {
    try {
      const backupKey = await storage.createBackup();
      alert(`✅ Backup erfolgreich erstellt: ${backupKey}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Fehler beim Erstellen des Backups: ' + error.message);
    }
  };

  const restoreFromBackup = async (backupKey) => {
    try {
      await storage.restoreFromBackup(backupKey);
      await loadData();
      alert('✅ Backup erfolgreich wiederhergestellt!');
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Fehler beim Wiederherstellen des Backups: ' + error.message);
    }
  };

  const handleTradeAdded = async (newTrade) => {
    try {
      console.log('handleTradeAdded called with:', newTrade);
      console.log('Current trades:', trades);
      
      // Check if this is an update to an existing trade (partial exit)
      if (newTrade.id && trades.find(t => t.id === newTrade.id)) {
        console.log('Updating existing trade');
        await storage.updateManualTrade(newTrade);
      } else {
        console.log('Adding new trade');
        await storage.addManualTrade(newTrade);
      }
      await loadData();
      setError('');
    } catch (error) {
      console.error('Error adding/updating trade:', error);
      setError('Fehler beim Hinzufügen/Aktualisieren des Trades: ' + error.message);
    }
  };

  const handleTradeDeleted = async (tradeId) => {
    try {
      // Find the trade to be deleted
      const tradeToDelete = trades.find(trade => trade.id === tradeId);
      if (!tradeToDelete) {
        throw new Error('Trade nicht gefunden');
      }
      
      // Delete trade directly from database
      await storage.deleteTrade(tradeId);
      
      // Remove from local state
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      
      setError('');
    } catch (error) {
      console.error('Error deleting trade:', error);
      setError('Fehler beim Löschen des Trades: ' + error.message);
    }
  };

  const handleJournalEntryAdded = async (entry) => {
    try {
      await storage.addJournalEntry(entry);
      setError('');
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setError('Fehler beim Hinzufügen des Journal-Eintrags: ' + error.message);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Lade Daten...</div>
        </div>
      );
    }

    // Get open trades for the trade selector
    const openTrades = trades.filter(trade => 
    trade.status === 'open' && parseFloat(trade.quantity) > 0
  );

    try {
      switch (activeTab) {
        case 'trade-entry':
          return (
            <NewTradeEntry onTradeAdded={handleTradeAdded} openTrades={openTrades} onNavigate={setActiveTab} />
          );
        case 'system-overview':
          return (
            <SystemOverview />
          );
        case 'big-day-reset-checklist':
          return (
            <BigDayResetChecklist />
          );
        case 'trading-routine':
          return (
            <TradingRoutine onNavigate={setActiveTab} />
          );
        case 'weekly-task':
          return (
            <WeeklyTask />
          );
        case 'trade-planning':
          return (
            <TradePlanning onNavigate={setActiveTab} />
          );
        case 'company-info':
          return (
            <CompanyInfo />
          );
        case 'portfolio':
          return (
            <Portfolio trades={filteredTrades} onTradeDeleted={handleTradeDeleted} onTradeUpdated={handleTradeAdded} onNavigate={setActiveTab} />
          );
        case 'market-monitor':
          return isMobile ? (
            <MarketMonitorMobile />
          ) : (
            <MarketMonitor />
          );
        case 'sector-dashboard':
          return (
            <SectorDashboard />
          );
        case 'profit-taking':
          return (
            <ProfitTaking trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'book-of-truth':
          return (
            <BookOfTruth trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'daily-review':
          return (
            <DailyReview trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'weekly-review':
          return (
            <WeeklyReview trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'monthly-review':
          return (
            <MonthlyReview trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'yearly-review':
          return (
            <YearlyReview trades={trades} onTradeUpdated={handleTradeAdded} />
          );
        case 'ai-agents':
          return (
            <AIAgents trades={trades} onTradeUpdated={handleTradeAdded} onNavigate={setActiveTab} />
          );
        case 'ai-agent-plans-overview':
          return (
            <AIAgentPlansOverview />
          );
        case 'top-ops':
          return (
            <TopOps />
          );
        case 'best-100-charts-study':
          console.log('🎯 Rendering Best100ChartsStudy component');
          return (
            <Best100ChartsStudy />
          );
        case 'trading-metrics':
          return (
            <TradingMetrics trades={trades} settings={{ portfolioValue: 100000 }} />
          );
        case 'trading-equity-curve':
          return (
            <TradingEquityCurve trades={trades} onTradeUpdated={handleTradeAdded} onNavigate={setActiveTab} />
          );
        case 'trash':
          return (
            <Trash onTradeRestored={handleTradeAdded} />
          );
        case 'settings':
          return (
            <Settings />
          );
        case 'chart-analysis':
          return (
            <ChartAnalysis trades={trades} onNavigate={setActiveTab} />
          );
        case 'trade-upload':
          return (
            <TradeUpload onTradesImported={loadData} onNavigate={setActiveTab} />
          );
        case 'backup-manager':
          return (
            <BackupManager />
          );
        case 'screenshot-manager':
          return (
            <ScreenshotManager tradeId={null} />
          );
        case 'emergency-recovery':
          return (
            <EmergencyRecovery />
          );

        default:
          return <Portfolio trades={filteredTrades} onTradeDeleted={handleTradeDeleted} onTradeUpdated={handleTradeAdded} onNavigate={setActiveTab} />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Fehler beim Laden der Komponente
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      );
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif', height: '100vh' }}>
      {isMobile ? (
        <MobileNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      ) : (
        <Navigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          renderContent={renderContent}
        />
      )}
      
      <div className={isMobile ? 'mobile-main-content' : 'web-main-content'}>
        {isMobile ? renderContent() : null}
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          maxWidth: '400px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginLeft: '1rem'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Content will be rendered by Navigation component */}
    </div>
  );
}

export default App; 