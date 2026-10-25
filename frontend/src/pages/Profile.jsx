import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '', phone: user.phone || '', address: user.address || '', currentPassword: '', newPassword: '',
  });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address };
      if (form.newPassword) Object.assign(payload, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      const { data } = await api.put('/auth/me', payload);
      setUser(data.user);
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      setMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 560 }}>
      <h2 className="mb-3">My Profile</h2>
      <form onSubmit={submit} className="card border-0 shadow-sm"><div className="card-body">
        {msg && <div className={`alert alert-${msg.ok ? 'success' : 'danger'} py-2`}>{msg.text}</div>}
        <div className="mb-3"><label className="form-label">Email</label><input className="form-control" value={user.email} disabled /></div>
        <div className="mb-3"><label className="form-label">Name</label><input className="form-control" value={form.name} onChange={set('name')} required /></div>
        <div className="mb-3"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
        <div className="mb-3"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={set('address')} /></div>
        <hr />
        <h6>Change password (optional)</h6>
        <div className="row">
          <div className="col-md-6 mb-3"><input type="password" className="form-control" placeholder="Current password" value={form.currentPassword} onChange={set('currentPassword')} /></div>
          <div className="col-md-6 mb-3"><input type="password" minLength="6" className="form-control" placeholder="New password" value={form.newPassword} onChange={set('newPassword')} /></div>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div></form>
    </div>
  );
}
