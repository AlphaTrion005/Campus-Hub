import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Search, Upload, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../utils/roles';

const resourceTypes = ['All', 'Timetable', 'Exam Schedule', 'Note', 'Assignment', 'Writing Material', 'Previous Paper'];
const uploadTypes = resourceTypes.filter((type) => type !== 'All');
const classRepUploadTypes = ['Note', 'Writing Material'];
const fileBaseUrl = 'http://localhost:5000';
const emptyUploadForm = {
  title: '',
  description: '',
  type: 'Note',
  subject: '',
  semester: '',
  branch: '',
  section: '',
  year: '',
};

const Resources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: 'All', subject: '', semester: '', branch: '', section: '', year: '' });
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [file, setFile] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const canManageResources = hasPermission(user, 'manage_resources');
  const canUploadClassResources = hasPermission(user, 'upload_class_resources');
  const canUpload = canManageResources || canUploadClassResources;
  const allowedUploadTypes = canManageResources ? uploadTypes : classRepUploadTypes;

  const queryParams = useMemo(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.type !== 'All') params.type = filters.type;
    if (filters.subject) params.subject = filters.subject;
    if (filters.semester) params.semester = filters.semester;
    if (filters.branch) params.branch = filters.branch;
    if (filters.section) params.section = filters.section;
    if (filters.year) params.year = filters.year;
    return params;
  }, [filters]);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get('/resources', { params: queryParams });
        setResources(res.data);
      } catch {
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [queryParams, refreshKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleUploadChange = (event) => {
    const { name, value } = event.target;
    setUploadForm((current) => ({ ...current, [name]: value }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    Object.entries(uploadForm).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    if (file) formData.append('file', file);

    try {
      if (editingResource) {
        await api.put(`/resources/${editingResource._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Resource updated (new version)');
        setEditingResource(null);
      } else {
        await api.post('/resources', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Resource uploaded');
      }
      setUploadForm(emptyUploadForm);
      setFile(null);
      event.target.reset();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || (editingResource ? 'Update failed' : 'Upload failed'));
    }
  };

  const startEdit = (resource) => {
    setEditingResource(resource);
    setUploadForm({
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'Note',
      subject: resource.subject || '',
      semester: resource.semester || '',
      branch: resource.branch || '',
      section: resource.section || '',
      year: resource.year || '',
    });
    setFile(null);
  };

  const cancelEdit = () => {
    setEditingResource(null);
    setUploadForm(emptyUploadForm);
    setFile(null);
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/resources/${resourceId}`);
      toast.success('Resource deleted');
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const canDeleteResource = (resource) => {
    return canManageResources || resource.uploadedBy?._id === user?.id;
  };

  return (
    <div className="page resources-page">
      <header className="page-header">
        <div>
          <h1>Resources</h1>
          <p>Find timetables, notes, assignments, schedules, and previous papers.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => setFilters({ search: '', type: 'All', subject: '', semester: '', branch: '', section: '', year: '' })}>
          <RefreshCw size={18} />
          Reset
        </button>
      </header>

      <section className={`feature-layout ${canUpload ? '' : 'single-column'}`}>
        {canUpload && (
          <form className="feature-form card" onSubmit={handleUpload}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingResource ? 'Update resource' : 'Upload resource'}</h2>
              {editingResource && (
                <button type="button" className="icon-btn" onClick={cancelEdit}>
                  <X size={20} />
                </button>
              )}
            </div>
            <input required name="title" value={uploadForm.title} onChange={handleUploadChange} placeholder="Title" />
            <textarea name="description" value={uploadForm.description} onChange={handleUploadChange} placeholder="Description" />
            <div className="field-row">
              <select name="type" value={uploadForm.type} onChange={handleUploadChange}>
                {allowedUploadTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input name="semester" value={uploadForm.semester} onChange={handleUploadChange} placeholder="Semester" />
            </div>
            <div className="field-row">
              <input name="branch" value={uploadForm.branch} onChange={handleUploadChange} placeholder="Branch" />
              <input name="section" value={uploadForm.section} onChange={handleUploadChange} placeholder="Section" />
            </div>
            <input name="year" value={uploadForm.year} onChange={handleUploadChange} placeholder="Year" />
            <input name="subject" value={uploadForm.subject} onChange={handleUploadChange} placeholder="Subject" />

            {editingResource && <small className="field-hint">Upload a new file to increment the version, or leave blank to only update details.</small>}
            <input type={editingResource ? "file" : "file"} required={!editingResource} onChange={(event) => setFile(event.target.files[0] || null)} />

            <button className="btn-primary" type="submit">
              {editingResource ? <Edit2 size={18} /> : <Upload size={18} />}
              {editingResource ? 'Update Version' : 'Upload'}
            </button>
          </form>
        )}

        <div className="feature-list-area">
          <section className="resource-filters card">
            <div className="filter-search">
              <Search size={18} />
              <input name="search" value={filters.search} onChange={handleChange} placeholder="Search by title or description" />
            </div>
            <select name="type" value={filters.type} onChange={handleChange}>
              {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input name="subject" value={filters.subject} onChange={handleChange} placeholder="Subject" />
            <input name="semester" value={filters.semester} onChange={handleChange} placeholder="Semester" />
            <input name="branch" value={filters.branch} onChange={handleChange} placeholder="Branch" />
            <input name="section" value={filters.section} onChange={handleChange} placeholder="Section" />
            <input name="year" value={filters.year} onChange={handleChange} placeholder="Year" />
          </section>

          <section className="resource-list">
            {loading ? (
              <div className="empty-state card">Loading resources...</div>
            ) : resources.length > 0 ? (
              resources.map((resource) => (
                <article className="resource-card card" key={resource._id}>
                  <div className="resource-icon">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="tag blue">{resource.type}</span>
                    <h2>{resource.title}</h2>
                    <p>{resource.description || 'No description provided.'}</p>
                    <div className="resource-meta">
                      <span>{resource.subject || 'General'}</span>
                      <span>Semester {resource.semester || 'All'}</span>
                      <span>{resource.branch || 'All branches'}</span>
                      <span>Section {resource.section || 'All'}</span>
                      <span>Year {resource.year || 'All'}</span>
                      <span>v{resource.version || 1}</span>
                    </div>
                  </div>
                  <div className="resource-actions">
                    {resource.fileUrl && (
                      <a className="icon-link" href={`${fileBaseUrl}${resource.fileUrl}`} target="_blank" rel="noreferrer" aria-label={`Open ${resource.title}`}>
                        <Download size={18} />
                      </a>
                    )}
                    {canDeleteResource(resource) && (
                      <>
                        <button className="icon-btn" onClick={() => startEdit(resource)} title="Edit resource">
                          <Edit2 size={18} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(resource._id)} title="Delete resource">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state card">
                <FileText size={36} />
                <h2>No resources found</h2>
                <p>{canUpload ? 'Upload a resource or adjust filters.' : 'Try adjusting the filters.'}</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};

export default Resources;
