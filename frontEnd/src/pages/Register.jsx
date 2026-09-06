import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (name.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await API.post('/auth/register', {
        name,
        email,
        password: form.password
      });

      login(response.data.token, response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page register-page">
      <div className="login-left">
        <div>
          <div className="brand-icon">S</div>
          <h1 className="login-brand-title">SprintIQ</h1>
          <p className="login-brand-subtitle">AI-Powered Software Management System</p>
          <div className="login-feature-list">
            <p>✓ Create and track software projects</p>
            <p>✓ Manage tasks, sprints and bugs</p>
            <p>✓ Collaborate with your development team</p>
            <p>✓ Use AI-powered engineering insights</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card register-card">
          <h2>Create your account</h2>
          <p className="login-subtitle">Join SprintIQ as a Developer</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="login-label">
              Full Name
              <input
                className="login-input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </label>

            <label className="login-label">
              Email
              <input
                className="login-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </label>

            <label className="login-label">
              Password
              <div className="password-wrapper">
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <label className="login-label">
              Confirm Password
              <div className="password-wrapper">
                <input
                  className="login-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div className="register-role-note">
              <strong>Account type</strong>
              <span>Developer accounts can be created here. Project Manager accounts remain restricted to authorized users.</span>
            </div>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
