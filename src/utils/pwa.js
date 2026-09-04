// PWA Service Worker Registration and Management
class PWAManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
    this.deferredPrompt = null;
    this.isInstalled = false;
    
    this.init();
  }
  
  async init() {
    if (!this.isSupported) {
      console.log('❌ PWA: Service Worker not supported');
      return;
    }
    
    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ PWA: Service Worker registered successfully');
      
      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 PWA: Update found, installing...');
        this.handleUpdate();
      });
      
      // Check if app is already installed
      this.checkInstallationStatus();
      
      // Listen for install prompt
      this.setupInstallPrompt();
      
      // Setup push notifications
      this.setupPushNotifications();
      
    } catch (error) {
      console.error('❌ PWA: Service Worker registration failed', error);
    }
  }
  
  async handleUpdate() {
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New content is available, show update notification
          this.showUpdateNotification();
        } else {
          // Content is cached for the first time
          console.log('✅ PWA: Content is cached for offline use');
        }
      }
    });
  }
  
  showUpdateNotification() {
    if (window.confirm('Neue Version verfügbar! Jetzt aktualisieren?')) {
      this.updateApp();
    }
  }
  
  updateApp() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
  
  checkInstallationStatus() {
    // Check if app is running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true;
    
    console.log('📱 PWA: Installation status', this.isInstalled ? 'Installed' : 'Not installed');
  }
  
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('💾 PWA: Install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
    });
  }
  
  showInstallButton() {
    // Create install button if not exists
    let installButton = document.getElementById('pwa-install-button');
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.innerHTML = '📱 App installieren';
      installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
      `;
      
      installButton.addEventListener('click', () => this.installApp());
      document.body.appendChild(installButton);
    }
    
    installButton.style.display = 'block';
  }
  
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }
  
  async installApp() {
    if (!this.deferredPrompt) {
      console.log('❌ PWA: Install prompt not available');
      return;
    }
    
    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('📱 PWA: Install prompt outcome', outcome);
      
      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted install prompt');
      } else {
        console.log('❌ PWA: User dismissed install prompt');
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.hideInstallButton();
      
    } catch (error) {
      console.error('❌ PWA: Install prompt failed', error);
    }
  }
  
  async setupPushNotifications() {
    if (!('Notification' in window)) {
      console.log('❌ PWA: Push notifications not supported');
      return;
    }
    
    // Check current permission
    if (Notification.permission === 'granted') {
      console.log('✅ PWA: Push notifications already enabled');
      return;
    }
    
    // Request permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 PWA: Notification permission', permission);
    }
  }
  
  async sendNotification(title, options = {}) {
    if (!this.registration || Notification.permission !== 'granted') {
      console.log('❌ PWA: Cannot send notification - no permission');
      return;
    }
    
    try {
      await this.registration.showNotification(title, {
        body: options.body || 'Trading Journal Update',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: options.data || {},
        actions: options.actions || [
          {
            action: 'open',
            title: 'Öffnen',
            icon: '/icons/icon-72x72.png'
          }
        ],
        ...options
      });
      
      console.log('✅ PWA: Notification sent', title);
    } catch (error) {
      console.error('❌ PWA: Failed to send notification', error);
    }
  }
  
  // Send routine reminder notification
  sendRoutineReminder() {
    this.sendNotification('Trading Routine', {
      body: 'Vergiss nicht deine tägliche Trading-Routine abzuschließen!',
      data: { type: 'routine-reminder' },
      actions: [
        {
          action: 'open-routine',
          title: 'Routine öffnen',
          icon: '/icons/icon-72x72.png'
        }
      ]
    });
  }
  
  // Send trade reminder notification
  sendTradeReminder() {
    this.sendNotification('Trade Update', {
      body: 'Neue Trades zum Analysieren verfügbar!',
      data: { type: 'trade-reminder' },
      actions: [
        {
          action: 'open-trades',
          title: 'Trades anzeigen',
          icon: '/icons/icon-72x72.png'
        }
      ]
    });
  }
  
  // Get app version
  async getVersion() {
    if (!this.registration) return null;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };
      
      this.registration.active.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }
  
  // Check if app is online
  isOnline() {
    return navigator.onLine;
  }
  
  // Setup online/offline listeners
  setupConnectionListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 PWA: Back online');
      this.sendNotification('Verbindung wiederhergestellt', {
        body: 'Du bist wieder online!',
        data: { type: 'connection-restored' }
      });
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 PWA: Gone offline');
      this.sendNotification('Offline Modus', {
        body: 'Du bist offline - deine Daten werden lokal gespeichert',
        data: { type: 'offline-mode' }
      });
    });
  }
}

// Create global PWA manager instance
const pwaManager = new PWAManager();

// Export for use in other components
export default pwaManager;

// Export individual functions for convenience
export const {
  sendRoutineReminder,
  sendTradeReminder,
  isOnline,
  isInstalled: isAppInstalled
} = pwaManager;
