import React, { useEffect, useRef } from 'react';

const TradingViewMiniChart = ({ symbol, theme = 'dark', width = '100%', height = '200' }) => {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": "100%",
      "height": "100%",
      "locale": "de",
      "dateRange": "12M",
      "colorTheme": theme,
      "trendLineColor": "rgba(41, 98, 255, 1)",
      "underLineColor": "rgba(41, 98, 255, 0.3)",
      "underLineBottomColor": "rgba(41, 98, 255, 0)",
      "isTransparent": false,
      "autosize": true,
      "largeChartUrl": ""
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
  }, [symbol, theme]);

  return (
    <div 
      ref={container} 
      style={{ 
        width: width, 
        height: height,
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`
      }}
    />
  );
};

export default TradingViewMiniChart;
