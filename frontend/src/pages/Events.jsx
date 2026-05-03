import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, MapPin, Plus, RefreshCw, Search, Users, Trash2, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const emptyForm = {
  title: '',
  description: '',
  venue: '',
  date: '',
  time: '',
  organizer: '',
  category: 'Academic',
  capacity: '',
};

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const canManageEvents = hasPermission(user, 'manage_events');

  const params = useMemo(() => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  ), [filters]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/events', { params });
        setEvents(res.data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [params, refreshKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/events', { ...form, capacity: form.capacity || undefined });
      setForm(emptyForm);
      toast.success('Event created');
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create event');
    }
  };

  const register = async (id) => {
    try {
      await api.post(`/events/${id}/register`);
      toast.success('Registered for event');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Registration failed');
    }
  };

  const withdraw = async (id) => {
    try {
      await api.delete(`/events/${id}/register`);
      toast.success('Withdrawn from event');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Withdraw failed');
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/events/${id}/status`, { status });
      toast.success('Event updated');
      setRefreshKey((current) => current + 1);
    } catch {
      toast.error('Could not update event');
    }
  };

  return (
    <div className="page feature-page">
      <header className="page-header">
        <div>
          <h1>Events</h1>
          <p>Plan campus events, registrations, and attendance workflows.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', status: '', category: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <section className={`feature-layout ${canManageEvents ? '' : 'single-column'}`}>
        {canManageEvents && <form className="feature-form card" onSubmit={handleSubmit}>
          <h2>Create event</h2>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="field-row">
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <input required placeholder="Organizer" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
          <div className="field-row">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Academic', 'Cultural', 'Sports', 'Technical', 'Other'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <button className="btn-primary" type="submit">
            <Plus size={18} />
            Create
          </button>
        </form>}

        <div className="feature-list-area">
          <div className="resource-filters card">
            <div className="filter-search">
              <Search size={18} />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search events" />
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All categories</option>
              {['Academic', 'Cultural', 'Sports', 'Technical', 'Other'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <section className="resource-list">
            {loading ? <div className="empty-state card">Loading events...</div> : events.length ? events.map((item) => (
              <article className="resource-card card" key={item._id}>
                <div className="resource-icon"><Calendar size={22} /></div>
                <div>
                  <span className="tag blue">{item.category || 'Event'}</span>
                  <h2>{item.title}</h2>
                  <p>{item.description || 'No description provided.'}</p>
                  <div className="resource-meta">
                    <span><MapPin size={13} /> {item.venue || 'Venue TBA'}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span><Users size={13} /> {item.registeredStudents?.length || 0}{item.capacity ? `/${item.capacity}` : ''}</span>
                    <span>{item.status}</span>
                  </div>
                </div>
                <div className="card-actions">
                  {canManageEvents && (
                    <>
                      <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)} aria-label={`Update ${item.title} status`}>
                        {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <button className="icon-btn delete" type="button" onClick={() => deleteEvent(item._id)} aria-label={`Delete ${item.title}`}>
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {item.status === 'Completed' || item.status === 'Cancelled' ? (
                    <span className="icon-link done" aria-label={`${item.title} ${item.status}`}><CheckCircle size={18} /></span>
                  ) : item.registeredStudents?.includes(user?.id) ? (
                    <button className="icon-link" type="button" onClick={() => withdraw(item._id)} aria-label={`Withdraw from ${item.title}`}>
                      <Minus size={18} />
                    </button>
                  ) : (
                    <button className="icon-link" type="button" onClick={() => register(item._id)} aria-label={`Register for ${item.title}`}>
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </article>
            )) : <div className="empty-state card"><Calendar size={36} /><h2>No events found</h2><p>Create an event or adjust filters.</p></div>}
          </section>
        </div>
      </section>
    </div>
  );
};

export default Events;
