import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, BookOpen, Search, Filter, TrendingUp, TrendingDown, DollarSign, Target, Download, Eye, X } from 'lucide-react';
import storage from '../utils/storage';

const Journal = ({ trades = [], onTradeUpdated }) => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'manual'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    tags: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const loadedEntries = await storage.loadJournalEntries();
      setEntries(loadedEntries || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  // Group trades by date
  const groupTradesByDate = () => {
    const grouped = {};
    
    trades.forEach(trade => {
      const date = trade.entryDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(trade);
    });

    // Sort dates in descending order
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .reduce((acc, [date, trades]) => {
        acc[date] = trades.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
        return acc;
      }, {});
  };

  // Calculate daily statistics
  const calculateDailyStats = (dailyTrades) => {
    const stats = {
      totalTrades: dailyTrades.length,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      avgPnL: 0,
      bestTrade: null,
      worstTrade: null,
      setups: {},
      symbols: new Set()
    };

    dailyTrades.forEach(trade => {
      stats.symbols.add(trade.symbol);
      
      if (trade.setup) {
        stats.setups[trade.setup] = (stats.setups[trade.setup] || 0) + 1;
      }

      if (trade.status === 'closed' && trade.pnl !== null && trade.pnl !== undefined) {
        const pnl = parseFloat(trade.pnl);
        stats.totalPnL += pnl;
        
        if (pnl > 0) {
          stats.winningTrades++;
        } else if (pnl < 0) {
          stats.losingTrades++;
        }

        if (!stats.bestTrade || pnl > parseFloat(stats.bestTrade.pnl)) {
          stats.bestTrade = trade;
        }
        if (!stats.worstTrade || pnl < parseFloat(stats.worstTrade.pnl)) {
          stats.worstTrade = trade;
        }
      }
    });

    if (stats.totalTrades > 0) {
      stats.avgPnL = stats.totalPnL / stats.totalTrades;
    }

    return stats;
  };

  // Generate daily report content
  const generateDailyReport = (date, dailyTrades, stats) => {
    // Collect all notes from trades
    const allNotes = dailyTrades
      .filter(trade => trade.notes && trade.notes.trim())
      .map(trade => `**${trade.symbol} ${trade.side}:** ${trade.notes}`);

    const report = {
      date,
      title: `Trading Report - ${new Date(date).toLocaleDateString('de-DE')}`,
      content: `# Trading Report - ${new Date(date).toLocaleDateString('de-DE')}

## 📊 Daily Statistics
- **Total Trades:** ${stats.totalTrades}
- **Winning Trades:** ${stats.winningTrades}
- **Losing Trades:** ${stats.losingTrades}
- **Win Rate:** ${stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0}%
- **Total P&L:** $${stats.totalPnL.toFixed(2)}
- **Average P&L:** $${stats.avgPnL.toFixed(2)}
- **Symbols Traded:** ${Array.from(stats.symbols).join(', ')}

## 🎯 Setups Used
${Object.entries(stats.setups).map(([setup, count]) => `- ${setup}: ${count} trades`).join('\n')}

## 📈 Best Trade
${stats.bestTrade ? `${stats.bestTrade.symbol} ${stats.bestTrade.side} - $${parseFloat(stats.bestTrade.pnl).toFixed(2)} (${stats.bestTrade.setup || 'No setup'})` : 'No closed trades'}

## 📉 Worst Trade
${stats.worstTrade ? `${stats.worstTrade.symbol} ${stats.worstTrade.side} - $${parseFloat(stats.worstTrade.pnl).toFixed(2)} (${stats.worstTrade.setup || 'No setup'})` : 'No closed trades'}

## 📝 Trading Notes
${allNotes.length > 0 ? allNotes.join('\n\n') : '*No notes added for today\'s trades*'}

## 📋 Trade Details
${dailyTrades.map(trade => `
### ${trade.symbol} ${trade.side}
- **Entry Date:** ${trade.entryDate}
- **Entry Price:** $${trade.entryPrice}
- **Quantity:** ${trade.quantity}
- **Setup:** ${trade.setup || 'No setup'}
- **Status:** ${trade.status === 'open' ? 'Open' : 'Closed'}
${trade.status === 'closed' ? `- **Exit Price:** $${trade.exitPrice}
- **Exit Date:** ${trade.exitDate}
- **P&L:** $${trade.pnl || 'N/A'}
- **P&L %:** ${trade.pnl && trade.entryPrice && trade.quantity ? ((parseFloat(trade.pnl) / (parseFloat(trade.entryPrice) * parseFloat(trade.quantity))) * 100).toFixed(2) : 'N/A'}%` : ''}
${trade.mentalGame?.tradeReasoning ? `- **Why this trade:** ${trade.mentalGame.tradeReasoning}` : ''}
${trade.mentalGame?.emotionsThoughts ? `- **Emotions/Thoughts:** ${trade.mentalGame.emotionsThoughts}` : ''}
${trade.mentalGame?.strengthsMistakes ? `- **Strengths/Mistakes:** ${trade.mentalGame.strengthsMistakes}` : ''}
${trade.mentalGame?.nextTimeFix ? `- **Next time fix:** ${trade.mentalGame.nextTimeFix}` : ''}
${trade.notes ? `- **Notes:** ${trade.notes}` : ''}
`).join('\n')}

## 💭 Daily Reflection
*Add your daily trading reflection here...*

## 🎯 Tomorrow's Focus
*Add your focus areas for tomorrow...*`,
      mood: stats.totalPnL >= 0 ? 'positive' : 'negative',
      tags: ['daily-report', 'trading', 'coach-report'],
      timestamp: new Date().toISOString()
    };

    return report;
  };

  // Auto-generate daily report
  const generateDailyReportForDate = async (date) => {
    const groupedTrades = groupTradesByDate();
    const dailyTrades = groupedTrades[date] || [];
    
    if (dailyTrades.length === 0) {
      alert('Keine Trades für diesen Tag gefunden.');
      return;
    }

    const stats = calculateDailyStats(dailyTrades);
    const report = generateDailyReport(date, dailyTrades, stats);

    try {
      await storage.addJournalEntry(report);
      await loadEntries();
      alert(`Tagesbericht für ${new Date(date).toLocaleDateString('de-DE')} erstellt!`);
    } catch (error) {
      console.error('Error generating daily report:', error);
      alert('Fehler beim Erstellen des Tagesberichts.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Bitte füllen Sie Titel und Inhalt aus.');
      return;
    }

    try {
      const entry = {
        ...formData,
        id: editingEntry ? editingEntry.id : Date.now(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        timestamp: new Date().toISOString()
      };

      if (editingEntry) {
        await storage.updateJournalEntry(entry);
      } else {
        await storage.addJournalEntry(entry);
      }

      await loadEntries();
      resetForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Fehler beim Speichern des Eintrags.');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
      return;
    }

    try {
      await storage.deleteJournalEntry(entryId);
      await loadEntries();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      alert('Fehler beim Löschen des Eintrags.');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || 'neutral',
      tags: entry.tags ? entry.tags.join(', ') : '',
      date: entry.date
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      mood: 'neutral',
      tags: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || entry.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const groupedTrades = groupTradesByDate();

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155'
      }}>
        {/* Page Header */}
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
              📅 Journal
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Daily Reports & Trading Notes
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'daily' ? '#10b981' : 'transparent',
              border: `1px solid ${viewMode === 'daily' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: viewMode === 'daily' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Tagesberichte
          </button>
          <button
            onClick={() => setViewMode('manual')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'manual' ? '#10b981' : 'transparent',
              border: `1px solid ${viewMode === 'manual' ? '#10b981' : '#475569'}`,
              borderRadius: '0.5rem',
              color: viewMode === 'manual' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Manuelle Einträge
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        /* Daily Reports View */
        <div>
          {/* Daily Report Generator */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Tagesbericht erstellen
            </h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={() => generateDailyReportForDate(selectedDate)}
                disabled={!selectedDate}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  cursor: selectedDate ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: selectedDate ? 1 : 0.5
                }}
              >
                Bericht erstellen
              </button>
            </div>
          </div>

          {/* Trading Days Overview */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Trading Tage Übersicht
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(groupedTrades).map(([date, dailyTrades]) => {
                const stats = calculateDailyStats(dailyTrades);
                const hasReport = entries.some(entry => 
                  entry.date === date && entry.tags?.includes('daily-report')
                );
                
                return (
                  <div key={date} style={{
                    backgroundColor: '#334155',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #475569'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {new Date(date).toLocaleDateString('de-DE')}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!hasReport && (
                          <button
                            onClick={() => generateDailyReportForDate(date)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#10b981',
                              border: 'none',
                              borderRadius: '0.25rem',
                              color: '#f8fafc',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            Bericht erstellen
                          </button>
                        )}
                        {hasReport && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#059669',
                            borderRadius: '0.25rem',
                            color: '#f8fafc',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            Bericht vorhanden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div>📊 {stats.totalTrades} Trades</div>
                      <div>✅ {stats.winningTrades} Gewinner</div>
                      <div>❌ {stats.losingTrades} Verlierer</div>
                      <div style={{ color: stats.totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
                        💰 ${stats.totalPnL.toFixed(2)}
                      </div>
                      <div>📈 {stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0}% Win Rate</div>
                    </div>
                    
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {dailyTrades.map(trade => trade.symbol).join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated Reports */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Erstellte Tagesberichte
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredEntries
                .filter(entry => entry.tags?.includes('daily-report'))
                .map(entry => (
                  <div key={entry.id} style={{
                    backgroundColor: '#334155',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #475569'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {entry.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(entry)}
                          style={{
                            color: '#10b981',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                          title="Bearbeiten"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          style={{
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                          title="Löschen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      {new Date(entry.timestamp).toLocaleString('de-DE')}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#cbd5e1',
                      maxHeight: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {entry.content.substring(0, 200)}...
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Manual Entries View */
        <div>
          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Suche in Einträgen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              Neuer Eintrag
            </button>
          </div>

          {/* Entries List */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredEntries
              .filter(entry => !entry.tags?.includes('daily-report'))
              .map(entry => (
                <div key={entry.id} style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {entry.title}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        {new Date(entry.date).toLocaleDateString('de-DE')} • {entry.mood}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          color: '#10b981',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                        title="Bearbeiten"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {entry.content}
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {entry.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#475569',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#cbd5e1'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #334155'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h3>
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
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Titel
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Stimmung
                  </label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="positive">Positiv</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negativ</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Inhalt
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows="10"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Tags (kommagetrennt)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #334155'
              }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal; 