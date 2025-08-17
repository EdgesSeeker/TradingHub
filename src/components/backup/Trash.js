import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import storage from '../utils/storage';

const Trash = ({ onTradeRestored }) => {
  const [deletedTrades, setDeletedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadDeletedTrades();
  }, []);

  const loadDeletedTrades = async () => {
    try {
      setLoading(true);
      const trades = await storage.loadDeletedTrades();
      setDeletedTrades(trades);
    } catch (error) {
      console.error('Error loading deleted trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreTrade = async (tradeId) => {
    try {
      setRestoring(true);
      const restoredTrade = await storage.restoreTrade(tradeId);
      
      // Update local state
      setDeletedTrades(prev => prev.filter(trade => trade.id !== tradeId));
      
      // Notify parent component
      if (onTradeRestored) {
        onTradeRestored(restoredTrade);
      }
      
      alert(`✅ Trade ${restoredTrade.symbol} wurde erfolgreich wiederhergestellt!`);
    } catch (error) {
      console.error('Error restoring trade:', error);
      alert(`Fehler beim Wiederherstellen des Trades: ${error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const permanentlyDeleteTrade = async (tradeId) => {
    const confirmed = window.confirm(
      'Sind Sie sicher, dass Sie diesen Trade endgültig löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
    );
    
    if (!confirmed) return;
    
    try {
      await storage.permanentlyDeleteTrade(tradeId);
      setDeletedTrades(prev => prev.filter(trade => trade.id !== tradeId));
      alert('Trade wurde endgültig gelöscht.');
    } catch (error) {
      console.error('Error permanently deleting trade:', error);
      alert(`Fehler beim endgültigen Löschen: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔄</div>
          <div>Lade gelöschte Trades...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
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
        <Trash2 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            🗑️ Papierkorb
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            Deleted Trades & Recovery
          </p>
        </div>
      </div>

      {deletedTrades.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#94a3b8'
        }}>
          <Trash2 size={64} color="#475569" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Papierkorb ist leer
          </h3>
          <p>Keine gelöschten Trades gefunden.</p>
        </div>
      ) : (
        <div>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span style={{ fontWeight: '600', color: '#f59e0b' }}>Wichtiger Hinweis</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
              Gelöschte Trades werden für 30 Tage im Papierkorb gespeichert. Danach werden sie automatisch endgültig gelöscht.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {deletedTrades.map(trade => (
              <div key={trade.id} style={{
                backgroundColor: '#1e293b',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#f8fafc'
                    }}>
                      {trade.symbol}
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: trade.side === 'BUY' ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}>
                      {trade.side}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8'
                    }}>
                      {trade.quantity} shares @ ${parseFloat(trade.entryPrice).toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Entry Date:</span>
                      <div style={{ color: '#f8fafc' }}>{formatDate(trade.entryDate)}</div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Deleted:</span>
                      <div style={{ color: '#f8fafc' }}>{formatDate(trade.deletedAt)}</div>
                    </div>
                    {trade.notes && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Notes:</span>
                        <div style={{ color: '#f8fafc' }}>{trade.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => restoreTrade(trade.id)}
                    disabled={restoring}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      cursor: restoring ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: restoring ? 0.6 : 1
                    }}
                    title="Trade wiederherstellen"
                  >
                    <RotateCcw size={16} />
                    Wiederherstellen
                  </button>
                  
                  <button
                    onClick={() => permanentlyDeleteTrade(trade.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: '0.5rem',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    title="Trade endgültig löschen"
                  >
                    <Trash2 size={16} />
                    Endgültig löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trash;
