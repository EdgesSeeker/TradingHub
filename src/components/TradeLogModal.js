import React, { useState, useEffect } from 'react';

const TradeLogModal = ({ isOpen, onClose, onSave, initialData, phase }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    direction: 'Long',
    setupType: '',
    thesis: '',
    criteriaMet: true,
    missingCriteria: '',
    stopLevel: '',
    riskDollar: '',
    targetR: '',
    screenshotPre: '',
    screenshotPost: '',
    ruleCompliance: true,
    brokenRule: '',
    executionGrade: 'B',
    emotions: '',
    pnlDollar: '',
    pnlPercent: '',
    finalRR: '',
    marketContext: '',
    wentWell1: '',
    wentWell2: '',
    mistake1: '',
    mistake2: '',
    kaizen: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (name, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => handleChange(name, e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    onSave({ ...form, phase });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', width: '95%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{phase === 'post' ? 'Trade Log (Post-Trade)' : 'Trade Log (Pre-Trade)'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #475569', color: '#94a3b8', borderRadius: 8, padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Schließen</button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Trade Info */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Date</label>
              <input type="date" value={form.date} onChange={(e)=>handleChange('date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Symbol</label>
              <input type="text" value={form.symbol} onChange={(e)=>handleChange('symbol', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Direction</label>
              <select value={form.direction} onChange={(e)=>handleChange('direction', e.target.value)} style={inputStyle}>
                <option>Long</option>
                <option>Short</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Setup Type</label>
              <input type="text" placeholder="Breakout / Reversal / Macro / ..." value={form.setupType} onChange={(e)=>handleChange('setupType', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Trade Thesis (1-2 sentences)</label>
              <textarea value={form.thesis} onChange={(e)=>handleChange('thesis', e.target.value)} rows={2} style={textAreaStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Entry Criteria Met?</label>
              <select value={form.criteriaMet ? 'Yes':'No'} onChange={(e)=>handleChange('criteriaMet', e.target.value==='Yes')} style={inputStyle}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            {!form.criteriaMet && (
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12 }}>Missing Criterion</label>
                <input type="text" value={form.missingCriteria} onChange={(e)=>handleChange('missingCriteria', e.target.value)} style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Stop Level</label>
              <input type="text" value={form.stopLevel} onChange={(e)=>handleChange('stopLevel', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>$ Risk</label>
              <input type="number" value={form.riskDollar} onChange={(e)=>handleChange('riskDollar', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Target R</label>
              <input type="number" value={form.targetR} onChange={(e)=>handleChange('targetR', e.target.value)} style={inputStyle} />
            </div>
          </section>

          {/* 2. Visual Evidence */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Screenshot (Pre-Trade)</label>
              <input type="file" accept="image/*" onChange={(e)=>handleImageUpload('screenshotPre', e.target.files?.[0])} style={inputStyle} />
              {form.screenshotPre && <img src={form.screenshotPre} alt="pre" style={{ marginTop: 8, width: '100%', borderRadius: 8 }} />}
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Screenshot (Post-Trade)</label>
              <input type="file" accept="image/*" onChange={(e)=>handleImageUpload('screenshotPost', e.target.files?.[0])} style={inputStyle} />
              {form.screenshotPost && <img src={form.screenshotPost} alt="post" style={{ marginTop: 8, width: '100%', borderRadius: 8 }} />}
            </div>
          </section>

          {/* 3. Rule & Execution */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Rule Compliance</label>
              <select value={form.ruleCompliance ? 'Yes':'No'} onChange={(e)=>handleChange('ruleCompliance', e.target.value==='Yes')} style={inputStyle}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            {!form.ruleCompliance && (
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12 }}>Which Rule</label>
                <input type="text" value={form.brokenRule} onChange={(e)=>handleChange('brokenRule', e.target.value)} style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Execution Grade</label>
              <select value={form.executionGrade} onChange={(e)=>handleChange('executionGrade', e.target.value)} style={inputStyle}>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Emotions</label>
              <input type="text" placeholder="Calm / FOMO / Fear / Overconfidence / ..." value={form.emotions} onChange={(e)=>handleChange('emotions', e.target.value)} style={inputStyle} />
            </div>
          </section>

          {/* 4. Outcome */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>PnL ($)</label>
              <input type="number" value={form.pnlDollar} onChange={(e)=>handleChange('pnlDollar', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>PnL (%)</label>
              <input type="number" value={form.pnlPercent} onChange={(e)=>handleChange('pnlPercent', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Final R/R</label>
              <input type="number" value={form.finalRR} onChange={(e)=>handleChange('finalRR', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Market Context Reflection</label>
              <textarea value={form.marketContext} onChange={(e)=>handleChange('marketContext', e.target.value)} rows={2} style={textAreaStyle} />
            </div>
          </section>

          {/* 5. Reflection */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>What Went Well (1)</label>
              <input type="text" value={form.wentWell1} onChange={(e)=>handleChange('wentWell1', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>What Went Well (2)</label>
              <input type="text" value={form.wentWell2} onChange={(e)=>handleChange('wentWell2', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Mistakes / Suboptimal (1)</label>
              <input type="text" value={form.mistake1} onChange={(e)=>handleChange('mistake1', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Mistakes / Suboptimal (2)</label>
              <input type="text" value={form.mistake2} onChange={(e)=>handleChange('mistake2', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Kaizen (1% Improvement)</label>
              <textarea value={form.kaizen} onChange={(e)=>handleChange('kaizen', e.target.value)} rows={2} style={textAreaStyle} />
            </div>
          </section>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={secondaryButton}>Abbrechen</button>
            <button onClick={handleSubmit} style={primaryButton}>Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '0.6rem 0.75rem', background: '#334155', border: '1px solid #475569', color: '#f8fafc', borderRadius: 8, fontSize: 14
};
const textAreaStyle = {
  width: '100%', padding: '0.6rem 0.75rem', background: '#334155', border: '1px solid #475569', color: '#f8fafc', borderRadius: 8, fontSize: 14, resize: 'vertical'
};
const primaryButton = {
  padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500
};
const secondaryButton = {
  padding: '0.6rem 1rem', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: 8, cursor: 'pointer', fontWeight: 500
};

export default TradeLogModal;

