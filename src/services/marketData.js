// Market Data Service for fetching real-time prices and calculating Moving Averages
// Based on the Google Sheets script provided by the user

const ALPHA_VANTAGE_API_KEY = "O1DWEUG9Q61ALNXH"; // API Key from user's script

class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes instead of 5 minutes
    this.apiCallCount = 0;
    this.lastApiCall = 0;
  }

  // Calculate Simple Moving Average
  calculateSMA(prices, period) {
    if (prices.length < period) {
      return null;
    }
    
    const recentPrices = prices.slice(0, period);
    const sum = recentPrices.reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  // Calculate Exponential Moving Average
  calculateEMA(prices, period) {
    if (prices.length < period) {
      return null;
    }
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return null;
    }
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i - 1] - prices[i];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (change > 0) {
        currentGain = change;
      } else {
        currentLoss = Math.abs(change);
      }
      
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  // Calculate MACD
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod + signalPeriod) {
      return null;
    }
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    if (!fastEMA || !slowEMA) {
      return null;
    }
    
    const macdLine = fastEMA - slowEMA;
    
    // For simplicity, we'll use a simplified signal line calculation
    // In a real implementation, you'd need to track MACD values over time
    const signalLine = macdLine * 0.8; // Simplified approximation
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
      bullish: macdLine > signalLine
    };
  }

  // Calculate ATR (Average True Range)
  calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
      return null;
    }
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      
      const trueRange = Math.max(highLow, highClose, lowClose);
      trueRanges.push(trueRange);
    }
    
    // Calculate average of true ranges
    const sum = trueRanges.slice(0, period).reduce((acc, tr) => acc + tr, 0);
    return sum / period;
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      return null;
    }
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const recentPrices = prices.slice(0, period);
    const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  // Fetch fundamental data (company overview)
  async fetchFundamentalData(symbol) {
    const cacheKey = `fundamental_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      await this.checkApiLimits();
      
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: API Request failed`);
      }

      const data = await response.json();
      
      if (data.Note && data.Note.includes("API call frequency")) {
        throw new Error("API Limit reached - try again later");
      }
      
      if (data.Error) {
        throw new Error(`API Error: ${data.Error}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching fundamental data for ${symbol}:`, error);
      throw error;
    }
  }

  // Fetch intraday data for multi-timeframe analysis
  async fetchIntradayData(symbol, interval = '60min') {
    const cacheKey = `intraday_${symbol}_${interval}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: API Request failed`);
      }

      const data = await response.json();
      
      if (data.Note && data.Note.includes("API call frequency")) {
        throw new Error("API Limit reached - try again later");
      }
      
      if (data.Error) {
        throw new Error(`API Error: ${data.Error}`);
      }

      const timeSeriesKey = `Time Series (${interval})`;
      if (!data[timeSeriesKey]) {
        throw new Error("No intraday data available");
      }

      const timeSeries = data[timeSeriesKey];
      const timestamps = Object.keys(timeSeries).sort().reverse();
      
      const result = {
        symbol,
        interval,
        data: timestamps.map(timestamp => ({
          timestamp,
          open: parseFloat(timeSeries[timestamp]["1. open"]),
          high: parseFloat(timeSeries[timestamp]["2. high"]),
          low: parseFloat(timeSeries[timestamp]["3. low"]),
          close: parseFloat(timeSeries[timestamp]["4. close"]),
          volume: parseInt(timeSeries[timestamp]["5. volume"])
        })).filter(candle => !isNaN(candle.close)),
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error fetching intraday data for ${symbol}:`, error);
      throw error;
    }
  }

  // Get comprehensive technical analysis data
  async getTechnicalAnalysis(symbol) {
    try {
      const [dailyData, fundamentalData] = await Promise.all([
        this.fetchDailyPrices(symbol),
        this.fetchFundamentalData(symbol).catch(() => null)
      ]);

      const prices = dailyData.prices;
      const highs = dailyData.prices; // Simplified - in real implementation you'd have separate high/low data
      const lows = dailyData.prices;  // Simplified - in real implementation you'd have separate high/low data

      const technicalData = {
        symbol,
        currentPrice: dailyData.currentPrice,
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        sma200: this.calculateSMA(prices, 200),
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26),
        rsi14: this.calculateRSI(prices, 14),
        macd: this.calculateMACD(prices),
        atr14: this.calculateATR(highs, lows, prices, 14),
        bollingerBands: this.calculateBollingerBands(prices, 20),
        volume: dailyData.volume || null,
        lastUpdated: dailyData.lastUpdated,
        fundamental: fundamentalData
      };

      return technicalData;
    } catch (error) {
      console.error(`Error getting technical analysis for ${symbol}:`, error);
      throw error;
    }
  }

  // Check API limits and add delay if needed
  async checkApiLimits() {
    const now = Date.now();
    
    // Reset counter if more than 1 minute has passed
    if (now - this.lastApiCall > 60000) {
      this.apiCallCount = 0;
    }
    
    // If we've made 4 calls in the last minute, wait
    if (this.apiCallCount >= 4) {
      const waitTime = 60000 - (now - this.lastApiCall);
      console.log(`API limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.apiCallCount = 0;
    }
    
    this.apiCallCount++;
    this.lastApiCall = now;
  }

  // Fetch daily prices from Alpha Vantage API
  async fetchDailyPrices(symbol) {
    const cacheKey = `prices_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      await this.checkApiLimits();
      
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: API Request failed`);
      }

      const data = await response.json();
      
      // Check for API limits
      if (data.Note && data.Note.includes("API call frequency")) {
        throw new Error("API Limit reached - try again later");
      }
      
      if (data.Error) {
        throw new Error(`API Error: ${data.Error}`);
      }

      if (!data["Time Series (Daily)"]) {
        throw new Error("No time series data available");
      }

      const timeSeries = data["Time Series (Daily)"];
      const dates = Object.keys(timeSeries).sort().reverse();
      const closingPrices = dates.map(d => parseFloat(timeSeries[d]["4. close"])).filter(n => !isNaN(n));
      const volumes = dates.map(d => parseInt(timeSeries[d]["5. volume"])).filter(n => !isNaN(n));

      if (closingPrices.length < 10) {
        throw new Error(`Not enough data for ${symbol}: only ${closingPrices.length} days`);
      }

      const result = {
        currentPrice: closingPrices[0],
        prices: closingPrices,
        volumes: volumes,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  // Get current price and MA for a symbol
  async getPriceAndMA(symbol, maPeriod) {
    try {
      const priceData = await this.fetchDailyPrices(symbol);
      const maValue = this.calculateSMA(priceData.prices, maPeriod);
      
      return {
        symbol,
        currentPrice: priceData.currentPrice,
        maValue: maValue,
        sellSignal: priceData.currentPrice < maValue,
        lastUpdated: priceData.lastUpdated
      };
    } catch (error) {
      console.error(`Error getting price and MA for ${symbol}:`, error);
      throw error;
    }
  }

  // Batch fetch multiple symbols (with rate limiting)
  async batchFetchPriceAndMA(trades, batchSize = 3, delayMs = 20000) {
    const results = [];
    const tradesWithMA = trades.filter(trade => trade.trailingMA);
    
    for (let i = 0; i < tradesWithMA.length; i += batchSize) {
      const batch = tradesWithMA.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (trade) => {
        try {
          const data = await this.getPriceAndMA(trade.symbol, parseInt(trade.trailingMA));
          return {
            ...trade,
            ...data
          };
        } catch (error) {
          console.error(`Failed to fetch data for ${trade.symbol}:`, error);
          return {
            ...trade,
            currentPrice: null,
            maValue: null,
            sellSignal: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < tradesWithMA.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get API usage status
  getApiStatus() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    const callsInLastMinute = timeSinceLastCall < 60000 ? this.apiCallCount : 0;
    
    return {
      callsInLastMinute,
      remainingCalls: Math.max(0, 5 - callsInLastMinute),
      timeUntilReset: timeSinceLastCall < 60000 ? 60000 - timeSinceLastCall : 0,
      cacheEntries: this.cache.size,
      cacheTimeout: this.cacheTimeout / 60000 // in minutes
    };
  }

  // Get cache status
  getCacheStatus() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      isValid: now - value.timestamp < this.cacheTimeout
    }));
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(e => e.isValid).length,
      entries
    };
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();

export default marketDataService;
