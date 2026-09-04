// Responsive Design Manager
// Handles Web vs Mobile design switching

class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      mobile: 1023,  // Below 1024px = Mobile
      tablet: 1024,  // 1024px - 1199px = Tablet
      desktop: 1200, // 1200px+ = Desktop
      large: 1400    // 1400px+ = Large Desktop
    };
    
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.isMobile = this.currentBreakpoint === 'mobile';
    this.isWeb = !this.isMobile;
    
    this.init();
  }
  
  init() {
    // Listen for resize events
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Listen for orientation changes on mobile
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Initial setup
    this.updateBodyClasses();
    this.setupPWAFeatures();
  }
  
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check if it's a mobile device by user agent
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Check if it's a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Mobile if screen is small OR it's a mobile device OR it's a touch device
    if (width <= this.breakpoints.mobile || isMobileDevice || isTouchDevice) {
      return 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      return 'tablet';
    } else if (width <= this.breakpoints.desktop) {
      return 'desktop';
    } else {
      return 'large';
    }
  }
  
  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.isMobile = newBreakpoint === 'mobile';
      this.isWeb = !this.isMobile;
      
      this.updateBodyClasses();
      this.onBreakpointChange(newBreakpoint);
    }
  }
  
  handleOrientationChange() {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      this.handleResize();
    }, 100);
  }
  
  updateBodyClasses() {
    const body = document.body;
    
    // Remove existing breakpoint classes
    body.classList.remove('mobile', 'tablet', 'desktop', 'large');
    body.classList.remove('web-mode', 'mobile-mode');
    
    // Add current breakpoint class
    body.classList.add(this.currentBreakpoint);
    
    // Add mode classes
    if (this.isMobile) {
      body.classList.add('mobile-mode');
    } else {
      body.classList.add('web-mode');
    }
  }
  
  setupPWAFeatures() {
    // Only setup PWA features on mobile
    if (this.isMobile) {
      this.setupMobilePWA();
    } else {
      this.setupWebFeatures();
    }
  }
  
  setupMobilePWA() {
    // Mobile-specific PWA setup
    console.log('📱 Setting up Mobile PWA features');
    
    // Add mobile-specific meta tags
    this.addMobileMetaTags();
    
    // Setup touch gestures
    this.setupTouchGestures();
    
    // Setup mobile navigation
    this.setupMobileNavigation();
  }
  
  setupWebFeatures() {
    // Web-specific features
    console.log('💻 Setting up Web features');
    
    // Add web-specific meta tags
    this.addWebMetaTags();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Setup web navigation
    this.setupWebNavigation();
  }
  
  addMobileMetaTags() {
    // Add mobile-optimized viewport
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover');
    }
    
    // Add mobile web app capabilities
    let mobileCapable = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (!mobileCapable) {
      mobileCapable = document.createElement('meta');
      mobileCapable.name = 'mobile-web-app-capable';
      mobileCapable.content = 'yes';
      document.head.appendChild(mobileCapable);
    }
  }
  
  addWebMetaTags() {
    // Add web-optimized viewport
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    }
  }
  
  setupTouchGestures() {
    // Mobile touch gesture setup
    let touchStartY = 0;
    let touchStartX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;
      
      // Swipe detection
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 50) {
          // Swipe up
          this.handleSwipeUp();
        } else if (deltaY < -50) {
          // Swipe down
          this.handleSwipeDown();
        }
      } else {
        if (deltaX > 50) {
          // Swipe left
          this.handleSwipeLeft();
        } else if (deltaX < -50) {
          // Swipe right
          this.handleSwipeRight();
        }
      }
    });
  }
  
  setupKeyboardShortcuts() {
    // Web keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.handleSearch();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }
  
  setupMobileNavigation() {
    // Mobile navigation setup
    console.log('📱 Mobile navigation setup');
  }
  
  setupWebNavigation() {
    // Web navigation setup
    console.log('💻 Web navigation setup');
  }
  
  // Event handlers
  handleSwipeUp() {
    console.log('📱 Swipe up detected');
    // Handle swipe up gesture
  }
  
  handleSwipeDown() {
    console.log('📱 Swipe down detected');
    // Handle swipe down gesture
  }
  
  handleSwipeLeft() {
    console.log('📱 Swipe left detected');
    // Handle swipe left gesture
  }
  
  handleSwipeRight() {
    console.log('📱 Swipe right detected');
    // Handle swipe right gesture
  }
  
  handleSearch() {
    console.log('💻 Search triggered');
    // Handle search functionality
  }
  
  handleEscape() {
    console.log('💻 Escape pressed');
    // Handle escape key
  }
  
  onBreakpointChange(newBreakpoint) {
    console.log(`🔄 Breakpoint changed to: ${newBreakpoint}`);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('breakpointChange', {
      detail: {
        breakpoint: newBreakpoint,
        isMobile: this.isMobile,
        isWeb: this.isWeb
      }
    }));
    
    // Update PWA features
    this.setupPWAFeatures();
  }
  
  // Utility methods
  isMobileDevice() {
    return this.isMobile;
  }
  
  isWebDevice() {
    return this.isWeb;
  }
  
  getCurrentBreakpointName() {
    return this.currentBreakpoint;
  }
  
  getScreenWidth() {
    return window.innerWidth;
  }
  
  getScreenHeight() {
    return window.innerHeight;
  }
  
  // CSS class helpers
  addClass(element, className) {
    if (element && element.classList) {
      element.classList.add(className);
    }
  }
  
  removeClass(element, className) {
    if (element && element.classList) {
      element.classList.remove(className);
    }
  }
  
  toggleClass(element, className) {
    if (element && element.classList) {
      element.classList.toggle(className);
    }
  }
  
  hasClass(element, className) {
    return element && element.classList && element.classList.contains(className);
  }
}

// Create global instance
const responsiveManager = new ResponsiveManager();

// Export for use in components
export default responsiveManager;

// Export individual methods for convenience
export const {
  isMobileDevice,
  isWebDevice,
  getCurrentBreakpointName,
  getScreenWidth,
  getScreenHeight
} = responsiveManager;
