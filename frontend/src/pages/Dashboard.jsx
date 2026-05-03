import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import Schedule from '../components/Schedule';
import { BookOpen, Bell, Search, Calendar } from 'lucide-react';
import api from '../api/axios';

const formatRelativeTime = (dateValue) => {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    stats: { newResources: 0, activeClubs: 0, alerts: 0, lostFoundActive: 0, upcomingEvents: 0 },
    announcements: [],
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard');
        setSummary(res.data);
      } catch {
        setSummary({
          stats: { newResources: 0, activeClubs: 0, alerts: 0, lostFoundActive: 0, upcomingEvents: 0 },
          announcements: [],
        });
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'Student'}!</h1>
          <p>Here's what's happening in your campus today.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search resources, clubs..." />
          </div>
          <button className="icon-btn">
            <Bell size={20} />
            <span className="badge"></span>
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="main-stats">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <BookOpen size={24} color="#16a34a" />
            </div>
            <div className="stat-info">
              <span>Resources</span>
              <h3>{loadingSummary ? '...' : `${summary.stats.newResources} New`}</h3>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#e0f2fe' }}>
              <Calendar size={24} color="#0284c7" />
            </div>
            <div className="stat-info">
              <span>Events</span>
              <h3>{loadingSummary ? '...' : `${summary.stats.upcomingEvents} Upcoming`}</h3>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#f3e8ff' }}>
              <Search size={24} color="#9333ea" />
            </div>
            <div className="stat-info">
              <span>Lost & Found</span>
              <h3>{loadingSummary ? '...' : `${summary.stats.lostFoundActive} Active`}</h3>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Bell size={24} color="#d97706" />
            </div>
            <div className="stat-info">
              <span>Alerts</span>
              <h3>{loadingSummary ? '...' : `${summary.stats.alerts} Open`}</h3>
            </div>
          </div>
        </div>

        <div className="schedule-section">
          <Schedule />
        </div>

        <div className="announcements-wrapper">
          <div className="announcements-section card">
            <h3>Campus Announcements</h3>
            <div className="announcement-list">
              {loadingSummary ? (
                <p className="no-items">Loading announcements...</p>
              ) : summary.announcements.filter(a => a.scope !== 'Class').length > 0 ? (
                summary.announcements.filter(a => a.scope !== 'Class').map((announcement) => (
                  <div className="announcement-item" key={announcement._id}>
                    <span className={`tag ${announcement.scope === 'Campus' ? 'blue' : ''}`}>{announcement.scope}</span>
                    <p>{announcement.title}: {announcement.content}</p>
                    <small>{formatRelativeTime(announcement.createdAt)}</small>
                  </div>
                ))
              ) : (
                <p className="no-items">No campus announcements yet.</p>
              )}
            </div>
          </div>

          <div className="announcements-section card">
            <h3>Class Announcements</h3>
            <div className="announcement-list">
              {loadingSummary ? (
                <p className="no-items">Loading announcements...</p>
              ) : summary.announcements.filter(a => a.scope === 'Class').length > 0 ? (
                summary.announcements.filter(a => a.scope === 'Class').map((announcement) => (
                  <div className="announcement-item" key={announcement._id}>
                    <span className="tag green">{announcement.scope}</span>
                    <p>{announcement.title}: {announcement.content}</p>
                    <small>{formatRelativeTime(announcement.createdAt)}</small>
                  </div>
                ))
              ) : (
                <p className="no-items">No class announcements yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
