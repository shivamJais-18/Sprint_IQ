import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import API from '../services/api';

const statuses = ['To Do', 'In Progress', 'Review', 'Done'];

const emptyForm = {
  title: '',
  description: '',
  project: '',
  sprint: '',
  priority: 'Medium'
};

const emptyEditForm = {
  title: '',
  description: '',
  sprint: '',
  priority: 'Medium',
  status: 'To Do',
  assignedTo: '',
  dueDate: '',
  estimatedHours: '',
  storyPoints: ''
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async () => {
    try {
      const [taskResponse, projectResponse, sprintResponse, userResponse] = await Promise.all([
        API.get(`/tasks?search=${encodeURIComponent(search)}`),
        API.get('/projects'),
        API.get('/sprints'),
        API.get('/users')
      ]);

      setTasks(taskResponse.data.tasks || []);
      setProjects(projectResponse.data.projects || []);
      setSprints(sprintResponse.data.sprints || []);
      setUsers(userResponse.data.users || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTask = async (event) => {
    event.preventDefault();
    if (!form.title || !form.project) {
      alert('Task title and project are required.');
      return;
    }

    try {
      await API.post('/tasks', { ...form, sprint: form.sprint || undefined });
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to create task.');
    }
  };

  const moveTask = async (task) => {
    const currentIndex = statuses.indexOf(task.status);
    if (currentIndex === statuses.length - 1) return;

    try {
      await API.put(`/tasks/${task._id}`, { status: statuses[currentIndex + 1] });
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update task.');
    }
  };

  const deleteTask = async (task) => {
    if (user?.role !== 'Admin' && user?.role !== 'Project Manager') return;
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await API.delete(`/tasks/${task._id}`);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to delete task.');
    }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      sprint: task.sprint?._id || task.sprint || '',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
      estimatedHours: task.estimatedHours ?? '',
      storyPoints: task.storyPoints ?? ''
    });
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditingTask(null);
    setEditForm(emptyEditForm);
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingTask) return;

    setSavingEdit(true);

    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        sprint: editForm.sprint || null,
        priority: editForm.priority,
        status: editForm.status,
        assignedTo: editForm.assignedTo || null,
        dueDate: editForm.dueDate || null,
        estimatedHours: editForm.estimatedHours === '' ? null : Number(editForm.estimatedHours),
        storyPoints: editForm.storyPoints === '' ? null : Number(editForm.storyPoints)
      };

      await API.put(`/tasks/${editingTask._id}`, payload);
      closeEdit();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update task.');
    } finally {
      setSavingEdit(false);
    }
  };

  const projectSprints = editingTask
    ? sprints.filter((sprint) => {
        const projectId = editingTask.project?._id || editingTask.project;
        const sprintProjectId = sprint.project?._id || sprint.project;
        return !projectId || !sprintProjectId || String(projectId) === String(sprintProjectId);
      })
    : sprints;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage work across your development workflow.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <div className="panel-header">
          <div><h2>Create Task</h2><p>Add a task to a project or sprint.</p></div>
          <FiPlus size={21} />
        </div>
        <form onSubmit={createTask}>
          <div className="form-grid">
            <label>Task title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Implement authentication API" /></label>
            <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label>Project<select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
            <label>Sprint<select value={form.sprint} onChange={(e) => setForm({ ...form, sprint: e.target.value })}><option value="">No sprint</option>{sprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name}</option>)}</select></label>
            <label className="full-width">Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the task..." /></label>
          </div>
          <div className="form-actions"><button className="primary-button" type="submit"><FiPlus size={17} />Create Task</button></div>
        </form>
      </section>

      <section className="panel filter-bar">
        <FiSearch size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." />
        <button className="secondary-button" onClick={loadData}>Search</button>
      </section>

      <div className="kanban-board">
        {statuses.map((status) => (
          <section className="kanban-column" key={status}>
            <div className="kanban-column-header"><h3>{status}</h3><span>{tasks.filter((task) => task.status === status).length}</span></div>
            <div className="kanban-items">
              {tasks.filter((task) => task.status === status).map((task) => (
                <article className="task-card" key={task._id}>
                  <div className="task-card-top"><span className={`priority-badge ${String(task.priority || 'Medium').toLowerCase()}`}>{task.priority || 'Medium'}</span></div>
                  <h4>{task.title}</h4>
                  <p>{task.description || 'No description provided.'}</p>
                  <div className="task-card-actions">
                    {status !== 'Done' && <button className="task-move-button" onClick={() => moveTask(task)}>Move <FiArrowRight size={15} /></button>}
                    <button className="task-edit-button" onClick={() => openEdit(task)}><FiEdit2 size={14} />Edit</button>
                    {(user?.role === 'Admin' || user?.role === 'Project Manager') && <button className="task-delete-button" onClick={() => deleteTask(task)}><FiTrash2 size={14} />Delete</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {editingTask && (
        <div className="modal-backdrop" onMouseDown={closeEdit}>
          <div className="task-edit-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Task</h2>
                <p>Update the task details, sprint, assignment and effort.</p>
              </div>
              <button className="icon-button modal-close" onClick={closeEdit} title="Close"><FiX size={18} /></button>
            </div>

            <form onSubmit={saveEdit}>
              <div className="form-grid">
                <label>Task title<input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></label>
                <label>Priority<select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
                <label>Sprint<select value={editForm.sprint} onChange={(e) => setEditForm({ ...editForm, sprint: e.target.value })}><option value="">No sprint</option>{projectSprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name}</option>)}</select></label>
                <label>Status<select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Assigned To<select value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}><option value="">Unassigned</option>{users.filter((user) => user.role === 'Developer' || user.role === 'Project Manager').map((user) => <option key={user._id} value={user._id}>{user.name} ({user.role})</option>)}</select></label>
                <label>Due Date<input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></label>
                <label>Estimated Hours<input type="number" min="0" step="0.5" value={editForm.estimatedHours} onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })} placeholder="e.g. 5" /></label>
                <label>Story Points<input type="number" min="0" max="13" step="1" value={editForm.storyPoints} onChange={(e) => setEditForm({ ...editForm, storyPoints: e.target.value })} placeholder="e.g. 3" /></label>
                <label className="full-width">Description<textarea rows="4" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeEdit} disabled={savingEdit}>Cancel</button>
                <button type="submit" className="primary-button" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
