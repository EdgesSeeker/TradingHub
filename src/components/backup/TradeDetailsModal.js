import React from 'react';
import { X, Calendar, DollarSign, TrendingUp, TrendingDown, FileImage } from 'lucide-react';

const TradeDetailsModal = ({ trade, onClose }) => {
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getStatusBadge = (status, pnl) => {
    if (status === 'open') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Offen
        </span>
      );
    } else {
      const pnlValue = parseFloat(pnl) || 0;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          pnlValue >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {pnlValue >= 0 ? 'Gewinn' : 'Verlust'}
        </span>
      );
    }
  };

  const getSideBadge = (side) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {side === 'BUY' ? 'LONG' : 'SHORT'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{trade.symbol}</h2>
              <p className="text-slate-600">Trade Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Trade Information */}
          <div className="space-y-6">
            {/* Basic Trade Info */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Trade Informationen</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Symbol:</span>
                  <span className="font-medium text-slate-800">{trade.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Typ:</span>
                  {getSideBadge(trade.side)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status:</span>
                  {getStatusBadge(trade.status, trade.pnl)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Menge:</span>
                  <span className="font-medium text-slate-800">{trade.quantity}</span>
                </div>
              </div>
            </div>

            {/* Entry Information */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Einstieg
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Preis:</span>
                  <span className="font-mono font-medium text-slate-800">{formatPrice(trade.entryPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Datum:</span>
                  <span className="font-medium text-slate-800">{formatDate(trade.entryDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Stop Loss:</span>
                  <span className="font-mono font-medium text-slate-800">{formatPrice(trade.stopLoss)}</span>
                </div>
              </div>
            </div>

            {/* Exit Information */}
            {trade.status === 'closed' && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                  Ausstieg
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Preis:</span>
                    <span className="font-mono font-medium text-slate-800">{formatPrice(trade.exitPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Datum:</span>
                    <span className="font-medium text-slate-800">{formatDate(trade.exitDate)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Financial & Screenshots */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Finanzielle Übersicht</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Positionsgröße:</span>
                  <div className="text-right">
                    <div className="font-medium text-slate-800">${(trade.positionSize || 0).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{(trade.positionSizePercent || 0).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Risiko pro Trade:</span>
                  <span className="font-medium text-slate-800">${(trade.riskPerTrade || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">P&L:</span>
                  <span className={`font-mono font-medium ${
                    (parseFloat(trade.pnl) || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(parseFloat(trade.pnl) || 0)}
                  </span>
                </div>
                {trade.commission && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Kommission:</span>
                    <span className="font-medium text-slate-800">${(trade.commission || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Setup Information */}
            {trade.setup && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Setup</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Setup Typ:</span>
                    <span className="font-medium text-slate-800">{trade.setup.type}</span>
                  </div>
                  {trade.setup.entryReason && (
                    <div className="flex justify-between items-start">
                      <span className="text-slate-600">Einstiegsgrund:</span>
                      <span className="font-medium text-slate-800 text-right max-w-48">{trade.setup.entryReason}</span>
                    </div>
                  )}
                  {trade.setup.exitReason && (
                    <div className="flex justify-between items-start">
                      <span className="text-slate-600">Ausstiegsgrund:</span>
                      <span className="font-medium text-slate-800 text-right max-w-48">{trade.setup.exitReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Screenshots */}
            {trade.screenshots && trade.screenshots.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-blue-600" />
                  Screenshots
                </h3>
                <div className="space-y-3">
                  {trade.screenshots.map((screenshot, index) => (
                    <div key={index} className="relative">
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mental Game Snapshot */}
        {trade.mentalGame && (
          <div className="mt-6 bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              🧠 Mental Game Snapshot
            </h3>
            <div className="space-y-4">
              {trade.mentalGame.tradeReasoning && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Why did I take this trade?</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{trade.mentalGame.tradeReasoning}</p>
                </div>
              )}
              {trade.mentalGame.emotionsThoughts && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">What emotions or thoughts influenced my actions?</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{trade.mentalGame.emotionsThoughts}</p>
                </div>
              )}
              {trade.mentalGame.strengthsMistakes && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">What did I do well, and what was a mistake?</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{trade.mentalGame.strengthsMistakes}</p>
                </div>
              )}
              {trade.mentalGame.nextTimeFix && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">What's one fix for next time?</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{trade.mentalGame.nextTimeFix}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailsModal; 