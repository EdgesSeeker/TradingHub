import React, { useState, useEffect } from 'react';
import storage from '../utils/storage';

const Best100ChartsStudy = () => {
  console.log('🚀 Best100ChartsStudy component loaded!');
  
  const [selectedChart, setSelectedChart] = useState('');
  const [completedCharts, setCompletedCharts] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [screenshots, setScreenshots] = useState({});
  const [checklist, setChecklist] = useState({});
  
  // New state for unsaved changes and view mode
  const [unsavedNotes, setUnsavedNotes] = useState({});
  const [unsavedScreenshots, setUnsavedScreenshots] = useState({});
  const [unsavedChecklist, setUnsavedChecklist] = useState({});
  const [isViewMode, setIsViewMode] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const analysisSections = [
    {
      id: 'market-environment',
      title: 'Market Environment & Sector',
      questions: [
        'Overall market phase at the time of the setup (bull market, bear market, sideways)',
        'What was the Theme?',
        'Development of market indices (e.g., Nasdaq, S&P 500) around the setup',
        'Macroeconomic and sector-specific news and trends',
        'Sentiment indicators (e.g., Fear & Greed Index)'
      ]
    },
    {
      id: 'fundamental-data',
      title: 'Fundamental Data (at the time of setup)',
      questions: [
        'Corporate news / breaking news as catalyst',
        'Earnings, revenue, and other relevant fundamental data',
        'Analyst ratings and commentaries',
        'Possible regulatory or external factors'
      ]
    },
    {
      id: 'chart-movement',
      title: 'Chart and Price Movement Prior to Setup',
      questions: [
        'Percentage price movement of the stock in the last 10, 20, 30 days (e.g., ~30% move)',
        'Type of movement (linear pullback, consolidation, flag, channel)',
        'Behavior relative to moving averages (10/20/50 DMA) including undercuts and reclaims',
        'Trendlines on daily and hourly basis (clear and well-defined)',
        'Proximity to breakout level (e.g., within 0.5 ATR or ADR)',
        'Volatility and volume development before and during the setup (absolute and relative values)'
      ]
    },
    {
      id: 'setup-details',
      title: 'Setup-Specific Details',
      questions: [
        'Date and exact time of the setup',
        'Exact breakout level and type of setup (breakout, breakdown, panic, bounce)',
        'Multi-day or one-day setup',
        'Fulfilled entry criteria (e.g., breakout above daily high, 5-min candle)',
        'Position size relative to account',
        'Entry and stop-loss levels'
      ]
    },
    {
      id: 'trade-execution',
      title: 'Trade Execution & Performance',
      questions: [
        'Entry and exit times with explanations',
        'Absolute and percentage profit/loss',
        'Risk-reward ratio (R/R) of the trades',
        'Duration of the trades (days/hours)',
        'Rule compliance and documentation of rule breaks',
        'Observed peculiarities in order flow, liquidity, tape action',
        'Volatility breakout and spread development during trading'
      ]
    },
    {
      id: 'psychological-strategic',
      title: 'Psychological & Strategic Observations',
      questions: [
        'Was the setup expected or a surprise?',
        'Long vs. short thesis and the outcome',
        'Emotional analysis: FOMO, panic, hesitation, rule breaches',
        'Own involvement or non-involvement (why?)',
        'Lessons learned and what would be done differently'
      ]
    },
    {
      id: 'contextual-extensions',
      title: 'Contextual Extensions',
      questions: [
        'Time of trade initiation (market open, midday, after-hours)',
        'Overarching chart structure (key support and resistance zones)',
        'Connection with news flow and external event management',
        'Relevant volume and liquidity aspects',
        'Possible market halts, technical problems, or extreme price gaps'
      ]
    }
  ];

  const checklistItems = [
    'Market Environment & Sector analyzed',
    'Fundamental Data researched',
    'Chart & Price Movement documented',
    'Setup-Specific Details captured',
    'Trade Execution & Performance evaluated',
    'Psychological & Strategic observations recorded',
    'Contextual Extensions documented',
    'Screenshots uploaded for all sections'
  ];

  const charts = [
    { id: 'crwv', title: 'CRWV - Chart Study', date: '2025-01-15' },
    { id: 'aeva', title: 'AEVA - Chart Study', date: '2025-01-16' },
    { id: 'plug', title: 'PLUG - Chart Study', date: '2025-01-17' },
    { id: 'soun', title: 'SOUN - Chart Study', date: '2025-01-18' },
    { id: 'rklb', title: 'RKLB - Chart Study', date: '2025-01-19' },
    { id: 'cvna', title: 'CVNA - Chart Study', date: '2025-01-20' },
    { id: 'tsla', title: 'TSLA - Chart Study', date: '2025-01-21' },
    { id: 'riot', title: 'RIOT - Chart Study', date: '2025-01-22' },
    { id: 'mstr', title: 'MSTR - Chart Study', date: '2025-01-23' },
    { id: 'zepp', title: 'ZEPP - Chart Study', date: '2025-01-24' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Initialize chart data when selectedChart changes
  useEffect(() => {
    if (selectedChart) {
      initializeChartData(selectedChart);
    }
  }, [selectedChart]);

  const loadData = async () => {
    try {
      const savedCompleted = await storage.loadSetting('best100ChartsCompleted') || [];
      const savedNotes = await storage.loadSetting('best100ChartsNotes') || {};
      const savedScreenshots = await storage.loadSetting('best100ChartsScreenshots') || {};
      const savedChecklist = await storage.loadSetting('best100ChartsChecklist') || {};
      
      // Ensure savedCompleted is an array before creating Set
      const completedArray = Array.isArray(savedCompleted) ? savedCompleted : [];
      setCompletedCharts(new Set(completedArray));
      setNotes(savedNotes);
      setScreenshots(savedScreenshots);
      setChecklist(savedChecklist);
      
      // Initialize unsaved state with saved data
      setUnsavedNotes(savedNotes);
      setUnsavedScreenshots(savedScreenshots);
      setUnsavedChecklist(savedChecklist);
      
      // Initialize view mode for each chart
      const viewModeState = {};
      charts.forEach(chart => {
        viewModeState[chart.id] = Object.keys(savedNotes[chart.id] || {}).length > 0;
      });
      setIsViewMode(viewModeState);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Initialize data structure for a new chart
  const initializeChartData = (chartId) => {
    if (!unsavedNotes[chartId]) {
      setUnsavedNotes(prev => ({
        ...prev,
        [chartId]: {}
      }));
    }
    
    if (!unsavedScreenshots[chartId]) {
      setUnsavedScreenshots(prev => ({
        ...prev,
        [chartId]: {}
      }));
    }
    
    if (!unsavedChecklist[chartId]) {
      setUnsavedChecklist(prev => ({
        ...prev,
        [chartId]: new Array(checklistItems.length).fill(false)
      }));
    }
  };

  const saveData = async () => {
    try {
      console.log('Saving Best 100 Charts Study data...');
      
      // Ensure the current chart data is initialized
      if (selectedChart) {
        initializeChartData(selectedChart);
      }
      
      // Save the unsaved changes to the main state
      setNotes(unsavedNotes);
      setScreenshots(unsavedScreenshots);
      setChecklist(unsavedChecklist);
      
      // Ensure we have valid data to save
      const completedArray = Array.from(completedCharts);
      const notesData = unsavedNotes || {};
      const screenshotsData = unsavedScreenshots || {};
      const checklistData = unsavedChecklist || {};
      
      console.log('Data to save:', {
        completed: completedArray.length,
        notes: Object.keys(notesData).length,
        screenshots: Object.keys(screenshotsData).length,
        checklist: Object.keys(checklistData).length
      });
      
      await storage.saveSetting('best100ChartsCompleted', completedArray);
      await storage.saveSetting('best100ChartsNotes', notesData);
      await storage.saveSetting('best100ChartsScreenshots', screenshotsData);
      await storage.saveSetting('best100ChartsChecklist', checklistData);
      
      // Switch to view mode for the current chart
      setIsViewMode(prev => ({
        ...prev,
        [selectedChart]: true
      }));
      
      setHasUnsavedChanges(false);
      
      console.log('Best 100 Charts Study data saved successfully!');
      
      // Show success feedback to user
      alert('✅ Chart Study saved successfully!');
      
    } catch (error) {
      console.error('Error saving Best 100 Charts Study data:', error);
      alert('❌ Error saving chart study. Please try again.');
    }
  };

  const toggleCompleted = async (chartId) => {
    const newCompleted = new Set(completedCharts);
    if (newCompleted.has(chartId)) {
      newCompleted.delete(chartId);
    } else {
      newCompleted.add(chartId);
    }
    setCompletedCharts(newCompleted);
    
    // Save completed status immediately
    try {
      const completedArray = Array.from(newCompleted);
      await storage.saveSetting('best100ChartsCompleted', completedArray);
    } catch (error) {
      console.error('Error saving completed status:', error);
    }
  };

  const handleFileUpload = (chartId, sectionId, files) => {
    // Initialize chart data if it doesn't exist
    if (!unsavedScreenshots[chartId]) {
      setUnsavedScreenshots(prev => ({
        ...prev,
        [chartId]: {}
      }));
    }
    
    if (!unsavedScreenshots[chartId][sectionId]) {
      setUnsavedScreenshots(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [sectionId]: []
        }
      }));
    }
    
    const fileArray = Array.from(files);
    
    // Convert files to base64 strings
    const filePromises = fileArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            data: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(filePromises).then(fileData => {
      setUnsavedScreenshots(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [sectionId]: [...(prev[chartId]?.[sectionId] || []), ...fileData]
        }
      }));
      setHasUnsavedChanges(true);
    });
  };

  const toggleChecklistItem = (chartId, itemIndex) => {
    // Initialize chart checklist if it doesn't exist
    if (!unsavedChecklist[chartId]) {
      setUnsavedChecklist(prev => ({
        ...prev,
        [chartId]: new Array(checklistItems.length).fill(false)
      }));
    }
    
    const chartChecklist = unsavedChecklist[chartId] || new Array(checklistItems.length).fill(false);
    const newChecklist = [...chartChecklist];
    newChecklist[itemIndex] = !newChecklist[itemIndex];
    
    setUnsavedChecklist(prev => ({
      ...prev,
      [chartId]: newChecklist
    }));
    setHasUnsavedChanges(true);
  };

  const deleteScreenshot = (chartId, sectionId, screenshotIndex) => {
    const chartScreenshots = unsavedScreenshots[chartId]?.[sectionId] || [];
    const newScreenshots = chartScreenshots.filter((_, index) => index !== screenshotIndex);
    
    setUnsavedScreenshots(prev => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [sectionId]: newScreenshots
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (chartId, sectionId, questionIndex, value) => {
    // Initialize chart data if it doesn't exist
    if (!unsavedNotes[chartId]) {
      setUnsavedNotes(prev => ({
        ...prev,
        [chartId]: {}
      }));
    }
    
    if (!unsavedNotes[chartId][sectionId]) {
      setUnsavedNotes(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [sectionId]: {}
        }
      }));
    }
    
    const newNotes = { ...unsavedNotes };
    if (!newNotes[chartId]) newNotes[chartId] = {};
    if (!newNotes[chartId][sectionId]) newNotes[chartId][sectionId] = {};
    newNotes[chartId][sectionId][questionIndex] = value;
    setUnsavedNotes(newNotes);
    setHasUnsavedChanges(true);
  };

  const toggleEditMode = (chartId) => {
    // Initialize chart data when switching to edit mode
    initializeChartData(chartId);
    
    setIsViewMode(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }));
  };

  const discardChanges = () => {
    // Reset unsaved changes to saved state
    setUnsavedNotes(notes);
    setUnsavedScreenshots(screenshots);
    setUnsavedChecklist(checklist);
    setHasUnsavedChanges(false);
    
    // Re-initialize current chart data
    if (selectedChart) {
      initializeChartData(selectedChart);
    }
  };

  const selectedChartData = charts.find(c => c.id === selectedChart);

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#f8fafc',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          📊 Best 100 Charts Study
        </h1>

        {/* Compact Checklist */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '0.75rem'
          }}>
            📋 Chart Study Checklist ({completedCharts.size}/{charts.length} completed)
          </h2>
          <p style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginBottom: '0.75rem',
            fontStyle: 'italic'
          }}>
            💡 Click on a chart study to open the analysis. Checkbox to mark as completed.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.375rem'
          }}>
            {charts.map((chart) => (
              <div key={chart.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem',
                backgroundColor: completedCharts.has(chart.id) ? '#10b981' : '#334155',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.75rem',
                color: completedCharts.has(chart.id) ? '#ffffff' : '#cbd5e1',
                border: selectedChart === chart.id ? '2px solid #3b82f6' : '1px solid transparent'
              }}
              onClick={() => setSelectedChart(chart.id)}
              onMouseOver={(e) => e.target.style.backgroundColor = completedCharts.has(chart.id) ? '#059669' : '#475569'}
              onMouseOut={(e) => e.target.style.backgroundColor = completedCharts.has(chart.id) ? '#10b981' : '#334155'}
              >
                <input
                  type="checkbox"
                  checked={completedCharts.has(chart.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleCompleted(chart.id);
                  }}
                  style={{
                    width: '0.875rem',
                    height: '0.875rem',
                    accentColor: '#10b981'
                  }}
                />
                                 <span style={{ fontWeight: '500', flex: '1' }}>{chart.title}</span>
                {selectedChart === chart.id && (
                  <span style={{ 
                    fontSize: '0.625rem', 
                    color: '#3b82f6', 
                    fontWeight: '600',
                    marginLeft: '0.25rem'
                  }}>
                    👁️
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Section */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            🔍 Deep Chart Analysis
          </h2>

          {/* Chart Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.375rem'
            }}>
              Select Chart Study to Analyze:
            </label>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
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
              <option value="">Choose a chart study to analyze...</option>
                             {charts.map(chart => (
                 <option key={chart.id} value={chart.id}>
                   {chart.title}
                 </option>
               ))}
            </select>
          </div>

          {/* Analysis Content */}
          {selectedChartData && (
            <div>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  📈 {selectedChartData.title} Analysis
                </h3>
                
              </div>

              {/* Analysis Sections */}
              {analysisSections.map((section) => (
                <div key={section.id} style={{ 
                  marginBottom: '2rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  border: '1px solid #475569'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#10b981',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📊 {section.title}
                  </h4>
                  
                  {/* Screenshots Section */}
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#475569',
                    borderRadius: '0.375rem',
                    border: '1px solid #64748b'
                  }}>
                    <h5 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      marginBottom: '0.75rem'
                    }}>
                      📸 Screenshots for {section.title}
                    </h5>
                    
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(selectedChart, section.id, e.target.files)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#64748b',
                        border: '2px dashed #94a3b8',
                        borderRadius: '0.375rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}
                    />
                    
                    {unsavedScreenshots[selectedChart]?.[section.id] && unsavedScreenshots[selectedChart][section.id].length > 0 && (
                      <div style={{
                        display: 'grid',
                        gap: '1.5rem',
                        justifyContent: 'start'
                      }}>
                        {unsavedScreenshots[selectedChart][section.id].map((file, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <div style={{ 
                              color: '#94a3b8', 
                              fontSize: '0.875rem', 
                              fontWeight: '600',
                              marginBottom: '0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span>Screenshot {index + 1}: {file.name}</span>
                              {!isViewMode[selectedChart] && (
                                <button
                                  onClick={() => deleteScreenshot(selectedChart, section.id, index)}
                                  style={{
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                                  title="Delete screenshot"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <img 
                              src={file.data} 
                              alt={`Screenshot ${index + 1}`}
                              style={{
                                width: '100%',
                                maxHeight: '600px',
                                objectFit: 'contain',
                                borderRadius: '0.5rem',
                                border: '1px solid #64748b'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show saved screenshots in view mode */}
                    {isViewMode[selectedChart] && screenshots[selectedChart]?.[section.id] && screenshots[selectedChart][section.id].length > 0 && (
                      <div style={{
                        display: 'grid',
                        gap: '1.5rem',
                        justifyContent: 'start'
                      }}>
                        {screenshots[selectedChart][section.id].map((file, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <div style={{ 
                              color: '#94a3b8', 
                              fontSize: '0.875rem', 
                              fontWeight: '600',
                              marginBottom: '0.75rem'
                            }}>
                              <span>Screenshot {index + 1}: {file.name}</span>
                            </div>
                            <img 
                              src={file.data} 
                              alt={`Screenshot ${index + 1}`}
                              style={{
                                width: '100%',
                                maxHeight: '600px',
                                objectFit: 'contain',
                                borderRadius: '0.5rem',
                                border: '1px solid #64748b'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Analysis Questions */}
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem'
                  }}>
                    {section.questions.map((question, index) => (
                      <div key={index} style={{
                        backgroundColor: '#475569',
                        borderRadius: '0.375rem',
                        padding: '1rem',
                        border: '1px solid #64748b'
                      }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#f8fafc',
                          marginBottom: '0.5rem'
                        }}>
                          {index + 1}. {question}
                        </label>
                        {isViewMode[selectedChart] ? (
                          <div style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '0.75rem',
                            backgroundColor: '#64748b',
                            border: '1px solid #94a3b8',
                            borderRadius: '0.25rem',
                            color: '#f8fafc',
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word'
                          }}>
                            {notes[selectedChart]?.[section.id]?.[index] || unsavedNotes[selectedChart]?.[section.id]?.[index] || 'No analysis entered yet...'}
                          </div>
                        ) : (
                          <textarea
                            value={unsavedNotes[selectedChart]?.[section.id]?.[index] || notes[selectedChart]?.[section.id]?.[index] || ''}
                            onChange={(e) => handleNoteChange(selectedChart, section.id, index, e.target.value)}
                            placeholder="Enter your analysis..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              backgroundColor: '#64748b',
                              border: '1px solid #94a3b8',
                              borderRadius: '0.25rem',
                              color: '#f8fafc',
                              fontSize: '0.875rem',
                              resize: 'vertical'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Checklist */}
              <div style={{ 
                marginBottom: '2rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '1rem'
                }}>
                  ✅ Analysis Checklist
                </h4>
                
                <div style={{
                  display: 'grid',
                  gap: '0.5rem'
                }}>
                  {checklistItems.map((item, index) => (
                    <label key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#475569',
                      borderRadius: '0.25rem',
                      cursor: isViewMode[selectedChart] ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      color: (unsavedChecklist[selectedChart]?.[index] || checklist[selectedChart]?.[index]) ? '#10b981' : '#cbd5e1',
                      border: '1px solid #64748b'
                    }}>
                      <input
                        type="checkbox"
                        checked={unsavedChecklist[selectedChart]?.[index] || checklist[selectedChart]?.[index] || false}
                        onChange={() => toggleChecklistItem(selectedChart, index)}
                        disabled={isViewMode[selectedChart]}
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{ 
                        fontWeight: (unsavedChecklist[selectedChart]?.[index] || checklist[selectedChart]?.[index]) ? '600' : '400',
                        textDecoration: (unsavedChecklist[selectedChart]?.[index] || checklist[selectedChart]?.[index]) ? 'line-through' : 'none'
                      }}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {isViewMode[selectedChart] ? (
                  <button
                    onClick={() => toggleEditMode(selectedChart)}
                    style={{
                      flex: '1',
                      padding: '1rem',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    ✏️ Edit Analysis
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveData}
                      style={{
                        flex: '1',
                        padding: '1rem',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      💾 Save Analysis
                    </button>
                    {hasUnsavedChanges && (
                      <button
                        onClick={discardChanges}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        ❌ Discard
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && !isViewMode[selectedChart] && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.375rem',
                  color: '#92400e',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  ⚠️ You have unsaved changes. Click "Save Analysis" to save them.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Best100ChartsStudy;
