import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MapPin, Plus, RefreshCw, Search, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim request failed');
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

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/lost-found/${id}`);
      toast.success('Item deleted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleLog = async (id) => {
    if (expandedLogs[id]) {
      setExpandedLogs(prev => { const next = {...prev}; delete next[id]; return next; });
    } else {
      try {
        const res = await api.get(`/lost-found/${id}/log`);
        setExpandedLogs(prev => ({ ...prev, [id]: res.data }));
      } catch {
        toast.error('Failed to fetch activity log');
      }
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
                    <>
                      <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)} aria-label={`Update ${item.title} status`}>
                        {['Active', 'Claimed', 'Expired'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <button className="icon-btn delete" type="button" onClick={() => deleteItem(item._id)} aria-label={`Delete ${item.title}`}>
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {item.status === 'Claimed' ? (
                    <span className="icon-link done" aria-label={`${item.title} claimed`}><CheckCircle size={18} /></span>
                  ) : item.postedBy?._id === user?.id ? null : (
                    <button className="icon-link" type="button" onClick={() => claim(item._id)} aria-label={`Claim ${item.title}`}><Plus size={18} /></button>
                  )}
                  {canManageLostFound && (
                    <button className="icon-btn" type="button" onClick={() => toggleLog(item._id)} aria-label="View Activity Log">
                      {expandedLogs[item._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  )}
                </div>
                {expandedLogs[item._id] && (
                  <div className="activity-log-section" style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Activity Log</h4>
                    {expandedLogs[item._id].length === 0 ? <p style={{ fontSize: '13px' }}>No activity yet.</p> : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                        {expandedLogs[item._id].map((log, idx) => (
                          <li key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '4px', color: '#475569' }}>
                            <Clock size={14} style={{ marginTop: '2px' }} />
                            <span><strong>{log.action}</strong> by {log.performedBy?.name || 'Unknown'} at {new Date(log.timestamp).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            )) : <div className="empty-state card"><Search size={36} /><h2>No items found</h2><p>Post an item or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default LostFound;
