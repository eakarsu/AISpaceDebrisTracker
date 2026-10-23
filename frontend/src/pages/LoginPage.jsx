import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.login(loginEmail, loginPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await submitLogin(email, password);
  };

  const handleDemoLogin = async () => {
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL || '';
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    if (demoEmail && demoPassword) {
      await submitLogin(demoEmail, demoPassword);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-section">
          <span className="logo-icon">{'\uD83C\uDF0C'}</span>
          <h1>Space Debris Tracker</h1>
          <p>Orbital Situational Awareness Platform</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || !import.meta.env.VITE_DEMO_EMAIL || !import.meta.env.VITE_DEMO_PASSWORD}
            aria-label="Fill demo credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Fill demo credentials
          </button>
          {(!import.meta.env.VITE_DEMO_EMAIL || !import.meta.env.VITE_DEMO_PASSWORD) && <p role="status">Demo credentials are not configured for this local build.</p>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
