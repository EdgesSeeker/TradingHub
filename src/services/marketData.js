// Market Data Service for SMA calculations
class MarketDataService {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Calculate Simple Moving Average
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  // Fetch stock data from Yahoo Finance
  async fetchStockData(symbol, period = '1mo') {
    const cacheKey = `${symbol}_${period}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/${symbol}?interval=1d&range=${period}`;
      
      // Try multiple CORS proxy services
      const proxyServices = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://thingproxy.freeboard.io/fetch/'
      ];

      for (const proxy of proxyServices) {
        try {
          const response = await fetch(proxy + url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
              const result = data.chart.result[0];
              const timestamps = result.timestamp;
              const quotes = result.indicators.quote[0];
              const closes = quotes.close;
              
              // Filter out null values and get recent data
              const validPrices = closes.filter(price => price !== null);
              
              const stockData = {
                symbol: symbol,
                currentPrice: validPrices[validPrices.length - 1],
                prices: validPrices,
                timestamps: timestamps,
                sma10: this.calculateSMA(validPrices, 10),
                sma20: this.calculateSMA(validPrices, 20)
              };

              // Cache the result
              this.cache.set(cacheKey, {
                data: stockData,
                timestamp: Date.now()
              });

              return stockData;
            }
          }
        } catch (error) {
          console.log(`Proxy ${proxy} failed for ${symbol}:`, error.message);
          continue;
        }
      }

      throw new Error(`Failed to fetch data for ${symbol} from all proxies`);
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      
      // Return mock data as fallback
      return {
        symbol: symbol,
        currentPrice: symbol === 'QQQ' ? 398.45 : 468.23,
        prices: [],
        timestamps: [],
        sma10: symbol === 'QQQ' ? 395.50 : 465.80,
        sma20: symbol === 'QQQ' ? 392.30 : 462.40,
        isMockData: true
      };
    }
  }

  // Get market status for QQQ and SPY
  async getMarketStatus() {
    try {
      const [qqqData, spyData] = await Promise.all([
        this.fetchStockData('QQQ'),
        this.fetchStockData('SPY')
      ]);

      const qqqStatus = qqqData.sma10 > qqqData.sma20;
      const spyStatus = spyData.sma10 > spyData.sma20;
      const overallStatus = qqqStatus && spyStatus;

      return {
        qqq: {
          symbol: 'QQQ',
          currentPrice: qqqData.currentPrice,
          sma10: qqqData.sma10,
          sma20: qqqData.sma20,
          status: qqqStatus,
          isMockData: qqqData.isMockData || false
        },
        spy: {
          symbol: 'SPY',
          currentPrice: spyData.currentPrice,
          sma10: spyData.sma10,
          sma20: spyData.sma20,
          status: spyStatus,
          isMockData: spyData.isMockData || false
        },
        overallStatus: overallStatus,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting market status:', error);
      return {
        qqq: { symbol: 'QQQ', status: false, isMockData: true },
        spy: { symbol: 'SPY', status: false, isMockData: true },
        overallStatus: false,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new MarketDataService();
