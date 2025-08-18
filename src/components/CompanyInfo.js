import React, { useState } from 'react';
import { Building2, Search, Loader2, FileText, TrendingUp, AlertTriangle, Calendar, Target, X } from 'lucide-react';
import { getCompanyInfo } from '../services/aiAnalysis';

const CompanyInfo = () => {
  const [symbol, setSymbol] = useState('');
  const [companyAnalysis, setCompanyAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    if (!symbol.trim()) {
      setError('Bitte gib ein Symbol ein');
      return;
    }

    setIsLoading(true);
    setError('');
    setCompanyAnalysis(null);

    try {
      const analysis = await getCompanyInfo(symbol.toUpperCase());
      setCompanyAnalysis(analysis);
    } catch (error) {
      console.error('Error generating company report:', error);
      setError('Fehler beim Generieren des Reports. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSymbol('');
    setCompanyAnalysis(null);
    setError('');
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#f8fafc'
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155'
      }}>
        <Building2 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            Company Info Generator
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            Detaillierte Unternehmensanalyse für Trading-Entscheidungen
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Input */}
        <div>
          <div style={{
            backgroundColor: '#334155',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Search size={20} />
              Symbol eingeben
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  Aktien-Symbol *
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="z.B. AAPL, TSLA, NVDA"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleGenerateReport}
                  disabled={isLoading || !symbol.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isLoading ? '#64748b' : '#3b82f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Report generieren
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#475569',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <X size={16} />
                  Löschen
                </button>
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#dc2626',
                  border: '1px solid #ef4444',
                  borderRadius: '0.25rem',
                  color: '#fef2f2',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            backgroundColor: '#1e40af',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #3b82f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Target size={16} color="#fbbf24" />
              <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.875rem' }}>
                Was wird analysiert?
              </span>
            </div>
            <ul style={{
              color: '#cbd5e1',
              fontSize: '0.75rem',
              margin: 0,
              paddingLeft: '1.25rem',
              lineHeight: '1.4'
            }}>
              <li>Unternehmensmodell & Branche</li>
              <li>Wichtige Katalysatoren (6-12 Monate)</li>
              <li>Kurshebel & Verdopplungspotenzial</li>
              <li>Geschäftliche Termine & Events</li>
              <li>Risiken & Gegenargumente</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {!companyAnalysis ? (
            <div style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '0.5rem', color: '#f8fafc' }}>
                Kein Report generiert
              </h3>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Gib ein Symbol ein und klicke auf "Report generieren", um eine detaillierte Unternehmensanalyse zu erhalten.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #475569'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  📊 {symbol} - Unternehmensanalyse
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  backgroundColor: '#475569',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}>
                  KI-generiert
                </span>
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#f8fafc',
                whiteSpace: 'pre-wrap'
              }}>
                {companyAnalysis}
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: '#64748b',
                textAlign: 'center'
              }}>
                💡 Diese Analyse dient nur zu Informationszwecken. Führe immer eigene Recherchen durch.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
