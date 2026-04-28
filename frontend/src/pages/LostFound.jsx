import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MapPin, Plus, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const emptyForm = { title: '', description: '', type: 'Lost', category: 'Electronics', location: '' };

const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: '', status: 'Active', category: '' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const canManageLostFound = hasPermission(user, 'manage_lost_found');

  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await api.get('/lost-found', { params });
        setItems(res.data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [params, refreshKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/lost-found', form);
      setForm(emptyForm);
      toast.success('Item posted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not post item');
    }
  };

  const claim = async (id) => {
    try {
      await api.post(`/lost-found/${id}/claim`, { message: 'I can identify this item.' });
      toast.success('Claim request sent');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Claim request failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/lost-found/${id}/status`, { status });
      toast.success('Item updated');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not update item');
    }
  };

  return (
    <div className="page feature-page">
      <header className="page-header">
        <div>
          <h1>Lost & Found</h1>
          <p>Track lost items, found items, claim requests, and status updates.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', type: '', status: 'Active', category: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <section className="feature-layout">
        <form className="feature-form card" onSubmit={handleSubmit}>
          <h2>Post item</h2>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="field-row">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['Lost', 'Found'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Electronics', 'Stationery', 'ID Cards', 'Clothing', 'Others'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button className="btn-primary" type="submit"><Plus size={18} />Post</button>
        </form>

        <div className="feature-list-area">
          <div className="resource-filters card">
            <div className="filter-search"><Search size={18} /><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search items" /></div>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Lost and found</option><option>Lost</option><option>Found</option></select>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{['Electronics', 'Stationery', 'ID Cards', 'Clothing', 'Others'].map((item) => <option key={item}>{item}</option>)}</select>
          </div>

          <section className="resource-list">
            {loading ? <div className="empty-state card">Loading items...</div> : items.length ? items.map((item) => (
              <article className="resource-card card" key={item._id}>
                <div className="resource-icon"><Search size={22} /></div>
                <div>
                  <span className="tag blue">{item.type}</span>
                  <h2>{item.title}</h2>
                  <p>{item.description || 'No description provided.'}</p>
                  <div className="resource-meta">
                    <span>{item.category}</span>
                    <span><MapPin size={13} /> {item.location || 'Location unknown'}</span>
                    <span>{item.status}</span>
                    <span>{item.claimRequests?.length || 0} claims</span>
                  </div>
                </div>
                <div className="card-actions">
                  {(canManageLostFound || item.postedBy?._id === user?.id) && (
                  <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)} aria-label={`Update ${item.title} status`}>
                    {['Active', 'Claimed', 'Expired'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                  )}
                  {item.status === 'Claimed' ? (
                    <span className="icon-link done" aria-label={`${item.title} claimed`}><CheckCircle size={18} /></span>
                  ) : (
                    <button className="icon-link" type="button" onClick={() => claim(item._id)} aria-label={`Claim ${item.title}`}><Plus size={18} /></button>
                  )}
                </div>
              </article>
            )) : <div className="empty-state card"><Search size={36} /><h2>No items found</h2><p>Post an item or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default LostFound;
