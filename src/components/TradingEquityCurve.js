import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import MonteCarloChart from './MonteCarloChart';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Download, 
  Calendar,
  BarChart3,
  Target,
  Activity,
  FileText,
  BarChart,
  Layers,
  Zap
} from 'lucide-react';
import storage from '../utils/storage';
import { getMultipleMarketData, compareWithMarket } from '../services/marketData';

const TradingEquityCurve = ({ trades, onTradeUpdated, onNavigate }) => {
  const [portfolioValue, setPortfolioValue] = useState(10000);
  const [dateRange, setDateRange] = useState('all');
  const [showFloatingEquity, setShowFloatingEquity] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotation, setNewAnnotation] = useState({ date: '', note: '', type: 'note' });
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEquityInput, setCurrentEquityInput] = useState('');
  const [showEquityInput, setShowEquityInput] = useState(false);
  const [totalValueInput, setTotalValueInput] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [showCashInput, setShowCashInput] = useState(false);
  const [totalValue, setTotalValue] = useState(10000);
  const [availableCash, setAvailableCash] = useState(0);
  const [equityLog, setEquityLog] = useState([]);
  const [showHistoricalEquityInput, setShowHistoricalEquityInput] = useState(false);
  const [historicalEquityDate, setHistoricalEquityDate] = useState('');
  const [historicalEquityValue, setHistoricalEquityValue] = useState('');
  const [performancePeriod, setPerformancePeriod] = useState('monthly');
  const [chartType, setChartType] = useState('line'); // 'line', 'candlestick', 'area'
  const [marketComparisonPeriod, setMarketComparisonPeriod] = useState('1m');
  const [marketData, setMarketData] = useState({});
  const [marketComparison, setMarketComparison] = useState(null);
  const [monteCarloScenarios, setMonteCarloScenarios] = useState(1000);
  const [monteCarloData, setMonteCarloData] = useState([]);
  const [showCustomSimulation, setShowCustomSimulation] = useState(false);
  const [performanceSimulationPeriod, setPerformanceSimulationPeriod] = useState('1m'); // 1m, 3m, 1y, 2y, 3y
  const [customSimulationParams, setCustomSimulationParams] = useState({
    winRate: 0.35,
    slippagePct: 0.001,
    commission: 2.00,
    startEquity: 5000,
    posSizePct: 0.20,
    numTrades: 250, // 1 Jahr (250 Trading-Tage)
    numSim: 100,
    winRange: [0.07, 0.15],
    lossRange: [0.01, 0.025],
    tailWinChance: 0.005,
    tailLossChance: 0.01,
    tailWinRange: [0.5, 2.0],
    tailLossRange: [0.25, 0.5],
    blackSwanChance: 0.001,
    blackSwanLoss: [0.25, 0.5],
    maxReturn: 1.5
  });
  const [customSimulationResults, setCustomSimulationResults] = useState(null);

  // Load settings and annotations on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedPortfolioValue = await storage.loadSetting('portfolioValue');
        if (savedPortfolioValue) {
          setPortfolioValue(parseFloat(savedPortfolioValue));
        }
        
        const savedTotalValue = await storage.loadSetting('totalValue');
        if (savedTotalValue) {
          setTotalValue(parseFloat(savedTotalValue));
        }
        
        const savedAvailableCash = await storage.loadSetting('availableCash');
        if (savedAvailableCash) {
          setAvailableCash(parseFloat(savedAvailableCash));
        }
        
        const savedAnnotations = await storage.loadSetting('equityAnnotations');
        if (savedAnnotations) {
          setAnnotations(savedAnnotations);
        }
        
        const savedEquityLog = await storage.loadSetting('equityLog');
        if (savedEquityLog) {
          setEquityLog(savedEquityLog);
        }
      } catch (error) {
        console.log('No saved settings found, using defaults');
      }
    };
    
    loadSettings();
  }, []);

  // Generate simulated data for the last month
  const generateSimulatedData = () => {
    if (window.confirm('Möchtest du simulierte Daten für den letzten Monat generieren? Dies überschreibt alle bestehenden historischen Daten.')) {
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        const startValue = 1800;
        const endValue = portfolioValue;
        const totalDays = Math.ceil((today - oneMonthAgo) / (1000 * 60 * 60 * 24));
        
        const simulatedEntries = [];
        let currentValue = startValue;
        
        for (let i = 0; i < totalDays; i++) {
          const date = new Date(oneMonthAgo);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Skip if it's today (we'll use the real value)
          if (dateStr === today.toISOString().split('T')[0]) {
            continue;
          }
          
          // Calculate target value (linear progression with some randomness)
          const progress = i / (totalDays - 1);
          const targetValue = startValue + (endValue - startValue) * progress;
          
          // Add realistic daily volatility (±2% to ±5%)
          const volatility = 0.02 + Math.random() * 0.03; // 2-5%
          const dailyChange = (Math.random() - 0.5) * 2 * volatility * currentValue;
          
          // Ensure we're trending towards the target
          const targetAdjustment = (targetValue - currentValue) * 0.1; // 10% towards target
          currentValue += dailyChange + targetAdjustment;
          
          // Ensure minimum value
          currentValue = Math.max(currentValue, startValue * 0.8);
          
          // Add some realistic trading activity
          const hasTrades = Math.random() > 0.3; // 70% chance of trades
          const closedTrades = hasTrades ? Math.floor(Math.random() * 3) : 0;
          const openTrades = hasTrades ? Math.floor(Math.random() * 2) : 0;
          
          simulatedEntries.push({
            date: dateStr,
            equity: Math.round(currentValue * 100) / 100,
            floatingEquity: Math.round((currentValue + (Math.random() - 0.5) * 100) * 100) / 100,
            realizedPnL: Math.round((currentValue - startValue) * 100) / 100,
            unrealizedPnL: Math.round((Math.random() - 0.5) * 200 * 100) / 100,
            closedTrades: closedTrades,
            openTrades: openTrades,
            dailyPnL: Math.round(dailyChange * 100) / 100
          });
        }
        
        // Save simulated data
        localStorage.setItem('historicalEquityEntries', JSON.stringify(simulatedEntries));
        
        // Add to log
        addToEquityLog('simulated_data', endValue, {
          note: `Simulierte Daten für ${totalDays} Tage generiert (${startValue} → ${endValue})`,
          days: totalDays,
          startValue: startValue,
          endValue: endValue
        });
        
        alert(`✅ Simulierte Daten für ${totalDays} Tage generiert!\nStart: $${startValue}\nEnde: $${endValue.toFixed(2)}`);
      } catch (error) {
        console.error('Error generating simulated data:', error);
        alert('❌ Fehler beim Generieren der simulierten Daten');
      }
    }
  };

  // Calculate equity curve data
  const calculateEquityCurve = useMemo(() => {
    // Get all equity entries from storage (including simulated data)
    const allEquityEntries = [];
    
    // Check for historical equity entries first (includes simulated data)
    const historicalEquity = localStorage.getItem('historicalEquityEntries');
    if (historicalEquity) {
      try {
        const historicalData = JSON.parse(historicalEquity);
        allEquityEntries.push(...historicalData);
        console.log('Loaded historical/simulated data:', historicalData.length, 'entries');
      } catch (error) {
        console.error('Error parsing historical equity:', error);
      }
    }
    
    // Check for current equity entry
    const currentEquity = localStorage.getItem('currentEquity');
    if (currentEquity) {
      try {
        const equityData = JSON.parse(currentEquity);
        allEquityEntries.push(equityData);
        console.log('Loaded current equity entry');
      } catch (error) {
        console.error('Error parsing current equity:', error);
      }
    }
    
    // Always add today's portfolio value as the most current entry
    const today = new Date().toISOString().split('T')[0];
    
    // Remove any existing entry for today to avoid duplicates
    const filteredEntries = allEquityEntries.filter(entry => entry.date !== today);
    
    // Add today's entry with current portfolio value
    if (portfolioValue > 0) {
      filteredEntries.push({
        date: today,
        equity: portfolioValue,
        floatingEquity: portfolioValue,
        realizedPnL: 0,
        unrealizedPnL: 0,
        closedTrades: 0,
        openTrades: 0,
        dailyPnL: 0
      });
      console.log('Added today\'s entry:', portfolioValue);
    }
    
    // Sort by date
    filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('Total equity entries:', filteredEntries.length);
    
    // If still no entries, return empty array (clean start)
    if (filteredEntries.length === 0) {
      return [];
    }
    
    return filteredEntries.map(entry => ({
      date: entry.date,
      equity: entry.equity,
      floatingEquity: entry.floatingEquity || entry.equity,
      realizedPnL: entry.realizedPnL || 0,
      unrealizedPnL: entry.unrealizedPnL || 0,
      closedTrades: entry.closedTrades || 0,
      openTrades: entry.openTrades || 0,
      dailyPnL: entry.dailyPnL || 0
    }));
  }, [portfolioValue]);

  // Calculate SMA values
  const calculateSMA = (data, period) => {
    return data.map((item, index) => {
      // Need at least 'period' data points for SMA
      if (index < period - 1) return null;
      
      // Take the last 'period' data points for SMA calculation
      const slice = data.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.equity, 0);
      return sum / period;
    });
  };

  // Add SMA data to equity curve
  const equityDataWithSMA = useMemo(() => {
    const sma10 = calculateSMA(calculateEquityCurve, 10);
    const sma20 = calculateSMA(calculateEquityCurve, 20);
    
    const result = calculateEquityCurve.map((item, index) => ({
      ...item,
      sma10: sma10[index],
      sma20: sma20[index]
    }));
    
    // Debug log to see what data we have
    console.log('Equity Curve Data:', result);
    console.log('Number of data points:', result.length);
    console.log('SMA10 values:', sma10.filter(val => val !== null).length, 'valid values');
    console.log('SMA20 values:', sma20.filter(val => val !== null).length, 'valid values');
    
    // Show first few SMA values for debugging
    if (result.length > 0) {
      console.log('First 5 SMA10 values:', sma10.slice(0, 5));
      console.log('First 5 SMA20 values:', sma20.slice(0, 5));
    }
    
    return result;
  }, [calculateEquityCurve]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (dateRange === 'all') return equityDataWithSMA;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'ytd':
        startDate.setMonth(0, 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '12m':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return equityDataWithSMA;
    }
    
    return equityDataWithSMA.filter(item => new Date(item.date) >= startDate);
  }, [equityDataWithSMA, dateRange]);

  // Calculate drawdown metrics
  const drawdownMetrics = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    let peak = filteredData[0].equity;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let drawdownStart = null;
    let maxDrawdownStart = null;
    let maxDrawdownEnd = null;
    let recoveryDays = 0;
    let isInDrawdown = false;
    
    // const drawdowns = []; // For future use if needed
    
    filteredData.forEach((item, index) => {
      if (item.equity > peak) {
        peak = item.equity;
        if (isInDrawdown) {
          // Drawdown ended
          isInDrawdown = false;
          recoveryDays = 0;
        }
      } else {
        const drawdown = ((peak - item.equity) / peak) * 100;
        currentDrawdown = drawdown;
        
        if (!isInDrawdown) {
          // Drawdown started
          isInDrawdown = true;
          drawdownStart = item.date;
        }
        
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownStart = drawdownStart;
          maxDrawdownEnd = item.date;
        }
        
        if (isInDrawdown) {
          recoveryDays++;
        }
      }
    });
    
    // Find equity high
    const equityHigh = Math.max(...filteredData.map(item => item.equity));
    const equityHighDate = filteredData.find(item => item.equity === equityHigh)?.date;
    
    // Debug log
    console.log('Drawdown calculation:');
    console.log('All equity values:', filteredData.map(item => ({ date: item.date, equity: item.equity })));
    console.log('Equity High:', equityHigh);
    console.log('Equity High Date:', equityHighDate);
    
    // Check if 2830 is in the data
    const has2830 = filteredData.some(item => item.equity === 2830);
    console.log('Has 2830 in data:', has2830);
    
    // Show all unique equity values
    const uniqueValues = [...new Set(filteredData.map(item => item.equity))].sort((a, b) => b - a);
    console.log('Unique equity values (sorted high to low):', uniqueValues);
    
    // Calculate current SMA values
    const currentSMA10 = filteredData[filteredData.length - 1]?.sma10;
    const currentSMA20 = filteredData[filteredData.length - 1]?.sma20;
    
    const metrics = {
      maxDrawdown,
      currentDrawdown,
      recoveryDays,
      equityHigh,
      equityHighDate,
      currentSMA10,
      currentSMA20,
      maxDrawdownStart,
      maxDrawdownEnd
    };
    
    // Save current drawdown to localStorage for Portfolio component
    localStorage.setItem('currentDrawdown', currentDrawdown.toString());
    console.log('💾 Saved current drawdown to localStorage:', currentDrawdown);
    
    return metrics;
  }, [filteredData]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const now = new Date();
    let startDate = new Date();
    let periodLabel = '';
    
    // Calculate start date based on selected period
    switch (performancePeriod) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        periodLabel = '7 Days';
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        periodLabel = '1 Month';
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        periodLabel = '3 Months';
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        periodLabel = '1 Year';
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        periodLabel = '1 Month';
    }
    
    // Find data points within the period
    const periodData = filteredData.filter(item => new Date(item.date) >= startDate);
    
    if (periodData.length === 0) return null;
    
    const startValue = periodData[0].equity;
    const endValue = periodData[periodData.length - 1].equity;
    const totalPnL = endValue - startValue;
    const performancePercent = startValue > 0 ? (totalPnL / startValue) * 100 : 0;
    
    return {
      period: periodLabel,
      startValue,
      endValue,
      totalPnL,
      performancePercent,
      startDate: periodData[0].date,
      endDate: periodData[periodData.length - 1].date
    };
  }, [filteredData, performancePeriod]);

  // Load market data when period changes
  useEffect(() => {
    const loadMarketData = async () => {
      if (filteredData.length === 0) return;
      
      try {
        const symbols = ['QQQ']; // NASDAQ 100 ETF
        const data = await getMultipleMarketData(symbols, marketComparisonPeriod);
        setMarketData(data);
        
        // Calculate comparison
        const comparison = compareWithMarket(filteredData, data.QQQ);
        setMarketComparison(comparison);
      } catch (error) {
        console.error('Error loading market data:', error);
      }
    };
    
    loadMarketData();
  }, [filteredData, marketComparisonPeriod]);

  // Calculate performance-based parameters from historical data
  const performanceParams = useMemo(() => {
    if (filteredData.length < 2) return null;
    
    const returns = [];
    for (let i = 1; i < filteredData.length; i++) {
      const return_ = (filteredData[i].equity - filteredData[i-1].equity) / filteredData[i-1].equity;
      returns.push(return_);
    }
    
    if (returns.length === 0) return null;
    
    // Calculate win rate (positive returns)
    const positiveReturns = returns.filter(r => r > 0);
    const winRate = positiveReturns.length / returns.length;
    
    // Calculate average win and loss
    const avgWin = positiveReturns.length > 0 ? 
      positiveReturns.reduce((a, b) => a + b, 0) / positiveReturns.length : 0;
    const negativeReturns = returns.filter(r => r < 0);
    const avgLoss = negativeReturns.length > 0 ? 
      Math.abs(negativeReturns.reduce((a, b) => a + b, 0) / negativeReturns.length) : 0;
    
    // Calculate volatility
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      winRate: Math.max(0.1, Math.min(0.9, winRate)), // Clamp between 10% and 90%
      avgWin: Math.max(0.01, avgWin), // Min 1% win
      avgLoss: Math.max(0.01, avgLoss), // Min 1% loss
      volatility: stdDev,
      mean: mean
    };
  }, [filteredData]);

  // Generate Monte Carlo simulation data based on performance with different periods
  const generatePerformanceMonteCarloData = useMemo(() => {
    if (filteredData.length === 0 || !performanceParams) return [];
    
    const lastValue = filteredData[filteredData.length - 1].equity;
    const scenarios = [];
    const periodDays = {
      '1m': 30,
      '3m': 90,
      '1y': 365,
      '2y': 730,
      '3y': 1095
    };
    const days = periodDays[performanceSimulationPeriod] || 30;
    
    for (let s = 0; s < monteCarloScenarios; s++) {
      let currentValue = lastValue;
      const scenario = [{ date: filteredData[filteredData.length - 1].date, value: currentValue }];
      
      for (let d = 1; d <= days; d++) {
        // Use performance-based parameters
        const isWin = Math.random() < performanceParams.winRate;
        let return_;
        
        if (isWin) {
          // Generate win based on historical average win with some randomness
          return_ = performanceParams.avgWin * (0.5 + Math.random()); // 50% to 150% of avg win
        } else {
          // Generate loss based on historical average loss with some randomness
          return_ = -performanceParams.avgLoss * (0.5 + Math.random()); // 50% to 150% of avg loss
        }
        
        // Add some volatility
        const volatilityFactor = 1 + (Math.random() - 0.5) * performanceParams.volatility * 2;
        return_ *= volatilityFactor;
        
        // Clamp extreme values
        return_ = Math.max(-0.5, Math.min(0.5, return_)); // Max 50% loss or gain per day
        
        currentValue *= (1 + return_);
        
        const futureDate = new Date(filteredData[filteredData.length - 1].date);
        futureDate.setDate(futureDate.getDate() + d);
        
        scenario.push({
          date: futureDate.toISOString().split('T')[0],
          value: Math.max(0, currentValue) // Ensure no negative values
        });
      }
      
      scenarios.push(scenario);
    }
    
    return scenarios;
  }, [filteredData, monteCarloScenarios, performanceParams, performanceSimulationPeriod]);

  // Custom simulation based on trading parameters
  const runCustomSimulation = () => {
    const params = customSimulationParams;
    const curves = [];
    
    for (let sim = 0; sim < params.numSim; sim++) {
      let equity = params.startEquity;
      const curve = [equity];
      
      for (let trade = 0; trade < params.numTrades; trade++) {
        // Stop if equity reaches certain threshold
        if (equity >= 125000) break;
        
        // Black swan event
        if (Math.random() < params.blackSwanChance) {
          const loss = Math.random() * (params.blackSwanLoss[1] - params.blackSwanLoss[0]) + params.blackSwanLoss[0];
          equity *= (1 - loss);
          curve.push(equity);
          continue;
        }
        
        const posSize = equity * params.posSizePct;
        const isWin = Math.random() < params.winRate;
        
        let pct;
        if (isWin) {
          // Tail win chance
          if (Math.random() < params.tailWinChance) {
            pct = Math.random() * (params.tailWinRange[1] - params.tailWinRange[0]) + params.tailWinRange[0];
          } else {
            pct = Math.random() * (params.winRange[1] - params.winRange[0]) + params.winRange[0];
          }
        } else {
          // Tail loss chance
          if (Math.random() < params.tailLossChance) {
            pct = Math.random() * (params.tailLossRange[1] - params.tailLossRange[0]) + params.tailLossRange[0];
          } else {
            pct = Math.random() * (params.lossRange[1] - params.lossRange[0]) + params.lossRange[0];
          }
        }
        
        pct = Math.min(pct, params.maxReturn);
        const profit = posSize * pct * (isWin ? 1 : -1);
        const net = profit - posSize * params.slippagePct - params.commission;
        equity += net;
        
        curve.push(Math.max(0, equity));
      }
      
      // Pad curve to numTrades length
      while (curve.length < params.numTrades + 1) {
        curve.push(curve[curve.length - 1]);
      }
      
      curves.push(curve);
    }
    
    // Calculate statistics
    const finals = curves.map(curve => curve[curve.length - 1]);
    const median = curves[0].map((_, i) => {
      const values = curves.map(curve => curve[i]).sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    });
    
    // Calculate median
    const sortedFinals = [...finals].sort((a, b) => a - b);
    const medianEnd = sortedFinals[Math.floor(sortedFinals.length / 2)];
    
    setCustomSimulationResults({
      curves,
      median,
      finals,
      startEquity: params.startEquity,
      medianEnd,
      bestEnd: Math.max(...finals),
      worstEnd: Math.min(...finals)
    });
  };

  // Check for drawdown warnings
  const drawdownWarnings = useMemo(() => {
    if (!drawdownMetrics) return [];
    
    const warnings = [];
    
    if (drawdownMetrics.currentDrawdown >= 30) {
      warnings.push({
        level: 'critical',
        message: `Critical Drawdown: ${drawdownMetrics.currentDrawdown.toFixed(1)}%`,
        color: '#dc2626'
      });
    } else if (drawdownMetrics.currentDrawdown >= 20) {
      warnings.push({
        level: 'warning',
        message: `High Drawdown: ${drawdownMetrics.currentDrawdown.toFixed(1)}%`,
        color: '#f59e0b'
      });
    } else if (drawdownMetrics.currentDrawdown >= 10) {
      warnings.push({
        level: 'caution',
        message: `Moderate Drawdown: ${drawdownMetrics.currentDrawdown.toFixed(1)}%`,
        color: '#eab308'
      });
    }
    
    return warnings;
  }, [drawdownMetrics]);

  // Handle annotation submission
  const handleAddAnnotation = async () => {
    if (!newAnnotation.date || !newAnnotation.note) return;
    
    const annotation = {
      id: Date.now(),
      ...newAnnotation,
      date: new Date(newAnnotation.date).toISOString().split('T')[0]
    };
    
    const updatedAnnotations = [...annotations, annotation];
    setAnnotations(updatedAnnotations);
    
    try {
      await storage.saveSetting('equityAnnotations', updatedAnnotations);
    } catch (error) {
      console.error('Failed to save annotation:', error);
    }
    
    // Add to log
    await addToEquityLog('annotation', 0, {
      note: annotation.note,
      annotationType: annotation.type,
      annotationDate: annotation.date
    });
    
    setNewAnnotation({ date: '', note: '', type: 'note' });
    setShowAnnotationForm(false);
  };

  // Add entry to equity log
  const addToEquityLog = async (type, value, additionalData = {}) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      type: type, // 'equity', 'total_cash', 'annotation'
      value: value,
      ...additionalData
    };
    
    const updatedLog = [logEntry, ...equityLog].slice(0, 50); // Keep last 50 entries
    setEquityLog(updatedLog);
    
    try {
      await storage.saveSetting('equityLog', updatedLog);
    } catch (error) {
      console.error('Error saving equity log:', error);
    }
  };

  // Handle current equity input
  const handleSetCurrentEquity = async () => {
    const equityValue = parseFloat(currentEquityInput);
    if (isNaN(equityValue) || equityValue <= 0) {
      alert('Bitte gib einen gültigen Equity-Wert ein (größer als 0)');
      return;
    }

    try {
      // Save current equity as today's value
      const today = new Date().toISOString().split('T')[0];
      const currentEquityData = {
        date: today,
        equity: equityValue,
        floatingEquity: equityValue,
        realizedPnL: equityValue - portfolioValue,
        unrealizedPnL: 0,
        closedTrades: 0,
        openTrades: 0
      };

      // Save to storage
      await storage.saveSetting('currentEquity', currentEquityData);
      await storage.saveSetting('portfolioValue', equityValue);
      
      setPortfolioValue(equityValue);
      setCurrentEquityInput('');
      setShowEquityInput(false);
      
      // Add to log
      await addToEquityLog('equity', equityValue, {
        previousValue: portfolioValue,
        change: equityValue - portfolioValue
      });
      
      alert(`✅ Aktueller Equity-Stand auf $${equityValue.toFixed(2)} gesetzt!`);
    } catch (error) {
      console.error('Error saving current equity:', error);
      alert('❌ Fehler beim Speichern des Equity-Stands');
    }
  };

  // Handle total value and cash input
  const handleSetTotalValueAndCash = async () => {
    const totalValueNum = parseFloat(totalValueInput);
    const cashNum = parseFloat(cashInput);

    if (isNaN(totalValueNum) || totalValueNum <= 0) {
      alert('Bitte gib einen gültigen Total Value ein (größer als 0)');
      return;
    }

    if (isNaN(cashNum) || cashNum < 0) {
      alert('Bitte gib einen gültigen Cash-Wert ein (0 oder größer)');
      return;
    }

    if (cashNum > totalValueNum) {
      alert('Cash kann nicht größer als Total Value sein');
      return;
    }

    try {
      // Save to storage
      await storage.saveSetting('totalValue', totalValueNum);
      await storage.saveSetting('availableCash', cashNum);
      await storage.saveSetting('portfolioValue', totalValueNum - cashNum);
      
      setTotalValue(totalValueNum);
      setAvailableCash(cashNum);
      setPortfolioValue(totalValueNum - cashNum);
      
      setTotalValueInput('');
      setCashInput('');
      setShowCashInput(false);
      
      // Add to log
      await addToEquityLog('total_cash', totalValueNum, {
        cash: cashNum,
        investments: totalValueNum - cashNum,
        previousTotalValue: totalValue,
        previousCash: availableCash
      });
      
      alert(`✅ Total Value: $${totalValueNum.toFixed(2)}, Cash: $${cashNum.toFixed(2)} gesetzt!`);
    } catch (error) {
      console.error('Error saving total value and cash:', error);
      alert('❌ Fehler beim Speichern der Werte');
    }
  };

  // Handle historical equity input
  const handleSetHistoricalEquity = async () => {
    const equityValue = parseFloat(historicalEquityValue);
    const selectedDate = historicalEquityDate;

    if (isNaN(equityValue) || equityValue <= 0) {
      alert('Bitte gib einen gültigen Equity-Wert ein (größer als 0)');
      return;
    }

    if (!selectedDate) {
      alert('Bitte wähle ein Datum aus');
      return;
    }

    // Check if date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      alert('Du kannst keine Equity-Werte für zukünftige Daten setzen');
      return;
    }

    try {
      // Get existing historical entries
      const existingHistorical = localStorage.getItem('historicalEquityEntries');
      let historicalEntries = existingHistorical ? JSON.parse(existingHistorical) : [];

      // Remove any existing entry for this date
      historicalEntries = historicalEntries.filter(entry => entry.date !== selectedDate);

      // Add new entry
      const newEntry = {
        date: selectedDate,
        equity: equityValue,
        floatingEquity: equityValue,
        realizedPnL: 0,
        unrealizedPnL: 0,
        closedTrades: 0,
        openTrades: 0,
        dailyPnL: 0
      };

      historicalEntries.push(newEntry);
      historicalEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Save to storage
      localStorage.setItem('historicalEquityEntries', JSON.stringify(historicalEntries));

      // Reset form
      setHistoricalEquityDate('');
      setHistoricalEquityValue('');
      setShowHistoricalEquityInput(false);

      // Add to log
      await addToEquityLog('historical_equity', equityValue, {
        date: selectedDate,
        note: `Historischer Equity-Stand für ${new Date(selectedDate).toLocaleDateString('de-DE')}`
      });

      alert(`✅ Historischer Equity-Stand für ${new Date(selectedDate).toLocaleDateString('de-DE')}: $${equityValue.toFixed(2)} gesetzt!`);
    } catch (error) {
      console.error('Error saving historical equity:', error);
      alert('❌ Fehler beim Speichern des historischen Equity-Stands');
    }
  };

  // Export functionality
  const handleExport = (format) => {
    if (format === 'csv') {
      const csvData = filteredData.map(item => ({
        Date: item.date,
        Equity: item.equity.toFixed(2),
        'Floating Equity': item.floatingEquity.toFixed(2),
        'SMA 10': item.sma10 ? item.sma10.toFixed(2) : '',
        'SMA 20': item.sma20 ? item.sma20.toFixed(2) : '',
        'Realized P&L': item.realizedPnL.toFixed(2),
        'Unrealized P&L': item.unrealizedPnL.toFixed(2)
      }));
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equity-curve-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // For PNG export, we'd need to use a library like html2canvas
      alert('PNG export requires additional setup. CSV export is available.');
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: '#f8fafc',
          fontSize: '0.875rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
            {new Date(label).toLocaleDateString()}
          </p>
          <p style={{ margin: '0 0 0.25rem 0' }}>
            Equity: ${data.equity.toFixed(2)}
          </p>
          <p style={{ margin: '0 0 0.25rem 0' }}>
            Floating: ${data.floatingEquity.toFixed(2)}
          </p>
          {data.sma10 && (
            <p style={{ margin: '0 0 0.25rem 0', color: '#3b82f6' }}>
              SMA 10: ${data.sma10.toFixed(2)}
            </p>
          )}
          {data.sma20 && (
            <p style={{ margin: '0 0 0.25rem 0', color: '#8b5cf6' }}>
              SMA 20: ${data.sma20.toFixed(2)}
            </p>
          )}
          <p style={{ margin: '0 0 0.25rem 0' }}>
            Realized P&L: ${data.realizedPnL.toFixed(2)}
          </p>
          <p style={{ margin: '0' }}>
            Unrealized P&L: ${data.unrealizedPnL.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading Equity Curve...</div>
          <div style={{ color: '#94a3b8' }}>Calculating performance metrics</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem 1rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <BarChart3 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
                Trading Equity Curve
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Portfolio Performance Analysis & Drawdown Monitoring
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('trading-routine')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
              }}
            >
              ← Zurück zur Routine
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar style={{ width: '1rem', height: '1rem', color: '#94a3b8' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                padding: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Time</option>
              <option value="ytd">Year to Date</option>
              <option value="12m">Last 12 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="3m">Last 3 Months</option>
            </select>
          </div>

          {/* Chart Type Selection */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <label style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Chart Type
            </label>
            <div style={{
              display: 'flex',
              gap: '0.25rem'
            }}>
              {[
                { key: 'line', label: 'Line', icon: '📈' },
                { key: 'area', label: 'Area', icon: '📊' },
                { key: 'candlestick', label: 'Candle', icon: '🕯️' }
              ].map(type => (
                <button
                  key={type.key}
                  onClick={() => setChartType(type.key)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: chartType === type.key ? '#3b82f6' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="floatingEquity"
              checked={showFloatingEquity}
              onChange={(e) => setShowFloatingEquity(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="floatingEquity" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Show Floating Equity
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button
              onClick={() => setShowCashInput(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Activity style={{ width: '1rem', height: '1rem' }} />
              Set Total & Cash
            </button>

            <button
              onClick={() => setShowEquityInput(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Target style={{ width: '1rem', height: '1rem' }} />
              Set Equity
            </button>

            <button
              onClick={() => setShowHistoricalEquityInput(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Calendar style={{ width: '1rem', height: '1rem' }} />
              Historischer Equity
            </button>

            <button
              onClick={generateSimulatedData}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <TrendingUp style={{ width: '1rem', height: '1rem' }} />
              Simuliere Monat
            </button>


            <button
              onClick={() => setShowAnnotationForm(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText style={{ width: '1rem', height: '1rem' }} />
              Add Note
            </button>

            <button
              onClick={() => handleExport('csv')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download style={{ width: '1rem', height: '1rem' }} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Drawdown Warnings */}
        {drawdownWarnings.length > 0 && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                Drawdown Alerts
              </h3>
            </div>
            {drawdownWarnings.map((warning, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  backgroundColor: warning.color + '20',
                  border: `1px solid ${warning.color}`,
                  borderRadius: '0.375rem',
                  marginBottom: '0.5rem',
                  color: warning.color,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {warning.message}
              </div>
            ))}
          </div>
        )}

        {/* Performance Overview */}
        {performanceMetrics && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0
              }}>
                📊 Performance Overview
              </h3>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {['weekly', 'monthly', '3months', 'yearly'].map(period => (
                  <button
                    key={period}
                    onClick={() => setPerformancePeriod(period)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: performancePeriod === period ? '#3b82f6' : '#334155',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {period === 'weekly' ? '7D' : 
                     period === 'monthly' ? '1M' : 
                     period === '3months' ? '3M' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  {performanceMetrics.period} Performance
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: performanceMetrics.performancePercent >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {performanceMetrics.performancePercent >= 0 ? '+' : ''}{performanceMetrics.performancePercent.toFixed(2)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Total P&L
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: performanceMetrics.totalPnL >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {performanceMetrics.totalPnL >= 0 ? '+' : ''}${performanceMetrics.totalPnL.toFixed(2)}
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Start Value
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  ${performanceMetrics.startValue.toFixed(2)}
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  End Value
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  ${performanceMetrics.endValue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            📈 Equity Curve
          </h3>
          
          <div style={{ height: '500px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' && (
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Equity lines */}
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Equity"
                  />
                  
                  {showFloatingEquity && (
                    <Line
                      type="monotone"
                      dataKey="floatingEquity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Floating Equity"
                    />
                  )}
                  
                  {/* SMA lines */}
                  <Line
                    type="monotone"
                    dataKey="sma10"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 10"
                  />
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 20"
                  />
                  
                </LineChart>
              )}
              
              {chartType === 'area' && (
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={3}
                    name="Equity"
                  />
                  
                  {/* SMA lines */}
                  <Line
                    type="monotone"
                    dataKey="sma10"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 10"
                  />
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 20"
                  />
                </AreaChart>
              )}
              
              {chartType === 'candlestick' && (
                <ComposedChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Equity line for candlestick */}
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Equity"
                  />
                  
                  {/* SMA lines */}
                  <Line
                    type="monotone"
                    dataKey="sma10"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 10"
                  />
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                    name="SMA 20"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Comparison */}
        {marketComparison && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Layers style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                Market Comparison
              </h3>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {['1w', '1m', '3m', '1y'].map(period => (
                  <button
                    key={period}
                    onClick={() => setMarketComparisonPeriod(period)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: marketComparisonPeriod === period ? '#3b82f6' : '#334155',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {period === '1w' ? '1W' : 
                     period === '1m' ? '1M' : 
                     period === '3m' ? '3M' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Your Performance
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: marketComparison.equity.totalReturnPercent >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.equity.totalReturnPercent >= 0 ? '+' : ''}{marketComparison.equity.totalReturnPercent.toFixed(2)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  NASDAQ 100 Performance
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: marketComparison.market.totalReturnPercent >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.market.totalReturnPercent >= 0 ? '+' : ''}{marketComparison.market.totalReturnPercent.toFixed(2)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Outperformance
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: marketComparison.outperformance >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.outperformance >= 0 ? '+' : ''}{marketComparison.outperformance.toFixed(2)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Correlation
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {(marketComparison.correlation * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Your Volatility
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.equity.volatility.toFixed(1)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Market Volatility
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.market.volatility.toFixed(1)}%
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Your Sharpe Ratio
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.equity.sharpeRatio.toFixed(2)}
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Market Sharpe Ratio
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {marketComparison.market.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monte Carlo Simulation */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#f8fafc',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Zap style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              Monte Carlo Simulation
            </h3>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowCustomSimulation(!showCustomSimulation)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: showCustomSimulation ? '#3b82f6' : '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Custom Parameters
              </button>
              <label style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Scenarios:
              </label>
              <input
                type="number"
                value={monteCarloScenarios}
                onChange={(e) => setMonteCarloScenarios(Math.max(100, Math.min(10000, parseInt(e.target.value) || 1000)))}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#334155',
                  color: 'white',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  width: '100px'
                }}
              />
            </div>
          </div>

          {/* Performance-based parameters display */}
          {performanceParams && (
            <div style={{
              backgroundColor: '#334155',
              padding: '1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: '0 0 0.5rem 0'
              }}>
                📊 Your Performance Parameters (Auto-calculated)
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Win Rate:</span>
                  <span style={{ color: '#f8fafc', fontFamily: 'Geist Mono, monospace', marginLeft: '0.5rem' }}>
                    {(performanceParams.winRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Avg Win:</span>
                  <span style={{ color: '#10b981', fontFamily: 'Geist Mono, monospace', marginLeft: '0.5rem' }}>
                    +{(performanceParams.avgWin * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Avg Loss:</span>
                  <span style={{ color: '#ef4444', fontFamily: 'Geist Mono, monospace', marginLeft: '0.5rem' }}>
                    -{(performanceParams.avgLoss * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Volatility:</span>
                  <span style={{ color: '#f8fafc', fontFamily: 'Geist Mono, monospace', marginLeft: '0.5rem' }}>
                    {(performanceParams.volatility * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Parameters Panel */}
          {showCustomSimulation && (
            <div style={{
              backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: '0 0 1rem 0'
              }}>
                ⚙️ Custom Trading Parameters
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Win Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customSimulationParams.winRate * 100}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        winRate: Math.max(0, Math.min(100, value)) / 100
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Position Size (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customSimulationParams.posSizePct * 100}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        posSizePct: Math.max(0, Math.min(100, value)) / 100
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Start Equity ($)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={customSimulationParams.startEquity}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 1000;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        startEquity: Math.max(100, value)
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Number of Trades (Max 5 Jahre = 1250)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1250"
                    step="10"
                    value={customSimulationParams.numTrades}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 100;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        numTrades: Math.max(10, Math.min(1250, value))
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Simulations
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={customSimulationParams.numSim}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 100;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        numSim: Math.max(10, Math.min(1000, value))
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Commission ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customSimulationParams.commission}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCustomSimulationParams(prev => ({
                        ...prev,
                        commission: Math.max(0, value)
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      border: '1px solid #475569',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={runCustomSimulation}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🚀 Run Custom Simulation
              </button>
            </div>
          )}

          {/* Custom Simulation Results */}
          {customSimulationResults && (
            <div style={{
              backgroundColor: '#334155',
              padding: '1.5rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f8fafc',
                margin: '0 0 1rem 0'
              }}>
                📈 Custom Simulation Results
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Start Equity
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.startEquity.toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Median End Value
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.medianEnd.toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Best Case
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.bestEnd.toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Worst Case
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.worstEnd.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <MonteCarloChart
                data={customSimulationResults.curves}
                title="Custom Monte Carlo Simulation"
                xAxisLabel="Trades"
                yAxisLabel="Equity ($)"
                showAverage={true}
                maxScenarios={50}
              />
            </div>
          )}
          
          {/* Performance-based Monte Carlo Simulation */}
          {generatePerformanceMonteCarloData.length > 0 && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#0f172a',
              borderRadius: '0.75rem',
              border: '1px solid #334155'
            }}>
              <h4 style={{
                color: '#f8fafc',
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Performance-based Monte Carlo Simulation
              </h4>
              
              {/* Period Selection */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                {['1m', '3m', '1y', '2y', '3y'].map(period => (
                  <button
                    key={period}
                    onClick={() => setPerformanceSimulationPeriod(period)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: performanceSimulationPeriod === period ? '#3b82f6' : '#334155',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {period === '1m' ? '1 Month' : 
                     period === '3m' ? '3 Months' :
                     period === '1y' ? '1 Year' :
                     period === '2y' ? '2 Years' : '3 Years'}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Median End Value
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${(generatePerformanceMonteCarloData.reduce((sum, scenario) => sum + scenario[scenario.length - 1].value, 0) / generatePerformanceMonteCarloData.length).toFixed(2)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    95th Percentile
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${generatePerformanceMonteCarloData.map(s => s[s.length - 1].value).sort((a, b) => b - a)[Math.floor(generatePerformanceMonteCarloData.length * 0.05)].toFixed(2)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    5th Percentile
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${generatePerformanceMonteCarloData.map(s => s[s.length - 1].value).sort((a, b) => a - b)[Math.floor(generatePerformanceMonteCarloData.length * 0.05)].toFixed(2)}
                  </div>
                </div>
              </div>
              
              <MonteCarloChart
                data={generatePerformanceMonteCarloData}
                title={`${performanceSimulationPeriod === '1m' ? '1 Month' : 
                        performanceSimulationPeriod === '3m' ? '3 Months' :
                        performanceSimulationPeriod === '1y' ? '1 Year' :
                        performanceSimulationPeriod === '2y' ? '2 Years' : '3 Years'} Monte Carlo Simulation (Based on Your Performance)`}
                xAxisLabel="Days"
                yAxisLabel="Equity ($)"
                showAverage={true}
                maxScenarios={100}
              />
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                <strong>Hinweis:</strong> Die Monte Carlo Simulation basiert auf historischen Renditen deiner Equity Curve. 
                Sie zeigt mögliche zukünftige Szenarien, ist aber keine Garantie für zukünftige Performance. 
                Die Simulation verwendet {monteCarloScenarios} Szenarien über {performanceSimulationPeriod === '1m' ? '30' : 
                performanceSimulationPeriod === '3m' ? '90' :
                performanceSimulationPeriod === '1y' ? '365' :
                performanceSimulationPeriod === '2y' ? '730' : '1095'} Tage.
              </div>
            </div>
          )}

          {/* Custom Monte Carlo Simulation */}
          {customSimulationResults && customSimulationResults.curves && customSimulationResults.curves.length > 0 && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#0f172a',
              borderRadius: '0.75rem',
              border: '1px solid #334155'
            }}>
              <h4 style={{
                color: '#f8fafc',
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚙️ Custom Monte Carlo Simulation
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Current Value
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#f8fafc',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${filteredData[filteredData.length - 1]?.equity.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Median End Value
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.medianEnd.toFixed(2)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Best Case (95%)
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.bestEnd.toFixed(2)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#334155',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    Worst Case (5%)
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    ${customSimulationResults.worstEnd.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <MonteCarloChart
                data={customSimulationResults.curves}
                title="Custom Monte Carlo Simulation"
                xAxisLabel="Trades"
                yAxisLabel="Equity ($)"
                showAverage={true}
                maxScenarios={50}
              />
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                <strong>Hinweis:</strong> Die Custom Monte Carlo Simulation verwendet deine eigenen Parameter. 
                Sie zeigt mögliche zukünftige Szenarien basierend auf deinen Eingaben, ist aber keine Garantie für zukünftige Performance.
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Panel */}
        {drawdownMetrics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                  Equity High
                </h4>
              </div>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#10b981',
                margin: '0 0 0.5rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {formatCurrency(drawdownMetrics.equityHigh)}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                margin: 0
              }}>
                {formatDate(drawdownMetrics.equityHighDate)}
              </p>
            </div>

            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <TrendingDown style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                  Max Drawdown
                </h4>
              </div>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#ef4444',
                margin: '0 0 0.5rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {drawdownMetrics.maxDrawdown.toFixed(1)}%
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                margin: 0
              }}>
                {drawdownMetrics.maxDrawdownStart && formatDate(drawdownMetrics.maxDrawdownStart)}
                {drawdownMetrics.maxDrawdownEnd && ` - ${formatDate(drawdownMetrics.maxDrawdownEnd)}`}
              </p>
            </div>

            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Activity style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                  Current Drawdown
                </h4>
              </div>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: drawdownMetrics.currentDrawdown > 0 ? '#ef4444' : '#10b981',
                margin: '0 0 0.5rem 0',
                fontFamily: 'Geist Mono, monospace'
              }}>
                {drawdownMetrics.currentDrawdown.toFixed(1)}%
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                margin: 0
              }}>
                {drawdownMetrics.recoveryDays} days in drawdown
              </p>
            </div>

            <div style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Target style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                  SMA Values
                </h4>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#3b82f6',
                  margin: '0 0 0.25rem 0',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  SMA 10: {drawdownMetrics.currentSMA10 ? formatCurrency(drawdownMetrics.currentSMA10) : 'N/A'}
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  margin: 0,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  SMA 20: {drawdownMetrics.currentSMA20 ? formatCurrency(drawdownMetrics.currentSMA20) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Annotations */}
        {annotations.length > 0 && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1rem'
            }}>
              Annotations & Notes
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {annotations.map(annotation => (
                <div
                  key={annotation.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#334155',
                    borderRadius: '0.5rem',
                    border: '1px solid #475569'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#f8fafc'
                    }}>
                      {formatDate(annotation.date)}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: annotation.type === 'warning' ? '#ef4444' : 
                                     annotation.type === 'success' ? '#10b981' : '#3b82f6',
                      color: 'white'
                    }}>
                      {annotation.type}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    {annotation.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Value and Cash Input Modal */}
        {showCashInput && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              width: '90%',
              maxWidth: '500px'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem'
              }}>
                Total Value & Cash setzen
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Total Value ($) - Gesamtwert (Investments + Cash)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalValueInput}
                  onChange={(e) => setTotalValueInput(e.target.value)}
                  placeholder="z.B. 15000.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Available Cash ($) - Verfügbares Cash zum Investieren
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder="z.B. 2500.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: '0 0 0.5rem 0'
                }}>
                  <strong>Hinweis:</strong> Total Value = Investments + Cash. Das verfügbare Cash wird im Dashboard angezeigt.
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  Aktuell: Total Value: <span style={{ color: '#f8fafc', fontFamily: 'Geist Mono, monospace' }}>${totalValue.toFixed(2)}</span>, Cash: <span style={{ color: '#f8fafc', fontFamily: 'Geist Mono, monospace' }}>${availableCash.toFixed(2)}</span>
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowCashInput(false);
                    setTotalValueInput('');
                    setCashInput('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSetTotalValueAndCash}
                  disabled={!totalValueInput || !cashInput || isNaN(parseFloat(totalValueInput)) || isNaN(parseFloat(cashInput))}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    opacity: (!totalValueInput || !cashInput || isNaN(parseFloat(totalValueInput)) || isNaN(parseFloat(cashInput))) ? 0.5 : 1
                  }}
                >
                  Werte setzen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historical Equity Input Modal */}
        {showHistoricalEquityInput && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                📅 Historischen Equity-Stand setzen
              </h3>
              
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  Datum
                </label>
                <input
                  type="date"
                  value={historicalEquityDate}
                  onChange={(e) => setHistoricalEquityDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  Equity-Stand ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={historicalEquityValue}
                  onChange={(e) => setHistoricalEquityValue(e.target.value)}
                  placeholder="z.B. 12500.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: '0 0 0.5rem 0'
                }}>
                  <strong>Hinweis:</strong> Du kannst historische Equity-Stände für vergangene Tage setzen, falls du einen Tag vergessen hast.
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  Dies hilft dir dabei, eine kontinuierliche Equity Curve aufzubauen.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowHistoricalEquityInput(false);
                    setHistoricalEquityDate('');
                    setHistoricalEquityValue('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSetHistoricalEquity}
                  disabled={!historicalEquityDate || !historicalEquityValue || isNaN(parseFloat(historicalEquityValue))}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    opacity: (!historicalEquityDate || !historicalEquityValue || isNaN(parseFloat(historicalEquityValue))) ? 0.5 : 1
                  }}
                >
                  Historischen Stand setzen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Equity Input Modal */}
        {showEquityInput && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              width: '90%',
              maxWidth: '500px'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem'
              }}>
                Aktuellen Equity-Stand setzen
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Aktueller Equity-Stand ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentEquityInput}
                  onChange={(e) => setCurrentEquityInput(e.target.value)}
                  placeholder="z.B. 12500.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </div>
              
              <div style={{
                backgroundColor: '#334155',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: '0 0 0.5rem 0'
                }}>
                  <strong>Hinweis:</strong> Dieser Wert wird als dein aktueller Equity-Stand für heute gesetzt und dient als Basis für die Equity Curve Berechnungen.
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  Aktueller Portfolio-Wert: <span style={{ color: '#f8fafc', fontFamily: 'Geist Mono, monospace' }}>${portfolioValue.toFixed(2)}</span>
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowEquityInput(false);
                    setCurrentEquityInput('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSetCurrentEquity}
                  disabled={!currentEquityInput || isNaN(parseFloat(currentEquityInput))}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    opacity: (!currentEquityInput || isNaN(parseFloat(currentEquityInput))) ? 0.5 : 1
                  }}
                >
                  Equity setzen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Annotation Form Modal */}
        {showAnnotationForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              width: '90%',
              maxWidth: '500px'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1rem'
              }}>
                Add Annotation
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={newAnnotation.date}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Type
                </label>
                <select
                  value={newAnnotation.type}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="note">Note</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Note
                </label>
                <textarea
                  value={newAnnotation.note}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, note: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  placeholder="Enter your note here..."
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAnnotationForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.date || !newAnnotation.note}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    opacity: (!newAnnotation.date || !newAnnotation.note) ? 0.5 : 1
                  }}
                >
                  Add Annotation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Equity Log */}
        {equityLog.length > 0 && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            marginTop: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Activity style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
              Equity Log - Letzte Eintragungen
            </h3>
            
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              backgroundColor: '#0f172a'
            }}>
              {equityLog.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '1rem',
                    borderBottom: index < equityLog.length - 1 ? '1px solid #334155' : 'none',
                    backgroundColor: index % 2 === 0 ? '#1e293b' : 'transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: entry.type === 'equity' ? '#8b5cf6' : 
                                       entry.type === 'total_cash' ? '#10b981' : 
                                       entry.type === 'historical_equity' ? '#f59e0b' : 
                                       entry.type === 'simulated_data' ? '#8b5cf6' : '#3b82f6',
                        color: 'white'
                      }}>
                        {entry.type === 'equity' ? 'Equity' : 
                         entry.type === 'total_cash' ? 'Total & Cash' : 
                         entry.type === 'historical_equity' ? 'Hist. Equity' : 
                         entry.type === 'simulated_data' ? 'Simuliert' : 'Note'}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                      }}>
                        {new Date(entry.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                    {entry.value > 0 && (
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#f8fafc',
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        ${entry.value.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#f8fafc'
                  }}>
                    {entry.type === 'equity' && (
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Equity-Stand gesetzt: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#8b5cf6' }}>${entry.value.toFixed(2)}</span>
                        </p>
                        {entry.previousValue && (
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                            Vorher: ${entry.previousValue.toFixed(2)} 
                            {entry.change !== 0 && (
                              <span style={{ color: entry.change >= 0 ? '#10b981' : '#ef4444' }}>
                                ({entry.change >= 0 ? '+' : ''}${entry.change.toFixed(2)})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {entry.type === 'total_cash' && (
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Total Value: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#10b981' }}>${entry.value.toFixed(2)}</span>
                        </p>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Cash: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#10b981' }}>${entry.cash.toFixed(2)}</span>
                        </p>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Investments: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#10b981' }}>${entry.investments.toFixed(2)}</span>
                        </p>
                        {entry.previousTotalValue && (
                          <p style={{ margin: '0', fontSize: '0.75rem', color: '#94a3b8' }}>
                            Vorher: Total ${entry.previousTotalValue.toFixed(2)}, Cash ${entry.previousCash.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {entry.type === 'annotation' && (
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          <span style={{
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            backgroundColor: entry.annotationType === 'warning' ? '#ef4444' : 
                                           entry.annotationType === 'success' ? '#10b981' : '#3b82f6',
                            color: 'white',
                            marginRight: '0.5rem'
                          }}>
                            {entry.annotationType}
                          </span>
                          {entry.note}
                        </p>
                        <p style={{ margin: '0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Datum: {new Date(entry.annotationDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                    
                    {entry.type === 'historical_equity' && (
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Historischer Equity-Stand: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#f59e0b' }}>${entry.value.toFixed(2)}</span>
                        </p>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          {entry.note}
                        </p>
                      </div>
                    )}
                    
                    {entry.type === 'simulated_data' && (
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          Simulierte Daten generiert: <span style={{ fontFamily: 'Geist Mono, monospace', color: '#8b5cf6' }}>${entry.value.toFixed(2)}</span>
                        </p>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          {entry.note}
                        </p>
                        <p style={{ margin: '0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          {entry.days} Tage, Start: ${entry.startValue}, Ende: ${entry.endValue.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  if (window.confirm('Möchtest du den kompletten Equity Log löschen?')) {
                    setEquityLog([]);
                    storage.saveSetting('equityLog', []);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Log löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingEquityCurve;
