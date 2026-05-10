import React, { useState } from 'react';
import './MediaLibrary.css';

export default function MediaLibrary() {
  const [files, setFiles] = useState([]);
  const [view, setView] = useState('grid');

  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      uploadedAt: new Date(),
    }));
    setFiles(prev => [...newFiles, ...prev]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="media-page animate-in">
      <header className="page-header">
        <div>
          <h1>Media Library</h1>
          <p>Upload and manage your images and videos.</p>
        </div>
        <div className="media-actions">
          <div className="view-toggle">
            <button className={`btn btn-icon ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>⊞</button>
            <button className={`btn btn-icon ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰</button>
          </div>
          <button className="btn btn-primary" onClick={() => document.getElementById('media-upload')?.click()}>
            Upload
          </button>
          <input id="media-upload" type="file" hidden multiple accept="image/*,video/*" onChange={handleUpload} />
        </div>
      </header>

      {files.length > 0 ? (
        view === 'grid' ? (
          <div className="media-grid">
            {files.map(f => (
              <div key={f.id} className="media-card">
                <div className="media-card-img">
                  {f.type.startsWith('video') ? (
                    <video src={f.url} />
                  ) : (
                    <img src={f.url} alt={f.name} />
                  )}
                </div>
                <div className="media-card-info">
                  <span className="media-card-name">{f.name}</span>
                  <span className="media-card-size">{formatSize(f.size)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-flat">
            {files.map(f => (
              <div key={f.id} className="media-list-row">
                <div className="media-list-thumb">
                  <img src={f.url} alt="" />
                </div>
                <span className="media-list-name">{f.name}</span>
                <span className="media-list-size">{formatSize(f.size)}</span>
                <span className="media-list-date">{f.uploadedAt.toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card">
          <div className="media-drop-zone-lg" onClick={() => document.getElementById('media-upload')?.click()}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <h3>Drop files here or click to upload</h3>
            <p>Supports PNG, JPG, GIF, MP4 files up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
