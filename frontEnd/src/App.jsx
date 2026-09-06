import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Bugs from './pages/Bugs';
import Layout from './pages/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';
import Sprints from './pages/Sprints';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import AIWorkspace from './pages/AIWorkspace';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading SprintIQ...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading SprintIQ...</div>;
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/sprints" element={<Sprints />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/bugs" element={<Bugs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai" element={<AIWorkspace />} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
