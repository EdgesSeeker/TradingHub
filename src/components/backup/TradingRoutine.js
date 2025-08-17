import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  Edit3, 
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import storage from '../utils/storage';

const TradingRoutine = () => {
  const [workflows, setWorkflows] = useState({
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
  });

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const savedWorkflows = await storage.loadSetting('tradingRoutine');
      if (savedWorkflows) {
        setWorkflows(savedWorkflows);
      }
    } catch (error) {
      console.log('No saved workflows found, using defaults');
    }
  };

  const saveWorkflows = async (newWorkflows) => {
    try {
      await storage.saveSetting('tradingRoutine', newWorkflows);
      setWorkflows(newWorkflows);
      console.log('Workflows saved successfully');
    } catch (error) {
      console.error('Error saving workflows:', error);
    }
  };

  const startEditing = (workflowType, index, value) => {
    setEditingWorkflow(workflowType);
    setEditingIndex(index);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingWorkflow || editingIndex === null) return;

    const newWorkflows = { ...workflows };
    newWorkflows[editingWorkflow][editingIndex] = editValue;
    
    saveWorkflows(newWorkflows);
    setEditingWorkflow(null);
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingWorkflow(null);
    setEditingIndex(null);
    setEditValue('');
  };

  const addWorkflowItem = (workflowType) => {
    const newWorkflows = { ...workflows };
    newWorkflows[workflowType].push('Neue Aufgabe hinzufügen');
    saveWorkflows(newWorkflows);
  };

  const removeWorkflowItem = (workflowType, index) => {
    const newWorkflows = { ...workflows };
    newWorkflows[workflowType].splice(index, 1);
    saveWorkflows(newWorkflows);
  };

  const renderWorkflowItem = (workflowType, item, index) => {
    const isEditing = editingWorkflow === workflowType && editingIndex === index;
    
    if (isEditing) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.25rem',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={saveEdit}
            style={{
              padding: '0.5rem',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '0.25rem',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <Save size={16} />
          </button>
          <button
            onClick={cancelEdit}
            style={{
              padding: '0.5rem',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '0.25rem',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{item}</span>
        <button
          onClick={() => startEditing(workflowType, index, item)}
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
        <button
          onClick={() => removeWorkflowItem(workflowType, index)}
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
          <Trash2 size={12} />
        </button>
      </div>
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
        {/* Page Header */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <Clock style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              🕐 Trading Routine
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Daily & Weekly Trading Workflows
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Daily Workflow */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={20} color="#06b6d4" />
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  Daily Workflow
                </h2>
              </div>
              <button
                onClick={() => addWorkflowItem('daily')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
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
                <Plus size={16} />
                Add Task
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {workflows.daily.map((item, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.5rem',
                  border: '1px solid #475569'
                }}>
                  {renderWorkflowItem('daily', item, index)}
                </div>
              ))}
            </div>
          </div>

          {/* Sunday Workflow */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} color="#f59e0b" />
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  Sunday Workflow
                </h2>
              </div>
              <button
                onClick={() => addWorkflowItem('sunday')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
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
                <Plus size={16} />
                Add Task
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {workflows.sunday.map((item, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  backgroundColor: '#334155',
                  borderRadius: '0.5rem',
                  border: '1px solid #475569'
                }}>
                  {renderWorkflowItem('sunday', item, index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingRoutine;

