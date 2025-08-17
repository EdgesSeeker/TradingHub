import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Settings, 
  BarChart3, 
  Calendar, 
  Edit3, 
  Save, 
  Clock, 
  TrendingUp, 
  Shield, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  Database,
  History,
  Zap
} from 'lucide-react';
import storage from '../utils/storage';

const SystemOverview = () => {
  const [systemData, setSystemData] = useState({
    mission: {
      statement: "Starting with $5.100, design, implement, and continuously improve a swing trading system that requires minimal daily actions and can scale beyond $1,000,000 within 24 months.",
      startDate: "2025-06-23",
      startEquity: 5100,
      targetGain: 1000,
      maxDailyHours: 4
    },
    resources: {
      startDate: "2025-06-23",
      startEquity: 5100,
      target: 1000
    },
    timeCommitment: {
      maxDailyHours: 4
    },
    mainRules: {
      marketFilter: "QQQ & SPY 10DSMA Close > 20D SMA Close",
      positionSize: 5,
      portfolioAPTR: 7,
      maxPositionDrawdown: 2,
      fiftyPercentRule: "50%-Regel (weitere Details siehe Execution Rules)",
      totalDrawdown: "Details anpassbar"
    },
    setups: {
      firstTouch: {
        name: "1st-touch",
        move: "> 50% Range der letzten 60 Tage",
        pullback: "Aktueller Kurs unter dem Hoch",
        undercut: "Price unter 10/20/50DSMA",
        reclaim: "Gestern Close > 10DSMA & APTR<1",
        surf: ">=1 Tag Haltedauer",
        getTight: "APTR(1) <= APTR(14)",
        aptr: 5,
        volume: "> 10x Account aber mind. $30M"
      },
      firstFlag: {
        name: "1st-flag",
        description: "Regelset identisch zu 1st-touch, ggf. individuell anpassbar"
      },
      dayOneRunner: {
        name: "Day One Runner",
        description: "ebenfalls wie oben, ggf. separate Kriterien"
      }
    },
    scanCriteria: {
      atrPercent: 7.0,
      dollarVolume: 30000000,
      priceVs10dSMA: -1.0
    },
    executionRules: {
      buyTrigger: "Über Triggerlinie",
      stopLoss: "LOD oder naheliegendes Level (nicht mehr als 1% Drawdown)",
      trim: "Verkaufe nach Tag 3, 30-50%",
      exit: "Erstes Close unter 10DSMA",
      specialExit: "Gap down auf News >10%"
    },
    workflows: {
      daily: [
        "Premarket / Session: PNL-Log, Spreadsheet-Update",
        "Nightly Scan: Watchlist bauen, Triggers setzen",
        "Spreadsheet aktualisieren: Focus List, Trigger ausführen"
      ],
      sunday: [
        "Scan: Trading-Metriken",
        "Weekly Trades uploaden/journaling",
        "Regelbrüche prüfen, Korrekturmaßnahmen",
        "Verbesserungsaktion pro Woche",
        "Beginn & Ende Portfolio Tracking"
      ]
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [systemLog, setSystemLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    loadSystemData();
    loadSystemLog();
  }, []);

  const loadSystemData = async () => {
    try {
      const savedData = await storage.loadSetting('systemOverview');
      if (savedData) {
        setSystemData(savedData);
      }
    } catch (error) {
      console.log('No saved system data found, using defaults');
    }
  };

  const loadSystemLog = async () => {
    try {
      const savedLog = await storage.loadSetting('systemLog');
      if (savedLog) {
        setSystemLog(savedLog);
      }
    } catch (error) {
      console.log('No saved system log found');
    }
  };

  const saveSystemData = async (newData) => {
    try {
      await storage.saveSetting('systemOverview', newData);
      setSystemData(newData);
      
      // Add to system log
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'System data updated',
        user: 'User',
        details: 'System overview data modified'
      };
      
      const updatedLog = [logEntry, ...systemLog.slice(0, 99)]; // Keep last 100 entries
      await storage.saveSetting('systemLog', updatedLog);
      setSystemLog(updatedLog);
      
      console.log('System data saved successfully');
    } catch (error) {
      console.error('Error saving system data:', error);
    }
  };

  const startEditing = (path, value) => {
    setEditingField(path);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingField) return;

    const newData = { ...systemData };
    const pathParts = editingField.split('.');
    let current = newData;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    
    // Convert to number if the field is numeric
    const fieldName = pathParts[pathParts.length - 1];
    const isNumericField = ['positionSize', 'portfolioAPTR', 'maxPositionDrawdown', 'atrPercent', 'dollarVolume', 'priceVs10dSMA', 'aptr', 'startEquity', 'targetGain', 'maxDailyHours'].includes(fieldName);
    
    current[fieldName] = isNumericField ? parseFloat(editValue) || 0 : editValue;
    
    saveSystemData(newData);
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableField = (path, value, type = 'text', min = null, max = null) => {
    const isEditing = editingField === path;
    
    if (isEditing) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {type === 'number' ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              min={min}
              max={max}
              step={min && max ? (max - min) / 100 : 0.01}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.25rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.25rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                width: '100%'
              }}
            />
          )}
          <button
            onClick={saveEdit}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '0.25rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            <Save size={12} />
          </button>
          <button
            onClick={cancelEdit}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '0.25rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            ✕
          </button>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{value}</span>
        <button
          onClick={() => startEditing(path, value)}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '0.25rem',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          <Edit3 size={12} />
        </button>
      </div>
    );
  };

  const renderChecklist = (items, path) => {
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => (
          <li key={index} style={{ 
            marginBottom: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.25rem',
            border: '1px solid #334155'
          }}>
            {renderEditableField(`${path}.${index}`, item)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        padding: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setShowLog(!showLog)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: showLog ? '#ef4444' : '#3b82f6',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <History size={16} />
            {showLog ? 'Hide Log' : 'Show Log'}
          </button>
        </div>
      </div>

      {/* System Log */}
      {showLog && (
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1rem',
          borderBottom: '1px solid #334155'
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>System Change Log</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {systemLog.map((entry, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                backgroundColor: '#334155',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div style={{ color: '#f8fafc' }}>{entry.action}</div>
                <div style={{ color: '#94a3b8' }}>{entry.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 2rem 1rem'
      }}>
        <h1 style={{ 
          margin: '0 0 2rem 0', 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          ⚡ System Overview
        </h1>
        <p style={{ 
          margin: '0 0 2rem 0', 
          color: '#94a3b8', 
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          Swing Trading System & Mission Rules
        </p>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem'
      }}>
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Mission Statement */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Target size={20} color="#3b82f6" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Mission Statement
              </h2>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              {renderEditableField('mission.statement', systemData.mission.statement)}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Start Date</label>
                {renderEditableField('mission.startDate', systemData.mission.startDate)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Start Equity ($)</label>
                {renderEditableField('mission.startEquity', systemData.mission.startEquity, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Target Gain ($)</label>
                {renderEditableField('mission.targetGain', systemData.mission.targetGain, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Max Daily Hours</label>
                {renderEditableField('mission.maxDailyHours', systemData.mission.maxDailyHours, 'number')}
              </div>
            </div>
          </div>

          {/* Main Rules */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Shield size={20} color="#10b981" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Main Rules
              </h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Market Filter</label>
                {renderEditableField('mainRules.marketFilter', systemData.mainRules.marketFilter)}
              </div>
                             <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Position Size (%)</label>
                 {renderEditableField('mainRules.positionSize', systemData.mainRules.positionSize, 'number', 5, 30)}
               </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Portfolio APTR Threshold</label>
                {renderEditableField('mainRules.portfolioAPTR', systemData.mainRules.portfolioAPTR, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Max Position Drawdown (%)</label>
                {renderEditableField('mainRules.maxPositionDrawdown', systemData.mainRules.maxPositionDrawdown, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>50% Rule</label>
                {renderEditableField('mainRules.fiftyPercentRule', systemData.mainRules.fiftyPercentRule)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Drawdown</label>
                {renderEditableField('mainRules.totalDrawdown', systemData.mainRules.totalDrawdown)}
              </div>
            </div>
          </div>

          {/* Setups */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <BarChart3 size={20} color="#f59e0b" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Setups
              </h2>
            </div>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              
              {/* 1st Touch */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem'
                }}>
                  {systemData.setups.firstTouch.name}
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Move</label>
                    {renderEditableField('setups.firstTouch.move', systemData.setups.firstTouch.move)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pullback</label>
                    {renderEditableField('setups.firstTouch.pullback', systemData.setups.firstTouch.pullback)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Undercut</label>
                    {renderEditableField('setups.firstTouch.undercut', systemData.setups.firstTouch.undercut)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Reclaim</label>
                    {renderEditableField('setups.firstTouch.reclaim', systemData.setups.firstTouch.reclaim)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Surf</label>
                    {renderEditableField('setups.firstTouch.surf', systemData.setups.firstTouch.surf)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Get Tight</label>
                    {renderEditableField('setups.firstTouch.getTight', systemData.setups.firstTouch.getTight)}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>APTR</label>
                    {renderEditableField('setups.firstTouch.aptr', systemData.setups.firstTouch.aptr, 'number')}
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Volume</label>
                    {renderEditableField('setups.firstTouch.volume', systemData.setups.firstTouch.volume)}
                  </div>
                </div>
              </div>

              {/* 1st Flag */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem'
                }}>
                  {systemData.setups.firstFlag.name}
                </h3>
                {renderEditableField('setups.firstFlag.description', systemData.setups.firstFlag.description)}
              </div>

              {/* Day One Runner */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '1rem'
                }}>
                  {systemData.setups.dayOneRunner.name}
                </h3>
                {renderEditableField('setups.dayOneRunner.description', systemData.setups.dayOneRunner.description)}
              </div>
            </div>
          </div>

          {/* Scan Criteria */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Database size={20} color="#8b5cf6" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Scan Criteria
              </h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>ATR % (14d)</label>
                {renderEditableField('scanCriteria.atrPercent', systemData.scanCriteria.atrPercent, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Dollar Volume ($)</label>
                {renderEditableField('scanCriteria.dollarVolume', systemData.scanCriteria.dollarVolume, 'number')}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Price vs 10dSMA (%)</label>
                {renderEditableField('scanCriteria.priceVs10dSMA', systemData.scanCriteria.priceVs10dSMA, 'number')}
              </div>
            </div>
          </div>

          {/* Execution Rules */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <TrendingUp size={20} color="#ef4444" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Execution Rules
              </h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Buy Trigger</label>
                {renderEditableField('executionRules.buyTrigger', systemData.executionRules.buyTrigger)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stop Loss</label>
                {renderEditableField('executionRules.stopLoss', systemData.executionRules.stopLoss)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Trim</label>
                {renderEditableField('executionRules.trim', systemData.executionRules.trim)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Exit</label>
                {renderEditableField('executionRules.exit', systemData.executionRules.exit)}
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Special Exit</label>
                {renderEditableField('executionRules.specialExit', systemData.executionRules.specialExit)}
              </div>
            </div>
          </div>

          {/* Workflows */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Calendar size={20} color="#06b6d4" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                Workflows
              </h2>
            </div>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              
              {/* Daily Workflow */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
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
                  <Clock size={16} />
                  Daily Workflow
                </h3>
                {renderChecklist(systemData.workflows.daily, 'workflows.daily')}
              </div>

              {/* Sunday Workflow */}
              <div style={{
                backgroundColor: '#334155',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
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
                  <Calendar size={16} />
                  Sunday Workflow
                </h3>
                {renderChecklist(systemData.workflows.sunday, 'workflows.sunday')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
