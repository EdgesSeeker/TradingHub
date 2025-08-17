import React, { useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';

const CurrentPriceInput = ({ openTrades, currentPrices, onPriceUpdate }) => {
  const [prices, setPrices] = useState(currentPrices || {});

  const handlePriceChange = (symbol, price) => {
    const newPrices = { ...prices, [symbol]: parseFloat(price) || 0 };
    setPrices(newPrices);
    onPriceUpdate(newPrices);
  };

  const resetToEntryPrices = () => {
    const entryPrices = {};
    openTrades.forEach(trade => {
      entryPrices[trade.symbol] = parseFloat(trade.entryPrice);
    });
    setPrices(entryPrices);
    onPriceUpdate(entryPrices);
  };

  if (!openTrades || openTrades.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Aktuelle Preise</h3>
          <p className="text-sm text-slate-600">Für Open Heat Berechnung</p>
        </div>
        <button
          onClick={resetToEntryPrices}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Entry Preise</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {openTrades.map((trade) => (
          <div key={trade.symbol} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-slate-800">{trade.symbol}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                trade.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trade.side === 'BUY' ? 'Long' : 'Short'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Entry:</span>
                <span className="text-sm font-medium">${parseFloat(trade.entryPrice).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Stop:</span>
                <span className="text-sm font-medium text-red-600">${parseFloat(trade.stopLoss).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Aktuell:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    value={prices[trade.symbol] || ''}
                    onChange={(e) => handlePriceChange(trade.symbol, e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={trade.entryPrice}
                  />
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentPriceInput; 