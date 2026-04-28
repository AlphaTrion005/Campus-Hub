import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { User, Mail, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile', { name: formData.name });
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
            <div className="roles-list">
              {user?.roles?.map(role => (
                <span key={role} className="tag blue">{role}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-actions feature-list-area">
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
