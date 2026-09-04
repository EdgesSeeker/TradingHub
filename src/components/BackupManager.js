import React, { useState, useEffect } from 'react';
import advancedStorage from '../utils/advancedStorage';
import './BackupManager.css';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBackupList();
    loadStorageInfo();
  }, []);

  const loadBackupList = async () => {
    try {
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
      const backupList = backupKeys.map(key => {
        const backupData = localStorage.getItem(key);
        const data = JSON.parse(backupData);
        return {
          id: key.replace('backup_', ''),
          timestamp: data.exportTimestamp,
          size: new Blob([backupData]).size,
          type: data.type || 'manual'
        };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setBackups(backupList);
    } catch (error) {
      console.error('Fehler beim Laden der Backup-Liste:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await advancedStorage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Fehler beim Laden der Speicher-Info:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const backupId = await advancedStorage.createBackup('manual');
      setMessage(`✅ Backup erstellt: ${backupId}`);
      await loadBackupList();
      await loadStorageInfo();
    } catch (error) {
      setMessage(`❌ Backup-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Backup wiederherstellen möchten? Alle aktuellen Daten werden überschrieben!')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      await advancedStorage.restoreFromBackup(backupId);
      setMessage(`✅ Backup wiederhergestellt: ${backupId}`);
      await loadBackupList();
      await loadStorageInfo();
      
      // Seite neu laden um Änderungen zu reflektieren
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(`❌ Restore-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Backup löschen möchten?')) {
      return;
    }

    try {
      localStorage.removeItem(`backup_${backupId}`);
      setMessage(`🗑️ Backup gelöscht: ${backupId}`);
      await loadBackupList();
      await loadStorageInfo();
    } catch (error) {
      setMessage(`❌ Lösch-Fehler: ${error.message}`);
    }
  };

  const downloadBackup = (backupId) => {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-journal-backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(`📥 Backup heruntergeladen: ${backupId}`);
    } catch (error) {
      setMessage(`❌ Download-Fehler: ${error.message}`);
    }
  };

  const uploadBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = e.target.result;
        const data = JSON.parse(backupData);
        
        // Backup-ID generieren
        const backupId = `uploaded_${Date.now()}`;
        localStorage.setItem(`backup_${backupId}`, backupData);
        
        setMessage(`📤 Backup hochgeladen: ${backupId}`);
        await loadBackupList();
        await loadStorageInfo();
      } catch (error) {
        setMessage(`❌ Upload-Fehler: ${error.message}`);
      }
    };
    
    reader.readAsText(file);
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
    <div className="backup-manager">
      <div className="backup-header">
        <h2>💾 Backup & Datenmanagement</h2>
        <p>Sichere Verwaltung aller Trading Journal Daten</p>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Speicher-Informationen */}
      {storageInfo && (
        <div className="storage-info">
          <h3>📊 Speicher-Informationen</h3>
          <div className="storage-grid">
            <div className="storage-item">
              <span className="label">Gesamtgröße:</span>
              <span className="value">{formatBytes(storageInfo.totalSize)}</span>
            </div>
            <div className="storage-item">
              <span className="label">Anzahl Backups:</span>
              <span className="value">{storageInfo.backupCount}</span>
            </div>
            <div className="storage-item">
              <span className="label">Letztes Backup:</span>
              <span className="value">
                {storageInfo.lastBackup ? formatDate(storageInfo.lastBackup) : 'Nie'}
              </span>
            </div>
          </div>
          
          <div className="store-breakdown">
            <h4>Store-Aufschlüsselung:</h4>
            {Object.entries(storageInfo.storeSizes).map(([store, size]) => (
              <div key={store} className="store-item">
                <span className="store-name">{store}:</span>
                <span className="store-size">{formatBytes(size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup-Aktionen */}
      <div className="backup-actions">
        <h3>🔄 Backup-Aktionen</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={createBackup}
            disabled={loading}
          >
            {loading ? '⏳ Erstelle...' : '💾 Neues Backup erstellen'}
          </button>
          
          <label className="btn btn-secondary">
            📤 Backup hochladen
            <input 
              type="file" 
              accept=".json" 
              onChange={uploadBackup}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Backup-Liste */}
      <div className="backup-list">
        <h3>📋 Verfügbare Backups</h3>
        {backups.length === 0 ? (
          <div className="no-backups">
            <p>Keine Backups vorhanden</p>
            <button className="btn btn-primary" onClick={createBackup}>
              Erstes Backup erstellen
            </button>
          </div>
        ) : (
          <div className="backup-table">
            <div className="backup-header-row">
              <div>Datum</div>
              <div>Typ</div>
              <div>Größe</div>
              <div>Aktionen</div>
            </div>
            {backups.map(backup => (
              <div key={backup.id} className="backup-row">
                <div className="backup-date">
                  {formatDate(backup.timestamp)}
                </div>
                <div className="backup-type">
                  <span className={`type-badge ${backup.type}`}>
                    {backup.type === 'auto' ? '🤖 Auto' : '👤 Manual'}
                  </span>
                </div>
                <div className="backup-size">
                  {formatBytes(backup.size)}
                </div>
                <div className="backup-actions">
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => restoreBackup(backup.id)}
                    disabled={loading}
                  >
                    🔄 Wiederherstellen
                  </button>
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={() => downloadBackup(backup.id)}
                  >
                    📥 Download
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteBackup(backup.id)}
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

      {/* Emergency Backup */}
      <div className="emergency-section">
        <h3>🚨 Emergency Backup</h3>
        <p>Notfall-Backup wird automatisch bei kritischen Operationen erstellt</p>
        <button 
          className="btn btn-warning"
          onClick={() => advancedStorage.createEmergencyBackup()}
        >
          🚨 Emergency Backup erstellen
        </button>
      </div>
    </div>
  );
};

export default BackupManager;







