import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', description: '', project: '', severity: 'Medium', priority: 'Medium', environment: '', status: 'Open', assignedTo: '', dueDate: '' };

export default function Bugs() {
  const [bugs, setBugs] = useState([]);
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingBug, setEditingBug] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [bugResponse, projectResponse, userResponse] = await Promise.all([API.get(`/bugs?search=${encodeURIComponent(search)}`), API.get('/projects'), API.get('/users')]);
      setBugs(bugResponse.data.bugs || []);
      setProjects(projectResponse.data.projects || []);
      setUsers(userResponse.data.users || []);
    } catch (error) { console.error(error); }
  };
  useEffect(() => { loadData(); }, []);

  const reset = () => { setForm(emptyForm); setEditingBug(null); };
  const openEdit = (bug) => {
    setEditingBug(bug);
    setForm({
      title: bug.title || '', description: bug.description || '', project: bug.project?._id || bug.project || '', severity: bug.severity || 'Medium', priority: bug.priority || 'Medium',
      environment: bug.environment || '', status: bug.status || 'Open', assignedTo: bug.assignedTo?._id || bug.assignedTo || '', dueDate: bug.dueDate ? String(bug.dueDate).slice(0, 10) : ''
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.description || !form.project) return alert('Title, description and project are required.');
    try {
      setLoading(true);
      if (editingBug) {
        await API.put(`/bugs/${editingBug._id}`, { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null });
      } else {
        await API.post('/bugs', { ...form, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined });
      }
      reset();
      await loadData();
    } catch (error) { alert(error.response?.data?.message || `Unable to ${editingBug ? 'update' : 'report'} bug.`); }
    finally { setLoading(false); }
  };

  const deleteBug = async (id) => {
    if (!window.confirm('Delete this bug?')) return;
    try { await API.delete(`/bugs/${id}`); await loadData(); }
    catch (error) { alert(error.response?.data?.message || 'Unable to delete bug.'); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Bugs</h1><p>Track, prioritize and resolve software defects.</p></div></div>
      <section className="panel form-panel">
        <div className="panel-header"><div><h2>{editingBug ? 'Edit Bug' : 'Report Bug'}</h2><p>{editingBug ? 'Update defect details and workflow state.' : 'Create a new software defect.'}</p></div>{editingBug ? <button className="icon-button" onClick={reset}><FiX size={18} /></button> : <FiPlus size={21} />}</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>Bug title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Project<select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} disabled={Boolean(editingBug)} required><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
            <label>Severity<select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option><option>Reopened</option></select></label>
            <label>Assigned To<select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Unassigned</option>{users.filter((user) => user.role === 'Developer').map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}</select></label>
            <label>Due Date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
            <label>Environment<input value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="Production" /></label>
            <label className="full-width">Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
                      </div>
          <div className="form-actions">{editingBug && <button type="button" className="secondary-button" onClick={reset}>Cancel</button>}<button className="primary-button" type="submit" disabled={loading}><FiPlus size={17} />{loading ? 'Saving...' : editingBug ? 'Save Changes' : 'Report Bug'}</button></div>
        </form>
      </section>

      <section className="panel filter-bar"><FiSearch size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} placeholder="Search bugs..." /><button className="secondary-button" onClick={loadData}>Search</button></section>

      <div className="bug-list">
        {bugs.map((bug) => (
          <article className="bug-card" key={bug._id}>
            <div className="bug-card-icon"><FiAlertTriangle size={20} /></div>
            <div className="bug-card-main">
              <div className="bug-card-heading"><h2>{bug.title}</h2><span className="status-badge">{bug.status}</span></div>
              <p>{bug.description}</p>
              <div className="bug-meta"><span>Severity: <strong>{bug.severity}</strong></span><span>Priority: <strong>{bug.priority}</strong></span>{bug.environment && <span>Environment: <strong>{bug.environment}</strong></span>}</div>
              <div className="project-card-actions">{(user?.role === 'Admin' || user?.role === 'Project Manager' || bug.reportedBy?._id === user?.id || bug.assignedTo?._id === user?.id) && <button className="secondary-button small" onClick={() => openEdit(bug)}><FiEdit2 size={14} />Edit</button>}{(user?.role === 'Admin' || user?.role === 'Project Manager') && <button className="danger-button small" onClick={() => deleteBug(bug._id)}><FiTrash2 size={14} />Delete</button>}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
