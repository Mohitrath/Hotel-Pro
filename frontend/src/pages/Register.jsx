import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="card border-0 shadow-sm">
        <form className="card-body p-4" onSubmit={submit}>
          <h3 className="mb-1">Create your account</h3>
          <p className="text-muted">Book rooms and track your stays.</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <div className="mb-3"><label className="form-label">Full name</label>
            <input className="form-control" value={form.name} onChange={set('name')} required /></div>
          <div className="mb-3"><label className="form-label">Email</label>
            <input type="email" className="form-control" value={form.email} onChange={set('email')} required /></div>
          <div className="mb-3"><label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={set('phone')} /></div>
          <div className="row">
            <div className="col-md-6 mb-3"><label className="form-label">Password</label>
              <input type="password" minLength="6" className="form-control" value={form.password} onChange={set('password')} required /></div>
            <div className="col-md-6 mb-3"><label className="form-label">Confirm</label>
              <input type="password" minLength="6" className="form-control" value={form.confirm} onChange={set('confirm')} required /></div>
          </div>
          <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
          <p className="text-center mt-3 mb-0">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
