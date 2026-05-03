import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Activity, User, Clock } from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category) params.category = category;
        const res = await api.get('/admin/logs', { params });
        setLogs(res.data);
      } catch {
        toast.error('Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [category]);

  const getActionColor = (action) => {
    switch (action) {
      case 'USER_DELETE': return 'tag red';
      case 'USER_ROLE_UPDATE': return 'tag blue';
      default: return 'tag';
    }
  };

  return (
    <div className="page admin-logs">
      <header className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Track administrative actions and system changes.</p>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="">All Categories</option>
          {['User', 'Resource', 'Event', 'LostFound', 'Club', 'System', 'Other'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </header>

      <div className="logs-list-area card">
        {loading ? <p>Loading logs...</p> : logs.length === 0 ? <p>No logs found for this category.</p> : (
          <div className="audit-timeline">
            {logs.map(log => (
              <div key={log._id} className="audit-item">
                <div className="audit-icon">
                  <Activity size={18} />
                </div>
                <div className="audit-content">
                  <div className="audit-header">
                    <span className={getActionColor(log.action)}>{log.action}</span>
                    <span className="audit-time">
                      <Clock size={14} /> {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="audit-details">{log.details}</p>
                  <div className="audit-footer">
                    <span>
                      <User size={14} /> <strong>By:</strong> {log.performedBy?.name} ({log.performedBy?.email})
                    </span>
                    {log.targetUser && (
                      <span>
                        <User size={14} /> <strong>Target:</strong> {log.targetUser?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
