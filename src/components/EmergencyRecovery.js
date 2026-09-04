import React, { useState, useEffect } from 'react';
import migrationManager from '../utils/migration';
import advancedStorage from '../utils/advancedStorage';
import './EmergencyRecovery.css';

const EmergencyRecovery = () => {
  const [migrationBackups, setMigrationBackups] = useState([]);
  const [emergencyBackups, setEmergencyBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dataIntegrity, setDataIntegrity] = useState(null);

  useEffect(() => {
    loadBackups();
    checkDataIntegrity();
  }, []);

  const loadBackups = () => {
    // Migration-Backups laden
    const migrationKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('migration_backup_'))
      .map(key => {
        const backupData = localStorage.getItem(key);
        const data = JSON.parse(backupData);
        return {
          id: key.replace('migration_backup_', ''),
          timestamp: data.exportTimestamp,
          type: 'migration',
          size: new Blob([backupData]).size,
          dataCount: data.trades ? data.trades.length : 0
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Emergency-Backups laden
    const emergencyKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('emergency_backup_'))
      .map(key => {
        const backupData = localStorage.getItem(key);
        const data = JSON.parse(backupData);
        return {
          id: key.replace('emergency_backup_', ''),
          timestamp: data.exportTimestamp,
          type: 'emergency',
          size: new Blob([backupData]).size,
          dataCount: data.trades ? data.trades.length : 0
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setMigrationBackups(migrationKeys);
    setEmergencyBackups(emergencyKeys);
  };

  const checkDataIntegrity = async () => {
    try {
      const db = await advancedStorage.db;
      if (db) {
        const validation = await migrationManager.validateDataIntegrity(db);
        setDataIntegrity(validation);
      }
    } catch (error) {
      console.error('Fehler beim Prüfen der Datenintegrität:', error);
      setDataIntegrity({
        success: false,
        errors: ['Fehler beim Prüfen der Datenintegrität'],
        warnings: [],
        dataCounts: {}
      });
    }
  };

  const restoreFromMigrationBackup = async (backupId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Migration-Backup wiederherstellen möchten? Alle aktuellen Daten werden überschrieben!')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await migrationManager.rollbackMigration(backupId);
      
      if (result.success) {
        setMessage(`✅ Migration-Backup erfolgreich wiederhergestellt: ${backupId}`);
        await loadBackups();
        await checkDataIntegrity();
        
        // Seite neu laden um Änderungen zu reflektieren
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Wiederherstellung fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Wiederherstellungs-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromEmergencyBackup = async (backupId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Emergency-Backup wiederherstellen möchten? Alle aktuellen Daten werden überschrieben!')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const backupData = localStorage.getItem(`emergency_backup_${backupId}`);
      if (!backupData) {
        throw new Error('Emergency-Backup nicht gefunden');
      }

      const data = JSON.parse(backupData);
      
      // Daten in die aktuelle Datenbank importieren
      await advancedStorage.restoreFromBackup(backupId);
      
      setMessage(`✅ Emergency-Backup erfolgreich wiederhergestellt: ${backupId}`);
      await loadBackups();
      await checkDataIntegrity();
      
      // Seite neu laden um Änderungen zu reflektieren
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(`❌ Wiederherstellungs-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = (backupId, type) => {
    try {
      const key = type === 'migration' ? `migration_backup_${backupId}` : `emergency_backup_${backupId}`;
      const backupData = localStorage.getItem(key);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-journal-${type}-backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(`📥 ${type === 'migration' ? 'Migration' : 'Emergency'}-Backup heruntergeladen: ${backupId}`);
    } catch (error) {
      setMessage(`❌ Download-Fehler: ${error.message}`);
    }
  };

  const deleteBackup = (backupId, type) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Backup löschen möchten?')) {
      return;
    }

    try {
      const key = type === 'migration' ? `migration_backup_${backupId}` : `emergency_backup_${backupId}`;
      localStorage.removeItem(key);
      setMessage(`🗑️ ${type === 'migration' ? 'Migration' : 'Emergency'}-Backup gelöscht: ${backupId}`);
      loadBackups();
    } catch (error) {
      setMessage(`❌ Lösch-Fehler: ${error.message}`);
    }
  };

  const createEmergencyBackup = async () => {
    setLoading(true);
    setMessage('');

    try {
      const backupId = await advancedStorage.createEmergencyBackup();
      setMessage(`🚨 Emergency-Backup erstellt: ${backupId}`);
      await loadBackups();
    } catch (error) {
      setMessage(`❌ Emergency-Backup-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div className="emergency-recovery">
      <div className="recovery-header">
        <h2>🚨 Emergency Recovery</h2>
        <p>Notfall-Wiederherstellung bei Datenverlust oder fehlerhaften Migrationen</p>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Datenintegritäts-Status */}
      {dataIntegrity && (
        <div className="data-integrity">
          <h3>📊 Datenintegritäts-Status</h3>
          <div className={`integrity-status ${dataIntegrity.success ? 'success' : 'error'}`}>
            <div className="status-indicator">
              {dataIntegrity.success ? '✅' : '❌'}
              <span>{dataIntegrity.success ? 'Datenintegrität OK' : 'Datenintegrität PROBLEMATISCH'}</span>
            </div>
            
            {dataIntegrity.errors.length > 0 && (
              <div className="errors">
                <h4>Kritische Fehler:</h4>
                <ul>
                  {dataIntegrity.errors.map((error, index) => (
                    <li key={index} className="error-item">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {dataIntegrity.warnings.length > 0 && (
              <div className="warnings">
                <h4>Warnungen:</h4>
                <ul>
                  {dataIntegrity.warnings.map((warning, index) => (
                    <li key={index} className="warning-item">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="data-counts">
              <h4>Datenzählung:</h4>
              {Object.entries(dataIntegrity.dataCounts).map(([store, count]) => (
                <div key={store} className="count-item">
                  <span className="store-name">{store}:</span>
                  <span className="count">{count} Einträge</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Backup erstellen */}
      <div className="emergency-actions">
        <h3>🚨 Notfall-Aktionen</h3>
        <button 
          className="btn btn-warning"
          onClick={createEmergencyBackup}
          disabled={loading}
        >
          {loading ? '⏳ Erstelle...' : '🚨 Emergency Backup erstellen'}
        </button>
      </div>

      {/* Migration-Backups */}
      <div className="migration-backups">
        <h3>🔄 Migration-Backups</h3>
        {migrationBackups.length === 0 ? (
          <div className="no-backups">
            <p>Keine Migration-Backups vorhanden</p>
          </div>
        ) : (
          <div className="backup-table">
            <div className="backup-header-row">
              <div>Datum</div>
              <div>Typ</div>
              <div>Trades</div>
              <div>Größe</div>
              <div>Aktionen</div>
            </div>
            {migrationBackups.map(backup => (
              <div key={backup.id} className="backup-row">
                <div className="backup-date">
                  {formatDate(backup.timestamp)}
                </div>
                <div className="backup-type">
                  <span className="type-badge migration">🔄 Migration</span>
                </div>
                <div className="backup-trades">
                  {backup.dataCount} Trades
                </div>
                <div className="backup-size">
                  {formatBytes(backup.size)}
                </div>
                <div className="backup-actions">
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => restoreFromMigrationBackup(backup.id)}
                    disabled={loading}
                  >
                    🔄 Wiederherstellen
                  </button>
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={() => downloadBackup(backup.id, 'migration')}
                  >
                    📥 Download
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteBackup(backup.id, 'migration')}
                    disabled={loading}
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency-Backups */}
      <div className="emergency-backups">
        <h3>🚨 Emergency-Backups</h3>
        {emergencyBackups.length === 0 ? (
          <div className="no-backups">
            <p>Keine Emergency-Backups vorhanden</p>
          </div>
        ) : (
          <div className="backup-table">
            <div className="backup-header-row">
              <div>Datum</div>
              <div>Typ</div>
              <div>Trades</div>
              <div>Größe</div>
              <div>Aktionen</div>
            </div>
            {emergencyBackups.map(backup => (
              <div key={backup.id} className="backup-row">
                <div className="backup-date">
                  {formatDate(backup.timestamp)}
                </div>
                <div className="backup-type">
                  <span className="type-badge emergency">🚨 Emergency</span>
                </div>
                <div className="backup-trades">
                  {backup.dataCount} Trades
                </div>
                <div className="backup-size">
                  {formatBytes(backup.size)}
                </div>
                <div className="backup-actions">
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => restoreFromEmergencyBackup(backup.id)}
                    disabled={loading}
                  >
                    🔄 Wiederherstellen
                  </button>
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={() => downloadBackup(backup.id, 'emergency')}
                  >
                    📥 Download
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteBackup(backup.id, 'emergency')}
                    disabled={loading}
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warnung */}
      <div className="warning-section">
        <h3>⚠️ Wichtige Hinweise</h3>
        <ul>
          <li>Migration-Backups werden automatisch vor jeder Datenbank-Migration erstellt</li>
          <li>Emergency-Backups werden bei kritischen Operationen erstellt</li>
          <li>Das Wiederherstellen eines Backups überschreibt ALLE aktuellen Daten</li>
          <li>Laden Sie wichtige Backups herunter, bevor Sie sie löschen</li>
          <li>Bei Problemen können Sie immer zu einem früheren Backup zurückkehren</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyRecovery;







