import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Failed to log in. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#09090b', padding: '0 16px', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#18181b', border: '1px solid #27272a', marginBottom: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
            <Lock style={{ color: '#3b82f6' }} size={32} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', letterSpacing: '-0.025em' }}>Welcome Back</h1>
          <p style={{ color: '#a1a1aa' }}>Sign in to access your dashboard</p>
        </div>

        <div className="floating-card" style={{ padding: '32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', marginTop: '2px' }} />
                <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>Email Address</label>
              <div className="modal-input-wrap" style={{ width: '100%' }}>
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  className="modal-input"
                  style={{ width: '100%' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>Password</label>
              <div className="modal-input-wrap" style={{ width: '100%' }}>
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  className="modal-input"
                  style={{ width: '100%' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="modal-submit"
              style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {loading ? (
                <div className="modal-spinner" style={{ width: '20px', height: '20px', borderColor: '#fff' }}></div>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a1a1aa', marginTop: '32px', opacity: 0.6 }}>

          Secure POS System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
