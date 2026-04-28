import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/useAuth';
import { Calendar as CalendarIcon, Check, Clock, Edit2, Plus, Trash2, X } from 'lucide-react';

const scheduleManagers = ['Developer', 'Admin', 'Sub-admin'];

const formatDateInput = (value) => {
  const date = value ? new Date(value) : new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatTimeInput = (value) => {
  if (!value) return '';
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const emptyForm = (date = new Date()) => ({
  type: 'Event',
  title: '',
  date: formatDateInput(date),
  time: '',
  description: '',
  subject: '',
  venue: '',
});

const Schedule = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const canManageSchedule = user?.roles?.some((role) => scheduleManagers.includes(role));

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await api.get('/schedule');
        setItems(res.data);
      } catch {
        console.error('Failed to fetch schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [refreshKey]);

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    if (!editingItem) {
      setForm((current) => ({ ...current, date: formatDateInput(nextDate) }));
    }
  };

  // Filter items for the selected date
  const selectedItems = items.filter(item => 
    new Date(item.date).toDateString() === date.toDateString()
  );

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayItems = items.filter(item => 
        new Date(item.date).toDateString() === date.toDateString()
      );
      if (dayItems.length > 0) {
        return (
          <div className="dot-container">
            {dayItems.slice(0, 3).map((item, i) => (
              <div key={i} className="dot" style={{ backgroundColor: item.color }}></div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setEditingItem(null);
    setForm(emptyForm(date));
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      type: item.type,
      title: item.title || '',
      date: formatDateInput(item.date),
      time: formatTimeInput(item.time || item.date),
      description: item.description || '',
      subject: item.subject || '',
      venue: item.venue || '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/schedule/${editingItem.type}/${editingItem.id}`, form);
        toast.success('Schedule item updated');
      } else {
        await api.post('/schedule', form);
        toast.success('Schedule item added');
      }
      resetForm();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save schedule item');
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}" from the campus schedule?`)) return;
    try {
      await api.delete(`/schedule/${item.type}/${item.id}`);
      toast.success('Schedule item deleted');
      if (editingItem?.id === item.id && editingItem?.type === item.type) resetForm();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete schedule item');
    }
  };

  return (
    <div className="schedule-container card">
      <div className="schedule-header">
        <CalendarIcon size={24} />
        <h3>Campus Schedule</h3>
      </div>

      {canManageSchedule && (
        <form className="schedule-editor" onSubmit={handleSubmit}>
          <div className="field-row">
            <select name="type" value={form.type} onChange={handleFormChange} disabled={Boolean(editingItem)}>
              {['Event', 'Assignment', 'Test'].map((type) => <option key={type}>{type}</option>)}
            </select>
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="Title" required />
          </div>
          <div className="field-row">
            <input name="date" type="date" value={form.date} onChange={handleFormChange} required />
            <input name="time" type="time" value={form.time} onChange={handleFormChange} />
          </div>
          <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description" />
          <div className="field-row">
            <input name="subject" value={form.subject} onChange={handleFormChange} placeholder="Subject" />
            <input name="venue" value={form.venue} onChange={handleFormChange} placeholder="Venue" />
          </div>
          <div className="schedule-editor-actions">
            <button className="btn-primary" type="submit">
              {editingItem ? <Check size={18} /> : <Plus size={18} />}
              {editingItem ? 'Update' : 'Add'}
            </button>
            {editingItem && (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      
      <div className="schedule-content">
        <div className="calendar-wrapper">
          <Calendar 
            onChange={handleDateChange} 
            value={date} 
            tileContent={tileContent}
          />
        </div>

        <div className="day-details">
          <h4>{date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
          <div className="items-list">
            {loading ? <p>Loading schedule...</p> : 
             selectedItems.length > 0 ? (
               selectedItems.map((item) => (
                 <div key={`${item.type}-${item.id}`} className="schedule-item" style={{ borderLeftColor: item.color }}>
                   <div className="item-info">
                     <span className="item-type" style={{ color: item.color }}>{item.type}</span>
                     <h5>{item.title}</h5>
                     {item.description && <p>{item.description}</p>}
                     <div className="item-time">
                       <Clock size={14} /> 
                       <span>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                   </div>
                   {canManageSchedule && (
                     <div className="schedule-item-actions">
                       <button className="icon-btn" type="button" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}>
                         <Edit2 size={16} />
                       </button>
                       <button className="icon-btn delete" type="button" onClick={() => deleteItem(item)} aria-label={`Delete ${item.title}`}>
                         <Trash2 size={16} />
                       </button>
                     </div>
                   )}
                 </div>
               ))
             ) : (
               <p className="no-items">No events or deadlines for this day.</p>
             )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
