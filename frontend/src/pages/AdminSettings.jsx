import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Globe, Save, Building } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({ name: '', domain: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        setSettings(res.data);
      } catch {
        toast.error('Failed to fetch college settings');
      }
    };

    fetchSettings();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page admin-settings">
      <header className="page-header">
        <div>
          <h1>College Settings</h1>
          <p>Manage global configuration for your campus instance.</p>
        </div>
      </header>

      <div className="feature-layout single-column">
        <form className="card feature-form max-w-2xl" onSubmit={handleUpdate}>
          <h3>General Configuration</h3>
          <p className="section-desc">Update the basic identity of your campus application.</p>
          
          <div className="input-group">
            <label><Building size={16} /> College Name</label>
            <input 
              type="text" 
              value={settings.name} 
              onChange={(e) => setSettings({ ...settings, name: e.target.value })} 
              required 
              placeholder="e.g., Harvard University"
            />
          </div>

          <div className="input-group">
            <label><Globe size={16} /> College Domain</label>
            <input 
              type="text" 
              value={settings.domain} 
              onChange={(e) => setSettings({ ...settings, domain: e.target.value })} 
              required 
              placeholder="e.g., harvard.edu"
            />
            <small className="field-hint">This domain is used for email validation and scope during registration.</small>
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
