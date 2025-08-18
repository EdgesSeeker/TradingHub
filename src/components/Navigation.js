import React, { useState } from 'react';
import { BarChart3, Briefcase, BookOpen, Calendar, Settings, ArrowLeft, Plus, TrendingDown, Target, Brain, BarChart, Zap, Clock, Trash2, ChevronDown, FileText, Building2 } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange, dateRange, onDateRangeChange, children, renderContent }) => {
  const [reviewsDropdownOpen, setReviewsDropdownOpen] = useState(false);
  
  const tabs = [
    { id: 'portfolio', label: 'Dashboard', icon: Briefcase },
    { id: 'system-overview', label: 'System Overview', icon: Zap },
    { id: 'trading-routine', label: 'Trading Routine', icon: Clock },
    { id: 'trade-planning', label: 'Trade Planning', icon: Target },
    { id: 'company-info', label: 'Company Info', icon: Building2 },
    { id: 'ai-agents', label: 'AI Agents', icon: Brain },
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

  const getCurrentPageTitle = () => {
    // Check if it's a review sub-tab first
    const currentReviewTab = reviewSubTabs.find(tab => tab.id === activeTab);
    if (currentReviewTab) {
      return currentReviewTab.label;
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
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0f172a'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
        padding: '1rem 0',
        overflowY: 'auto'
      }}>
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
              (tab.hasDropdown && reviewSubTabs.some(subTab => activeTab === subTab.id));
            
            if (tab.hasDropdown) {
              return (
                <div key={tab.id}>
                  <button
                    onClick={() => setReviewsDropdownOpen(!reviewsDropdownOpen)}
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
                        transform: reviewsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {reviewsDropdownOpen && (
                    <div style={{
                      marginLeft: '1rem',
                      marginBottom: '0.25rem'
                    }}>
                      {reviewSubTabs.map(subTab => {
                        const SubIcon = subTab.icon;
                        const isSubActive = activeTab === subTab.id;
                        
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => onTabChange(subTab.id)}
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
  );
};

export default Navigation; 