// Responsive Component Wrapper
// Automatically applies web or mobile classes based on screen size

import React, { useState, useEffect } from 'react';
import responsiveManager from '../utils/responsive';

const ResponsiveWrapper = ({ 
  children, 
  webClassName = '', 
  mobileClassName = '', 
  component = 'div',
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  const [isWeb, setIsWeb] = useState(responsiveManager.isWebDevice());
  
  useEffect(() => {
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
      setIsWeb(event.detail.isWeb);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
    };
  }, []);
  
  // Determine which classes to apply
  const getClassName = () => {
    let className = '';
    
    if (isMobile) {
      className = mobileClassName || 'mobile-only';
    } else {
      className = webClassName || 'web-only';
    }
    
    return className;
  };
  
  // Create the component with appropriate props
  const Component = component;
  
  return (
    <Component 
      className={getClassName()}
      data-responsive-mode={isMobile ? 'mobile' : 'web'}
      {...props}
    >
      {children}
    </Component>
  );
};

// Specific responsive components
export const WebOnly = ({ children, ...props }) => (
  <ResponsiveWrapper 
    component="div" 
    webClassName="web-only" 
    mobileClassName="mobile-hidden"
    {...props}
  >
    {children}
  </ResponsiveWrapper>
);

export const MobileOnly = ({ children, ...props }) => (
  <ResponsiveWrapper 
    component="div" 
    webClassName="web-hidden" 
    mobileClassName="mobile-only"
    {...props}
  >
    {children}
  </ResponsiveWrapper>
);

// Responsive button component
export const ResponsiveButton = ({ 
  children, 
  webProps = {}, 
  mobileProps = {},
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  
  useEffect(() => {
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
    };
  }, []);
  
  const buttonProps = isMobile ? { ...props, ...mobileProps } : { ...props, ...webProps };
  const className = isMobile ? 'mobile-button' : 'web-button';
  
  return (
    <button 
      className={className}
      data-responsive-mode={isMobile ? 'mobile' : 'web'}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children, 
  webProps = {}, 
  mobileProps = {},
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  
  useEffect(() => {
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
    };
  }, []);
  
  const cardProps = isMobile ? { ...props, ...mobileProps } : { ...props, ...webProps };
  const className = isMobile ? 'mobile-card' : 'web-card';
  
  return (
    <div 
      className={className}
      data-responsive-mode={isMobile ? 'mobile' : 'web'}
      {...cardProps}
    >
      {children}
    </div>
  );
};

// Responsive navigation component
export const ResponsiveNavigation = ({ 
  children, 
  webProps = {}, 
  mobileProps = {},
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  
  useEffect(() => {
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
    };
  }, []);
  
  const navProps = isMobile ? { ...props, ...mobileProps } : { ...props, ...webProps };
  const className = isMobile ? 'mobile-nav' : 'web-nav';
  
  return (
    <nav 
      className={className}
      data-responsive-mode={isMobile ? 'mobile' : 'web'}
      {...navProps}
    >
      {children}
    </nav>
  );
};

// Responsive modal component
export const ResponsiveModal = ({ 
  children, 
  isOpen, 
  onClose,
  webProps = {}, 
  mobileProps = {},
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(responsiveManager.isMobileDevice());
  
  useEffect(() => {
    const handleBreakpointChange = (event) => {
      setIsMobile(event.detail.isMobile);
    };
    
    window.addEventListener('breakpointChange', handleBreakpointChange);
    
    return () => {
      window.removeEventListener('breakpointChange', handleBreakpointChange);
    };
  }, []);
  
  if (!isOpen) return null;
  
  const modalProps = isMobile ? { ...props, ...mobileProps } : { ...props, ...webProps };
  const modalClassName = isMobile ? 'mobile-modal' : 'web-modal';
  const contentClassName = isMobile ? 'mobile-modal-content' : 'web-modal-content';
  
  return (
    <div 
      className={modalClassName}
      data-responsive-mode={isMobile ? 'mobile' : 'web'}
      {...modalProps}
    >
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveWrapper;
