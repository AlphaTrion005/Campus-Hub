import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Users } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const canManageClub = hasPermission(user, 'manage_own_club');
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
      await api.post('/clubs', form);
      setForm(emptyForm);
      toast.success('Club created');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not create club');
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

      <section className={`feature-layout ${canManageClub ? '' : 'single-column'}`}>
        {canManageClub && <form className="feature-form card" onSubmit={handleSubmit}>
          <h2>Create club</h2>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea placeholder="Requirements" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <button className="btn-primary" type="submit"><Plus size={18} />Create</button>
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
                <button className="icon-link" type="button" onClick={() => apply(club._id)} aria-label={`Apply to ${club.name}`}><Plus size={18} /></button>
              </article>
            )) : <div className="empty-state card"><Users size={36} /><h2>No clubs found</h2><p>Create a club or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default Clubs;
