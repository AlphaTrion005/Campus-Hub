import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Plus, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const emptyForm = { title: '', description: '', category: '', isAnonymous: true };

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const canManageReports = hasPermission(user, 'manage_reports');

  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports', { params });
        setReports(res.data);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [params, refreshKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/reports', form);
      setForm(emptyForm);
      toast.success('Report submitted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not submit report');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/reports/${id}/status`, { status, comment: status === 'Resolved' ? 'Marked complete from dashboard.' : '' });
      toast.success('Report updated');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not update report');
    }
  };

  return (
    <div className="page feature-page">
      <header className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Submit issues, review status, and manage campus support queues.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', status: '', category: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <section className="feature-layout">
        <form className="feature-form card" onSubmit={handleSubmit}>
          <h2>Submit report</h2>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="checkbox-field">
            <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
            Submit anonymously
          </label>
          <button className="btn-primary" type="submit"><Plus size={18} />Submit</button>
        </form>

        <div className="feature-list-area">
          <div className="resource-filters card">
            <div className="filter-search"><Search size={18} /><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search reports" /></div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {['Pending', 'In Review', 'Resolved'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Category" />
          </div>

          <section className="resource-list">
            {loading ? <div className="empty-state card">Loading reports...</div> : reports.length ? reports.map((report) => (
              <article className={`resource-card card ${report.status === 'Resolved' ? 'is-complete' : ''}`} key={report._id}>
                <div className="resource-icon"><AlertCircle size={22} /></div>
                <div>
                  <span className="tag blue">{report.status}</span>
                  <h2>{report.title}</h2>
                  <p>{report.description}</p>
                  <div className="resource-meta">
                    <span>{report.category || 'General'}</span>
                    <span>{report.isAnonymous ? 'Anonymous' : report.submittedBy?.name || 'Submitted'}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {canManageReports && <div className="card-actions">
                  <select value={report.status} onChange={(e) => updateStatus(report._id, e.target.value)} aria-label={`Update ${report.title} status`}>
                    {['Pending', 'In Review', 'Resolved'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                  {report.status === 'Resolved' && <span className="icon-link done" aria-label={`${report.title} resolved`}><CheckCircle size={18} /></span>}
                </div>}
              </article>
            )) : <div className="empty-state card"><AlertCircle size={36} /><h2>No reports found</h2><p>Submit a report or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default Reports;
