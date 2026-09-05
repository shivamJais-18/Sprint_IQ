import { useEffect, useState } from 'react';
import { FiEdit2, FiShield, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import API from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'Developer', isActive: true, password: '' });
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await API.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to load users.');
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name || '', email: user.email || '', role: user.role || 'Developer', isActive: user.isActive !== false, password: '' });
  };

  const reset = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'Developer', isActive: true, password: '' });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive
      };
      if (form.password.trim()) payload.password = form.password;
      await API.put(`/users/${editingUser._id}`, payload);
      reset();
      await loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update user.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await API.delete(`/users/${user._id}`);
      await loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to delete user.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>User Management</h1><p>Manage project team accounts and roles.</p></div>
      </div>

      {editingUser && (
        <section className="panel form-panel">
          <div className="panel-header">
            <div><h2>Edit User</h2><p>Update account details and access level.</p></div>
            <button className="icon-button" onClick={reset} type="button"><FiX size={18} /></button>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
              <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Developer</option><option>Project Manager</option><option>Admin</option></select></label>
              <label>Status<select value={form.isActive ? 'Active' : 'Inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'Active' })}><option>Active</option><option>Inactive</option></select></label>
              <label className="full-width">New password (optional)<input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" /></label>
            </div>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={reset}>Cancel</button><button type="submit" className="primary-button" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button></div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header"><div><h2>Team Accounts</h2><p>{users.length} active account(s)</p></div><FiUsers size={20} /></div>
        <div className="user-list">
          {users.map((user) => (
            <article className="user-row" key={user._id}>
              <div className="user-row-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className="user-row-main"><strong>{user.name}</strong><span>{user.email}</span></div>
              <span className="status-badge"><FiShield size={13} />{user.role}</span>
              <div className="project-card-actions"><button className="secondary-button small" onClick={() => openEdit(user)}><FiEdit2 size={14} />Edit</button><button className="danger-button small" onClick={() => remove(user)}><FiTrash2 size={14} />Delete</button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
