import React, { useState } from 'react';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');

  // Settings state
  const [autoRetry, setAutoRetry] = useState(true);
  const [bestTime, setBestTime] = useState(user?.settings?.bestTimePosting ?? true);
  const [notifyPublished, setNotifyPublished] = useState(user?.settings?.notifications?.email ?? true);
  const [notifyFailed, setNotifyFailed] = useState(user?.settings?.notifications?.onFailure ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const SECTIONS = [
    { key: 'profile', label: 'Profile' },
    { key: 'publishing', label: 'Publishing' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'api', label: 'API & Webhooks' },
  ];

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/auth/me', { name, email, timezone });
      if (data.user && setUser) setUser(data.user);
      setSaved(true);
      toast.success('Profile saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const savePublishing = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/auth/me', {
        timezone,
        settings: {
          ...user?.settings,
          autoSchedule: autoRetry,
          bestTimePosting: bestTime,
        }
      });
      if (data.user && setUser) setUser(data.user);
      setSaved(true);
      toast.success('Publishing preferences saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save publishing settings:', err);
      toast.error('Failed to save publishing preferences');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/auth/me', {
        settings: {
          ...user?.settings,
          notifications: {
            email: notifyPublished,
            push: true,
            onFailure: notifyFailed,
          }
        }
      });
      if (data.user && setUser) setUser(data.user);
      setSaved(true);
      toast.success('Notification preferences saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page animate-in">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and publishing preferences.</p>
        </div>
        {saved && <span className="badge badge-success" style={{fontSize: 13, padding: '6px 16px'}}>✓ Saved</span>}
      </header>

      <div className="settings-layout">
        {/* Settings Nav */}
        <nav className="settings-nav">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={`settings-nav-item ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="settings-content">
          {activeSection === 'profile' && (
            <div className="settings-panel">
              <h3>Profile</h3>
              <div className="form-group">
                <label className="label">Full name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Email address</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Timezone</label>
                <select className="select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option>Asia/Kolkata</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>America/Los_Angeles</option>
                  <option>Pacific/Auckland</option>
                  <option>Australia/Sydney</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {activeSection === 'publishing' && (
            <div className="settings-panel">
              <h3>Publishing Preferences</h3>
              <div className="form-group">
                <label className="label">Default timezone</label>
                <select className="select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option>Asia/Kolkata</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>America/Los_Angeles</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Auto-retry failed posts</label>
                <div className="toggle-row" onClick={() => setAutoRetry(!autoRetry)}>
                  <span className={`toggle-switch ${autoRetry ? 'on' : ''}`} />
                  <span>Automatically retry posts that fail to publish</span>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Best time suggestions</label>
                <div className="toggle-row" onClick={() => setBestTime(!bestTime)}>
                  <span className={`toggle-switch ${bestTime ? 'on' : ''}`} />
                  <span>Show optimal posting time suggestions</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={savePublishing} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-panel">
              <h3>Notifications</h3>
              <div className="form-group">
                <div className="toggle-row" onClick={() => setNotifyPublished(!notifyPublished)}>
                  <span className={`toggle-switch ${notifyPublished ? 'on' : ''}`} />
                  <span>Email me when a post is published</span>
                </div>
              </div>
              <div className="form-group">
                <div className="toggle-row" onClick={() => setNotifyFailed(!notifyFailed)}>
                  <span className={`toggle-switch ${notifyFailed ? 'on' : ''}`} />
                  <span>Email me when a post fails</span>
                </div>
              </div>
              <div className="form-group">
                <div className="toggle-row" onClick={() => setWeeklyDigest(!weeklyDigest)}>
                  <span className={`toggle-switch ${weeklyDigest ? 'on' : ''}`} />
                  <span>Weekly analytics digest</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={saveNotifications} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="settings-panel">
              <h3>API & Webhooks</h3>
              <div className="form-group">
                <label className="label">API Key</label>
                <div className="api-key-box">
                  <input className="input" value="sf_live_**********************" readOnly />
                  <button className="btn btn-outline btn-sm">Copy</button>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Webhook URL</label>
                <input className="input" placeholder="https://your-app.com/webhook" />
              </div>
              <div className="form-group">
                <label className="label">Webhook events</label>
                <div className="toggle-row"><span className="toggle-switch on" /><span>post.published</span></div>
                <div className="toggle-row" style={{marginTop: 8}}><span className="toggle-switch on" /><span>post.failed</span></div>
                <div className="toggle-row" style={{marginTop: 8}}><span className="toggle-switch" /><span>post.scheduled</span></div>
              </div>
              <button className="btn btn-primary">Save changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
