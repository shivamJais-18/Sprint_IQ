import { useEffect, useState } from 'react';
import { FiEdit2, FiFolder, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', description: '', projectKey: '', members: [], status: 'Planning', startDate: '', endDate: '' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [projectResponse, userResponse] = await Promise.all([
        API.get('/projects'),
        API.get('/users')
      ]);
      setProjects(projectResponse.data.projects || []);
      setUsers(userResponse.data.users || []);
    } catch (error) {
      console.error(error);
      setProjects([]);
      setUsers([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingProject(null);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name || '',
      description: project.description || '',
      projectKey: project.projectKey || '',
      members: (project.members || []).map((member) => member._id || member),
      status: project.status || 'Planning',
      startDate: project.startDate ? String(project.startDate).slice(0, 10) : '',
      endDate: project.endDate ? String(project.endDate).slice(0, 10) : ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || (!editingProject && !form.projectKey)) {
      alert('Project name and project key are required.');
      return;
    }

    try {
      setLoading(true);
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, {
          name: form.name,
          description: form.description,
          members: form.members,
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null
        });
      } else {
        await API.post('/projects', {
          ...form,
          projectKey: form.projectKey.toUpperCase(),
          members: form.members,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined
        });
      }
      resetForm();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || `Unable to ${editingProject ? 'update' : 'create'} project.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? Its sprints, tasks and bugs will also be deleted.')) return;
    try {
      await API.delete(`/projects/${id}`);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to delete project.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Projects</h1><p>Manage your software projects, teams and delivery state.</p></div>
        {(user?.role === 'Admin' || user?.role === 'Project Manager') && <button className="primary-button" onClick={() => { setEditingProject(null); setForm(emptyForm); setShowForm(!showForm); }}><FiPlus size={17} />New Project</button>}
      </div>

      {showForm && (
        <section className="panel form-panel">
          <div className="panel-header">
            <div><h2>{editingProject ? 'Edit Project' : 'Create Project'}</h2><p>{editingProject ? 'Update project details and team membership.' : 'Add a new software project.'}</p></div>
            <button className="icon-button" onClick={resetForm}><FiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>Project name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Project key<input value={form.projectKey} onChange={(e) => setForm({ ...form, projectKey: e.target.value.toUpperCase() })} placeholder="SPT" maxLength={10} disabled={Boolean(editingProject)} required={!editingProject} /></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Planning</option><option>Active</option><option>Completed</option><option>Archived</option></select></label>
              <label>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
              <label>End date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
              <div className="full-width project-members-field">
                <div className="form-field-label">Project members</div>
                <div className="member-picker">
                  {users.filter((member) => member.role === 'Developer').length === 0 ? (
                    <div className="member-picker-empty">No active developers available.</div>
                  ) : (
                    users.filter((member) => member.role === 'Developer').map((member) => {
                      const selected = form.members.includes(member._id);
                      return (
                        <label key={member._id} className={`member-option ${selected ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setForm({
                              ...form,
                              members: selected
                                ? form.members.filter((id) => id !== member._id)
                                : [...form.members, member._id]
                            })}
                          />
                          <span className="member-avatar">{member.name?.charAt(0)?.toUpperCase() || 'D'}</span>
                          <span className="member-details">
                            <strong>{member.name}</strong>
                            <small>{member.email}</small>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <small className="field-help">Select one or more developers for this project.</small>
              </div>
              <label className="full-width">Description<textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
              <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}</button>
            </div>
          </form>
        </section>
      )}

      {projects.length === 0 ? (
        <div className="empty-state panel"><FiFolder size={34} /><h2>No projects yet</h2><p>Create your first project to start managing sprints and tasks.</p>{(user?.role === 'Admin' || user?.role === 'Project Manager') && <button className="primary-button" onClick={() => setShowForm(true)}><FiPlus size={17} />Create Project</button>}</div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project._id}>
              <div className="project-card-top"><div className="project-icon"><FiFolder size={20} /></div><span className="status-badge">{project.status}</span></div>
              <h2>{project.name}</h2>
              <p>{project.description || 'No description provided.'}</p>
              <div className="project-key">{project.projectKey}</div>
              {(user?.role === 'Admin' || user?.role === 'Project Manager') && <div className="project-card-actions">
                <button className="secondary-button small" onClick={() => openEdit(project)}><FiEdit2 size={15} />Edit</button>
                <button className="danger-button small" onClick={() => handleDelete(project._id)}><FiTrash2 size={15} />Delete</button>
              </div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
