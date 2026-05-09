import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    scheduled: 0,
    failed: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, postsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/posts?limit=5')
        ]);
        const analyticsData = statsRes.data;
        const postsData = postsRes.data;
        setStats({
          totalPosts: analyticsData.overview?.totalPosts ?? analyticsData.totalPosts ?? 0,
          published: analyticsData.overview?.publishedPosts ?? analyticsData.published ?? 0,
          scheduled: analyticsData.overview?.scheduledPosts ?? analyticsData.scheduled ?? 0,
          failed: analyticsData.overview?.failedPosts ?? analyticsData.failed ?? 0,
        });
        setRecentPosts(postsData.posts || postsData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container animate-in">
      <header className="page-header">
        <div>
          <h1>Good morning, {user?.name.split(' ')[0]}</h1>
          <p>Here's what's happening with your social channels today.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/calendar')}>
            <CalendarIcon size={16} />
            <span>View Calendar</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/compose')}>
            <PlusIcon size={16} />
            <span>Create Post</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-4 stats-row">
        <div className="card stat-card">
          <span className="stat-label">Total Posts</span>
          <span className="stat-value">{stats.totalPosts}</span>
          <span className="stat-change up">+12% from last month</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Published</span>
          <span className="stat-value">{stats.published}</span>
          <span className="stat-change up">+8% this week</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Scheduled</span>
          <span className="stat-value">{stats.scheduled}</span>
          <span className="stat-change">Next post in 2h</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Failed</span>
          <span className="stat-value">{stats.failed}</span>
          <span className="stat-change down">-2% from yesterday</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Posts */}
        <section className="dashboard-section recent-posts-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/posts')}>View all</button>
          </div>
          <div className="card-flat posts-list">
            {recentPosts.length > 0 ? (
              recentPosts.map(post => (
                <div key={post._id} className="post-item">
                  <div className="post-platform-icons">
                    {post.platforms.map(p => {
                      const platformName = typeof p === 'string' ? p : p.platform;
                      return (
                        <span key={platformName} className={`platform-tag tag-${platformName}`} title={platformName}>
                          {platformName[0].toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                  <div className="post-content-preview">
                    <p className="text-truncate">{post.content?.text || post.content}</p>
                    <span className="post-meta">
                      {new Date(post.scheduledAt || post.createdAt).toLocaleDateString()} • 
                      <span className={`status-text status-${post.status}`}>{post.status}</span>
                    </span>
                  </div>
                  <button className="btn btn-icon" onClick={() => navigate(`/posts?id=${post._id}`)}>
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No posts yet</h3>
                <p>Start your journey by creating your first post.</p>
                <button className="btn btn-primary btn-sm" style={{marginTop: '16px'}} onClick={() => navigate('/compose')}>
                  Create Post
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Channels Status */}
        <section className="dashboard-section channels-section">
          <div className="section-header">
            <h3>Your Channels</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/platforms')}>Manage</button>
          </div>
          <div className="card-flat channels-grid">
            {user?.connectedPlatforms?.length > 0 ? (
              user.connectedPlatforms.map((p, i) => (
                <div key={i} className="channel-card-mini">
                  <div className={`platform-dot channel-${p.platform}`}>
                    {p.platform[0].toUpperCase()}
                  </div>
                  <div className="channel-info">
                    <span className="channel-title">{p.accountName || p.platform}</span>
                    <span className={`channel-status ${p.isActive ? 'online' : 'offline'}`}>
                      {p.isActive ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{padding: '24px'}}>
                <p>No channels connected</p>
                <button className="btn btn-outline btn-sm" style={{marginTop: '12px'}} onClick={() => navigate('/platforms')}>
                  Connect
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* Icons */
function PlusIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function CalendarIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ChevronRightIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
