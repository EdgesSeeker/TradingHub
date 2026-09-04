import React, { useState } from 'react';
import { 
  BarChart3, Briefcase, BookOpen, Calendar, Settings, ArrowLeft, Plus, 
  TrendingDown, Target, Brain, BarChart, Zap, Clock, Trash2, ChevronDown, 
  FileText, Building2, TrendingUp, Star, Rocket, Activity, CheckSquare, 
  Layers, Download, Menu, X, Award, Maximize2, Minimize2, Upload
} from 'lucide-react';

const MobileNavigation = ({ activeTab, onTabChange, dateRange, onDateRangeChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewsDropdownOpen, setReviewsDropdownOpen] = useState(false);
  const [tradeWorkflowDropdownOpen, setTradeWorkflowDropdownOpen] = useState(false);
  const [analysisDropdownOpen, setAnalysisDropdownOpen] = useState(false);
  const [studyDataDropdownOpen, setStudyDataDropdownOpen] = useState(false);
  const [routineDropdownOpen, setRoutineDropdownOpen] = useState(false);
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tabs = [
    // 1. Routine & Tasks (Dropdown) - Moved to top
    { id: 'routine', label: 'Routine & Tasks', icon: Clock, hasDropdown: true },
    
    // 2. Portfolio & Dashboard
    { id: 'portfolio', label: 'Portfolio Dashboard', icon: Briefcase },
    
    // 3. Marktüberwachung & Sektoren
    { id: 'market-monitor', label: 'Market Monitor', icon: Activity },
    
    // 4. Trade-Workflow (Dropdown)
    { id: 'trade-workflow', label: 'Trade-Workflow', icon: Target, hasDropdown: true },
    
    // 5. Analyse (Dropdown)
    { id: 'analysis', label: 'Analyse', icon: BarChart3, hasDropdown: true },
    
    // 6. Study Data (Dropdown)
    { id: 'study-data', label: 'Study Data', icon: BookOpen, hasDropdown: true },
    
    // 7. System (Dropdown)
    { id: 'system', label: 'System', icon: Settings, hasDropdown: true }
  ];

  // Sub-tabs for dropdowns
  const routineSubTabs = [
    { id: 'trading-routine', label: 'Trading Routine', icon: CheckSquare },
    { id: 'weekly-task', label: 'Weekly Task', icon: Calendar },
    { id: 'daily-review', label: 'Daily Review', icon: FileText },
    { id: 'weekly-review', label: 'Weekly Review', icon: Calendar },
    { id: 'monthly-review', label: 'Monthly Review', icon: Calendar },
    { id: 'yearly-review', label: 'Yearly Review', icon: Calendar }
  ];

  const tradeWorkflowSubTabs = [
    { id: 'new-trade', label: 'New Trade Entry', icon: Plus },
    { id: 'trade-planning', label: 'Trade Planning', icon: Target },
    { id: 'trade-upload', label: 'Trade Upload', icon: Upload },
    { id: 'profit-taking', label: 'Profit Taking', icon: TrendingUp },
    { id: 'company-info', label: 'Company Info', icon: Building2 }
  ];

  const analysisSubTabs = [
    { id: 'ai-agents', label: 'AI Agents', icon: Brain },
    { id: 'ai-agent-plans', label: 'AI Agent Plans', icon: Rocket },
    { id: 'trading-equity-curve', label: 'Trading Equity Curve', icon: TrendingUp }
  ];

  const studyDataSubTabs = [
    { id: 'best100-charts-study', label: 'Best 100 Charts Study', icon: Star },
    { id: 'top-ops', label: 'Top Ops', icon: Award }
  ];

  const systemSubTabs = [
    { id: 'system-overview', label: 'System Overview', icon: Settings }
  ];

  const getCurrentTabLabel = () => {
    // Check if it's a routine sub-tab
    const currentRoutineTab = routineSubTabs.find(tab => tab.id === activeTab);
    if (currentRoutineTab) {
      return currentRoutineTab.label;
    }
    
    // Check if it's a trade workflow sub-tab
    const currentTradeWorkflowTab = tradeWorkflowSubTabs.find(tab => tab.id === activeTab);
    if (currentTradeWorkflowTab) {
      return currentTradeWorkflowTab.label;
    }
    
    // Check if it's an analysis sub-tab
    const currentAnalysisTab = analysisSubTabs.find(tab => tab.id === activeTab);
    if (currentAnalysisTab) {
      return currentAnalysisTab.label;
    }
    
    // Check if it's a study data sub-tab
    const currentStudyDataTab = studyDataSubTabs.find(tab => tab.id === activeTab);
    if (currentStudyDataTab) {
      return currentStudyDataTab.label;
    }
    
    // Check if it's a routine sub-tab
    const currentRoutineTab2 = routineSubTabs.find(tab => tab.id === activeTab);
    if (currentRoutineTab2) {
      return currentRoutineTab2.label;
    }
    
    // Check if it's a system sub-tab
    const currentSystemTab = systemSubTabs.find(tab => tab.id === activeTab);
    if (currentSystemTab) {
      return currentSystemTab.label;
    }
    
    // Then check main tabs
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.label : 'Dashboard';
  };

  const dateRanges = [
    { value: 'all', label: 'Alle' },
    { value: 'today', label: 'Heute' },
    { value: 'week', label: 'Woche' },
    { value: 'month', label: 'Monat' }
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Fullscreen functions
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // PWA Fullscreen mode
  const togglePWAFullscreen = () => {
    if (document.body.classList.contains('pwa-fullscreen')) {
      document.body.classList.remove('pwa-fullscreen');
      setIsFullscreen(false);
    } else {
      document.body.classList.add('pwa-fullscreen');
      setIsFullscreen(true);
    }
  };

  return (
    <>
      {/* Mobile Header - Hidden to avoid duplication */}
      {/* <div className="mobile-header">
        <button 
          className="mobile-hamburger"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
        <div className="mobile-header-title">
          {getCurrentTabLabel()}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={togglePWAFullscreen}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#334155';
              e.target.style.color = '#f8fafc';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#94a3b8';
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div> */}

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--foreground)',
            margin: 0
          }}>
            Trading Journal
          </h2>
          <button 
            onClick={closeSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted-foreground)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ padding: '16px 0' }}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const isRoutineTab = tab.id === 'routine';
            const isTradeWorkflowTab = tab.id === 'trade-workflow';
            const isAnalysisTab = tab.id === 'analysis';
            const isStudyDataTab = tab.id === 'study-data';
            const isSystemTab = tab.id === 'system';
            
            const subTabs = isRoutineTab ? routineSubTabs :
                           isTradeWorkflowTab ? tradeWorkflowSubTabs :
                           isAnalysisTab ? analysisSubTabs :
                           isStudyDataTab ? studyDataSubTabs :
                           isSystemTab ? systemSubTabs : [];
            
            const isDropdownOpen = isRoutineTab ? routineDropdownOpen :
                                  isTradeWorkflowTab ? tradeWorkflowDropdownOpen :
                                  isAnalysisTab ? analysisDropdownOpen :
                                  isStudyDataTab ? studyDataDropdownOpen :
                                  isSystemTab ? systemDropdownOpen : false;
            
            const setDropdownOpen = isRoutineTab ? setRoutineDropdownOpen :
                                   isTradeWorkflowTab ? setTradeWorkflowDropdownOpen :
                                   isAnalysisTab ? setAnalysisDropdownOpen :
                                   isStudyDataTab ? setStudyDataDropdownOpen :
                                   isSystemTab ? setSystemDropdownOpen : () => {};
            
            return (
              <div key={tab.id}>
                <button
                  onClick={() => {
                    if (tab.hasDropdown) {
                      setDropdownOpen(!isDropdownOpen);
                    } else {
                      onTabChange(tab.id);
                      closeSidebar();
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    border: 'none',
                    borderRadius: '8px',
                    margin: '4px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  <IconComponent size={20} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
                  {tab.hasDropdown && (
                    <ChevronDown 
                      size={16} 
                      style={{ 
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  )}
                </button>
                
                {tab.hasDropdown && isDropdownOpen && (
                  <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                    {subTabs.map((subTab) => {
                      const SubIconComponent = subTab.icon;
                      const isSubActive = activeTab === subTab.id;
                      
                      return (
                        <button
                          key={subTab.id}
                          onClick={() => {
                            console.log('🔄 Mobile Navigation: Clicking on subTab:', subTab.id);
                            onTabChange(subTab.id);
                            closeSidebar();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            background: isSubActive ? 'var(--secondary)' : 'transparent',
                            color: isSubActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                            border: 'none',
                            borderRadius: '6px',
                            margin: '2px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '14px'
                          }}
                        >
                          <SubIconComponent size={16} />
                          <span style={{ flex: 1, textAlign: 'left' }}>{subTab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* PWA Install Button & Fullscreen Toggle */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => {
                window.open('/pwa-install.html', '_blank');
                closeSidebar();
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Download size={16} />
              Install
            </button>
            <button
              onClick={() => {
                togglePWAFullscreen();
                closeSidebar();
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: isFullscreen ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFullscreen ? 'Exit FS' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--muted-foreground)',
            marginBottom: '8px'
          }}>
            Zeitraum
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '14px'
            }}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Navigation - Only show main tabs */}
      <div className="mobile-nav">
        {tabs.slice(0, 5).map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.hasDropdown) {
                  setSidebarOpen(true);
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                minWidth: '60px'
              }}
            >
              <IconComponent size={24} />
              <span style={{ fontSize: '12px', marginTop: '4px' }}>
                {tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default MobileNavigation;
