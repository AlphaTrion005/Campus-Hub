import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Globe, Save, Building, Plus, Settings } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const AdminSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ name: '', domain: '', settings: { maintenanceMode: false, allowRegistrations: true, allowGuestView: false } });
  const [saving, setSaving] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', domain: '' });
  const [creating, setCreating] = useState(false);
  const isDeveloper = user?.roles?.includes('Developer');

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

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/colleges', newCollege);
      toast.success('College created successfully');
      setNewCollege({ name: '', domain: '' });
    } catch {
      toast.error('Failed to create college');
    } finally {
      setCreating(false);
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

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={18} /> Feature Toggles</h3>

          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={settings.settings?.maintenanceMode || false}
              onChange={(e) => setSettings({ ...settings, settings: { ...settings.settings, maintenanceMode: e.target.checked } })}
              id="maintenanceMode"
            />
            <label htmlFor="maintenanceMode" style={{ marginBottom: 0 }}>Maintenance Mode (Disables login for non-admins)</label>
          </div>

          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={settings.settings?.allowRegistrations ?? true}
              onChange={(e) => setSettings({ ...settings, settings: { ...settings.settings, allowRegistrations: e.target.checked } })}
              id="allowRegistrations"
            />
            <label htmlFor="allowRegistrations" style={{ marginBottom: 0 }}>Allow New Registrations</label>
          </div>

          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={settings.settings?.allowGuestView || false}
              onChange={(e) => setSettings({ ...settings, settings: { ...settings.settings, allowGuestView: e.target.checked } })}
              id="allowGuestView"
            />
            <label htmlFor="allowGuestView" style={{ marginBottom: 0 }}>Allow Guest View (Public access without login)</label>
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {isDeveloper && (
          <form className="card feature-form max-w-2xl" onSubmit={handleCreateCollege} style={{ marginTop: '2rem', border: '1px solid #c084fc' }}>
            <h3 style={{ color: '#9333ea' }}>Developer: Create New College Instance</h3>
            <p className="section-desc">Provision a new campus environment.</p>

            <div className="input-group">
              <label>College Name</label>
              <input
                type="text"
                value={newCollege.name}
                onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>College Domain</label>
              <input
                type="text"
                value={newCollege.domain}
                onChange={(e) => setNewCollege({ ...newCollege, domain: e.target.value })}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={creating} style={{ background: '#9333ea' }}>
              <Plus size={18} /> {creating ? 'Creating...' : 'Create Instance'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
