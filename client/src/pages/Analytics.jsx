import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Analytics.css';

const PLATFORM_COLORS = {
  facebook: '#1877F2', instagram: '#E4405F', twitter: '#1d9bf0',
  linkedin: '#0A66C2', youtube: '#FF0000', pinterest: '#E60023',
  telegram: '#26A5E4', whatsapp: '#25D366',
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    api.get('/analytics/overview').then(r => setOverview(r.data)).catch(console.error);
    api.get('/analytics/engagement').then(r => setEngagement(r.data)).catch(console.error);
  }, [period]);

  if (!overview) return <div className="analytics-page animate-in"><p style={{color: 'var(--text-tertiary)', padding: 40}}>Loading analytics…</p></div>;

  const stats = overview.overview || overview;
  const platformDist = overview.platformDistribution || [];
  const engTotals = engagement?.totals || {};
  const engByPlatform = engagement?.byPlatform || {};
  const maxPosts = Math.max(...platformDist.map(p => p.count || 0), 1);

  return (
    <div className="analytics-page animate-in">
      <header className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Track your publishing performance across platforms.</p>
        </div>
        <div className="period-selector">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-accent' : 'btn-outline'}`} onClick={() => setPeriod(p)}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </header>

      {/* Overview cards */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        <div className="card stat-card">
          <span className="stat-label">Total Posts</span>
          <span className="stat-value">{stats.totalPosts || 0}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Likes</span>
          <span className="stat-value">{engTotals.likes || 0}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Comments</span>
          <span className="stat-value">{engTotals.comments || 0}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Shares</span>
          <span className="stat-value">{engTotals.shares || 0}</span>
        </div>
      </div>

      {/* Platform Breakdown */}
      <section className="analytics-section">
        <h3>Posts by Platform</h3>
        <div className="card-flat chart-container">
          {platformDist.length > 0 ? (
            <div className="bar-chart">
              {platformDist.map(p => (
                <div key={p._id} className="bar-row">
                  <span className="bar-label">
                    <span className="bar-dot" style={{ background: PLATFORM_COLORS[p._id] || '#888' }} />
                    {p._id}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(p.count / maxPosts) * 100}%`, background: PLATFORM_COLORS[p._id] || '#888' }}
                    />
                  </div>
                  <span className="bar-value">{p.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No data available yet. Start publishing to see analytics.</p>
            </div>
          )}
        </div>
      </section>

      {/* Engagement by Platform */}
      <section className="analytics-section">
        <h3>Engagement by Platform</h3>
        <div className="grid grid-3">
          {Object.entries(engByPlatform).map(([platform, data]) => (
            <div key={platform} className="card engagement-card">
              <div className="engagement-header">
                <span className="bar-dot" style={{ background: PLATFORM_COLORS[platform] || '#888', width: 28, height: 28, fontSize: 13 }}>
                  {platform[0].toUpperCase()}
                </span>
                <span className="engagement-platform">{platform}</span>
              </div>
              <div className="engagement-stats">
                <div className="engagement-row"><span>Likes</span><span className="engagement-val">{data.likes || 0}</span></div>
                <div className="engagement-row"><span>Comments</span><span className="engagement-val">{data.comments || 0}</span></div>
                <div className="engagement-row"><span>Shares</span><span className="engagement-val">{data.shares || 0}</span></div>
                <div className="engagement-row"><span>Views</span><span className="engagement-val">{(data.views || 0).toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
