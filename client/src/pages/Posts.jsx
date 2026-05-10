import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Posts.css';

const STATUS_TABS = ['all', 'published', 'scheduled', 'draft', 'failed'];

export default function Posts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const params = filter !== 'all' ? { status: filter } : {};
        const { data } = await api.get('/posts', { params });
        setPosts(data.posts || data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, [filter]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch (err) { console.error(err); }
  };

  const statusBadge = (status) => {
    const map = { published: 'badge-success', scheduled: 'badge-info', draft: 'badge-draft', failed: 'badge-error', queued: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-draft'}`}>{status}</span>;
  };

  return (
    <div className="posts-page animate-in">
      <header className="page-header">
        <div>
          <h1>Posts</h1>
          <p>Manage all your published and scheduled content.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/compose')}>+ New Post</button>
      </header>

      {/* Tabs */}
      <div className="tabs">
        {STATUS_TABS.map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'all' && <span className="tab-count">{posts.length}</span>}
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="card-flat posts-table">
        {posts.length > 0 ? (
          <>
            <div className="table-header">
              <span className="th-col th-platform">Channel</span>
              <span className="th-col th-content">Content</span>
              <span className="th-col th-status">Status</span>
              <span className="th-col th-date">Date</span>
              <span className="th-col th-actions"></span>
            </div>
            {posts.map(post => (
              <div key={post._id} className="table-row">
                <div className="td-col th-platform">
                  <div className="platform-tags">
                    {post.platforms.map(p => {
                      const platformName = typeof p === 'string' ? p : p.platform;
                      return (
                        <span key={platformName} className={`platform-tag tag-${platformName}`}>
                          {platformName[0].toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="td-col th-content">
                  <p className="post-text">{post.content?.text || post.content}</p>
                  {post.publishStatus?.map(ps => {
                    if (ps.error) {
                      return (
                        <div key={ps.platform} style={{ fontSize: '12px', color: '#d32f2f', marginTop: '4px' }}>
                          ⚠️ {ps.platform}: {ps.error}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="td-col th-status">
                  {statusBadge(post.status)}
                </div>
                <div className="td-col th-date">
                  <span className="date-text">{new Date(post.scheduledAt || post.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="td-col th-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/compose?edit=${post._id}`)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{color: 'var(--color-error)'}} onClick={() => handleDelete(post._id)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>{filter === 'all' ? 'No posts yet' : `No ${filter} posts`}</h3>
            <p>Create your first post to see it here.</p>
            <button className="btn btn-primary btn-sm" style={{marginTop: '16px'}} onClick={() => navigate('/compose')}>Create Post</button>
          </div>
        )}
      </div>
    </div>
  );
}
