import React, { useEffect, useRef } from 'react';

const TradingViewAdvancedChart = ({ 
  symbol, 
  interval = '1D', 
  theme = 'dark', 
  pineScript = null,
  width = '100%', 
  height = '400' 
}) => {
  const container = useRef();

  useEffect(() => {
    // Load TradingView Charting Library
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.async = true;
    
    script.onload = () => {
      if (window.TradingView) {
        createChart();
      }
    };

    document.head.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, pineScript]);

  const createChart = () => {
    if (!container.current) return;

    // Create chart instance
    const chart = window.TradingView.widget({
      symbol: symbol,
      interval: interval,
      timezone: 'Europe/Berlin',
      theme: theme,
      style: '1',
      locale: 'de',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: container.current.id,
      library_path: '/charting_library/',
      custom_css_url: '/css/trading_view.css',
      studies_overrides: {},
      disabled_features: ['use_localstorage_for_settings'],
      enabled_features: ['study_templates'],
      charts_storage_url: 'https://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      client_id: 'tradingview.com',
      user_id: 'public_user_id',
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
      },
      loading_screen: { backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' },
      custom_indicators_getter: function(PineJS) {
        return Promise.resolve([
          // You can add custom indicators here
        ]);
      }
    });

    // If you have a Pine Script, you can load it
    if (pineScript) {
      // This would require the full TradingView Charting Library
      // For now, we'll use the widget approach
      console.log('Pine Script available:', pineScript);
    }
  };

  return (
    <div 
      ref={container} 
      id={`tradingview-chart-${symbol}`}
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

export default TradingViewAdvancedChart;
