import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowUpRight, FiBriefcase, FiCheckCircle, FiClock, FiLayers, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ title, value, subtitle, icon: Icon, onClick }) {
  return (
    <button className="stat-card" onClick={onClick} type="button">
      <div className="stat-card-top">
        <div className="stat-icon"><Icon size={20} /></div>
        <FiArrowUpRight size={18} />
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/summary')
      .then((response) => setSummary(response.data.summary))
      .catch((error) => console.error('Dashboard error:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading dashboard...</div>;
  if (!summary) return <div className="empty-state panel"><h2>Unable to load dashboard</h2><p>Please check your backend connection.</p></div>;

  const maxTaskValue = Math.max(summary.tasks.todo, summary.tasks.inProgress, summary.tasks.review, summary.tasks.completed, 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>. Here's your project overview.</p>
        </div>
      </div>

      <div className="ai-dashboard-cta panel"><div className="ai-dashboard-cta-icon"><FiCpu size={22} /></div><div><div className="eyebrow">SPRINTIQ AI</div><h2>Turn your live project data into decisions.</h2><p>Generate tasks, detect sprint risk, prioritize bugs, analyze project health and more.</p></div><button className="primary-button" onClick={() => navigate('/ai')}>Open AI Workspace <FiArrowUpRight size={16} /></button></div>

      <div className="stats-grid">
        <StatCard title="Projects" value={summary.projects.total} subtitle={`${summary.projects.active} active`} icon={FiBriefcase} onClick={() => navigate('/projects')} />
        <StatCard title="Tasks" value={summary.tasks.total} subtitle={`${summary.tasks.completed} completed`} icon={FiCheckCircle} onClick={() => navigate('/tasks')} />
        <StatCard title="Open Bugs" value={summary.bugs.open} subtitle={`${summary.bugs.total} total bugs`} icon={FiAlertTriangle} onClick={() => navigate('/bugs')} />
        <StatCard title="Sprints" value={summary.sprints.total} subtitle={`${summary.sprints.active} active`} icon={FiLayers} onClick={() => navigate('/sprints')} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div><h2>Task Progress</h2><p>Current task distribution</p></div>
            <FiClock size={20} />
          </div>
          <div className="progress-list">
            {[
              ['To Do', summary.tasks.todo],
              ['In Progress', summary.tasks.inProgress],
              ['Review', summary.tasks.review],
              ['Done', summary.tasks.completed]
            ].map(([label, value]) => (
              <div className="progress-row" key={label}>
                <div className="progress-row-header"><span>{label}</span><strong>{value}</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(value / maxTaskValue) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div><h2>Bug Overview</h2><p>Current defect status</p></div>
            <button className="text-button" onClick={() => navigate('/bugs')}>View all</button>
          </div>
          <div className="overview-list">
            <div className="overview-row"><span>Total Bugs</span><strong>{summary.bugs.total}</strong></div>
            <div className="overview-row"><span>Open Bugs</span><strong>{summary.bugs.open}</strong></div>
            <div className="overview-row"><span>Resolved Bugs</span><strong>{summary.bugs.resolved}</strong></div>
            <div className="overview-row critical"><span>Critical Bugs</span><strong>{summary.bugs.critical}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
