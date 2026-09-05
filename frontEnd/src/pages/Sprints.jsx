import { useEffect, useState } from 'react';
import { FiCalendar, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', goal: '', project: '', startDate: '', endDate: '', status: 'Planning' };

export default function Sprints() {
  const [sprints, setSprints] = useState([]);
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSprint, setEditingSprint] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [sprintResponse, projectResponse] = await Promise.all([API.get('/sprints'), API.get('/projects')]);
      setSprints(sprintResponse.data.sprints || []);
      setProjects(projectResponse.data.projects || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadData(); }, []);

  const reset = () => { setForm(emptyForm); setEditingSprint(null); };

  const openEdit = (sprint) => {
    setEditingSprint(sprint);
    setForm({
      name: sprint.name || '',
      goal: sprint.goal || '',
      project: sprint.project?._id || sprint.project || '',
      startDate: sprint.startDate ? String(sprint.startDate).slice(0, 10) : '',
      endDate: sprint.endDate ? String(sprint.endDate).slice(0, 10) : '',
      status: sprint.status || 'Planning'
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.project || !form.startDate || !form.endDate) return alert('Please fill all required fields.');
    try {
      setLoading(true);
      if (editingSprint) {
        await API.put(`/sprints/${editingSprint._id}`, { name: form.name, goal: form.goal, startDate: form.startDate, endDate: form.endDate, status: form.status });
      } else {
        await API.post('/sprints', form);
      }
      reset();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || `Unable to ${editingSprint ? 'update' : 'create'} sprint.`);
    } finally { setLoading(false); }
  };

  const deleteSprint = async (id) => {
    if (!window.confirm('Delete this sprint? Tasks assigned to it may become unassigned.')) return;
    try { await API.delete(`/sprints/${id}`); await loadData(); }
    catch (error) { alert(error.response?.data?.message || 'Unable to delete sprint.'); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Sprints</h1><p>Plan and manage development iterations.</p></div></div>
      <section className="panel form-panel">
        <div className="panel-header"><div><h2>{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</h2><p>{editingSprint ? 'Update sprint scope and lifecycle.' : 'Start a new development sprint.'}</p></div>{editingSprint ? <button className="icon-button" onClick={reset}><FiX size={18} /></button> : <FiCalendar size={21} />}</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>Sprint name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 1" required /></label>
            <label>Project<select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} disabled={Boolean(editingSprint)} required><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
            <label>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label>
            <label>End date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Planning</option><option>Active</option><option>Completed</option></select></label>
            <label className="full-width">Sprint goal<textarea rows="3" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="What should this sprint accomplish?" /></label>
          </div>
          <div className="form-actions">{editingSprint && <button type="button" className="secondary-button" onClick={reset}>Cancel</button>}<button className="primary-button" type="submit" disabled={loading}><FiPlus size={17} />{loading ? 'Saving...' : editingSprint ? 'Save Changes' : 'Create Sprint'}</button></div>
        </form>
      </section>

      <section className="sprint-list">
        {sprints.map((sprint) => (
          <article className="sprint-card" key={sprint._id}>
            <div><span className="status-badge">{sprint.status}</span><h2>{sprint.name}</h2><p>{sprint.goal || 'No sprint goal.'}</p><small>{sprint.project?.name || 'Project'}</small></div>
            <div className="sprint-meta"><span>{new Date(sprint.startDate).toLocaleDateString()}</span><span>→</span><span>{new Date(sprint.endDate).toLocaleDateString()}</span>{(user?.role === 'Admin' || user?.role === 'Project Manager') && <><button className="secondary-button small" onClick={() => openEdit(sprint)}><FiEdit2 size={14} />Edit</button><button className="danger-button small" onClick={() => deleteSprint(sprint._id)}><FiTrash2 size={14} />Delete</button></>}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
