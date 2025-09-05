import React, { useState } from 'react';
import { BarChart3, Briefcase, BookOpen, Calendar, Settings, ArrowLeft, Plus, TrendingDown, Target, Brain, BarChart, Zap, Clock, Trash2, ChevronDown, FileText, Building2, TrendingUp, Star, Rocket, Activity, CheckSquare, Layers } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange, dateRange, onDateRangeChange, children, renderContent }) => {
  const [reviewsDropdownOpen, setReviewsDropdownOpen] = useState(false);
  const [setupStudyDropdownOpen, setSetupStudyDropdownOpen] = useState(false);
  
        const tabs = [
    { id: 'portfolio', label: 'Dashboard', icon: Briefcase },
    { id: 'market-monitor', label: 'Market Monitor', icon: Activity },
    { id: 'sector-dashboard', label: 'Sector Dashboard', icon: Layers },
    { id: 'chart-analysis', label: 'Chart Analysis', icon: TrendingUp },
    { id: 'system-overview', label: 'System Overview', icon: Zap },
    { id: 'trading-routine', label: 'Trading Routine', icon: Clock },
    { id: 'weekly-task', label: 'Weekly Task', icon: CheckSquare },
    { id: 'trade-planning', label: 'Trade Planning', icon: Target },
    { id: 'company-info', label: 'Company Info', icon: Building2 },
    { id: 'ai-agents', label: 'AI Agents', icon: Brain },
    { id: 'ai-agent-plans-overview', label: 'AI Plans Overview', icon: Star },
    { id: 'setup-study', label: 'Setup Study', icon: Rocket, hasDropdown: true },
    { id: 'trade-entry', label: 'Trade Entry', icon: Plus },
    { id: 'profit-taking', label: 'Profit Taking', icon: TrendingDown },
    { id: 'book-of-truth', label: 'Book of Truth', icon: BookOpen },
    { id: 'trading-metrics', label: 'Trading Metrics', icon: BarChart },
    { id: 'reviews', label: 'Reviews', icon: FileText, hasDropdown: true },
    { id: 'trash', label: 'Papierkorb', icon: Trash2 },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ];

  const reviewSubTabs = [
    { id: 'daily-review', label: 'Daily Review', icon: Calendar },
    { id: 'weekly-review', label: 'Weekly Review', icon: BarChart3 },
    { id: 'monthly-review', label: 'Monthly Review', icon: TrendingDown },
    { id: 'yearly-review', label: 'Yearly Review', icon: Target }
  ];

  const setupStudySubTabs = [
    { id: 'top-ops', label: 'Best Opportunities Study', icon: Rocket },
    { id: 'best-100-charts-study', label: 'Best 100 Charts Study', icon: BarChart3 }
  ];

  const getCurrentPageTitle = () => {
    // Check if it's a review sub-tab first
    const currentReviewTab = reviewSubTabs.find(tab => tab.id === activeTab);
    if (currentReviewTab) {
      return currentReviewTab.label;
    }
    
    // Check if it's a setup study sub-tab
    const currentSetupStudyTab = setupStudySubTabs.find(tab => tab.id === activeTab);
    if (currentSetupStudyTab) {
      return currentSetupStudyTab.label;
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
                (tab.id === 'setup-study' && setupStudySubTabs.some(subTab => activeTab === subTab.id))
              ));
            
            if (tab.hasDropdown) {
              const isReviewsTab = tab.id === 'reviews';
              const isSetupStudyTab = tab.id === 'setup-study';
              const dropdownOpen = isReviewsTab ? reviewsDropdownOpen : (isSetupStudyTab ? setupStudyDropdownOpen : false);
              const subTabs = isReviewsTab ? reviewSubTabs : (isSetupStudyTab ? setupStudySubTabs : []);
              
              return (
                <div key={tab.id}>
                  <button
                    onClick={() => {
                      if (isReviewsTab) {
                        setReviewsDropdownOpen(!reviewsDropdownOpen);
                        setSetupStudyDropdownOpen(false); // Close other dropdown
                      } else if (isSetupStudyTab) {
                        setSetupStudyDropdownOpen(!setupStudyDropdownOpen);
                        setReviewsDropdownOpen(false); // Close other dropdown
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
                              } else if (isSetupStudyTab) {
                                setSetupStudyDropdownOpen(false);
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