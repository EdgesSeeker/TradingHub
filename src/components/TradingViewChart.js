import React, { useEffect, useRef } from 'react';

const TradingViewChart = ({ symbol, interval = '1D', theme = 'dark', style = '1', width = '100%', height = '400' }) => {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": "Europe/Berlin",
      "theme": theme,
      "style": style,
      "locale": "de",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    const widgetContainer = container.current;
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container';
      widgetDiv.appendChild(script);
      widgetContainer.appendChild(widgetDiv);
    }

    return () => {
      if (widgetContainer) {
        widgetContainer.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, style]);

  return (
    <div 
      ref={container} 
      style={{ 
        width: width, 
        height: height,
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default TradingViewChart;
