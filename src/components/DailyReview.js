import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Save, Edit } from 'lucide-react';
import storage from '../utils/storage';

const DailyReview = ({ trades, onTradeUpdated }) => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: 7,
    energy: 7,
    focus: 7,
    trades: [],
    notes: '',
    lessons: '',
    goals: ''
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const loadedEntries = await storage.getDailyReviews();
      setEntries(loadedEntries || []);
    } catch (error) {
      console.error('Error loading daily reviews:', error);
      setEntries([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntries = entries.map(entry => 
          entry.id === editingEntry.id ? { ...currentEntry, id: entry.id } : entry
        );
        await storage.saveDailyReviews(updatedEntries);
        setEntries(updatedEntries);
        setEditingEntry(null);
      } else {
        // Create new entry
        const newEntry = {
          ...currentEntry,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        const updatedEntries = [newEntry, ...entries];
        await storage.saveDailyReviews(updatedEntries);
        setEntries(updatedEntries);
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving daily review:', error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    try {
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      await storage.saveDailyReviews(updatedEntries);
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error deleting daily review:', error);
    }
  };

  const resetForm = () => {
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      mood: 7,
      energy: 7,
      focus: 7,
      trades: [],
      notes: '',
      lessons: '',
      goals: ''
    });
  };

  const getMoodColor = (mood) => {
    if (mood >= 8) return '#10b981';
    if (mood >= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getMoodEmoji = (mood) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '😐';
    return '😔';
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Page Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 2rem 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <Calendar style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              Daily Review
            </h1>
            <p style={{ margin: '0.5rem 0 0 0, color: '#94a3b8', fontSize: '0.875rem' }}>
              Track your daily trading performance and mindset
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem'
      }}>
        {/* Add New Entry Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setEditingEntry(null);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
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
            Add Daily Review
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  {editingEntry ? 'Edit Daily Review' : 'New Daily Review'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                    resetForm();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'grid',
                  gap: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  {/* Date */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentEntry.date}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  {/* Mood Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem'
                  }}>
                    {[
                      { key: 'mood', label: 'Mood', emoji: '😊' },
                      { key: 'energy', label: 'Energy', emoji: '⚡' },
                      { key: 'focus', label: 'Focus', emoji: '🎯' }
                    ].map(metric => (
                      <div key={metric.key}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#94a3b8',
                          marginBottom: '0.5rem'
                        }}>
                          {metric.emoji} {metric.label}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={currentEntry[metric.key]}
                          onChange={(e) => setCurrentEntry(prev => ({ 
                            ...prev, 
                            [metric.key]: parseInt(e.target.value) 
                          }))}
                          style={{
                            width: '100%',
                            height: '8px',
                            borderRadius: '4px',
                            background: '#334155',
                            outline: 'none',
                            opacity: '0.7',
                            transition: 'opacity .2s'
                          }}
                        />
                        <div style={{
                          textAlign: 'center',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#f8fafc',
                          marginTop: '0.5rem'
                        }}>
                          {currentEntry[metric.key]}/10
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Daily Notes
                    </label>
                    <textarea
                      value={currentEntry.notes}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      placeholder="How was your trading day? Any observations?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Lessons */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Key Lessons
                    </label>
                    <textarea
                      value={currentEntry.lessons}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, lessons: e.target.value }))}
                      rows={3}
                      placeholder="What did you learn today?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Goals */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '0.5rem'
                    }}>
                      Tomorrow's Goals
                    </label>
                    <textarea
                      value={currentEntry.goals}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, goals: e.target.value }))}
                      rows={3}
                      placeholder="What do you want to focus on tomorrow?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
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

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#475569',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
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
                    <Save size={16} />
                    {editingEntry ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {entries.length === 0 ? (
            <div style={{
              backgroundColor: '#1e293b',
              padding: '3rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              textAlign: 'center'
            }}>
              <Calendar style={{
                width: '3rem',
                height: '3rem',
                color: '#94a3b8',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}>
                No Daily Reviews Yet
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                Start tracking your daily trading performance and mindset
              </p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #334155'
              }}>
                {/* Entry Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {new Date(entry.date).toLocaleDateString('de-DE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    
                    {/* Mood Metrics */}
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      {[
                        { key: 'mood', label: 'Mood', emoji: '😊' },
                        { key: 'energy', label: 'Energy', emoji: '⚡' },
                        { key: 'focus', label: 'Focus', emoji: '🎯' }
                      ].map(metric => (
                        <div key={metric.key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1.25rem' }}>{metric.emoji}</span>
                          <div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#94a3b8'
                            }}>
                              {metric.label}
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: getMoodColor(entry[metric.key])
                            }}>
                              {entry[metric.key]}/10
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => handleEdit(entry)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '0.375rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Entry Content */}
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {entry.notes && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Daily Notes
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.notes}
                      </p>
                    </div>
                  )}

                  {entry.lessons && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Key Lessons
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.lessons}
                      </p>
                    </div>
                  )}

                  {entry.goals && (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        Tomorrow's Goals
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.goals}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReview;
