import React, { useState } from 'react';
import { BarChart3, Briefcase, BookOpen, Calendar, Settings, ArrowLeft, Plus, TrendingDown, Target, Brain, BarChart, Zap, Clock, Trash2, ChevronDown, FileText, Building2, TrendingUp, Star, Rocket, Activity, CheckSquare, Layers } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange, dateRange, onDateRangeChange, children, renderContent }) => {
  const [reviewsDropdownOpen, setReviewsDropdownOpen] = useState(false);
  const [tradeWorkflowDropdownOpen, setTradeWorkflowDropdownOpen] = useState(false);
  const [analysisDropdownOpen, setAnalysisDropdownOpen] = useState(false);
  const [studyDataDropdownOpen, setStudyDataDropdownOpen] = useState(false);
  const [routineDropdownOpen, setRoutineDropdownOpen] = useState(false);
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);
  
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
    { id: 'analysis', label: 'Analyse', icon: TrendingUp, hasDropdown: true },
    
    // 6. Study & Data (Dropdown)
    { id: 'study-data', label: 'Study & Data', icon: BarChart3, hasDropdown: true },
    
    // 7. Reviews (Dropdown)
    { id: 'reviews', label: 'Reviews', icon: FileText, hasDropdown: true },
    
    // 8. System & Einstellungen (Dropdown)
    { id: 'system', label: 'System & Einstellungen', icon: Settings, hasDropdown: true }
  ];

  const reviewSubTabs = [
    { id: 'daily-review', label: 'Daily Review', icon: Calendar },
    { id: 'weekly-review', label: 'Weekly Review', icon: BarChart3 },
    { id: 'monthly-review', label: 'Monthly Review', icon: TrendingDown },
    { id: 'yearly-review', label: 'Yearly Review', icon: Target }
  ];

  const tradeWorkflowSubTabs = [
    { id: 'trade-planning', label: 'Trade Planning', icon: Target },
    { id: 'trade-entry', label: 'Trade Entry', icon: Plus },
    { id: 'profit-taking', label: 'Profit Taking', icon: TrendingDown },
    { id: 'ai-agents', label: 'AI Agents', icon: Brain },
    { id: 'ai-agent-plans-overview', label: 'AI Plans Overview', icon: Star },
    { id: 'chart-analysis', label: 'Chart Analysis', icon: TrendingUp },
    { id: 'book-of-truth', label: 'Book of Truth', icon: BookOpen }
  ];

  const analysisSubTabs = [
    { id: 'sector-dashboard', label: 'Sector Dashboard', icon: Layers },
    { id: 'company-info', label: 'Company Info', icon: Building2 }
  ];

  const studyDataSubTabs = [
    { id: 'top-ops', label: 'Best Opportunities Study', icon: Rocket },
    { id: 'best-100-charts-study', label: 'Best 100 Charts Study', icon: BarChart3 },
    { id: 'trading-metrics', label: 'Trading Metrics', icon: BarChart },
    { id: 'trading-equity-curve', label: 'Trading Equity Curve', icon: TrendingUp }
  ];

  const routineSubTabs = [
    { id: 'trading-routine', label: 'Trading Routine', icon: Clock },
    { id: 'weekly-task', label: 'Weekly Task Board', icon: CheckSquare }
  ];

  const systemSubTabs = [
    { id: 'system-overview', label: 'System Overview', icon: Zap },
    { id: 'trash', label: 'Papierkorb', icon: Trash2 },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ];

  const getCurrentPageTitle = () => {
    // Check if it's a review sub-tab first
    const currentReviewTab = reviewSubTabs.find(tab => tab.id === activeTab);
    if (currentReviewTab) {
      return currentReviewTab.label;
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
    const currentRoutineTab = routineSubTabs.find(tab => tab.id === activeTab);
    if (currentRoutineTab) {
      return currentRoutineTab.label;
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
    { value: 'month', label: 'Monat' },
    { value: 'year', label: 'Jahr' }
  ];

  return (
    <>
      <style>
        {`
          .sidebar-hidden-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
          .sidebar-hidden-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#0f172a'
      }}>
      {/* Sidebar */}
      <aside 
        className="sidebar-hidden-scrollbar"
        style={{
          width: '280px',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          padding: '1rem 0',
          overflowY: 'auto'
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #334155',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#f8fafc'
            }}>Trading Journal</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '0 0.5rem' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || 
              (tab.hasDropdown && (
                (tab.id === 'reviews' && reviewSubTabs.some(subTab => activeTab === subTab.id)) ||
                (tab.id === 'trade-workflow' && tradeWorkflowSubTabs.some(subTab => activeTab === subTab.id)) ||
                (tab.id === 'analysis' && analysisSubTabs.some(subTab => activeTab === subTab.id)) ||
                (tab.id === 'study-data' && studyDataSubTabs.some(subTab => activeTab === subTab.id)) ||
                (tab.id === 'routine' && routineSubTabs.some(subTab => activeTab === subTab.id)) ||
                (tab.id === 'system' && systemSubTabs.some(subTab => activeTab === subTab.id))
              ));
            
            if (tab.hasDropdown) {
              const isReviewsTab = tab.id === 'reviews';
              const isTradeWorkflowTab = tab.id === 'trade-workflow';
              const isAnalysisTab = tab.id === 'analysis';
              const isStudyDataTab = tab.id === 'study-data';
              const isRoutineTab = tab.id === 'routine';
              const isSystemTab = tab.id === 'system';
              
              const dropdownOpen = isReviewsTab ? reviewsDropdownOpen : 
                                 (isTradeWorkflowTab ? tradeWorkflowDropdownOpen :
                                 (isAnalysisTab ? analysisDropdownOpen :
                                 (isStudyDataTab ? studyDataDropdownOpen :
                                 (isRoutineTab ? routineDropdownOpen :
                                 (isSystemTab ? systemDropdownOpen : false)))));
              
              const subTabs = isReviewsTab ? reviewSubTabs : 
                            (isTradeWorkflowTab ? tradeWorkflowSubTabs :
                            (isAnalysisTab ? analysisSubTabs :
                            (isStudyDataTab ? studyDataSubTabs :
                            (isRoutineTab ? routineSubTabs :
                            (isSystemTab ? systemSubTabs : [])))));
              
              return (
                <div key={tab.id}>
                  <button
                    onClick={() => {
                      // Close all other dropdowns first
                      setReviewsDropdownOpen(false);
                      setTradeWorkflowDropdownOpen(false);
                      setAnalysisDropdownOpen(false);
                      setStudyDataDropdownOpen(false);
                      setRoutineDropdownOpen(false);
                      setSystemDropdownOpen(false);
                      
                      // Toggle the clicked dropdown
                      if (isReviewsTab) {
                        setReviewsDropdownOpen(!reviewsDropdownOpen);
                      } else if (isTradeWorkflowTab) {
                        setTradeWorkflowDropdownOpen(!tradeWorkflowDropdownOpen);
                      } else if (isAnalysisTab) {
                        setAnalysisDropdownOpen(!analysisDropdownOpen);
                      } else if (isStudyDataTab) {
                        setStudyDataDropdownOpen(!studyDataDropdownOpen);
                      } else if (isRoutineTab) {
                        setRoutineDropdownOpen(!routineDropdownOpen);
                      } else if (isSystemTab) {
                        setSystemDropdownOpen(!systemDropdownOpen);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.25rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                      color: isActive ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Icon size={20} />
                      {tab.label}
                    </div>
                    <ChevronDown 
                      size={16} 
                      style={{ 
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div style={{
                      marginLeft: '1rem',
                      marginBottom: '0.25rem'
                    }}>
                      {subTabs.map(subTab => {
                        const SubIcon = subTab.icon;
                        const isSubActive = activeTab === subTab.id;
                        
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => {
                              console.log('🔄 Navigation: Clicking on subTab:', subTab.id);
                              onTabChange(subTab.id);
                              // Close dropdown after selection
                              if (isReviewsTab) {
                                setReviewsDropdownOpen(false);
                              } else if (isTradeWorkflowTab) {
                                setTradeWorkflowDropdownOpen(false);
                              } else if (isAnalysisTab) {
                                setAnalysisDropdownOpen(false);
                              } else if (isStudyDataTab) {
                                setStudyDataDropdownOpen(false);
                              } else if (isRoutineTab) {
                                setRoutineDropdownOpen(false);
                              } else if (isSystemTab) {
                                setSystemDropdownOpen(false);
                              }
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.5rem 1rem',
                              marginBottom: '0.25rem',
                              borderRadius: '0.5rem',
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              transition: 'all 0.2s',
                              border: 'none',
                              cursor: 'pointer',
                              background: isSubActive ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                              color: isSubActive ? '#ffffff' : '#94a3b8'
                            }}
                          >
                            <SubIcon size={18} />
                            {subTab.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.color = '#f8fafc';
                    e.target.style.background = '#334155';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.color = '#94a3b8';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon style={{ width: '1.125rem', height: '1.125rem' }} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Date Range Filter */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #334155',
          marginTop: 'auto'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#94a3b8',
            marginBottom: '0.5rem'
          }}>
            Zeitraum
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.375rem',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Header - Removed to avoid duplicate titles */}

        {/* Content will be rendered here by App.js */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderContent ? renderContent() : children}
        </div>
      </main>
      </div>
    </>
  );
};

export default Navigation; 