import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { User, Trash2, Search, Filter, Edit2, X, Check } from 'lucide-react';
import { ROLES, canAssignRole } from '../utils/roles';
import { useAuth } from '../context/useAuth';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', branch: '', section: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch {
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshKey]);

  const handleUpdateRole = async (userId, newRoles) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { roles: newRoles });
      toast.success('User roles updated');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Failed to update roles');
    }
  };

  const handleStartEdit = (user) => {
    setEditingUser(user._id);
    setEditFormData({ name: user.name, email: user.email, branch: user.branch || '', section: user.section || '' });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSaveEdit = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}`, editFormData);
      toast.success('User updated successfully');
      setEditingUser(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page admin-users">
      <header className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Control access, assign roles, and manage campus members.</p>
        </div>
      </header>

      <div className="admin-controls card">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="user-list card">
        {loading ? <p>Loading users...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Academic</th>
                <th>Roles</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td>
                    {editingUser === u._id ? (
                      <div className="edit-user-form">
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          placeholder="Name"
                        />
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <div className="user-info-cell">
                        <div className="user-avatar-small"><User size={16} /></div>
                        <div>
                          <div className="user-name">{u.name}</div>
                          <div className="user-email">{u.email}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingUser === u._id && u.roles.some(r => !['Admin', 'Developer'].includes(r)) ? (
                      <div className="edit-user-form" style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                        <select
                          value={editFormData.branch}
                          onChange={(e) => setEditFormData({...editFormData, branch: e.target.value})}
                          className="admin-select"
                        >
                          <option value="">No Branch</option>
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="CSM">CSM</option>
                        </select>
                        <select
                          value={editFormData.section}
                          onChange={(e) => setEditFormData({...editFormData, section: e.target.value})}
                          className="admin-select"
                        >
                          <option value="">No Section</option>
                          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                            <option key={char} value={char}>{char}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      u.roles.some(r => !['Admin', 'Developer'].includes(r)) && (u.branch || u.section) ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {u.branch && <span className="tag blue">{u.branch}</span>}
                          {u.section && <span className="tag blue">Sec {u.section}</span>}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div className="roles-container">
                      {ROLES.map(role => (
                        <label key={role} className={`role-checkbox ${!canAssignRole(currentUser?.roles, role) ? 'disabled' : ''}`}>
                          <input
                            type="checkbox"
                            checked={u.roles.includes(role)}
                            disabled={!canAssignRole(currentUser?.roles, role)}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...u.roles, role]
                                : u.roles.filter(r => r !== role);
                              handleUpdateRole(u._id, newRoles);
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="row-actions">
                      {editingUser === u._id ? (
                        <>
                          <button className="icon-btn save" onClick={() => handleSaveEdit(u._id)}>
                            <Check size={18} />
                          </button>
                          <button className="icon-btn cancel" onClick={handleCancelEdit}>
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="icon-btn edit" onClick={() => handleStartEdit(u)}>
                            <Edit2 size={18} />
                          </button>
                          {u._id !== currentUser?.id && (
                            <button className="icon-btn delete" onClick={() => handleDeleteUser(u._id)}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
