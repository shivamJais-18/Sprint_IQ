import { useEffect, useState } from 'react';
import {
  FiEdit2,
  FiFolder,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';

import API from '../services/api';

const initialForm = {
  name: '',
  description: '',
  projectKey: ''
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    try {
      const response = await API.get('/projects');

      setProjects(response.data.projects || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.projectKey) {
      alert('Project name and project key are required.');
      return;
    }

    try {
      setLoading(true);

      await API.post('/projects', {
        name: form.name,
        description: form.description,
        projectKey: form.projectKey.toUpperCase()
      });

      setForm(initialForm);
      setShowForm(false);

      await loadProjects();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Unable to create project.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Delete this project?'
    );

    if (!confirmed) return;

    try {
      await API.delete(`/projects/${id}`);

      await loadProjects();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Unable to delete project.'
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your software projects and teams.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          <FiPlus size={17} />
          New Project
        </button>
      </div>

      {showForm && (
        <section className="panel form-panel">
          <div className="panel-header">
            <div>
              <h2>Create Project</h2>
              <p>Add a new software project.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Project name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                  placeholder="SprintIQ Web Platform"
                />
              </label>

              <label>
                Project key
                <input
                  value={form.projectKey}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectKey:
                        e.target.value.toUpperCase()
                    })
                  }
                  placeholder="SPT"
                  maxLength={10}
                />
              </label>

              <label className="full-width">
                Description
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value
                    })
                  }
                  placeholder="Describe the project..."
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? 'Creating...'
                  : 'Create Project'}
              </button>
            </div>
          </form>
        </section>
      )}

      {projects.length === 0 ? (
        <div className="empty-state panel">
          <FiFolder size={34} />

          <h2>No projects yet</h2>

          <p>
            Create your first project to start managing
            sprints and tasks.
          </p>

          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <FiPlus size={17} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article
              className="project-card"
              key={project._id}
            >
              <div className="project-card-top">
                <div className="project-icon">
                  <FiFolder size={20} />
                </div>

                <span className="status-badge">
                  {project.status}
                </span>
              </div>

              <h2>{project.name}</h2>

              <p>
                {project.description ||
                  'No description provided.'}
              </p>

              <div className="project-key">
                {project.projectKey}
              </div>

              <div className="project-card-actions">
                <button
                  className="secondary-button small"
                  disabled
                  title="Editing will be enabled next"
                >
                  <FiEdit2 size={15} />
                  Edit
                </button>

                <button
                  className="danger-button small"
                  onClick={() =>
                    handleDelete(project._id)
                  }
                >
                  <FiTrash2 size={15} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}