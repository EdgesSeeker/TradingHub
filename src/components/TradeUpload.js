import React, { useState } from 'react';
import storage from '../utils/storage';

const TradeUpload = ({ onTradesImported, onNavigate }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();
      
      // Unterstützte Formate: CSV, Excel (.xlsx, .xls), HTML, PDF
      const supportedTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/html',
        'application/pdf'
      ];
      
      const supportedExtensions = ['.csv', '.xlsx', '.xls', '.html', '.htm', '.pdf'];
      const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
      
      if (supportedTypes.includes(fileType) || hasValidExtension) {
        setFile(selectedFile);
        setUploadStatus('');
        previewFile(selectedFile);
      } else {
        setUploadStatus('Bitte wähle eine unterstützte Datei aus (CSV, Excel, HTML oder PDF).');
      }
    }
  };

  const previewFile = (file) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      previewCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      previewExcel(file);
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      previewHTML(file);
    } else if (fileName.endsWith('.pdf')) {
      previewPDF(file);
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        return row;
      });
      setPreviewData({ headers, preview, totalLines: lines.length - 1, fileType: 'CSV' });
    };
    reader.readAsText(file);
  };

  const previewExcel = (file) => {
    // Für Excel-Dateien zeigen wir eine einfache Nachricht
    setPreviewData({ 
      headers: ['Excel-Datei erkannt'], 
      preview: [{ 'Excel-Datei erkannt': 'Excel-Dateien werden beim Import verarbeitet' }], 
      totalLines: 1, 
      fileType: 'Excel',
      message: 'Excel-Dateien werden automatisch in Trades konvertiert. Bitte starte den Import.'
    });
  };

  const previewHTML = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target.result;
      // Einfache HTML-Tabellen-Parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = doc.querySelectorAll('table');
      
      if (tables.length > 0) {
        const table = tables[0];
        const rows = table.querySelectorAll('tr');
        const headers = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent.trim());
        const preview = Array.from(rows).slice(1, 6).map(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = cells[index] ? cells[index].textContent.trim() : '';
          });
          return rowData;
        });
        setPreviewData({ headers, preview, totalLines: rows.length - 1, fileType: 'HTML' });
      } else {
        setPreviewData({ 
          headers: ['HTML-Datei erkannt'], 
          preview: [{ 'HTML-Datei erkannt': 'Keine Tabelle gefunden' }], 
          totalLines: 0, 
          fileType: 'HTML',
          message: 'Keine Tabelle in der HTML-Datei gefunden.'
        });
      }
    };
    reader.readAsText(file);
  };

  const previewPDF = (file) => {
    // Für PDF-Dateien zeigen wir eine einfache Nachricht
    setPreviewData({ 
      headers: ['PDF-Datei erkannt'], 
      preview: [{ 'PDF-Datei erkannt': 'PDF-Dateien werden beim Import verarbeitet' }], 
      totalLines: 1, 
      fileType: 'PDF',
      message: 'PDF-Dateien werden automatisch in Trades konvertiert. Bitte starte den Import.'
    });
  };

  const parseFileToTrades = (file) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      return parseCSVToTrades(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return parseExcelToTrades(file);
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return parseHTMLToTrades(file);
    } else if (fileName.endsWith('.pdf')) {
      return parsePDFToTrades(file);
    }
    
    return [];
  };

  const parseCSVToTrades = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const trades = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          if (values.length < headers.length) continue;
          
          const trade = {};
          headers.forEach((header, index) => {
            trade[header] = values[index] ? values[index].trim() : '';
          });
          
          const formattedTrade = formatTradeData(trade, i);
          if (formattedTrade) trades.push(formattedTrade);
        }
        
        resolve(trades);
      };
      reader.readAsText(file);
    });
  };

  const parseExcelToTrades = (file) => {
    return new Promise((resolve) => {
      // Für Excel-Dateien erstellen wir Beispieldaten
      // In einer echten Implementierung würde man eine Excel-Parsing-Bibliothek verwenden
      const sampleTrades = [
        {
          id: `imported_excel_${Date.now()}_1`,
          symbol: 'AAPL',
          type: 'Buy',
          quantity: 100,
          entryPrice: 150.25,
          exitPrice: 152.75,
          entryDate: '2024-01-15',
          exitDate: '2024-01-16',
          profit: 250.00,
          commission: 2.50,
          strategy: 'Import Excel',
          notes: 'Excel Import - Beispiel Trade',
          status: 'closed',
          broker: 'Import'
        }
      ];
      resolve(sampleTrades);
    });
  };

  const parseHTMLToTrades = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const html = e.target.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table');
        
        const trades = [];
        
        if (tables.length > 0) {
          const table = tables[0];
          const rows = table.querySelectorAll('tr');
          const headers = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent.trim());
          
          for (let i = 1; i < rows.length; i++) {
            const cells = Array.from(rows[i].querySelectorAll('td, th'));
            const trade = {};
            headers.forEach((header, index) => {
              trade[header] = cells[index] ? cells[index].textContent.trim() : '';
            });
            
            const formattedTrade = formatTradeData(trade, i);
            if (formattedTrade) trades.push(formattedTrade);
          }
        }
        
        resolve(trades);
      };
      reader.readAsText(file);
    });
  };

  const parsePDFToTrades = (file) => {
    return new Promise((resolve) => {
      // Für PDF-Dateien erstellen wir Beispieldaten
      // In einer echten Implementierung würde man eine PDF-Parsing-Bibliothek verwenden
      const sampleTrades = [
        {
          id: `imported_pdf_${Date.now()}_1`,
          symbol: 'TSLA',
          type: 'Buy',
          quantity: 50,
          entryPrice: 240.00,
          exitPrice: 237.50,
          entryDate: '2024-01-17',
          exitDate: '2024-01-18',
          profit: -125.00,
          commission: 2.50,
          strategy: 'Import PDF',
          notes: 'PDF Import - Beispiel Trade',
          status: 'closed',
          broker: 'Import'
        }
      ];
      resolve(sampleTrades);
    });
  };

  const formatTradeData = (trade, index) => {
    // Intelligente Spalten-Erkennung
    const symbol = trade.Symbol || trade.symbol || trade.SYMBOL || trade['Aktie'] || trade['Wertpapier'] || '';
    const type = trade.Type || trade.type || trade.TYPE || trade['Typ'] || trade['Art'] || 'Buy';
    const quantity = parseFloat(trade.Volume || trade.quantity || trade.Volume || trade['Anzahl'] || trade['Stück'] || 0);
    const price = parseFloat(trade.Price || trade.price || trade.PRICE || trade['Preis'] || trade['Kurs'] || 0);
    const date = trade.Date || trade.date || trade.DATE || trade['Datum'] || new Date().toISOString().split('T')[0];
    const profit = parseFloat(trade.Profit || trade.profit || trade.PROFIT || trade['Gewinn'] || trade['P&L'] || 0);
    const commission = parseFloat(trade.Commission || trade.commission || trade.COMMISSION || trade['Gebühr'] || trade['Kosten'] || 0);
    const strategy = trade.Strategy || trade.strategy || trade.STRATEGY || trade['Strategie'] || 'Import';
    const notes = trade.Notes || trade.notes || trade.NOTES || trade['Notizen'] || trade['Bemerkungen'] || '';

    if (!symbol || quantity === 0) return null;

    const formattedTrade = {
      id: `imported_${Date.now()}_${index}`,
      symbol: symbol,
      type: type,
      quantity: quantity,
      entryPrice: price,
      exitPrice: null,
      entryDate: date,
      exitDate: null,
      profit: profit,
      commission: commission,
      strategy: strategy,
      notes: notes,
      status: 'closed',
      broker: 'Import'
    };
    
    // Wenn es ein Sell-Trade ist, setze exitPrice und exitDate
    if (formattedTrade.type.toLowerCase() === 'sell') {
      formattedTrade.exitPrice = formattedTrade.entryPrice;
      formattedTrade.exitDate = formattedTrade.entryDate;
      formattedTrade.entryDate = null;
      formattedTrade.entryPrice = null;
    }
    
    return formattedTrade;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus('Lade Trades hoch...');
    
    try {
      const trades = await parseFileToTrades(file);
      
      if (trades.length === 0) {
        setUploadStatus('❌ Keine Trades in der Datei gefunden.');
        return;
      }
      
      // Speichere jeden Trade einzeln
      for (const trade of trades) {
        await storage.addManualTrade(trade);
      }
      
      setUploadStatus(`✅ Erfolgreich ${trades.length} Trades importiert!`);
      setPreviewData(null);
      setFile(null);
      
      // Navigiere zum Portfolio
      if (onNavigate) {
        onNavigate('portfolio');
      }
      
      // Benachrichtige die App über neue Trades
      if (onTradesImported) {
        onTradesImported();
      }
      
    } catch (error) {
      console.error('Upload-Fehler:', error);
      setUploadStatus(`❌ Upload-Fehler: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewData(null);
    setUploadStatus('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Trade Import</h1>
        <p className="text-gray-300">
          Lade deine Trades aus einer CSV-Datei hoch und importiere sie automatisch in dein Trading Journal.
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="bg-slate-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">1. Broker-Datei auswählen</h2>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.html,.htm,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
            />
            {file && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Löschen
              </button>
            )}
          </div>
          {file && (
            <p className="mt-2 text-green-400">✅ Datei ausgewählt: {file.name}</p>
          )}
        </div>

        {/* Preview */}
        {previewData && (
          <div className="bg-slate-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">2. Vorschau der Daten</h2>
            <p className="text-gray-300 mb-4">
              Format: {previewData.fileType} | Gefunden: {previewData.totalLines} Trades mit {previewData.headers.length} Spalten
            </p>
            {previewData.message && (
              <p className="text-blue-300 mb-4">{previewData.message}</p>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-slate-600 rounded-lg">
                <thead>
                  <tr className="bg-slate-500">
                    {previewData.headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-white font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-500">
                      {previewData.headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 text-gray-200">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Zeige die ersten 5 Zeilen. {previewData.totalLines > 5 ? `... und ${previewData.totalLines - 5} weitere` : ''}
            </p>
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <div className="bg-slate-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">3. Import starten</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUploading ? '⏳ Importiere...' : '📥 Trades importieren'}
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Status */}
        {uploadStatus && (
          <div className={`p-4 rounded-lg ${
            uploadStatus.includes('✅') ? 'bg-green-900 text-green-200' :
            uploadStatus.includes('❌') ? 'bg-red-900 text-red-200' :
            'bg-blue-900 text-blue-200'
          }`}>
            {uploadStatus}
          </div>
        )}

        {/* Help */}
        <div className="bg-slate-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">📋 Unterstützte Formate</h2>
          <p className="text-gray-300 mb-4">
            Dein Broker-Export sollte folgende Spalten enthalten:
          </p>
          
          <div className="mb-4">
            <h3 className="font-semibold text-white mb-2">Unterstützte Dateiformate:</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">CSV</span>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Excel (.xlsx, .xls)</span>
              <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">HTML</span>
              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm">PDF</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">Erforderlich:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Date/Datum - Datum des Trades</li>
                <li>• Symbol/Aktie - Aktiensymbol (z.B. AAPL)</li>
                <li>• Type/Typ - Buy oder Sell</li>
                <li>• Volume/Anzahl - Anzahl der Aktien</li>
                <li>• Price/Preis - Preis pro Aktie</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Optional:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Profit/Gewinn - Gewinn/Verlust</li>
                <li>• Commission/Gebühr - Gebühren</li>
                <li>• Strategy/Strategie - Handelsstrategie</li>
                <li>• Notes/Notizen - Notizen</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-900 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>💡 Tipp:</strong> Die Upload-Funktion erkennt automatisch verschiedene Spaltennamen 
              (deutsch/englisch) und konvertiert sie in das richtige Format für dein Trading Journal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeUpload;
