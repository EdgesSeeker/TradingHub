import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Target } from 'lucide-react';

const WeeklyReview = ({ trades, onTradeUpdated }) => {
  const [weeklyData, setWeeklyData] = useState(null);

  useEffect(() => {
    // TODO: Implement weekly review logic
    console.log('Weekly Review component loaded');
  }, []);

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Page Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 2rem 1rem'
      }}>
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
          <BarChart3 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
              Weekly Review
            </h1>
            <p style={{ margin: '0.5rem 0 0 0, color: '#94a3b8', fontSize: '0.875rem' }}>
              Weekly trading performance analysis and insights
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          padding: '3rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <BarChart3 style={{
            width: '3rem',
            height: '3rem',
            color: '#94a3b8',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '0.5rem'
          }}>
            Weekly Review Coming Soon
          </h3>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.875rem'
          }}>
            This feature will provide comprehensive weekly trading analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReview;
