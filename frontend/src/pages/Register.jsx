import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { UserPlus, FileUp, ShieldAlert } from 'lucide-react';
import { ROLES, canAssignRole } from '../utils/roles';

const Register = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['Student']
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if current user is authorized to register others
  const isAuthorized = user && (user.roles.includes('Admin') || user.roles.includes('Developer') || user.roles.includes('Sub-admin'));
  const assignableRoles = ROLES.filter((role) => canAssignRole(user?.roles || [], role));

  if (!isAuthorized) {
    return (
      <div className="auth-container">
        <div className="auth-card card">
          <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p>Only administrators or developers can register new accounts.</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleToggle = (role) => {
    setFormData((current) => {
      const hasRole = current.roles.includes(role);
      const nextRoles = hasRole ? current.roles.filter((item) => item !== role) : [...current.roles, role];
      return { ...current, roles: nextRoles.length ? nextRoles : ['Student'] };
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        roles: formData.roles
      };
      await api.post('/auth/register', data);
      toast.success('User registered successfully!');
      setFormData({ name: '', email: '', password: '', roles: ['Student'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an Excel file');
    
    setLoading(true);
    const bulkData = new FormData();
    bulkData.append('file', file);

    try {
      const res = await api.post('/auth/bulk-register', bulkData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { results } = res.data;
      toast.success(`Bulk register complete: ${results.success} success, ${results.failed} failed`);
      if (results.errors.length > 0) {
        console.warn('Bulk registration errors:', results.errors);
      }
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ padding: '2rem' }}>
      <div className="auth-card card" style={{ maxWidth: '600px' }}>
        <h2>Registration Management</h2>
        <p>Create new campus accounts individually or in bulk</p>

        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <UserPlus size={18} /> Single User
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            <FileUp size={18} /> Bulk Import (Excel)
          </button>
        </div>

        {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Roles</label>
              <div className="role-grid">
                {assignableRoles.map((role) => (
                  <label className="checkbox-field" key={role}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Register User'}
            </button>
          </form>
        ) : (
          <div className="bulk-upload-section">
            <div className="info-box">
              <p>Upload an Excel file (.xlsx) with columns: <strong>name, email, password, roles</strong></p>
              <small>(roles can be comma-separated for multiple roles)</small>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="file-input-wrapper">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading || !file}>
                {loading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
