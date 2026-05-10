import React from 'react';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Platforms.css';

const CHANNELS = [
  { key: 'facebook',  name: 'Facebook',  color: '#1877F2', desc: 'Pages & Groups' },
  { key: 'instagram', name: 'Instagram', color: '#E4405F', desc: 'Business & Creator' },
  { key: 'twitter',   name: 'X (Twitter)', color: '#1d9bf0', desc: 'Profiles' },
  { key: 'linkedin',  name: 'LinkedIn',  color: '#0A66C2', desc: 'Profiles & Pages' },
  { key: 'youtube',   name: 'YouTube',   color: '#FF0000', desc: 'Channels' },
  { key: 'pinterest', name: 'Pinterest', color: '#E60023', desc: 'Boards' },
  { key: 'telegram',  name: 'Telegram',  color: '#26A5E4', desc: 'Channels & Groups' },
  { key: 'whatsapp',  name: 'WhatsApp',  color: '#25D366', desc: 'Business' },
];

export default function Platforms() {
  const { user, fetchMe } = useAuthStore();

  const isConnected = (key) => user?.connectedPlatforms?.some(p => p.platform === key && p.isActive);

  const handleConnect = async (key) => {
    try {
      const { data } = await api.get(`/auth/connect/${key}`);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(`${key} does not support OAuth connect.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to connect ${key}`);
    }
  };

  const handleDisconnect = async (key) => {
    try {
      await api.post(`/auth/disconnect/${key}`);
      toast.success(`Disconnected ${key}`);
      await fetchMe();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to disconnect ${key}`);
    }
  };

  return (
    <div className="platforms-page animate-in">
      <header className="page-header">
        <div>
          <h1>Channels</h1>
          <p>Connect your social media accounts to start publishing.</p>
        </div>
      </header>

      <div className="channels-list">
        {CHANNELS.map(ch => {
          const connected = isConnected(ch.key);
          return (
            <div key={ch.key} className="card channel-row">
              <div className="channel-left">
                <span className="channel-icon" style={{ background: ch.color }}>
                  {ch.name[0]}
                </span>
                <div className="channel-details">
                  <span className="channel-name">{ch.name}</span>
                  <span className="channel-desc">{ch.desc}</span>
                </div>
              </div>
              <div className="channel-right">
                {connected ? (
                  <>
                    <span className="badge badge-success">Connected</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(ch.key)}>Disconnect</button>
                  </>
                ) : (
                  <button className="btn btn-outline btn-sm" onClick={() => handleConnect(ch.key)}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
