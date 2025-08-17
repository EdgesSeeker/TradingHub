import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, TrendingDown } from 'lucide-react';

const PartialSellModal = ({ trade, currentPrice, onSave, onCancel }) => {
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState(currentPrice || trade.entryPrice);
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentPrice) {
      setSellPrice(currentPrice);
    }
  }, [currentPrice]);

  const handleSave = () => {
    const quantity = parseFloat(sellQuantity);
    const price = parseFloat(sellPrice);
    
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity to sell');
      return;
    }
    
    if (quantity > parseFloat(trade.quantity)) {
      alert('Sell quantity cannot exceed current position size');
      return;
    }
    
    if (!price || price <= 0) {
      alert('Please enter a valid sell price');
      return;
    }

    // Calculate P&L for the partial sale
    const entryPrice = parseFloat(trade.entryPrice);
    const pnl = trade.side === 'BUY' 
      ? (price - entryPrice) * quantity
      : (entryPrice - price) * quantity;

    const partialSale = {
      id: Date.now().toString(), // Generate unique ID for the partial sale
      originalTradeId: trade.id,
      symbol: trade.symbol,
      side: trade.side === 'BUY' ? 'SELL' : 'BUY', // Opposite of original position
      quantity: quantity,
      entryPrice: price,
      exitPrice: price,
      entryDate: sellDate,
      exitDate: sellDate,
      status: 'closed',
      pnl: pnl.toFixed(2),
      notes: notes || `Partial sale of ${quantity} shares at $${price}`,
      isPartialSale: true
    };

    // Update the original trade
    const remainingQuantity = parseFloat(trade.quantity) - quantity;
    const updatedTrade = {
      ...trade,
      quantity: remainingQuantity.toFixed(2),
      positionSize: (parseFloat(trade.entryPrice) * remainingQuantity).toFixed(2)
    };

    onSave(partialSale, updatedTrade);
  };

  const calculatePnL = () => {
    const quantity = parseFloat(sellQuantity) || 0;
    const price = parseFloat(sellPrice) || 0;
    const entryPrice = parseFloat(trade.entryPrice);
    
    if (quantity > 0 && price > 0 && entryPrice > 0) {
      return trade.side === 'BUY' 
        ? (price - entryPrice) * quantity
        : (entryPrice - price) * quantity;
    }
    return 0;
  };

  const pnl = calculatePnL();
  const maxQuantity = parseFloat(trade.quantity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="text-xl font-semibold text-slate-900">Partial Sell</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Trade Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800">{trade.symbol}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                trade.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trade.side === 'BUY' ? 'Long' : 'Short'}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              <div>Current Position: {trade.quantity} shares</div>
              <div>Entry Price: ${parseFloat(trade.entryPrice).toFixed(2)}</div>
            </div>
          </div>

          {/* Sell Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity to Sell (max: {maxQuantity})
            </label>
            <input
              type="number"
              step="0.01"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              max={maxQuantity}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
          </div>

          {/* Sell Price */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sell Price</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter sell price"
              />
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Sell Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sell Date</label>
            <input
              type="date"
              value={sellDate}
              onChange={(e) => setSellDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* P&L Preview */}
          {pnl !== 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Estimated P&L:</div>
              <div className={`text-lg font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${pnl.toFixed(2)}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this partial sale..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Sell Partial
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialSellModal;
