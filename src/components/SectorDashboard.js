import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Eye,
  FileText,
  Target,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Volume2,
  Users
} from 'lucide-react';
import storage from '../utils/storage';

const SectorDashboard = () => {
  const [industryGroups, setIndustryGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sortBy, setSortBy] = useState('perfWeek');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'detail'
  const [notes, setNotes] = useState({});
  const [favorites, setFavorites] = useState([]);

  // Industry Groups Data (Finviz-style structure)
  const industryGroupsData = [
    {
      id: 1,
      name: 'Semiconductor',
      ticker: 'SOXX',
      perfWeek: 8.2,
      perfMonth: 15.4,
      perfQuarter: 22.1,
      perfHalf: 18.7,
      perfYear: 45.3,
      perfYTD: 38.9,
      recom: 1.8,
      avgVolume: 1250000,
      relVolume: 1.2,
      theme: 'AI',
      topStocks: [
        { symbol: 'NVDA', perf: 12.5, volume: 45000000, recom: 1.2 },
        { symbol: 'AMD', perf: 8.7, volume: 32000000, recom: 1.5 },
        { symbol: 'TSM', perf: 6.3, volume: 18000000, recom: 1.8 }
      ]
    },
    {
      id: 2,
      name: 'Solar',
      ticker: 'TAN',
      perfWeek: -2.1,
      perfMonth: 5.8,
      perfQuarter: 12.4,
      perfHalf: 8.9,
      perfYear: 28.7,
      perfYTD: 22.1,
      recom: 2.1,
      avgVolume: 890000,
      relVolume: 0.8,
      theme: 'Clean Energy',
      topStocks: [
        { symbol: 'ENPH', perf: 4.2, volume: 12000000, recom: 2.0 },
        { symbol: 'SEDG', perf: 3.8, volume: 8500000, recom: 2.2 },
        { symbol: 'FSLR', perf: 2.9, volume: 15000000, recom: 1.9 }
      ]
    },
    {
      id: 3,
      name: 'Biotechnology',
      ticker: 'IBB',
      perfWeek: 3.4,
      perfMonth: 7.2,
      perfQuarter: 15.8,
      perfHalf: 12.3,
      perfYear: 18.9,
      perfYTD: 14.7,
      recom: 2.3,
      avgVolume: 2100000,
      relVolume: 1.1,
      theme: 'Pharma',
      topStocks: [
        { symbol: 'GILD', perf: 5.1, volume: 18000000, recom: 2.1 },
        { symbol: 'AMGN', perf: 4.7, volume: 12000000, recom: 2.0 },
        { symbol: 'BIIB', perf: 3.9, volume: 9500000, recom: 2.4 }
      ]
    },
    {
      id: 4,
      name: 'Homebuilders',
      ticker: 'ITB',
      perfWeek: 1.8,
      perfMonth: 4.2,
      perfQuarter: 8.9,
      perfHalf: 6.7,
      perfYear: 12.4,
      perfYTD: 9.8,
      recom: 2.5,
      avgVolume: 1500000,
      relVolume: 0.9,
      theme: 'Real Estate',
      topStocks: [
        { symbol: 'DHI', perf: 2.8, volume: 22000000, recom: 2.3 },
        { symbol: 'LEN', perf: 2.4, volume: 18000000, recom: 2.4 },
        { symbol: 'PHM', perf: 2.1, volume: 15000000, recom: 2.6 }
      ]
    },
    {
      id: 5,
      name: 'Aerospace & Defense',
      ticker: 'ITA',
      perfWeek: 2.7,
      perfMonth: 6.1,
      perfQuarter: 11.3,
      perfHalf: 9.2,
      perfYear: 16.8,
      perfYTD: 13.5,
      recom: 2.0,
      avgVolume: 1100000,
      relVolume: 1.0,
      theme: 'Defense',
      topStocks: [
        { symbol: 'LMT', perf: 3.2, volume: 12000000, recom: 1.9 },
        { symbol: 'RTX', perf: 2.9, volume: 15000000, recom: 2.0 },
        { symbol: 'NOC', perf: 2.6, volume: 8500000, recom: 2.1 }
      ]
    },
    {
      id: 6,
      name: 'Software',
      ticker: 'IGV',
      perfWeek: 4.8,
      perfMonth: 9.7,
      perfQuarter: 18.4,
      perfHalf: 15.2,
      perfYear: 32.1,
      perfYTD: 26.8,
      recom: 1.9,
      avgVolume: 1800000,
      relVolume: 1.3,
      theme: 'AI',
      topStocks: [
        { symbol: 'MSFT', perf: 6.2, volume: 35000000, recom: 1.7 },
        { symbol: 'CRM', perf: 5.8, volume: 12000000, recom: 1.8 },
        { symbol: 'ADBE', perf: 4.9, volume: 18000000, recom: 2.0 }
      ]
    },
    {
      id: 7,
      name: 'Oil & Gas',
      ticker: 'XLE',
      perfWeek: -1.2,
      perfMonth: 2.4,
      perfQuarter: 5.8,
      perfHalf: 3.9,
      perfYear: 8.7,
      perfYTD: 6.2,
      recom: 2.4,
      avgVolume: 2200000,
      relVolume: 0.7,
      theme: 'Energy',
      topStocks: [
        { symbol: 'XOM', perf: 1.8, volume: 25000000, recom: 2.3 },
        { symbol: 'CVX', perf: 1.5, volume: 18000000, recom: 2.4 },
        { symbol: 'COP', perf: 1.2, volume: 12000000, recom: 2.5 }
      ]
    },
    {
      id: 8,
      name: 'Banking',
      ticker: 'KBE',
      perfWeek: 0.8,
      perfMonth: 3.1,
      perfQuarter: 7.2,
      perfHalf: 5.4,
      perfYear: 11.8,
      perfYTD: 8.9,
      recom: 2.6,
      avgVolume: 1900000,
      relVolume: 0.8,
      theme: 'Financial',
      topStocks: [
        { symbol: 'JPM', perf: 2.1, volume: 28000000, recom: 2.4 },
        { symbol: 'BAC', perf: 1.8, volume: 32000000, recom: 2.5 },
        { symbol: 'WFC', perf: 1.6, volume: 22000000, recom: 2.7 }
      ]
    }
  ];

  // Themes for filtering
  const themes = [
    { id: 'all', name: 'All Themes', color: '#64748b' },
    { id: 'AI', name: 'AI & Tech', color: '#3b82f6' },
    { id: 'Clean Energy', name: 'Clean Energy', color: '#10b981' },
    { id: 'Pharma', name: 'Pharma & Bio', color: '#8b5cf6' },
    { id: 'Real Estate', name: 'Real Estate', color: '#f59e0b' },
    { id: 'Defense', name: 'Defense', color: '#ef4444' },
    { id: 'Energy', name: 'Energy', color: '#f97316' },
    { id: 'Financial', name: 'Financial', color: '#06b6d4' }
  ];

  // Load data on component mount
  useEffect(() => {
    setIndustryGroups(industryGroupsData);
    setFilteredGroups(industryGroupsData);
    
    // Load saved data
    const loadSavedData = async () => {
      try {
        const savedNotes = await storage.loadSetting('sectorDashboardNotes') || {};
        const savedFavorites = await storage.loadSetting('sectorDashboardFavorites') || [];
        setNotes(savedNotes);
        setFavorites(savedFavorites);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, []);

  // Filter and sort groups
  useEffect(() => {
    let filtered = [...industryGroups];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by theme
    if (selectedTheme !== 'all') {
      filtered = filtered.filter(group => group.theme === selectedTheme);
    }

    // Sort groups
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredGroups(filtered);
  }, [industryGroups, searchTerm, selectedTheme, sortBy, sortOrder]);

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get performance color
  const getPerformanceColor = (value) => {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#94a3b8';
  };

  // Get top/bottom performers
  const getTopPerformers = (metric, count = 5) => {
    const sorted = [...filteredGroups].sort((a, b) => b[metric] - a[metric]);
    return {
      top: sorted.slice(0, count),
      bottom: sorted.slice(-count).reverse()
    };
  };

  // Toggle favorite
  const toggleFavorite = (groupId) => {
    const newFavorites = favorites.includes(groupId)
      ? favorites.filter(id => id !== groupId)
      : [...favorites, groupId];
    setFavorites(newFavorites);
    storage.saveSetting('sectorDashboardFavorites', newFavorites);
  };

  // Save notes
  const saveNotes = (groupId, noteText) => {
    const newNotes = { ...notes, [groupId]: noteText };
    setNotes(newNotes);
    storage.saveSetting('sectorDashboardNotes', newNotes);
  };

  // Navigation functions
  const navigateToGroup = (direction) => {
    if (!selectedGroup) return;
    
    const currentIndex = filteredGroups.findIndex(g => g.id === selectedGroup.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredGroups.length;
    } else {
      newIndex = currentIndex === 0 ? filteredGroups.length - 1 : currentIndex - 1;
    }
    
    setSelectedGroup(filteredGroups[newIndex]);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown size={14} />;
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const topPerformers = getTopPerformers(sortBy);

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1600px',
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
              <BarChart3 size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Sector Dashboard
            </h1>
          </div>
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Industry Groups Performance & Analysis - Finviz Style
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: '1',
            minWidth: '300px'
          }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }} />
            <input
              type="text"
              placeholder="Search industry groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Theme Filter */}
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            style={{
              padding: '0.75rem',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('detail')}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: viewMode === 'detail' ? '#3b82f6' : 'transparent',
                color: viewMode === 'detail' ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Detail View
            </button>
          </div>
        </div>

        {/* Top/Bottom Performers Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Top Performers */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp size={16} />
              Top 5 Performers ({sortBy})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topPerformers.top.map((group, index) => (
                <div key={group.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                    {index + 1}. {group.name}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: getPerformanceColor(group[sortBy])
                  }}>
                    {group[sortBy] > 0 ? '+' : ''}{group[sortBy].toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Performers */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ef4444',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingDown size={16} />
              Bottom 5 Performers ({sortBy})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topPerformers.bottom.map((group, index) => (
                <div key={group.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                    {index + 1}. {group.name}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: getPerformanceColor(group[sortBy])
                  }}>
                    {group[sortBy] > 0 ? '+' : ''}{group[sortBy].toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #334155'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Industry Groups Performance ({filteredGroups.length} groups)
              </h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#334155',
                    borderBottom: '1px solid #475569'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Group Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('perfWeek')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Perf Week {getSortIcon('perfWeek')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('perfMonth')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Perf Month {getSortIcon('perfMonth')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('perfQuarter')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Perf Quarter {getSortIcon('perfQuarter')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('perfYear')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Perf Year {getSortIcon('perfYear')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('recom')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Recom {getSortIcon('recom')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} onClick={() => handleSort('avgVolume')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        Avg Volume {getSortIcon('avgVolume')}
                      </div>
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group.id} style={{
                      borderBottom: '1px solid #334155',
                      cursor: 'pointer'
                    }} onClick={() => {
                      setSelectedGroup(group);
                      setViewMode('detail');
                    }}>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontWeight: '500'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(group.id);
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: favorites.includes(group.id) ? '#f59e0b' : '#94a3b8'
                            }}
                          >
                            <Star size={16} fill={favorites.includes(group.id) ? '#f59e0b' : 'none'} />
                          </button>
                          {group.name}
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            backgroundColor: '#334155',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem'
                          }}>
                            {group.ticker}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: getPerformanceColor(group.perfWeek),
                        fontWeight: '600'
                      }}>
                        {group.perfWeek > 0 ? '+' : ''}{group.perfWeek.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: getPerformanceColor(group.perfMonth),
                        fontWeight: '600'
                      }}>
                        {group.perfMonth > 0 ? '+' : ''}{group.perfMonth.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: getPerformanceColor(group.perfQuarter),
                        fontWeight: '600'
                      }}>
                        {group.perfQuarter > 0 ? '+' : ''}{group.perfQuarter.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: getPerformanceColor(group.perfYear),
                        fontWeight: '600'
                      }}>
                        {group.perfYear > 0 ? '+' : ''}{group.perfYear.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontWeight: '600'
                      }}>
                        {group.recom.toFixed(1)}
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontWeight: '600'
                      }}>
                        {(group.avgVolume / 1000000).toFixed(1)}M
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                            setViewMode('detail');
                          }}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Detail View */
          selectedGroup && (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '1rem',
              border: '1px solid #334155',
              overflow: 'hidden'
            }}>
              {/* Detail Header */}
              <div style={{
                padding: '2rem',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#f8fafc',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => toggleFavorite(selectedGroup.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: favorites.includes(selectedGroup.id) ? '#f59e0b' : '#94a3b8'
                      }}
                    >
                      <Star size={20} fill={favorites.includes(selectedGroup.id) ? '#f59e0b' : 'none'} />
                    </button>
                    {selectedGroup.name}
                    <span style={{
                      fontSize: '1rem',
                      color: '#94a3b8',
                      backgroundColor: '#334155',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontWeight: '500'
                    }}>
                      {selectedGroup.ticker}
                    </span>
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Theme: {selectedGroup.theme}
                  </p>
                </div>
                
                {/* Navigation */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => navigateToGroup('prev')}
                    style={{
                      backgroundColor: '#334155',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {filteredGroups.findIndex(g => g.id === selectedGroup.id) + 1} of {filteredGroups.length}
                  </span>
                  <button
                    onClick={() => navigateToGroup('next')}
                    style={{
                      backgroundColor: '#334155',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Detail Content */}
              <div style={{
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem'
              }}>
                {/* Performance Metrics */}
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    marginBottom: '1rem'
                  }}>
                    Performance Metrics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    {[
                      { label: 'Week', value: selectedGroup.perfWeek },
                      { label: 'Month', value: selectedGroup.perfMonth },
                      { label: 'Quarter', value: selectedGroup.perfQuarter },
                      { label: 'Half Year', value: selectedGroup.perfHalf },
                      { label: 'Year', value: selectedGroup.perfYear },
                      { label: 'YTD', value: selectedGroup.perfYTD }
                    ].map((metric) => (
                      <div key={metric.label} style={{
                        backgroundColor: '#334155',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #475569'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginBottom: '0.25rem'
                        }}>
                          {metric.label}
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: getPerformanceColor(metric.value)
                        }}>
                          {metric.value > 0 ? '+' : ''}{metric.value.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Stocks */}
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    marginBottom: '1rem'
                  }}>
                    Top Performing Stocks
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedGroup.topStocks.map((stock) => (
                      <div key={stock.symbol} style={{
                        backgroundColor: '#334155',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #475569',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#f8fafc'
                          }}>
                            {stock.symbol}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8'
                          }}>
                            Vol: {(stock.volume / 1000000).toFixed(1)}M | Recom: {stock.recom}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: '700',
                          color: getPerformanceColor(stock.perf)
                        }}>
                          {stock.perf > 0 ? '+' : ''}{stock.perf.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TradingView Chart Placeholder */}
              <div style={{
                padding: '2rem',
                borderTop: '1px solid #334155'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem'
                }}>
                  {selectedGroup.ticker} Chart
                </h3>
                <div style={{
                  height: '400px',
                  backgroundColor: '#334155',
                  borderRadius: '0.5rem',
                  border: '1px solid #475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '1rem'
                }}>
                  📈 TradingView Chart Widget for {selectedGroup.ticker}
                  <br />
                  <span style={{ fontSize: '0.875rem' }}>
                    (Chart integration would go here)
                  </span>
                </div>
              </div>

              {/* Notes Section */}
              <div style={{
                padding: '2rem',
                borderTop: '1px solid #334155'
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
                  <FileText size={20} />
                  Notes & Analysis
                </h3>
                <textarea
                  value={notes[selectedGroup.id] || ''}
                  onChange={(e) => saveNotes(selectedGroup.id, e.target.value)}
                  placeholder="Add your analysis, trading ideas, and sector insights here..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )
        )}

        {/* Back to Table Button */}
        {viewMode === 'detail' && (
          <div style={{
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                backgroundColor: '#64748b',
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
                margin: '0 auto'
              }}
            >
              <BarChart3 size={16} />
              Back to Table View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorDashboard;
