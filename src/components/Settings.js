import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, Trash2, DollarSign } from 'lucide-react';
import storage from '../utils/storage';

const Settings = () => {
  const [settings, setSettings] = useState({
    portfolioValue: 10000,
    defaultRiskPerTrade: 1,
    defaultCommission: 0,
    defaultBroker: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getAllSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Save each setting individually
      for (const [key, value] of Object.entries(settings)) {
        await storage.saveSetting(key, value);
      }
      alert('Einstellungen gespeichert!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
  };

  const exportData = async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-journal-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Fehler beim Exportieren der Daten');
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await storage.importData(data);
      alert('Daten erfolgreich importiert!');
      window.location.reload();
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Fehler beim Importieren der Daten');
    }
  };

  const clearAllData = async () => {
    setConfirmAction('clear');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'clear') {
      try {
        await storage.clearAll();
        alert('Alle Daten wurden gelöscht!');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Fehler beim Löschen der Daten');
      }
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Global header is rendered by App via Navigation */}

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem'
        }}>
          {/* Settings Form */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
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
              <SettingsIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
                  ⚙️ Einstellungen
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Trading Configuration & Preferences
                </p>
              </div>
            </div>
            
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              color: '#f8fafc'
            }}>
              Trading Einstellungen
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Portfolio Wert ($)
                </label>
                <input
                  type="number"
                  name="portfolioValue"
                  value={settings.portfolioValue}
                  onChange={handleInputChange}
                  step="100"
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
                <p style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.25rem'
                }}>
                  Wird für Positionsgrößen-Berechnungen verwendet
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Standard Risiko pro Trade (%)
                </label>
                <input
                  type="number"
                  name="defaultRiskPerTrade"
                  value={settings.defaultRiskPerTrade}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="100"
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
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Standard Kommission ($)
                </label>
                <input
                  type="number"
                  name="defaultCommission"
                  value={settings.defaultCommission}
                  onChange={handleInputChange}
                  step="0.01"
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
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Standard Broker
                </label>
                <input
                  type="text"
                  name="defaultBroker"
                  value={settings.defaultBroker}
                  onChange={handleInputChange}
                  placeholder="z.B. Interactive Brokers"
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

              <button
                onClick={saveSettings}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  alignSelf: 'flex-start'
                }}
              >
                <Save style={{ width: '1rem', height: '1rem' }} />
                Einstellungen speichern
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc'
            }}>
              Datenverwaltung
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button
                onClick={exportData}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download style={{ width: '1rem', height: '1rem' }} />
                Daten exportieren
              </button>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Daten importieren
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
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

              <button
                onClick={clearAllData}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} />
                Alle Daten löschen
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc'
            }}>
              Bestätigung erforderlich
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              marginBottom: '1.5rem'
            }}>
              Sind Sie sicher, dass Sie alle Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;







