import { useEffect, useState } from 'react';
import API from '../services/api';

const statuses = [
  'To Do',
  'In Progress',
  'Review',
  'Done'
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');

  const loadTasks = async () => {
    try {
      const response = await API.get(
        `/tasks?search=${encodeURIComponent(search)}`
      );

      setTasks(response.data.tasks || []);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Failed to load tasks'
      );
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const moveTask = async (task) => {
    const currentIndex = statuses.indexOf(task.status);

    if (currentIndex === statuses.length - 1) {
      return;
    }

    const newStatus = statuses[currentIndex + 1];

    try {
      await API.put(`/tasks/${task._id}`, {
        status: newStatus
      });

      await loadTasks();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Failed to update task'
      );
    }
  };

  return (
    <div>
      <h1 className="page-title">Tasks</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 10,
            width: 250,
            marginRight: 10
          }}
        />

        <button
          className="primary-btn"
          onClick={loadTasks}
        >
          Search
        </button>
      </div>

      <div className="kanban">
        {statuses.map((status) => (
          <div className="kanban-column" key={status}>
            <h3>{status}</h3>

            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <div className="task-card" key={task._id}>
                  <h4>{task.title}</h4>

                  <p>
                    Priority: <strong>{task.priority}</strong>
                  </p>

                  {task.assignedTo && (
                    <p>
                      Assigned: {task.assignedTo.name}
                    </p>
                  )}

                  {status !== 'Done' && (
                    <button
                      className="primary-btn"
                      onClick={() => moveTask(task)}
                    >
                      Move →
                    </button>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}