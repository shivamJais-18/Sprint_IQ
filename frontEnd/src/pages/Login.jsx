import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const fillDemoAccount = () => {
    setForm({ email: 'manager1@gmail.com', password: 'test123456' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await API.post('/auth/login', form);
      login(response.data.token, response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div>
          <div className="brand-icon">S</div>
          <h1 className="login-brand-title">SprintIQ</h1>
          <p className="login-brand-subtitle">AI-Powered Software Management System</p>
          <div className="login-feature-list">
            <p>✓ Project & Sprint Management</p>
            <p>✓ Task & Bug Tracking</p>
            <p>✓ Team Collaboration</p>
            <p>✓ AI-Powered Project Intelligence</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to your SprintIQ workspace</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="login-label">
              Email
              <input
                className="login-input"
                type="email"
                name="email"
                placeholder="manager1@gmail.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="login-label">
              Password
              <div className="password-wrapper">
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button className="demo-button" type="button" onClick={fillDemoAccount}>
            Use Demo Account
          </button>

          <p className="demo-info">Demo: manager1@gmail.com / test123456</p>
        </div>
      </div>
    </div>
  );
}
