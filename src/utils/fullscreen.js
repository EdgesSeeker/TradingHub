// Fullscreen utility functions
export const requestFullscreen = () => {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
};

export const isFullscreen = () => {
  return !!(document.fullscreenElement || 
           document.webkitFullscreenElement || 
           document.mozFullScreenElement || 
           document.msFullscreenElement);
};

export const toggleFullscreen = () => {
  if (isFullscreen()) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
};

// PWA Fullscreen mode
export const enterPWAFullscreen = () => {
  // Add fullscreen class to body
  document.body.classList.add('pwa-fullscreen');
  
  // Hide browser UI elements
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
  
  // Add PWA-specific styles
  const style = document.createElement('style');
  style.id = 'pwa-fullscreen-styles';
  style.textContent = `
    .pwa-fullscreen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
      background: #0f172a !important;
    }
    
    .pwa-fullscreen .mobile-header {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 1000 !important;
      background: #1e293b !important;
      border-bottom: 1px solid #334155 !important;
    }
    
    .pwa-fullscreen .mobile-nav {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 1000 !important;
      background: #1e293b !important;
      border-top: 1px solid #334155 !important;
    }
    
    .pwa-fullscreen .main-content {
      padding-top: 60px !important;
      padding-bottom: 80px !important;
      height: 100vh !important;
      overflow-y: auto !important;
    }
    
    /* Hide scrollbars in fullscreen */
    .pwa-fullscreen::-webkit-scrollbar {
      display: none;
    }
    
    .pwa-fullscreen {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  
  if (!document.getElementById('pwa-fullscreen-styles')) {
    document.head.appendChild(style);
  }
};

export const exitPWAFullscreen = () => {
  // Remove fullscreen class
  document.body.classList.remove('pwa-fullscreen');
  
  // Remove PWA-specific styles
  const style = document.getElementById('pwa-fullscreen-styles');
  if (style) {
    style.remove();
  }
  
  // Reset viewport
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
  }
};

export const togglePWAFullscreen = () => {
  if (document.body.classList.contains('pwa-fullscreen')) {
    exitPWAFullscreen();
  } else {
    enterPWAFullscreen();
  }
};
