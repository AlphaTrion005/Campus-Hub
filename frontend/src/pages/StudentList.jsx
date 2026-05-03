import { useEffect, useState } from 'react';
import { Search, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const StudentList = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', branch: '', section: '' });

  const canManageResources = hasPermission(user, 'manage_resources');

  useEffect(() => {
    if (!canManageResources) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.branch) params.branch = filters.branch;
        if (filters.section) params.section = filters.section;

        const res = await api.get('/students', { params });
        setStudents(res.data);
      } catch {
        toast.error('Failed to fetch students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filters, canManageResources]);

  if (!canManageResources) {
    return <div className="page"><h2>Access Denied</h2><p>You do not have permission to view the student list.</p></div>;
  }

  return (
    <div className="page student-list-page">
      <header className="page-header">
        <div>
          <h1>Student Directory</h1>
          <p>View students grouped by branch and section.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', branch: '', section: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <div className="feature-list-area">
        <section className="resource-filters card">
          <div className="filter-search">
            <Search size={18} />
            <input 
              value={filters.search} 
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
              placeholder="Search name or email" 
            />
          </div>
          <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
            <option value="">All Branches</option>
            {['CSE', 'ECE', 'CSM'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
            <option value="">All Sections</option>
            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </section>

        <section className="student-table-container card">
          {loading ? (
            <p>Loading students...</p>
          ) : students.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} />
                        {student.name}
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td><span className="tag blue">{student.branch || 'N/A'}</span></td>
                    <td><span className="tag">{student.section || 'N/A'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Users size={36} />
              <h2>No students found</h2>
              <p>Adjust your filters to see more results.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentList;
