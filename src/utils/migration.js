// Migration System für sichere Datenbank-Updates
// Stellt sicher, dass Updates ohne Datenverlust durchgeführt werden

class MigrationManager {
  constructor() {
    this.currentVersion = 8;
    this.migrations = new Map();
    this.setupMigrations();
  }

  setupMigrations() {
    // Migration von Version 1 zu 2
    this.migrations.set(2, async (db) => {
      console.log('🔄 Migration 1→2: Erweitere Trades Store');
      
      // Neue Indizes hinzufügen
      if (db.objectStoreNames.contains('trades')) {
        const transaction = db.transaction(['trades'], 'readwrite');
        const store = transaction.objectStore('trades');
        
        // Prüfe ob Index bereits existiert
        if (!store.indexNames.contains('status')) {
          store.createIndex('status', 'status', { unique: false });
        }
        if (!store.indexNames.contains('strategy')) {
          store.createIndex('strategy', 'strategy', { unique: false });
        }
      }
    });

    // Migration von Version 2 zu 3
    this.migrations.set(3, async (db) => {
      console.log('🔄 Migration 2→3: Füge Screenshots Store hinzu');
      
      if (!db.objectStoreNames.contains('screenshots')) {
        const screenshotsStore = db.createObjectStore('screenshots', { keyPath: 'id', autoIncrement: true });
        screenshotsStore.createIndex('tradeId', 'tradeId', { unique: false });
        screenshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
        screenshotsStore.createIndex('type', 'type', { unique: false });
      }
    });

    // Migration von Version 3 zu 4
    this.migrations.set(4, async (db) => {
      console.log('🔄 Migration 3→4: Füge Market Data Store hinzu');
      
      if (!db.objectStoreNames.contains('marketData')) {
        const marketDataStore = db.createObjectStore('marketData', { keyPath: 'id', autoIncrement: true });
        marketDataStore.createIndex('symbol', 'symbol', { unique: false });
        marketDataStore.createIndex('date', 'date', { unique: false });
        marketDataStore.createIndex('timeframe', 'timeframe', { unique: false });
      }
    });

    // Migration von Version 4 zu 5
    this.migrations.set(5, async (db) => {
      console.log('🔄 Migration 4→5: Erweitere Journal Store');
      
      if (db.objectStoreNames.contains('journal')) {
        const transaction = db.transaction(['journal'], 'readwrite');
        const store = transaction.objectStore('journal');
        
        if (!store.indexNames.contains('tags')) {
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      }
    });

    // Migration von Version 5 zu 6
    this.migrations.set(6, async (db) => {
      console.log('🔄 Migration 5→6: Füge Backup Metadata Store hinzu');
      
      if (!db.objectStoreNames.contains('backupMetadata')) {
        const backupStore = db.createObjectStore('backupMetadata', { keyPath: 'id', autoIncrement: true });
        backupStore.createIndex('timestamp', 'timestamp', { unique: false });
        backupStore.createIndex('type', 'type', { unique: false });
      }
    });

    // Migration von Version 6 zu 7
    this.migrations.set(7, async (db) => {
      console.log('🔄 Migration 6→7: Füge File Storage Store hinzu');
      
      if (!db.objectStoreNames.contains('fileStorage')) {
        const fileStore = db.createObjectStore('fileStorage', { keyPath: 'id', autoIncrement: true });
        fileStore.createIndex('tradeId', 'tradeId', { unique: false });
        fileStore.createIndex('type', 'type', { unique: false });
        fileStore.createIndex('filename', 'filename', { unique: false });
      }
    });

    // Migration von Version 7 zu 8
    this.migrations.set(8, async (db) => {
      console.log('🔄 Migration 7→8: Füge Performance Metrics Store hinzu');
      
      if (!db.objectStoreNames.contains('performanceMetrics')) {
        const metricsStore = db.createObjectStore('performanceMetrics', { keyPath: 'id', autoIncrement: true });
        metricsStore.createIndex('date', 'date', { unique: false });
        metricsStore.createIndex('type', 'type', { unique: false });
      }
    });
  }

  async migrate(fromVersion, toVersion, db) {
    console.log(`🚀 Starte Migration von Version ${fromVersion} zu ${toVersion}`);
    
    let migrationBackupId = null;
    let rollbackNeeded = false;
    
    try {
      // 1. ZWINGENDES Backup vor Migration erstellen
      migrationBackupId = await this.createMigrationBackup(db);
      if (!migrationBackupId) {
        throw new Error('Migration-Backup konnte nicht erstellt werden - Migration abgebrochen');
      }
      
      console.log(`💾 Migration-Backup erstellt: ${migrationBackupId}`);
      
      // 2. Daten vor Migration validieren
      const preMigrationValidation = await this.validateDataIntegrity(db);
      if (!preMigrationValidation.success) {
        console.warn('⚠️ Datenintegrität vor Migration nicht vollständig - trotzdem fortfahren');
      }
      
      // 3. Migrationen in Reihenfolge ausführen mit Rollback-Schutz
      for (let version = fromVersion + 1; version <= toVersion; version++) {
        if (this.migrations.has(version)) {
          console.log(`📦 Führe Migration ${version} aus...`);
          
          try {
            await this.migrations.get(version)(db);
            console.log(`✅ Migration ${version} abgeschlossen`);
            
            // Nach jeder Migration validieren
            const stepValidation = await this.validateDataIntegrity(db);
            if (!stepValidation.success) {
              console.warn(`⚠️ Validierung nach Migration ${version} fehlgeschlagen:`, stepValidation.errors);
            }
            
          } catch (stepError) {
            console.error(`❌ Migration ${version} fehlgeschlagen:`, stepError);
            rollbackNeeded = true;
            throw new Error(`Migration ${version} fehlgeschlagen: ${stepError.message}`);
          }
        }
      }
      
      // 4. Finale Validierung nach allen Migrationen
      const finalValidation = await this.validateDataIntegrity(db);
      if (!finalValidation.success) {
        console.error('❌ Finale Validierung fehlgeschlagen - Rollback erforderlich');
        rollbackNeeded = true;
        throw new Error('Finale Validierung fehlgeschlagen');
      }
      
      console.log(`🎉 Migration von ${fromVersion} zu ${toVersion} erfolgreich abgeschlossen`);
      return { success: true, backupId: migrationBackupId };
      
    } catch (error) {
      console.error(`❌ Migration fehlgeschlagen:`, error);
      
      // 5. Automatisches Rollback bei Fehlern
      if (rollbackNeeded && migrationBackupId) {
        console.log('🔄 Starte automatisches Rollback...');
        try {
          await this.rollbackMigration(migrationBackupId);
          console.log('✅ Rollback erfolgreich abgeschlossen');
        } catch (rollbackError) {
          console.error('❌ Rollback fehlgeschlagen:', rollbackError);
          throw new Error(`Migration und Rollback fehlgeschlagen: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  async createMigrationBackup(db) {
    try {
      const backupData = await this.exportAllData(db);
      const backupId = `migration_backup_${Date.now()}`;
      
      // Backup in localStorage speichern
      localStorage.setItem(`migration_backup_${backupId}`, JSON.stringify(backupData));
      
      console.log(`💾 Migration-Backup erstellt: ${backupId}`);
      return backupId;
    } catch (error) {
      console.warn('⚠️ Konnte kein Migration-Backup erstellen:', error);
      return null;
    }
  }

  async exportAllData(db) {
    const data = {};
    
    // Alle Stores exportieren
    const stores = ['trades', 'screenshots', 'journal', 'settings', 'marketData', 'fileStorage', 'performanceMetrics'];
    
    for (const storeName of stores) {
      try {
        if (db.objectStoreNames.contains(storeName)) {
          const storeData = await this.getAllFromStore(db, storeName);
          data[storeName] = storeData;
        } else {
          data[storeName] = [];
        }
      } catch (error) {
        console.warn(`Fehler beim Export von ${storeName}:`, error);
        data[storeName] = [];
      }
    }
    
    return {
      ...data,
      exportTimestamp: new Date().toISOString(),
      version: this.currentVersion,
      migrationBackup: true
    };
  }

  async getAllFromStore(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Daten-Transformationen für spezifische Felder
  transformTradeData(trade) {
    // Alte Feldnamen zu neuen Feldnamen
    const fieldMappings = {
      'tradeId': 'id',
      'stock': 'symbol',
      'direction': 'side',
      'amount': 'quantity',
      'price': 'entryPrice',
      'date': 'entryDate'
    };

    const transformedTrade = { ...trade };
    
    // Feldnamen transformieren
    Object.entries(fieldMappings).forEach(([oldField, newField]) => {
      if (transformedTrade[oldField] !== undefined) {
        transformedTrade[newField] = transformedTrade[oldField];
        delete transformedTrade[oldField];
      }
    });

    // Side-Werte normalisieren
    if (transformedTrade.side) {
      const sideMapping = {
        'long': 'buy',
        'short': 'sell',
        'Long': 'buy',
        'Short': 'sell'
      };
      transformedTrade.side = sideMapping[transformedTrade.side] || transformedTrade.side;
    }

    // Status-Werte normalisieren
    if (transformedTrade.status) {
      const statusMapping = {
        'active': 'open',
        'closed': 'closed',
        'Active': 'open',
        'Closed': 'closed'
      };
      transformedTrade.status = statusMapping[transformedTrade.status] || transformedTrade.status;
    }

    // Datum-Format normalisieren
    if (transformedTrade.entryDate) {
      transformedTrade.entryDate = this.normalizeDate(transformedTrade.entryDate);
    }
    if (transformedTrade.exitDate) {
      transformedTrade.exitDate = this.normalizeDate(transformedTrade.exitDate);
    }

    return transformedTrade;
  }

  normalizeDate(dateValue) {
    if (!dateValue) return null;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Ungültiges Datum:', dateValue);
      return new Date().toISOString();
    }
    
    return date.toISOString();
  }

  // Robuste Datenintegritäts-Validierung
  async validateDataIntegrity(db) {
    console.log('🔍 Validiere Datenintegrität...');
    
    const validationResults = {
      success: true,
      errors: [],
      warnings: [],
      dataCounts: {}
    };

    try {
      // 1. Prüfe ob alle erforderlichen Stores existieren
      const requiredStores = ['trades', 'screenshots', 'journal', 'settings'];
      const missingStores = [];
      
      requiredStores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          missingStores.push(storeName);
          validationResults.errors.push(`KRITISCH: Store '${storeName}' fehlt`);
          validationResults.success = false;
        }
      });

      if (missingStores.length > 0) {
        console.error('❌ Fehlende Stores:', missingStores);
        return validationResults;
      }

      // 2. Zähle Daten in jedem Store
      for (const storeName of requiredStores) {
        try {
          const data = await this.getAllFromStore(db, storeName);
          validationResults.dataCounts[storeName] = data.length;
          console.log(`📊 ${storeName}: ${data.length} Einträge`);
        } catch (error) {
          validationResults.errors.push(`Fehler beim Zählen von ${storeName}: ${error.message}`);
          validationResults.success = false;
        }
      }

      // 3. Validiere Trades-Daten
      if (db.objectStoreNames.contains('trades')) {
        const tradesData = await this.getAllFromStore(db, 'trades');
        let invalidTrades = 0;
        
        tradesData.forEach((trade, index) => {
          const tradeErrors = [];
          
          if (!trade.symbol || typeof trade.symbol !== 'string') {
            tradeErrors.push('Symbol fehlt oder ungültig');
          }
          if (!trade.side || !['buy', 'sell', 'long', 'short'].includes(trade.side)) {
            tradeErrors.push('Side fehlt oder ungültig');
          }
          if (!trade.quantity || isNaN(parseFloat(trade.quantity))) {
            tradeErrors.push('Quantity fehlt oder ungültig');
          }
          if (!trade.entryPrice || isNaN(parseFloat(trade.entryPrice))) {
            tradeErrors.push('Entry-Preis fehlt oder ungültig');
          }
          if (!trade.entryDate || isNaN(new Date(trade.entryDate).getTime())) {
            tradeErrors.push('Entry-Datum fehlt oder ungültig');
          }
          
          if (tradeErrors.length > 0) {
            invalidTrades++;
            validationResults.warnings.push(`Trade ${index}: ${tradeErrors.join(', ')}`);
          }
        });
        
        if (invalidTrades > 0) {
          validationResults.warnings.push(`${invalidTrades} von ${tradesData.length} Trades haben Validierungsprobleme`);
        }
      }

      // 4. Validiere Screenshots-Daten
      if (db.objectStoreNames.contains('screenshots')) {
        const screenshotsData = await this.getAllFromStore(db, 'screenshots');
        let invalidScreenshots = 0;
        
        screenshotsData.forEach((screenshot, index) => {
          if (!screenshot.data || !screenshot.data.startsWith('data:image/')) {
            invalidScreenshots++;
            validationResults.warnings.push(`Screenshot ${index}: Ungültige Daten`);
          }
        });
        
        if (invalidScreenshots > 0) {
          validationResults.warnings.push(`${invalidScreenshots} von ${screenshotsData.length} Screenshots haben Probleme`);
        }
      }

      // 5. Prüfe auf kritische Datenverluste
      const totalDataCount = Object.values(validationResults.dataCounts).reduce((sum, count) => sum + count, 0);
      if (totalDataCount === 0) {
        validationResults.errors.push('KRITISCH: Keine Daten in der Datenbank gefunden');
        validationResults.success = false;
      }

      console.log('✅ Datenintegritäts-Validierung abgeschlossen');
      return validationResults;
      
    } catch (error) {
      console.error('❌ Datenintegritäts-Validierung fehlgeschlagen:', error);
      validationResults.success = false;
      validationResults.errors.push(`Validierungsfehler: ${error.message}`);
      return validationResults;
    }
  }

  // Validierung nach Migration
  async validateMigration(db, fromVersion, toVersion) {
    console.log('🔍 Validiere Migration...');
    
    const validationResults = {
      success: true,
      errors: [],
      warnings: []
    };

    try {
      // Prüfe ob alle Stores existieren
      const requiredStores = ['trades', 'screenshots', 'journal', 'settings'];
      requiredStores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          validationResults.errors.push(`Store '${storeName}' fehlt`);
          validationResults.success = false;
        }
      });

      // Prüfe Datenintegrität
      const tradesData = await this.getAllFromStore(db, 'trades');
      tradesData.forEach((trade, index) => {
        if (!trade.symbol) {
          validationResults.warnings.push(`Trade ${index} hat kein Symbol`);
        }
        if (!trade.side) {
          validationResults.warnings.push(`Trade ${index} hat keine Side`);
        }
      });

      console.log('✅ Migration-Validierung abgeschlossen');
      return validationResults;
    } catch (error) {
      console.error('❌ Migration-Validierung fehlgeschlagen:', error);
      validationResults.success = false;
      validationResults.errors.push(`Validierungsfehler: ${error.message}`);
      return validationResults;
    }
  }

  // Robuste Rollback-Funktion
  async rollbackMigration(backupId) {
    console.log(`🔄 Starte Rollback mit Backup: ${backupId}`);
    
    try {
      const backupData = localStorage.getItem(`migration_backup_${backupId}`);
      
      if (!backupData) {
        throw new Error(`Migration-Backup ${backupId} nicht gefunden`);
      }
      
      const data = JSON.parse(backupData);
      console.log('📦 Backup-Daten geladen:', Object.keys(data));
      
      // 1. Validiere Backup-Daten
      if (!data.trades || !Array.isArray(data.trades)) {
        throw new Error('Backup-Daten sind beschädigt - Trades fehlen');
      }
      
      console.log(`📊 Backup enthält: ${data.trades.length} Trades`);
      
      // 2. Aktuelle Datenbank leeren (mit Backup)
      const currentBackup = await this.createEmergencyBackup();
      console.log(`💾 Aktuelle Datenbank gesichert: ${currentBackup}`);
      
      // 3. Datenbank-Stores leeren
      const db = await this.getCurrentDatabase();
      if (!db) {
        throw new Error('Datenbank-Verbindung nicht verfügbar');
      }
      
      const storesToRestore = ['trades', 'screenshots', 'journal', 'settings', 'marketData', 'fileStorage'];
      
      for (const storeName of storesToRestore) {
        if (db.objectStoreNames.contains(storeName)) {
          try {
            await this.clearStore(db, storeName);
            console.log(`🗑️ Store ${storeName} geleert`);
          } catch (error) {
            console.warn(`⚠️ Fehler beim Leeren von ${storeName}:`, error);
          }
        }
      }
      
      // 4. Backup-Daten wiederherstellen
      for (const storeName of storesToRestore) {
        if (data[storeName] && Array.isArray(data[storeName])) {
          try {
            await this.restoreStoreData(db, storeName, data[storeName]);
            console.log(`✅ ${storeName}: ${data[storeName].length} Einträge wiederhergestellt`);
          } catch (error) {
            console.error(`❌ Fehler beim Wiederherstellen von ${storeName}:`, error);
            throw error;
          }
        }
      }
      
      // 5. Rollback validieren
      const rollbackValidation = await this.validateDataIntegrity(db);
      if (!rollbackValidation.success) {
        console.error('❌ Rollback-Validierung fehlgeschlagen:', rollbackValidation.errors);
        throw new Error('Rollback-Validierung fehlgeschlagen');
      }
      
      console.log('✅ Rollback erfolgreich abgeschlossen');
      return { success: true, restoredData: data };
      
    } catch (error) {
      console.error('❌ Rollback fehlgeschlagen:', error);
      throw error;
    }
  }

  async getCurrentDatabase() {
    // Versuche die aktuelle Datenbank-Verbindung zu bekommen
    // Dies ist eine vereinfachte Implementierung
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TradingJournalAdvancedDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async restoreStoreData(db, storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
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

  async createEmergencyBackup() {
    try {
      const backupData = await this.exportAllData(await this.getCurrentDatabase());
      const emergencyBackupId = `emergency_backup_${Date.now()}`;
      
      localStorage.setItem(`emergency_backup_${emergencyBackupId}`, JSON.stringify(backupData));
      console.log(`🚨 Emergency Backup erstellt: ${emergencyBackupId}`);
      return emergencyBackupId;
    } catch (error) {
      console.error('❌ Emergency Backup fehlgeschlagen:', error);
      return null;
    }
  }

  // Migration-Status prüfen
  getMigrationStatus() {
    const migrationBackups = Object.keys(localStorage)
      .filter(key => key.startsWith('migration_backup_'))
      .map(key => ({
        id: key.replace('migration_backup_', ''),
        timestamp: new Date(parseInt(key.split('_')[2])).toISOString()
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      currentVersion: this.currentVersion,
      migrationBackups: migrationBackups,
      lastMigration: migrationBackups[0]?.timestamp || null
    };
  }

  // Migration-Backups aufräumen
  cleanupMigrationBackups(keepCount = 5) {
    const migrationBackups = Object.keys(localStorage)
      .filter(key => key.startsWith('migration_backup_'))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('_')[2]);
        const timestampB = parseInt(b.split('_')[2]);
        return timestampB - timestampA;
      });

    if (migrationBackups.length > keepCount) {
      const toDelete = migrationBackups.slice(keepCount);
      toDelete.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 ${toDelete.length} alte Migration-Backups gelöscht`);
    }
  }
}

// Singleton-Instanz
const migrationManager = new MigrationManager();

export default migrationManager;
