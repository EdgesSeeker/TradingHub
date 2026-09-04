// Advanced Storage System für Trading Journal
// Implementiert SQLite-ähnliche Funktionalität mit robustem Backup-System

class AdvancedTradingStorage {
  constructor() {
    this.dbName = 'TradingJournalAdvancedDB';
    this.dbVersion = 8;
    this.db = null;
    this.backupInterval = 24 * 60 * 60 * 1000; // 24 Stunden
    this.maxBackups = 10;
    this.initBackupTimer();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Fehler beim Öffnen der erweiterten Datenbank'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.setupAutoBackup();
        resolve();
      };

      request.onupgradeneeded = async (event) => {
        const db = event.target.result;
        
        // Backup vor Update erstellen
        await this.createEmergencyBackup();

        // Trades Store mit erweiterten Feldern
        if (!db.objectStoreNames.contains('trades')) {
          const tradesStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradesStore.createIndex('date', 'date', { unique: false });
          tradesStore.createIndex('symbol', 'symbol', { unique: false });
          tradesStore.createIndex('broker', 'broker', { unique: false });
          tradesStore.createIndex('status', 'status', { unique: false });
          tradesStore.createIndex('strategy', 'strategy', { unique: false });
          tradesStore.createIndex('sector', 'sector', { unique: false });
        }

        // Screenshots Store für Chart-Screenshots
        if (!db.objectStoreNames.contains('screenshots')) {
          const screenshotsStore = db.createObjectStore('screenshots', { keyPath: 'id', autoIncrement: true });
          screenshotsStore.createIndex('tradeId', 'tradeId', { unique: false });
          screenshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
          screenshotsStore.createIndex('type', 'type', { unique: false }); // 'entry', 'exit', 'analysis'
        }

        // Market Data Store für historische Daten
        if (!db.objectStoreNames.contains('marketData')) {
          const marketDataStore = db.createObjectStore('marketData', { keyPath: 'id', autoIncrement: true });
          marketDataStore.createIndex('symbol', 'symbol', { unique: false });
          marketDataStore.createIndex('date', 'date', { unique: false });
          marketDataStore.createIndex('timeframe', 'timeframe', { unique: false });
        }

        // Journal Store mit erweiterten Feldern
        if (!db.objectStoreNames.contains('journal')) {
          const journalStore = db.createObjectStore('journal', { keyPath: 'id', autoIncrement: true });
          journalStore.createIndex('date', 'date', { unique: false });
          journalStore.createIndex('type', 'type', { unique: false });
          journalStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Backup Metadata Store
        if (!db.objectStoreNames.contains('backupMetadata')) {
          const backupStore = db.createObjectStore('backupMetadata', { keyPath: 'id', autoIncrement: true });
          backupStore.createIndex('timestamp', 'timestamp', { unique: false });
          backupStore.createIndex('type', 'type', { unique: false });
        }

        // File Storage Store für große Dateien
        if (!db.objectStoreNames.contains('fileStorage')) {
          const fileStore = db.createObjectStore('fileStorage', { keyPath: 'id', autoIncrement: true });
          fileStore.createIndex('tradeId', 'tradeId', { unique: false });
          fileStore.createIndex('type', 'type', { unique: false });
          fileStore.createIndex('filename', 'filename', { unique: false });
        }

        // Performance Metrics Store
        if (!db.objectStoreNames.contains('performanceMetrics')) {
          const metricsStore = db.createObjectStore('performanceMetrics', { keyPath: 'id', autoIncrement: true });
          metricsStore.createIndex('date', 'date', { unique: false });
          metricsStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // SQLite-ähnliche Query-Funktionen
  async queryTrades(filters = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readonly');
      const store = transaction.objectStore('trades');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;
        
        // Filter anwenden
        if (filters.symbol) {
          results = results.filter(trade => trade.symbol === filters.symbol);
        }
        if (filters.status) {
          results = results.filter(trade => trade.status === filters.status);
        }
        if (filters.dateFrom) {
          results = results.filter(trade => new Date(trade.date) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
          results = results.filter(trade => new Date(trade.date) <= new Date(filters.dateTo));
        }
        if (filters.broker) {
          results = results.filter(trade => trade.broker === filters.broker);
        }

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Screenshot Management
  async saveScreenshot(tradeId, screenshotData, type = 'analysis') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['screenshots'], 'readwrite');
      const store = transaction.objectStore('screenshots');
      
      const screenshot = {
        tradeId: tradeId,
        data: screenshotData,
        type: type,
        timestamp: new Date().toISOString(),
        size: screenshotData.length
      };

      const request = store.add(screenshot);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getScreenshots(tradeId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['screenshots'], 'readonly');
      const store = transaction.objectStore('screenshots');
      const index = store.index('tradeId');
      const request = index.getAll(tradeId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // File Storage für große Dateien
  async saveFile(tradeId, fileData, filename, type = 'document') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['fileStorage'], 'readwrite');
      const store = transaction.objectStore('fileStorage');
      
      const file = {
        tradeId: tradeId,
        data: fileData,
        filename: filename,
        type: type,
        size: fileData.length,
        timestamp: new Date().toISOString()
      };

      const request = store.add(file);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Market Data Storage
  async saveMarketData(symbol, data, timeframe = '1D') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['marketData'], 'readwrite');
      const store = transaction.objectStore('marketData');
      
      const marketData = {
        symbol: symbol,
        data: data,
        timeframe: timeframe,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };

      const request = store.add(marketData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Performance Metrics
  async savePerformanceMetrics(metrics) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['performanceMetrics'], 'readwrite');
      const store = transaction.objectStore('performanceMetrics');
      
      const performanceData = {
        ...metrics,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };

      const request = store.add(performanceData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Backup System
  async createBackup(type = 'manual') {
    try {
      const backupData = await this.exportAllData();
      const backupId = `backup_${Date.now()}`;
      
      // Backup in localStorage speichern
      localStorage.setItem(`backup_${backupId}`, JSON.stringify(backupData));
      
      // Backup Metadata speichern
      await this.saveBackupMetadata(backupId, type);
      
      // Alte Backups löschen (max 10 behalten)
      await this.cleanupOldBackups();
      
      console.log(`✅ Backup erstellt: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('❌ Backup-Fehler:', error);
      throw error;
    }
  }

  async createEmergencyBackup() {
    try {
      const backupData = await this.exportAllData();
      const emergencyBackup = {
        data: backupData,
        timestamp: new Date().toISOString(),
        type: 'emergency'
      };
      
      localStorage.setItem('emergency_backup', JSON.stringify(emergencyBackup));
      console.log('🚨 Emergency Backup erstellt');
    } catch (error) {
      console.error('❌ Emergency Backup fehlgeschlagen:', error);
    }
  }

  async exportAllData() {
    const data = {};
    
    // Alle Stores exportieren
    const stores = ['trades', 'screenshots', 'journal', 'settings', 'marketData', 'fileStorage', 'performanceMetrics'];
    
    for (const storeName of stores) {
      try {
        const storeData = await this.getAllFromStore(storeName);
        data[storeName] = storeData;
      } catch (error) {
        console.warn(`Fehler beim Export von ${storeName}:`, error);
        data[storeName] = [];
      }
    }
    
    return {
      ...data,
      exportTimestamp: new Date().toISOString(),
      version: this.dbVersion
    };
  }

  async getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveBackupMetadata(backupId, type) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['backupMetadata'], 'readwrite');
      const store = transaction.objectStore('backupMetadata');
      
      const metadata = {
        backupId: backupId,
        type: type,
        timestamp: new Date().toISOString(),
        size: this.calculateBackupSize(backupId)
      };

      const request = store.add(metadata);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  calculateBackupSize(backupId) {
    const backup = localStorage.getItem(`backup_${backupId}`);
    return backup ? new Blob([backup]).size : 0;
  }

  async cleanupOldBackups() {
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    
    if (backupKeys.length > this.maxBackups) {
      // Nach Zeitstempel sortieren und älteste löschen
      const sortedKeys = backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_')[1]);
        const timestampB = parseInt(b.split('_')[1]);
        return timestampA - timestampB;
      });
      
      const keysToDelete = sortedKeys.slice(0, sortedKeys.length - this.maxBackups);
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
      console.log(`🧹 ${keysToDelete.length} alte Backups gelöscht`);
    }
  }

  // Auto-Backup System
  initBackupTimer() {
    setInterval(() => {
      this.createBackup('auto');
    }, this.backupInterval);
  }

  setupAutoBackup() {
    // Backup bei App-Start prüfen
    const lastBackup = localStorage.getItem('lastBackup');
    const now = Date.now();
    
    if (!lastBackup || (now - parseInt(lastBackup)) > this.backupInterval) {
      this.createBackup('auto');
      localStorage.setItem('lastBackup', now.toString());
    }
  }

  // Restore System
  async restoreFromBackup(backupId) {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`);
      
      if (!backupData) {
        throw new Error('Backup nicht gefunden');
      }
      
      const data = JSON.parse(backupData);
      
      // Alle Stores leeren und neu befüllen
      const stores = Object.keys(data).filter(key => key !== 'exportTimestamp' && key !== 'version');
      
      for (const storeName of stores) {
        await this.clearStore(storeName);
        await this.importToStore(storeName, data[storeName]);
      }
      
      console.log(`✅ Backup wiederhergestellt: ${backupId}`);
      return true;
    } catch (error) {
      console.error('❌ Restore-Fehler:', error);
      throw error;
    }
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async importToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let completed = 0;
      const total = data.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      data.forEach(item => {
        const request = store.add(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Migration System
  async migrateData(fromVersion, toVersion) {
    console.log(`🔄 Migration von Version ${fromVersion} zu ${toVersion}`);
    
    // Backup vor Migration
    await this.createBackup('migration');
    
    // Migration-Logik hier implementieren
    // Beispiel: Feld-Umbenennungen, Datenstruktur-Änderungen, etc.
    
    console.log('✅ Migration abgeschlossen');
  }

  // Datenvalidierung (Pydantic-ähnlich)
  validateTradeData(tradeData) {
    const requiredFields = ['symbol', 'side', 'quantity', 'entryPrice'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!tradeData[field]) {
        errors.push(`Feld '${field}' ist erforderlich`);
      }
    });
    
    if (tradeData.quantity && tradeData.quantity <= 0) {
      errors.push('Anzahl muss größer als 0 sein');
    }
    
    if (tradeData.entryPrice && tradeData.entryPrice <= 0) {
      errors.push('Entry-Preis muss größer als 0 sein');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validierungsfehler: ${errors.join(', ')}`);
    }
    
    return true;
  }

  // Speicherplatz-Überwachung
  async getStorageInfo() {
    const info = {
      totalSize: 0,
      storeSizes: {},
      backupCount: 0,
      lastBackup: null
    };
    
    // Store-Größen berechnen
    const stores = ['trades', 'screenshots', 'journal', 'settings', 'marketData', 'fileStorage'];
    
    for (const storeName of stores) {
      try {
        const data = await this.getAllFromStore(storeName);
        const size = JSON.stringify(data).length;
        info.storeSizes[storeName] = size;
        info.totalSize += size;
      } catch (error) {
        console.warn(`Fehler beim Berechnen der Größe für ${storeName}:`, error);
      }
    }
    
    // Backup-Info
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    info.backupCount = backupKeys.length;
    
    const lastBackup = localStorage.getItem('lastBackup');
    info.lastBackup = lastBackup ? new Date(parseInt(lastBackup)).toISOString() : null;
    
    return info;
  }
}

// Singleton-Instanz
const advancedStorage = new AdvancedTradingStorage();

export default advancedStorage;







