import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { User, Mail, Shield, Save, LogOut, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState({ events: [], clubs: [] });

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/auth/my-activity');
        setActivity(res.data);
      } catch {
        console.error('Failed to fetch activity');
      }
    };
    fetchActivity();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { name: formData.name });
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password changed successfully');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page profile-page">
      <header className="page-header">
        <div>
          <h1>User Profile</h1>
          <p>Manage your account settings and security.</p>
        </div>
      </header>

      <div className="feature-layout">
        <div className="profile-info card">
          <div className="profile-avatar-large">
            <User size={64} />
          </div>
          <div className="profile-header-info">
            <h2>{user?.name}</h2>
            <p className="email"><Mail size={16} /> {user?.email}</p>
            <div className="roles-list" style={{ marginTop: '0.5rem' }}>
              {user?.roles?.map(role => (
                <span key={role} className="tag blue">{role}</span>
              ))}
              {user?.branch && <span className="tag" style={{ background: '#eef2f7', color: '#475569' }}>{user.branch}</span>}
              {user?.section && <span className="tag" style={{ background: '#eef2f7', color: '#475569' }}>Sec {user.section}</span>}
            </div>
          </div>
        </div>

        <div className="profile-actions feature-list-area">
          <div className="card feature-form" style={{ marginBottom: '1.5rem' }}>
            <h3>My Campus Activity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#475569' }}><Calendar size={16} /> Registered Events</h4>
                {activity.events.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                    {activity.events.map(e => <li key={e._id} style={{ marginBottom: '4px' }}>{e.title} ({new Date(e.date).toLocaleDateString()})</li>)}
                  </ul>
                ) : <p style={{ fontSize: '13px', color: '#64748b' }}>No upcoming events.</p>}
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#475569' }}><Users size={16} /> My Clubs</h4>
                {activity.clubs.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                    {activity.clubs.map(c => <li key={c._id} style={{ marginBottom: '4px' }}>{c.name} ({c.category})</li>)}
                  </ul>
                ) : <p style={{ fontSize: '13px', color: '#64748b' }}>Not a member of any clubs.</p>}
              </div>
            </div>
          </div>

          <form className="card feature-form" onSubmit={handleUpdateProfile}>
            <h3>Account Settings</h3>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Email Address (Cannot be changed)</label>
              <input type="email" value={formData.email} disabled />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Update Name'}
            </button>
          </form>

          <form className="card feature-form" onSubmit={handleChangePassword}>
            <h3>Security</h3>
            <p className="section-desc">Change your password regularly to keep your account secure.</p>
            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field-row">
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              <Shield size={18} /> {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>

          <div className="card feature-form" style={{ marginTop: '1.5rem', border: '1px solid #fee2e2' }}>
            <h3 style={{ color: '#ef4444' }}>Account Actions</h3>
            <p className="section-desc">Sign out of your Campus Hub account on this device.</p>
            <button
              className="btn-primary"
              style={{ background: '#ef4444', marginTop: '0.5rem' }}
              onClick={logout}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
