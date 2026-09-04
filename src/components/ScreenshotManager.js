import React, { useState, useEffect, useRef } from 'react';
import advancedStorage from '../utils/advancedStorage';
import './ScreenshotManager.css';

const ScreenshotManager = ({ tradeId, onScreenshotAdded }) => {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (tradeId) {
      loadScreenshots();
    }
  }, [tradeId]);

  const loadScreenshots = async () => {
    try {
      const data = await advancedStorage.getScreenshots(tradeId);
      setScreenshots(data);
    } catch (error) {
      console.error('Fehler beim Laden der Screenshots:', error);
      setMessage(`❌ Fehler beim Laden: ${error.message}`);
    }
  };

  const handleFileUpload = async (files) => {
    setLoading(true);
    setMessage('');

    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const screenshotData = e.target.result;
              const screenshotId = await advancedStorage.saveScreenshot(
                tradeId, 
                screenshotData, 
                'analysis'
              );
              
              setMessage(`✅ Screenshot gespeichert: ${file.name}`);
              await loadScreenshots();
              
              if (onScreenshotAdded) {
                onScreenshotAdded(screenshotId);
              }
            } catch (error) {
              setMessage(`❌ Fehler beim Speichern: ${error.message}`);
            }
          };
          reader.readAsDataURL(file);
        } else {
          setMessage(`❌ Ungültiger Dateityp: ${file.name}`);
        }
      }
    } catch (error) {
      setMessage(`❌ Upload-Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const captureScreenshot = async () => {
    try {
      // Canvas für Screenshot erstellen
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Bildschirmgröße
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Screenshot mit html2canvas (falls verfügbar) oder einfache Implementierung
      if (window.html2canvas) {
        const canvasElement = await window.html2canvas(document.body);
        ctx.drawImage(canvasElement, 0, 0);
      } else {
        // Fallback: Screenshot des aktuellen Tabs
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Screenshot nicht verfügbar', 50, 50);
      }
      
      const screenshotData = canvas.toDataURL('image/png');
      const screenshotId = await advancedStorage.saveScreenshot(
        tradeId, 
        screenshotData, 
        'capture'
      );
      
      setMessage('✅ Screenshot erfasst');
      await loadScreenshots();
      
      if (onScreenshotAdded) {
        onScreenshotAdded(screenshotId);
      }
    } catch (error) {
      setMessage(`❌ Screenshot-Fehler: ${error.message}`);
    }
  };

  const deleteScreenshot = async (screenshotId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Screenshot löschen möchten?')) {
      return;
    }

    try {
      // Screenshot aus der Datenbank löschen
      const transaction = advancedStorage.db.transaction(['screenshots'], 'readwrite');
      const store = transaction.objectStore('screenshots');
      await new Promise((resolve, reject) => {
        const request = store.delete(screenshotId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      setMessage('🗑️ Screenshot gelöscht');
      await loadScreenshots();
    } catch (error) {
      setMessage(`❌ Lösch-Fehler: ${error.message}`);
    }
  };

  const downloadScreenshot = (screenshot) => {
    const link = document.createElement('a');
    link.href = screenshot.data;
    link.download = `screenshot-${screenshot.id}-${new Date(screenshot.timestamp).toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="screenshot-manager">
      <div className="screenshot-header">
        <h3>📸 Screenshot Management</h3>
        <p>Verwalten Sie Chart-Screenshots und Analysen</p>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Upload Area */}
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h4>Dateien hier ablegen oder klicken</h4>
          <p>Unterstützte Formate: PNG, JPG, GIF, WebP</p>
          <button className="btn btn-primary">
            📤 Dateien auswählen
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          style={{ display: 'none' }}
        />
      </div>

      {/* Screenshot Actions */}
      <div className="screenshot-actions">
        <button 
          className="btn btn-secondary"
          onClick={captureScreenshot}
          disabled={loading}
        >
          📷 Screenshot erstellen
        </button>
        
        <button 
          className="btn btn-info"
          onClick={() => window.open('https://www.tradingview.com', '_blank')}
        >
          📈 TradingView öffnen
        </button>
      </div>

      {/* Screenshot Gallery */}
      <div className="screenshot-gallery">
        <h4>Screenshots ({screenshots.length})</h4>
        
        {screenshots.length === 0 ? (
          <div className="no-screenshots">
            <p>Keine Screenshots vorhanden</p>
            <p>Laden Sie Bilder hoch oder erstellen Sie Screenshots</p>
          </div>
        ) : (
          <div className="screenshot-grid">
            {screenshots.map(screenshot => (
              <div key={screenshot.id} className="screenshot-item">
                <div className="screenshot-preview">
                  <img 
                    src={screenshot.data} 
                    alt={`Screenshot ${screenshot.id}`}
                    loading="lazy"
                  />
                  <div className="screenshot-overlay">
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => downloadScreenshot(screenshot)}
                    >
                      📥 Download
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteScreenshot(screenshot.id)}
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
                <div className="screenshot-info">
                  <div className="screenshot-meta">
                    <span className="type-badge">
                      {screenshot.type === 'capture' ? '📷 Erfasst' : 
                       screenshot.type === 'analysis' ? '📊 Analyse' : '📸 Upload'}
                    </span>
                    <span className="size">{formatFileSize(screenshot.size)}</span>
                  </div>
                  <div className="screenshot-date">
                    {formatDate(screenshot.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Canvas for Screenshots */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ScreenshotManager;







