// Market Data API Service
const MARKET_DATA_API = {
  // Free API endpoints for market data
  ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
  YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance/chart',
  FINNHUB: 'https://finnhub.io/api/v1'
};

// Cache for API responses to avoid rate limits
const marketDataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate simulated market data based on real market patterns
const generateSimulatedMarketData = (symbol, period, startDate, endDate) => {
  const periods = {
    '1w': 7,
    '1m': 30,
    '3m': 90,
    '1y': 365
  };
  
  const days = periods[period] || 30;
  const data = [];
  
  // Starting values (approximate real values)
  const startValues = {
    'SPY': 450, // S&P 500 ETF
    'QQQ': 380, // NASDAQ 100 ETF
    '^GSPC': 4500, // S&P 500 Index
    '^IXIC': 14000, // NASDAQ Index
    '^NDX': 15000 // NASDAQ 100 Index
  };
  
  let currentValue = startValues[symbol] || 100;
  const startTime = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startTime);
    currentDate.setDate(startTime.getDate() + i);
    
    // Generate realistic market movements
    const volatility = 0.02; // 2% daily volatility
    const trend = 0.0005; // Slight upward trend
    const randomChange = (Math.random() - 0.5) * volatility;
    const dailyReturn = trend + randomChange;
    
    currentValue *= (1 + dailyReturn);
    
    // Add some market patterns (weekend gaps, etc.)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      // Weekend - no trading
      continue;
    }
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      open: currentValue * (1 + (Math.random() - 0.5) * 0.01),
      high: currentValue * (1 + Math.random() * 0.02),
      low: currentValue * (1 - Math.random() * 0.02),
      close: currentValue,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
  }
  
  return data;
};

// Get market data for a symbol and period
export const getMarketData = async (symbol, period = '1m') => {
  const cacheKey = `${symbol}_${period}`;
  const cached = marketDataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    // For demo purposes, we'll use simulated data
    // In production, you would use real API calls here
    const endDate = new Date();
    const startDate = new Date();
    
    const periods = {
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '1y': 365
    };
    
    startDate.setDate(endDate.getDate() - (periods[period] || 30));
    
    const data = generateSimulatedMarketData(symbol, period, startDate, endDate);
    
    // Cache the result
    marketDataCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};

// Get multiple symbols data
export const getMultipleMarketData = async (symbols, period = '1m') => {
  const promises = symbols.map(symbol => getMarketData(symbol, period));
  const results = await Promise.all(promises);
  
  return symbols.reduce((acc, symbol, index) => {
    acc[symbol] = results[index];
    return acc;
  }, {});
};

// Calculate performance metrics for market data
export const calculateMarketPerformance = (data) => {
  if (!data || data.length === 0) return null;
  
  const startValue = data[0].close;
  const endValue = data[data.length - 1].close;
  const totalReturn = (endValue - startValue) / startValue;
  const totalReturnPercent = totalReturn * 100;
  
  // Calculate daily returns
  const dailyReturns = [];
  for (let i = 1; i < data.length; i++) {
    const dailyReturn = (data[i].close - data[i-1].close) / data[i-1].close;
    dailyReturns.push(dailyReturn);
  }
  
  // Calculate volatility (standard deviation of daily returns)
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
  
  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = startValue;
  
  for (const point of data) {
    if (point.close > peak) {
      peak = point.close;
    }
    const drawdown = (peak - point.close) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return {
    startValue,
    endValue,
    totalReturn,
    totalReturnPercent,
    volatility: volatility * 100,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio: totalReturn / (volatility || 0.01)
  };
};

// Compare equity curve with market data
export const compareWithMarket = (equityData, marketData) => {
  if (!equityData || !marketData || equityData.length === 0 || marketData.length === 0) {
    return null;
  }
  
  const equityPerformance = calculateMarketPerformance(equityData.map(d => ({ close: d.equity })));
  const marketPerformance = calculateMarketPerformance(marketData);
  
  if (!equityPerformance || !marketPerformance) return null;
  
  return {
    equity: equityPerformance,
    market: marketPerformance,
    outperformance: equityPerformance.totalReturnPercent - marketPerformance.totalReturnPercent,
    correlation: calculateCorrelation(equityData, marketData)
  };
};

// Calculate correlation between equity and market data
const calculateCorrelation = (equityData, marketData) => {
  // Align data by date
  const alignedData = [];
  
  for (const equityPoint of equityData) {
    const marketPoint = marketData.find(m => m.date === equityPoint.date);
    if (marketPoint) {
      alignedData.push({
        equity: equityPoint.equity,
        market: marketPoint.close
      });
    }
  }
  
  if (alignedData.length < 2) return 0;
  
  // Calculate returns
  const equityReturns = [];
  const marketReturns = [];
  
  for (let i = 1; i < alignedData.length; i++) {
    const equityReturn = (alignedData[i].equity - alignedData[i-1].equity) / alignedData[i-1].equity;
    const marketReturn = (alignedData[i].market - alignedData[i-1].market) / alignedData[i-1].market;
    
    equityReturns.push(equityReturn);
    marketReturns.push(marketReturn);
  }
  
  // Calculate correlation coefficient
  const n = equityReturns.length;
  const sumX = equityReturns.reduce((a, b) => a + b, 0);
  const sumY = marketReturns.reduce((a, b) => a + b, 0);
  const sumXY = equityReturns.reduce((sum, x, i) => sum + x * marketReturns[i], 0);
  const sumX2 = equityReturns.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = marketReturns.reduce((sum, y) => sum + y * y, 0);
  
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return isNaN(correlation) ? 0 : correlation;
};

export default {
  getMarketData,
  getMultipleMarketData,
  calculateMarketPerformance,
  compareWithMarket
};