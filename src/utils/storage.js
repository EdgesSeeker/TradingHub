// IndexedDB für lokale Speicherung
class TradingStorage {
  constructor() {
    this.dbName = 'TradingJournalDB';
    this.dbVersion = 5;
    this.db = null;
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion + 2);

      request.onerror = () => {
        reject(new Error('Fehler beim Öffnen der Datenbank'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = async (event) => {
        const db = event.target.result;
        
        // Backup erstellen bevor die Datenbank aktualisiert wird
        try {
          if (this.db) {
            await this.createBackup();
            console.log('Backup vor Datenbank-Update erstellt');
          }
        } catch (error) {
          console.warn('Konnte kein Backup erstellen:', error);
        }

        // Trades Store
        if (!db.objectStoreNames.contains('trades')) {
          const tradesStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradesStore.createIndex('date', 'date', { unique: false });
          tradesStore.createIndex('symbol', 'symbol', { unique: false });
          tradesStore.createIndex('broker', 'broker', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Journal Store
        if (!db.objectStoreNames.contains('journal')) {
          const journalStore = db.createObjectStore('journal', { keyPath: 'id', autoIncrement: true });
          journalStore.createIndex('date', 'date', { unique: false });
        }

        // PnL Sales Store
        if (!db.objectStoreNames.contains('pnlSales')) {
          db.createObjectStore('pnlSales', { keyPath: 'id' });
        }

        // Trade Plans Store
        if (!db.objectStoreNames.contains('tradePlans')) {
          const tradePlansStore = db.createObjectStore('tradePlans', { keyPath: 'id', autoIncrement: true });
          tradePlansStore.createIndex('symbol', 'symbol', { unique: false });
          tradePlansStore.createIndex('status', 'status', { unique: false });
          tradePlansStore.createIndex('date', 'date', { unique: false });
        }

        // Trash Store for deleted trades
        if (!db.objectStoreNames.contains('trash')) {
          const trashStore = db.createObjectStore('trash', { keyPath: 'id' });
          trashStore.createIndex('deletedAt', 'deletedAt', { unique: false });
          trashStore.createIndex('symbol', 'symbol', { unique: false });
        }
      };
    });
  }

  // Trades speichern
  async saveTrades(trades) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');

      // Alle bestehenden Trades löschen
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Neue Trades hinzufügen
        let completed = 0;
        const total = trades.length;

        if (total === 0) {
          resolve();
          return;
        }

        trades.forEach(trade => {
          const addRequest = store.add(trade);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
          addRequest.onerror = () => {
            reject(new Error('Fehler beim Speichern der Trades'));
          };
        });
      };

      clearRequest.onerror = () => {
        reject(new Error('Fehler beim Löschen der bestehenden Trades'));
      };
    });
  }

  // Trades laden
  async loadTrades() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readonly');
      const store = transaction.objectStore('trades');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Trades'));
      };
    });
  }

  // Trade hinzufügen
  async addTrade(trade) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.add(trade);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Hinzufügen des Trades'));
      };
    });
  }

  // Trade aktualisieren
  async updateTrade(trade) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.put(trade);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Aktualisieren des Trades'));
      };
    });
  }

  // Trade löschen
  async deleteTrade(tradeId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.delete(tradeId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Löschen des Trades'));
      };
    });
  }

  // Trades nach Datum filtern
  async getTradesByDateRange(startDate, endDate) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readonly');
      const store = transaction.objectStore('trades');
      const index = store.index('date');
      const request = index.getAll(IDBKeyRange.bound(startDate, endDate));

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Trades nach Datum'));
      };
    });
  }

  // Trades nach Symbol filtern
  async getTradesBySymbol(symbol) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readonly');
      const store = transaction.objectStore('trades');
      const index = store.index('symbol');
      const request = index.getAll(symbol);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Trades nach Symbol'));
      };
    });
  }

  // Einstellungen speichern
  async saveSetting(key, value) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Speichern der Einstellung'));
      };
    });
  }

  // Einstellung laden
  async loadSetting(key) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Einstellung'));
      };
    });
  }

  // Journal-Eintrag hinzufügen
  async addJournalEntry(entry) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal'], 'readwrite');
      const store = transaction.objectStore('journal');
      const request = store.add({
        ...entry,
        date: entry.date || new Date().toISOString(),
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Hinzufügen des Journal-Eintrags'));
      };
    });
  }

  // Journal-Einträge laden
  async loadJournalEntries() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal'], 'readonly');
      const store = transaction.objectStore('journal');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Journal-Einträge'));
      };
    });
  }

  // Journal-Eintrag löschen
  async deleteJournalEntry(entryId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal'], 'readwrite');
      const store = transaction.objectStore('journal');
      const request = store.delete(entryId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Löschen des Journal-Eintrags'));
      };
    });
  }

  // Journal-Eintrag aktualisieren
  async updateJournalEntry(entry) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal'], 'readwrite');
      const store = transaction.objectStore('journal');
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Aktualisieren des Journal-Eintrags'));
      };
    });
  }

  // PnL Sales methods
  async savePnLSale(sale) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pnlSales'], 'readwrite');
      const store = transaction.objectStore('pnlSales');
      const request = store.add(sale);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Speichern des PnL Sales'));
    });
  }

  async loadPnLSales() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pnlSales'], 'readonly');
      const store = transaction.objectStore('pnlSales');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Fehler beim Laden der PnL Sales'));
    });
  }

  async deletePnLSale(id) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pnlSales'], 'readwrite');
      const store = transaction.objectStore('pnlSales');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Löschen des PnL Sales'));
    });
  }

  // Manual trade methods
  async addManualTrade(trade) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.add(trade);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Hinzufügen des Trades'));
    });
  }

  async updateManualTrade(trade) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.put(trade);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Aktualisieren des Trades'));
    });
  }

  async deleteManualTrade(id) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades'], 'readwrite');
      const store = transaction.objectStore('trades');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Löschen des Trades'));
    });
  }

  // Alle Daten exportieren
  async exportData() {
    if (!this.db) {
      await this.init();
    }
    
    const trades = await this.loadTrades();
    const journalEntries = await this.loadJournalEntries();
    const settings = await this.getAllSettings();

    return {
      trades,
      journalEntries,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Automatisches Backup vor Datenbank-Updates
  async createBackup() {
    try {
      const data = await this.exportData();
      const backupKey = `backup_${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(backupKey, JSON.stringify(data));
      
      // Nur die letzten 5 Backups behalten
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
      if (backupKeys.length > 5) {
        backupKeys.sort();
        localStorage.removeItem(backupKeys[0]); // Ältestes Backup löschen
      }
      
      console.log('Backup erstellt:', backupKey);
      return backupKey;
    } catch (error) {
      console.error('Fehler beim Erstellen des Backups:', error);
      throw error;
    }
  }

  // Backup wiederherstellen
  async restoreFromBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup nicht gefunden');
      }
      
      const data = JSON.parse(backupData);
      await this.importData(data);
      console.log('Backup wiederhergestellt:', backupKey);
      return true;
    } catch (error) {
      console.error('Fehler beim Wiederherstellen des Backups:', error);
      throw error;
    }
  }

  // Alle verfügbaren Backups auflisten
  async listBackups() {
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    return backupKeys.sort().reverse(); // Neueste zuerst
  }

  // Alle Einstellungen laden
  async getAllSettings() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();

      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Einstellungen'));
      };
    });
  }

  // Daten importieren
  async importData(data) {
    if (!this.db) {
      await this.init();
    }
    
    try {
      if (data.trades) {
        await this.saveTrades(data.trades);
      }

      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
          await this.saveSetting(key, value);
        }
      }

      if (data.journalEntries) {
        // Journal-Einträge hinzufügen (ohne Duplikate zu löschen)
        for (const entry of data.journalEntries) {
          await this.addJournalEntry(entry);
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Fehler beim Importieren der Daten: ${error.message}`);
    }
  }

  // Trade Plans speichern
  async saveTradePlan(plan) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tradePlans'], 'readwrite');
      const store = transaction.objectStore('tradePlans');
      
      const request = store.add({
        ...plan,
        date: plan.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Fehler beim Speichern des Trade Plans'));
    });
  }

  // Trade Plans laden
  async loadTradePlans() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tradePlans'], 'readonly');
      const store = transaction.objectStore('tradePlans');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Trade Plans'));
      };
    });
  }

  // Trade Plan aktualisieren
  async updateTradePlan(plan) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tradePlans'], 'readwrite');
      const store = transaction.objectStore('tradePlans');
      
      const request = store.put(plan);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Fehler beim Aktualisieren des Trade Plans'));
    });
  }

  // Trade Plan löschen
  async deleteTradePlan(id) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tradePlans'], 'readwrite');
      const store = transaction.objectStore('tradePlans');
      
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Löschen des Trade Plans'));
    });
  }

  // Trade in Papierkorb verschieben (statt direkt zu löschen)
  async moveTradeToTrash(trade) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trash'], 'readwrite');
      const store = transaction.objectStore('trash');
      
      const tradeWithMetadata = {
        ...trade,
        deletedAt: new Date().toISOString(),
        originalId: trade.id
      };
      
      const request = store.add(tradeWithMetadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Verschieben in den Papierkorb'));
    });
  }

  // Gelöschte Trades aus dem Papierkorb laden
  async loadDeletedTrades() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trash'], 'readonly');
      const store = transaction.objectStore('trash');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Fehler beim Laden der gelöschten Trades'));
      };
    });
  }

  // Trade aus dem Papierkorb wiederherstellen
  async restoreTrade(tradeId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        // Trade aus dem Papierkorb laden
        const transaction = this.db.transaction(['trash'], 'readwrite');
        const trashStore = transaction.objectStore('trash');
        const getRequest = trashStore.get(tradeId);
        
        getRequest.onsuccess = async () => {
          const deletedTrade = getRequest.result;
          
          if (!deletedTrade) {
            reject(new Error('Trade nicht im Papierkorb gefunden'));
            return;
          }
          
          // Trade aus dem Papierkorb entfernen
          const deleteRequest = trashStore.delete(tradeId);
          
          deleteRequest.onsuccess = async () => {
            try {
              // Trade wieder in die Trades-Datenbank einfügen
              const restoredTrade = { ...deletedTrade };
              delete restoredTrade.deletedAt;
              delete restoredTrade.originalId;
              
              await this.addTrade(restoredTrade);
              resolve(restoredTrade);
            } catch (error) {
              reject(new Error(`Fehler beim Wiederherstellen des Trades: ${error.message}`));
            }
          };
          
          deleteRequest.onerror = () => {
            reject(new Error('Fehler beim Entfernen aus dem Papierkorb'));
          };
        };
        
        getRequest.onerror = () => {
          reject(new Error('Fehler beim Laden des gelöschten Trades'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Trade endgültig aus dem Papierkorb löschen
  async permanentlyDeleteTrade(tradeId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trash'], 'readwrite');
      const store = transaction.objectStore('trash');
      const request = store.delete(tradeId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim endgültigen Löschen des Trades'));
    });
  }

  // Datenbank löschen
  async clearAll() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trades', 'settings', 'journal', 'tradePlans'], 'readwrite');
      
      const tradesStore = transaction.objectStore('trades');
      const settingsStore = transaction.objectStore('settings');
      const journalStore = transaction.objectStore('journal');
      const tradePlansStore = transaction.objectStore('tradePlans');

      const tradesRequest = tradesStore.clear();
      const settingsRequest = settingsStore.clear();
      const journalRequest = journalStore.clear();
      const tradePlansRequest = tradePlansStore.clear();

      let completed = 0;
      const total = 4;

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };

      tradesRequest.onsuccess = checkComplete;
      settingsRequest.onsuccess = checkComplete;
      journalRequest.onsuccess = checkComplete;
      tradePlansRequest.onsuccess = checkComplete;

      tradesRequest.onerror = () => reject(new Error('Fehler beim Löschen der Trades'));
      settingsRequest.onerror = () => reject(new Error('Fehler beim Löschen der Einstellungen'));
      journalRequest.onerror = () => reject(new Error('Fehler beim Löschen der Journal-Einträge'));
      tradePlansRequest.onerror = () => reject(new Error('Fehler beim Löschen der Trade Plans'));
    });
  }
}

// Singleton-Instanz
const tradingStorage = new TradingStorage();

export default tradingStorage; 