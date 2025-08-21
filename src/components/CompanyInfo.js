import React, { useState, useEffect } from 'react';
import { Building2, Search, FileText, TrendingUp, Plus, Edit, Save, X, Calendar } from 'lucide-react';
import storage from '../utils/storage';

const CompanyInfo = () => {
  const [symbol, setSymbol] = useState('');
  const [companyAnalysis, setCompanyAnalysis] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState({
    companyName: '',
    hashtags: '',
    description: '',
    catalysts: [],
    news: [],
    overallScore: '',
    strengths: '',
    risks: '',
    riskReward: ''
  });
  const [showTextInput, setShowTextInput] = useState(false);

  // Load saved analyses on component mount
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  // Parse company analysis text into structured data
  const parseCompanyAnalysis = (text) => {
    if (!text.trim()) {
      setParsedData({
        companyName: '',
        hashtags: '',
        description: '',
        catalysts: [],
        news: [],
        overallScore: '',
        strengths: '',
        risks: '',
        riskReward: ''
      });
      return;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const parsed = {
      companyName: '',
      hashtags: '',
      description: '',
      catalysts: [],
      news: [],
      overallScore: '',
      strengths: '',
      risks: '',
      riskReward: ''
    };

    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Company Name and hashtags
      if (line.includes('– Company Snapshot')) {
        parsed.companyName = line.replace('– Company Snapshot', '').trim();
        // Look for hashtags in next line
        if (i + 1 < lines.length && lines[i + 1].includes('#')) {
          parsed.hashtags = lines[i + 1];
          i++; // Skip next line
        }
      }
      
      // Company Description
      else if (line.includes('🏢 Company Description')) {
        currentSection = 'description';
      }
      else if (currentSection === 'description' && line && !line.includes('🚀')) {
        parsed.description = line;
        currentSection = '';
      }
      
      // Catalysts
      else if (line.includes('🚀 Major Near-term Catalysts')) {
        currentSection = 'catalysts';
      }
      else if (currentSection === 'catalysts' && line && !line.includes('📰')) {
        if (line.trim()) {
          parsed.catalysts.push(line);
        }
      }
      else if (line.includes('📰 Latest Important News Headlines')) {
        currentSection = 'news';
      }
      else if (currentSection === 'news' && line && !line.includes('⭐')) {
        if (line.trim()) {
          parsed.news.push(line);
        }
      }
      
      // Overall Score
      else if (line.includes('⭐ Overall Score')) {
        currentSection = 'score';
      }
      else if (currentSection === 'score' && line.includes('➡️ Strengths:')) {
        parsed.strengths = line.replace('➡️ Strengths:', '').trim();
      }
      else if (currentSection === 'score' && line.includes('➡️ Risks:')) {
        parsed.risks = line.replace('➡️ Risks:', '').trim();
        currentSection = '';
      }
      else if (currentSection === 'score' && line && !line.includes('➡️')) {
        parsed.overallScore = line;
      }
      
      // Risk/Reward Summary
      else if (line.includes('⚖️ Risk/Reward Summary')) {
        currentSection = 'riskReward';
      }
      else if (currentSection === 'riskReward' && line) {
        parsed.riskReward = line;
        currentSection = '';
      }
    }

    setParsedData(parsed);
  };

  const loadSavedAnalyses = async () => {
    try {
      const analyses = await storage.loadSetting('companyAnalyses') || [];
      setSavedAnalyses(analyses);
    } catch (error) {
      console.log('Error loading saved analyses:', error);
      setSavedAnalyses([]);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!symbol.trim() || !companyAnalysis.trim()) {
      alert('Please enter both symbol and analysis');
      return;
    }

    setIsLoading(true);
    try {
      const newAnalysis = {
        id: Date.now().toString(),
        symbol: symbol.toUpperCase(),
        analysis: companyAnalysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedAnalyses = [...savedAnalyses, newAnalysis];
      await storage.saveSetting('companyAnalyses', updatedAnalyses);
      setSavedAnalyses(updatedAnalyses);
      
      // Clear form
      setSymbol('');
      setCompanyAnalysis('');
      setIsEditing(false);
      
      alert('Company analysis saved successfully!');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Error saving analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAnalysis = async () => {
    if (!selectedAnalysis || !symbol.trim() || !companyAnalysis.trim()) {
      alert('Please enter both symbol and analysis content');
      return;
    }

    setIsLoading(true);
    try {
      const updatedAnalysis = {
        ...selectedAnalysis,
        symbol: symbol.toUpperCase(),
        analysis: companyAnalysis,
        updatedAt: new Date().toISOString()
      };

      const updatedAnalyses = savedAnalyses.map(analysis => 
        analysis.id === selectedAnalysis.id ? updatedAnalysis : analysis
      );
      
      await storage.saveSetting('companyAnalyses', updatedAnalyses);
      setSavedAnalyses(updatedAnalyses);
      setSelectedAnalysis(updatedAnalysis);
      setIsEditing(false);
      
      alert('Company analysis updated successfully!');
    } catch (error) {
      console.error('Error updating analysis:', error);
      alert('Error updating analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== analysisId);
      await storage.saveSetting('companyAnalyses', updatedAnalyses);
      setSavedAnalyses(updatedAnalyses);
      
      if (selectedAnalysis && selectedAnalysis.id === analysisId) {
        setSelectedAnalysis(null);
        setSymbol('');
        setCompanyAnalysis('');
        setIsEditing(false);
      }
      
      alert('Analysis deleted successfully!');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Error deleting analysis. Please try again.');
    }
  };

  const handleSelectAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setSymbol(analysis.symbol);
    setCompanyAnalysis(analysis.analysis);
    parseCompanyAnalysis(analysis.analysis);
    setIsEditing(false);
  };

  const handleNewAnalysis = () => {
    setSelectedAnalysis({ id: 'new', symbol: '', analysis: '' });
    setSymbol('');
    setCompanyAnalysis('');
    setParsedData({
      companyName: '',
      hashtags: '',
      description: '',
      catalysts: [],
      news: [],
      overallScore: '',
      strengths: '',
      risks: '',
      riskReward: ''
    });
    setShowTextInput(false);
    setIsEditing(true);
  };

  const handleEditAnalysis = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (selectedAnalysis) {
      setCompanyAnalysis(selectedAnalysis.analysis);
      parseCompanyAnalysis(selectedAnalysis.analysis);
    } else {
      setCompanyAnalysis('');
      setParsedData({
        companyName: '',
        hashtags: '',
        description: '',
        catalysts: [],
        news: [],
        overallScore: '',
        strengths: '',
        risks: '',
        riskReward: ''
      });
    }
    setShowTextInput(false);
    setIsEditing(false);
  };

  // Load analyses from trade planning
  const loadFromTradePlanning = async () => {
    try {
      const tradePlans = await storage.loadSetting('tradePlans') || [];
      const analysesFromPlans = tradePlans
        .filter(plan => plan.companyAnalysis && plan.companyAnalysis.trim())
        .map(plan => ({
          id: `tp_${plan.id}`,
          symbol: plan.symbol,
          analysis: plan.companyAnalysis,
          createdAt: plan.createdAt,
          updatedAt: plan.createdAt,
          source: 'trade_planning'
        }));

      if (analysesFromPlans.length > 0) {
        const existingAnalyses = await storage.loadSetting('companyAnalyses') || [];
        const newAnalyses = [...existingAnalyses];
        
        analysesFromPlans.forEach(analysis => {
          const exists = existingAnalyses.some(existing => 
            existing.symbol === analysis.symbol && existing.source === 'trade_planning'
          );
          if (!exists) {
            newAnalyses.push(analysis);
          }
        });

        await storage.saveSetting('companyAnalyses', newAnalyses);
        setSavedAnalyses(newAnalyses);
        alert(`Loaded ${analysesFromPlans.length} analyses from Trade Planning!`);
        // Parse the first loaded analysis if any
        if (analysesFromPlans.length > 0) {
          parseCompanyAnalysis(analysesFromPlans[0].analysis);
        }
      } else {
        alert('No company analyses found in Trade Planning');
      }
    } catch (error) {
      console.error('Error loading from trade planning:', error);
      alert('Error loading analyses from Trade Planning');
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      color: '#f8fafc'
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Building2 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              Company Analysis Manager
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Manage and view company analyses for trading decisions
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={loadFromTradePlanning}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#475569',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={16} />
            Load from Trade Planning
          </button>
          
          <button
            onClick={handleNewAnalysis}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            New Analysis
          </button>
        </div>
      </div>

             <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Left Column - Saved Analyses List */}
        <div>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #334155',
              backgroundColor: '#334155'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: 0,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FileText size={18} />
                Saved Analyses ({savedAnalyses.length})
              </h2>
            </div>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {savedAnalyses.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>
                  <FileText size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    No saved analyses yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {savedAnalyses.map(analysis => (
                    <div
                      key={analysis.id}
                      onClick={() => handleSelectAnalysis(analysis)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #334155',
                        cursor: 'pointer',
                        backgroundColor: selectedAnalysis?.id === analysis.id ? '#3b82f6' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#f8fafc'
                        }}>
                          {analysis.symbol}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnalysis(analysis.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        {new Date(analysis.createdAt).toLocaleDateString('de-DE')}
                        {analysis.source === 'trade_planning' && (
                          <span style={{
                            backgroundColor: '#475569',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            marginLeft: '0.5rem',
                            fontSize: '0.625rem'
                          }}>
                            Trade Planning
                          </span>
                        )}
                      </div>
                      
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#cbd5e1',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {analysis.analysis.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Editor/Viewer */}
        <div>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #334155'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                {selectedAnalysis ? `${selectedAnalysis.symbol} Analysis` : 'New Analysis'}
              </h2>
              
              {selectedAnalysis && selectedAnalysis.id !== 'new' && !isEditing && (
                <button
                  onClick={handleEditAnalysis}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#475569',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>

            {selectedAnalysis === null && !isEditing ? (
              <div style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '2rem'
              }}>
                <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ marginBottom: '0.5rem', color: '#f8fafc' }}>
                  No Analysis Selected
                </h3>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  Select an analysis from the list or create a new one.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g., AAPL, TSLA, NVDA"
                    disabled={selectedAnalysis && !isEditing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      disabled: selectedAnalysis && !isEditing
                    }}
                  />
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8'
                    }}>
                      Analysis Content *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTextInput(!showTextInput)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: showTextInput ? '#1e3a8a' : 'transparent'
                      }}
                    >
                      {showTextInput ? 'Hide Text Input' : 'Show Text Input'}
                    </button>
                  </div>
                  
                  {showTextInput && (
                    <textarea
                      value={companyAnalysis}
                      onChange={(e) => {
                        setCompanyAnalysis(e.target.value);
                        parseCompanyAnalysis(e.target.value);
                      }}
                      placeholder="Paste your structured analysis here... (Company Snapshot, Catalysts, News, etc.)"
                      disabled={selectedAnalysis && !isEditing}
                      style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.375rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        lineHeight: '1.5',
                        marginBottom: '1rem'
                      }}
                    />
                  )}
                  
                  {!showTextInput && !companyAnalysis.trim() && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      borderStyle: 'dashed'
                    }}>
                      Click "Show Text Input" to add your analysis
                    </div>
                  )}
                </div>

                {/* Structured View */}
                {companyAnalysis.trim() && (
                  <div style={{ marginTop: '1rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      marginBottom: '1rem',
                      borderBottom: '1px solid #334155',
                      paddingBottom: '0.5rem'
                    }}>
                      📊 Structured Analysis View
                    </h3>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {/* Company Name & Hashtags */}
                      {parsedData.companyName && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                            {parsedData.companyName}
                          </h4>
                          {parsedData.hashtags && (
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>
                              {parsedData.hashtags}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Company Description */}
                      {parsedData.description && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                            🏢 Company Description
                          </h4>
                          <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {parsedData.description}
                          </p>
                        </div>
                      )}

                      {/* Catalysts */}
                      {parsedData.catalysts.length > 0 && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                            🚀 Major Near-term Catalysts
                          </h4>
                          <ul style={{ color: '#cbd5e1', margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {parsedData.catalysts.map((catalyst, index) => (
                              <li key={index} style={{ marginBottom: '0.25rem' }}>{catalyst}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* News */}
                      {parsedData.news.length > 0 && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                            📰 Latest Important News Headlines
                          </h4>
                          <ul style={{ color: '#cbd5e1', margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {parsedData.news.map((news, index) => (
                              <li key={index} style={{ marginBottom: '0.25rem' }}>{news}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Overall Score */}
                      {(parsedData.overallScore || parsedData.strengths || parsedData.risks) && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                            ⭐ Overall Score
                          </h4>
                          {parsedData.overallScore && (
                            <p style={{ color: '#cbd5e1', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                              {parsedData.overallScore}
                            </p>
                          )}
                          {parsedData.strengths && (
                            <p style={{ color: '#10b981', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
                              <strong>Strengths:</strong> {parsedData.strengths}
                            </p>
                          )}
                          {parsedData.risks && (
                            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>
                              <strong>Risks:</strong> {parsedData.risks}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Risk/Reward Summary */}
                      {parsedData.riskReward && (
                        <div style={{
                          backgroundColor: '#334155',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #475569'
                        }}>
                          <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                            ⚖️ Risk/Reward Summary
                          </h4>
                          <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {parsedData.riskReward}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {isEditing && (
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#475569',
                        border: 'none',
                        borderRadius: '0.375rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    onClick={selectedAnalysis ? handleUpdateAnalysis : handleSaveAnalysis}
                    disabled={isLoading || !symbol.trim() || !companyAnalysis.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: isLoading || !symbol.trim() || !companyAnalysis.trim() ? '#475569' : '#3b82f6',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#ffffff',
                      cursor: isLoading || !symbol.trim() || !companyAnalysis.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    {isLoading ? 'Saving...' : (selectedAnalysis ? 'Update' : 'Save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
