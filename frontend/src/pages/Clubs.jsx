import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Users, Trash2, Edit2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const emptyForm = { name: '', description: '', category: '', requirements: '' };

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingClub, setEditingClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const canCreateClub = hasPermission(user, 'manage_own_club');
  const canManageAnyClub = hasPermission(user, 'manage_club_applications');
  const [refreshKey, setRefreshKey] = useState(0);

  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/clubs', { params });
        setClubs(res.data);
      } catch {
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [params, refreshKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingClub) {
        await api.put(`/clubs/${editingClub._id}`, form);
        toast.success('Club updated');
        setEditingClub(null);
      } else {
        await api.post('/clubs', form);
        toast.success('Club created');
      }
      setForm(emptyForm);
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Operation failed');
    }
  };

  const deleteClub = async (id) => {
    if (!window.confirm('Delete this club?')) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Club deleted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Failed to delete club');
    }
  };

  const startEdit = (club) => {
    setEditingClub(club);
    setForm({
      name: club.name || '',
      description: club.description || '',
      category: club.category || '',
      requirements: club.requirements || '',
    });
  };

  const cancelEdit = () => {
    setEditingClub(null);
    setForm(emptyForm);
  };

  const [expandedClubs, setExpandedClubs] = useState({});

  const toggleDetails = async (id) => {
    if (expandedClubs[id]) {
      setExpandedClubs(prev => { const next = {...prev}; delete next[id]; return next; });
    } else {
      try {
        const [membersRes, eventsRes] = await Promise.all([
          api.get(`/clubs/${id}/members`),
          api.get(`/clubs/${id}/events`)
        ]);
        setExpandedClubs(prev => ({ ...prev, [id]: { members: membersRes.data, events: eventsRes.data } }));
      } catch {
        toast.error('Failed to fetch club details');
      }
    }
  };

  const apply = async (id) => {
    try {
      await api.post(`/clubs/${id}/apply`);
      toast.success('Application sent');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Application failed');
    }
  };

  return (
    <div className="page feature-page">
      <header className="page-header">
        <div>
          <h1>Clubs</h1>
          <p>Discover clubs, manage applications, and coordinate members.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', category: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <section className={`feature-layout ${canCreateClub ? '' : 'single-column'}`}>
        {canCreateClub && <form className="feature-form card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingClub ? 'Edit club' : 'Create club'}</h2>
            {editingClub && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea placeholder="Requirements" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <button className="btn-primary" type="submit">
            {editingClub ? <Edit2 size={18} /> : <Plus size={18} />}
            {editingClub ? 'Update' : 'Create'}
          </button>
        </form>}

        <div className="feature-list-area">
          <div className="resource-filters card">
            <div className="filter-search"><Search size={18} /><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search clubs" /></div>
            <input value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Category" />
          </div>

          <section className="resource-list">
            {loading ? <div className="empty-state card">Loading clubs...</div> : clubs.length ? clubs.map((club) => (
              <article className="resource-card card" key={club._id}>
                <div className="resource-icon"><Users size={22} /></div>
                <div>
                  <span className="tag blue">{club.category || 'Club'}</span>
                  <h2>{club.name}</h2>
                  <p>{club.description || 'No description provided.'}</p>
                  <div className="resource-meta">
                    <span>{club.members?.length || 0} members</span>
                    <span>{club.applications?.length || 0} applications</span>
                    <span>{club.clubHead?.name || 'Head TBA'}</span>
                  </div>
                </div>
                <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                  {(canManageAnyClub || club.clubHead?._id === user?.id) && (
                    <>
                      <button className="icon-btn" type="button" onClick={() => startEdit(club)} aria-label={`Edit ${club.name}`}><Edit2 size={18} /></button>
                      <button className="icon-btn delete" type="button" onClick={() => deleteClub(club._id)} aria-label={`Delete ${club.name}`}><Trash2 size={18} /></button>
                    </>
                  )}
                  <button className="icon-btn" type="button" onClick={() => apply(club._id)} aria-label={`Apply to ${club.name}`}><Plus size={18} /></button>
                  <button className="icon-btn" type="button" onClick={() => toggleDetails(club._id)} aria-label="View Details">
                    {expandedClubs[club._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {expandedClubs[club._id] && (
                  <div className="club-details-section" style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> Members</h4>
                      {expandedClubs[club._id].members.length === 0 ? <p style={{ fontSize: '13px' }}>No members found.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                          {expandedClubs[club._id].members.map(m => (
                            <li key={m._id} style={{ marginBottom: '4px', color: '#475569' }}>{m.name} ({m.branch || 'N/A'})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Events</h4>
                      {expandedClubs[club._id].events.length === 0 ? <p style={{ fontSize: '13px' }}>No events found.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                          {expandedClubs[club._id].events.map(e => (
                            <li key={e._id} style={{ marginBottom: '4px', color: '#475569' }}>{e.title} - {new Date(e.date).toLocaleDateString()}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )) : <div className="empty-state card"><Users size={36} /><h2>No clubs found</h2><p>Create a club or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default Clubs;
