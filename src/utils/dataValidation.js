// Data Validation System - Pydantic-ähnlich für JavaScript
// Stellt sicher, dass alle Daten korrekt validiert werden

class DataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Basis-Validierung
  validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      this.errors.push(`${fieldName} ist erforderlich`);
      return false;
    }
    return true;
  }

  validateString(value, fieldName, minLength = 0, maxLength = Infinity) {
    if (typeof value !== 'string') {
      this.errors.push(`${fieldName} muss ein String sein`);
      return false;
    }
    if (value.length < minLength) {
      this.errors.push(`${fieldName} muss mindestens ${minLength} Zeichen lang sein`);
      return false;
    }
    if (value.length > maxLength) {
      this.errors.push(`${fieldName} darf maximal ${maxLength} Zeichen lang sein`);
      return false;
    }
    return true;
  }

  validateNumber(value, fieldName, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      this.errors.push(`${fieldName} muss eine gültige Zahl sein`);
      return false;
    }
    if (num < min) {
      this.errors.push(`${fieldName} muss mindestens ${min} sein`);
      return false;
    }
    if (num > max) {
      this.errors.push(`${fieldName} darf maximal ${max} sein`);
      return false;
    }
    return true;
  }

  validateDate(value, fieldName) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.errors.push(`${fieldName} muss ein gültiges Datum sein`);
      return false;
    }
    return true;
  }

  validateEmail(value, fieldName) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.errors.push(`${fieldName} muss eine gültige E-Mail-Adresse sein`);
      return false;
    }
    return true;
  }

  validateEnum(value, fieldName, allowedValues) {
    if (!allowedValues.includes(value)) {
      this.errors.push(`${fieldName} muss einer der folgenden Werte sein: ${allowedValues.join(', ')}`);
      return false;
    }
    return true;
  }

  // Trade-spezifische Validierung
  validateTrade(tradeData) {
    this.clearErrors();
    
    // Erforderliche Felder
    this.validateRequired(tradeData.symbol, 'Symbol');
    this.validateRequired(tradeData.side, 'Side');
    this.validateRequired(tradeData.quantity, 'Anzahl');
    this.validateRequired(tradeData.entryPrice, 'Entry-Preis');
    this.validateRequired(tradeData.entryDate, 'Entry-Datum');

    // String-Validierung
    if (tradeData.symbol) {
      this.validateString(tradeData.symbol, 'Symbol', 1, 10);
    }
    if (tradeData.side) {
      this.validateEnum(tradeData.side, 'Side', ['buy', 'sell', 'long', 'short']);
    }
    if (tradeData.status) {
      this.validateEnum(tradeData.status, 'Status', ['open', 'closed', 'partial']);
    }

    // Numerische Validierung
    if (tradeData.quantity) {
      this.validateNumber(tradeData.quantity, 'Anzahl', 0.000001);
    }
    if (tradeData.entryPrice) {
      this.validateNumber(tradeData.entryPrice, 'Entry-Preis', 0.000001);
    }
    if (tradeData.exitPrice) {
      this.validateNumber(tradeData.exitPrice, 'Exit-Preis', 0.000001);
    }
    if (tradeData.stopLoss) {
      this.validateNumber(tradeData.stopLoss, 'Stop-Loss', 0.000001);
    }
    if (tradeData.takeProfit) {
      this.validateNumber(tradeData.takeProfit, 'Take-Profit', 0.000001);
    }

    // Datum-Validierung
    if (tradeData.entryDate) {
      this.validateDate(tradeData.entryDate, 'Entry-Datum');
    }
    if (tradeData.exitDate) {
      this.validateDate(tradeData.exitDate, 'Exit-Datum');
    }

    // P&L-Validierung
    if (tradeData.pnl !== undefined) {
      this.validateNumber(tradeData.pnl, 'P&L', -Infinity, Infinity);
    }

    // Risiko-Validierung
    if (tradeData.riskAmount) {
      this.validateNumber(tradeData.riskAmount, 'Risiko-Betrag', 0);
    }
    if (tradeData.riskPercent) {
      this.validateNumber(tradeData.riskPercent, 'Risiko-Prozent', 0, 100);
    }

    return this.isValid();
  }

  // Screenshot-Validierung
  validateScreenshot(screenshotData) {
    this.clearErrors();
    
    this.validateRequired(screenshotData.tradeId, 'Trade ID');
    this.validateRequired(screenshotData.data, 'Screenshot-Daten');
    this.validateRequired(screenshotData.type, 'Screenshot-Typ');
    
    if (screenshotData.type) {
      this.validateEnum(screenshotData.type, 'Screenshot-Typ', ['entry', 'exit', 'analysis', 'capture']);
    }
    
    if (screenshotData.data) {
      // Prüfe ob es ein gültiger Base64-String ist
      const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
      if (!base64Regex.test(screenshotData.data)) {
        this.errors.push('Screenshot-Daten müssen ein gültiges Base64-Bild sein');
      }
    }

    return this.isValid();
  }

  // Journal-Entry-Validierung
  validateJournalEntry(entryData) {
    this.clearErrors();
    
    this.validateRequired(entryData.content, 'Inhalt');
    this.validateRequired(entryData.type, 'Typ');
    this.validateRequired(entryData.date, 'Datum');
    
    if (entryData.content) {
      this.validateString(entryData.content, 'Inhalt', 1, 10000);
    }
    
    if (entryData.type) {
      this.validateEnum(entryData.type, 'Typ', ['daily', 'weekly', 'monthly', 'trade', 'analysis', 'note']);
    }
    
    if (entryData.date) {
      this.validateDate(entryData.date, 'Datum');
    }

    return this.isValid();
  }

  // Market Data-Validierung
  validateMarketData(marketData) {
    this.clearErrors();
    
    this.validateRequired(marketData.symbol, 'Symbol');
    this.validateRequired(marketData.data, 'Market Data');
    this.validateRequired(marketData.timeframe, 'Timeframe');
    
    if (marketData.symbol) {
      this.validateString(marketData.symbol, 'Symbol', 1, 20);
    }
    
    if (marketData.timeframe) {
      this.validateEnum(marketData.timeframe, 'Timeframe', ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M']);
    }
    
    if (marketData.data && Array.isArray(marketData.data)) {
      // Validiere OHLCV-Daten
      marketData.data.forEach((candle, index) => {
        if (!candle.open || !candle.high || !candle.low || !candle.close) {
          this.errors.push(`Candle ${index} muss OHLC-Daten enthalten`);
        }
        if (candle.volume === undefined) {
          this.warnings.push(`Candle ${index} hat kein Volume`);
        }
      });
    }

    return this.isValid();
  }

  // Performance Metrics-Validierung
  validatePerformanceMetrics(metricsData) {
    this.clearErrors();
    
    this.validateRequired(metricsData.date, 'Datum');
    
    if (metricsData.date) {
      this.validateDate(metricsData.date, 'Datum');
    }
    
    // Numerische Metriken validieren
    const numericFields = [
      'totalTrades', 'winRate', 'totalPnL', 'avgWin', 'avgLoss', 
      'maxDrawdown', 'profitFactor', 'sharpeRatio', 'totalEquity',
      'availableMargin', 'usedMargin', 'totalRisk', 'expectedDrawdown'
    ];
    
    numericFields.forEach(field => {
      if (metricsData[field] !== undefined) {
        this.validateNumber(metricsData[field], field, -Infinity, Infinity);
      }
    });

    return this.isValid();
  }

  // File Storage-Validierung
  validateFileStorage(fileData) {
    this.clearErrors();
    
    this.validateRequired(fileData.tradeId, 'Trade ID');
    this.validateRequired(fileData.data, 'Datei-Daten');
    this.validateRequired(fileData.filename, 'Dateiname');
    this.validateRequired(fileData.type, 'Datei-Typ');
    
    if (fileData.filename) {
      this.validateString(fileData.filename, 'Dateiname', 1, 255);
    }
    
    if (fileData.type) {
      this.validateEnum(fileData.type, 'Datei-Typ', ['document', 'image', 'video', 'audio', 'other']);
    }
    
    if (fileData.size) {
      this.validateNumber(fileData.size, 'Dateigröße', 0, 100 * 1024 * 1024); // Max 100MB
    }

    return this.isValid();
  }

  // Backup-Validierung
  validateBackup(backupData) {
    this.clearErrors();
    
    this.validateRequired(backupData.exportTimestamp, 'Export-Zeitstempel');
    this.validateRequired(backupData.version, 'Version');
    
    if (backupData.exportTimestamp) {
      this.validateDate(backupData.exportTimestamp, 'Export-Zeitstempel');
    }
    
    if (backupData.version) {
      this.validateNumber(backupData.version, 'Version', 1);
    }
    
    // Prüfe ob alle erforderlichen Stores vorhanden sind
    const requiredStores = ['trades', 'screenshots', 'journal', 'settings'];
    requiredStores.forEach(store => {
      if (!backupData[store]) {
        this.warnings.push(`Store '${store}' fehlt im Backup`);
      }
    });

    return this.isValid();
  }

  // Utility-Methoden
  clearErrors() {
    this.errors = [];
    this.warnings = [];
  }

  isValid() {
    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors;
  }

  getWarnings() {
    return this.warnings;
  }

  getAllMessages() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: this.isValid()
    };
  }

  // Sanitization (Daten bereinigen)
  sanitizeString(value) {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, '');
  }

  sanitizeNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  sanitizeDate(value) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  // Komplette Trade-Sanitization
  sanitizeTrade(tradeData) {
    return {
      ...tradeData,
      symbol: this.sanitizeString(tradeData.symbol),
      side: this.sanitizeString(tradeData.side),
      status: this.sanitizeString(tradeData.status),
      quantity: this.sanitizeNumber(tradeData.quantity),
      entryPrice: this.sanitizeNumber(tradeData.entryPrice),
      exitPrice: this.sanitizeNumber(tradeData.exitPrice),
      stopLoss: this.sanitizeNumber(tradeData.stopLoss),
      takeProfit: this.sanitizeNumber(tradeData.takeProfit),
      pnl: this.sanitizeNumber(tradeData.pnl),
      entryDate: this.sanitizeDate(tradeData.entryDate),
      exitDate: tradeData.exitDate ? this.sanitizeDate(tradeData.exitDate) : null,
      notes: this.sanitizeString(tradeData.notes),
      strategy: this.sanitizeString(tradeData.strategy),
      sector: this.sanitizeString(tradeData.sector)
    };
  }
}

// Singleton-Instanz
const dataValidator = new DataValidator();

export default dataValidator;







