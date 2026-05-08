import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PLATFORMS } from '../utils/constants';
import './Compose.css';

const PLATFORM_LIST = [
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2', icon: 'f' },
  { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: '📷' },
  { key: 'twitter',   label: 'X',         color: '#1d9bf0', icon: '𝕏' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2', icon: 'in' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', icon: '▶' },
  { key: 'pinterest', label: 'Pinterest', color: '#E60023', icon: 'P' },
  { key: 'telegram',  label: 'Telegram',  color: '#26A5E4', icon: '✈' },
  { key: 'whatsapp',  label: 'WhatsApp',  color: '#25D366', icon: '💬' },
];

export default function Compose() {
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState('');

  // Extract edit parameter from URL
  const editId = new URLSearchParams(location.search).get('edit');

  useEffect(() => {
    if (editId) {
      const loadPost = async () => {
        try {
          const { data } = await api.get('/posts');
          const post = data.posts?.find(p => p._id === editId);
          if (post) {
            setContent(post.content || '');
            // Only set schedule if it hasn't passed
            if (post.status === 'scheduled' && post.scheduledAt) {
              const d = new Date(post.scheduledAt);
              if (d > new Date()) {
                setScheduleType('schedule');
                setScheduleDate(d.toISOString().split('T')[0]);
                setScheduleTime(d.toTimeString().substring(0, 5));
              }
            }
          }
        } catch (e) {
          console.error("Failed to load post for editing", e);
        }
      };
      loadPost();
    }
  }, [editId]);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'linkedin']);
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  const togglePlatform = (key) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const validation = useMemo(() => {
    const issues = [];
    selectedPlatforms.forEach(p => {
      const spec = PLATFORMS[p];
      if (spec?.maxLength && content.length > spec.maxLength) {
        issues.push({ platform: p, message: `${p} limit: ${spec.maxLength} chars` });
      }
      if (p === 'instagram' && content.match(/https?:\/\//)) {
        issues.push({ platform: p, message: 'Instagram: links in captions not supported' });
      }
    });
    return issues;
  }, [content, selectedPlatforms]);

  const charInfo = useMemo(() => {
    const lowest = selectedPlatforms.reduce((min, p) => {
      const spec = PLATFORMS[p];
      return spec?.maxLength && spec.maxLength < min ? spec.maxLength : min;
    }, Infinity);
    return lowest === Infinity ? null : { limit: lowest, remaining: lowest - content.length };
  }, [content, selectedPlatforms]);

  const handleSubmit = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    setPosting(true);
    try {
      // Extract hashtags from content
      const hashtags = (content.match(/#\w+/g) || []).map(h => h.slice(1));
      // Extract links from content
      const linkMatch = content.match(/https?:\/\/[^\s]+/);

      // Upload media if any
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach(f => formData.append('files', f));
        formData.append('platforms', selectedPlatforms.join(','));
        const uploadRes = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        uploadedMedia = uploadRes.data.media.map(m => ({
          type: m.type,
          originalUrl: m.processedPath || m.originalPath,
          mimeType: m.mimeType,
          size: m.size
        }));
      }

      const payload = {
        content: {
          text: content,
          hashtags,
          link: linkMatch ? linkMatch[0] : undefined,
        },
        media: uploadedMedia,
        platforms: selectedPlatforms,
        schedule: scheduleType === 'schedule'
          ? { type: 'scheduled', scheduledAt: `${scheduleDate}T${scheduleTime}` }
          : { type: 'immediate' },
      };

      const { data } = await api.post('/posts', payload);
      const postId = data.post?._id || data._id;

      if (scheduleType === 'now') {
        await api.post(`/posts/${postId}/publish`);
        toast.success('Post published successfully!');
      } else {
        toast.success('Post scheduled successfully!');
      }
      navigate('/posts');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="compose-page animate-in">
      <header className="page-header">
        <div>
          <h1>Create Post</h1>
          <p>Craft and schedule content across your channels.</p>
        </div>
      </header>

      <div className="compose-tabs tabs">
        <button className={`tab ${activeTab === 'compose' ? 'active' : ''}`} onClick={() => setActiveTab('compose')}>Compose</button>
        <button className={`tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>Bulk Upload</button>
      </div>

      {activeTab === 'compose' ? (
        <div className="compose-layout">
          {/* Editor */}
          <div className="compose-editor">
            {/* Platform selector */}
            <div className="compose-section">
              <label className="label">Publish to</label>
              <div className="platform-selector">
                {PLATFORM_LIST.map(p => (
                  <button
                    key={p.key}
                    className={`platform-chip ${selectedPlatforms.includes(p.key) ? 'selected' : ''}`}
                    onClick={() => togglePlatform(p.key)}
                    style={selectedPlatforms.includes(p.key) ? { borderColor: p.color, background: p.color + '10' } : {}}
                  >
                    <span className="chip-dot" style={{ background: p.color }}>{p.icon}</span>
                    <span className="chip-label">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text editor */}
            <div className="compose-section">
              <label className="label">Content</label>
              <textarea
                className="textarea compose-textarea"
                placeholder="What would you like to share?"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
              />
              {charInfo && (
                <div className={`char-counter ${charInfo.remaining < 20 ? 'danger' : charInfo.remaining < 50 ? 'warning' : ''}`}>
                  {charInfo.remaining} characters remaining
                </div>
              )}
            </div>

            {/* Media */}
            <div className="compose-section">
              <label className="label">Media</label>
              <div className="media-drop-zone" onClick={() => document.getElementById('file-input')?.click()}>
                <UploadIcon />
                <span>Click to upload or drag and drop</span>
                <span className="drop-hint">PNG, JPG, GIF, MP4 up to 10MB</span>
                <input id="file-input" type="file" hidden multiple accept="image/*,video/*" onChange={e => setMediaFiles([...e.target.files])} />
              </div>
              {mediaFiles.length > 0 && (
                <div className="media-preview-strip">
                  {Array.from(mediaFiles).map((f, i) => (
                    <div key={i} className="media-thumb">
                      {f.type && f.type.startsWith('video/') ? (
                        <video src={URL.createObjectURL(f)} controls />
                      ) : (
                        <img src={URL.createObjectURL(f)} alt="" />
                      )}
                      <button className="media-remove" onClick={() => setMediaFiles(prev => prev.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation warnings */}
            {validation.length > 0 && (
              <div className="validation-box">
                {validation.map((v, i) => (
                  <div key={i} className="validation-item">
                    <span className="validation-icon">⚠</span>
                    <span>{v.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule */}
            <div className="compose-section">
              <label className="label">When to publish</label>
              <div className="schedule-options">
                <button className={`btn ${scheduleType === 'now' ? 'btn-accent' : 'btn-outline'} btn-sm`} onClick={() => setScheduleType('now')}>
                  Publish now
                </button>
                <button className={`btn ${scheduleType === 'schedule' ? 'btn-accent' : 'btn-outline'} btn-sm`} onClick={() => setScheduleType('schedule')}>
                  Schedule
                </button>
              </div>
              {scheduleType === 'schedule' && (
                <div className="schedule-datetime">
                  <input className="input" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  <input className="input" type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="compose-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/posts')}>Save as draft</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={!content.trim() || selectedPlatforms.length === 0 || posting || validation.length > 0}
              >
                {posting ? 'Publishing…' : scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="compose-preview">
            <h3 className="preview-title">Preview</h3>
            {selectedPlatforms.length > 0 ? selectedPlatforms.map(p => {
              const pInfo = PLATFORM_LIST.find(x => x.key === p);
              return (
                <div key={p} className="preview-card">
                  <div className="preview-header">
                    <span className="preview-dot" style={{ background: pInfo?.color }}>{pInfo?.icon}</span>
                    <div className="preview-meta">
                      <span className="preview-name">Your Name</span>
                      <span className="preview-handle">@yourhandle · {pInfo?.label}</span>
                    </div>
                  </div>
                  <p className="preview-body">{content || 'Your post content will appear here…'}</p>
                  {mediaFiles.length > 0 && (
                    <div className="preview-media">
                      {mediaFiles[0].type && mediaFiles[0].type.startsWith('video/') ? (
                        <video src={URL.createObjectURL(mediaFiles[0])} controls style={{maxWidth: '100%'}} />
                      ) : (
                        <img src={URL.createObjectURL(mediaFiles[0])} alt="" />
                      )}
                    </div>
                  )}
                  <div className="preview-engagement">
                    <span>♡ 0</span>
                    <span>💬 0</span>
                    <span>🔁 0</span>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-state" style={{padding: '40px 20px'}}>
                <p>Select platforms above to see previews</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Bulk Upload Tab */
        <div className="bulk-section card">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Bulk Schedule via CSV</h3>
            <p>Upload a CSV file with columns: content, platform, scheduledAt</p>
            <button className="btn btn-outline" style={{marginTop: '16px'}} onClick={() => document.getElementById('csv-input')?.click()} disabled={posting}>
              {posting ? 'Uploading...' : 'Choose CSV File'}
            </button>
            <input 
              id="csv-input" 
              type="file" 
              hidden 
              accept=".csv" 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setPosting(true);
                try {
                  const reader = new FileReader();
                  reader.onload = async (e) => {
                    try {
                      const csvData = e.target.result;
                      const { data } = await api.post('/posts/bulk/csv', { csvData });
                      toast.success(`Successfully scheduled ${data.succeeded} posts!`);
                      if (data.failed > 0) toast.error(`Failed to schedule ${data.failed} posts.`);
                      navigate('/posts');
                    } catch (err) {
                      toast.error(err.response?.data?.error || 'Failed to process CSV');
                    } finally {
                      setPosting(false);
                    }
                  };
                  reader.readAsText(file);
                } catch (err) {
                  toast.error('Failed to read file');
                  setPosting(false);
                }
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '24px' }}>
              Example CSV row:<br/>
              <code>"Check out our new feature!","twitter,linkedin","2026-06-01T10:00:00Z"</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
