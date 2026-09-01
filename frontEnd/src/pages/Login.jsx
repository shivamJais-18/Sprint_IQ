import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    setError('');
  };

  const fillDemoAccount = () => {
    setForm({
      email: 'manager1@gmail.com',
      password: 'test123456'
    });
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
      setError(
        err.response?.data?.message ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    background: '#f3f4f6',
    fontFamily: 'Arial, sans-serif'
  };

  const leftStyle = {
    width: '50%',
    background: '#111827',
    color: 'white',
    padding: '70px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const rightStyle = {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.08)'
  };

  const inputStyle = {
    width: '100%',
    padding: '13px',
    marginTop: '7px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '13px',
    marginTop: '18px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer'
  };

  return (
    <div style={pageStyle}>

      {/* LEFT */}
      <div style={leftStyle}>
        <div>
          <div
            style={{
              width: '50px',
              height: '50px',
              background: '#2563eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            S
          </div>

          <h1 style={{ fontSize: '48px', margin: 0 }}>
            SprintIQ
          </h1>

          <p
            style={{
              fontSize: '20px',
              color: '#cbd5e1',
              lineHeight: '1.5',
              maxWidth: '500px'
            }}
          >
            AI-Powered Software Management System
          </p>

          <div style={{ marginTop: '45px' }}>
            <p>✓ Project & Sprint Management</p>
            <p>✓ Task & Bug Tracking</p>
            <p>✓ Team Collaboration</p>
            <p>✓ AI-Powered Project Intelligence</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={rightStyle}>
        <div style={cardStyle}>

          <h2
            style={{
              marginTop: 0,
              fontSize: '32px',
              color: '#111827'
            }}
          >
            Welcome back
          </h2>

          <p style={{ color: '#6b7280', marginBottom: '30px' }}>
            Sign in to your SprintIQ workspace
          </p>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label>
              <strong>Email</strong>

              <input
                style={inputStyle}
                type="email"
                name="email"
                placeholder="manager1@gmail.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <div style={{ height: '20px' }} />

            <label>
              <strong>Password</strong>

              <div style={{ position: 'relative' }}>
                <input
                  style={{
                    ...inputStyle,
                    paddingRight: '70px'
                  }}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#2563eb',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button
              type="submit"
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          <button
            type="button"
            onClick={fillDemoAccount}
            style={{
              ...buttonStyle,
              background: 'white',
              color: '#2563eb',
              border: '1px solid #2563eb'
            }}
          >
            Use Demo Account
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '12px'
            }}
          >
            Demo: manager1@gmail.com / test123456
          </p>

        </div>
      </div>

    </div>
  );
}