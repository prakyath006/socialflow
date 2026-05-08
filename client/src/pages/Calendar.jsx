import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import './Calendar.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const [posts, setPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');

  useEffect(() => {
    api.get('/posts').then(r => setPosts(r.data.posts || r.data)).catch(console.error);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [year, month]);

  const getPostsForDay = (day) => {
    if (!day) return [];
    return posts.filter(p => {
      const d = new Date(p.scheduledAt || p.createdAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const today = new Date();
  const isToday = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const navigate = (dir) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  return (
    <div className="calendar-page animate-in">
      <header className="page-header">
        <div>
          <h1>Calendar</h1>
          <p>View your scheduled content at a glance.</p>
        </div>
        <div className="calendar-controls">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>←</button>
          <span className="calendar-month-label">{MONTHS[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(1)}>→</button>
        </div>
      </header>

      <div className="card-flat calendar-card">
        <div className="calendar-grid">
          {DAYS.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            const dayPosts = getPostsForDay(day);
            return (
              <div key={i} className={`calendar-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}>
                {day && (
                  <>
                    <span className={`cell-date ${isToday(day) ? 'today-dot' : ''}`}>{day}</span>
                    <div className="cell-posts">
                      {dayPosts.slice(0, 3).map(p => (
                        <div key={p._id} className={`cell-post status-bg-${p.status}`}>
                          <span className="cell-post-text">{(typeof p.content === 'object' ? p.content?.text : p.content)?.substring(0, 24)}</span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && <span className="cell-more">+{dayPosts.length - 3} more</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
