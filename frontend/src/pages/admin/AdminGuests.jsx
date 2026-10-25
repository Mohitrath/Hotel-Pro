import { useEffect, useState } from 'react';
import api, { errMsg, money, fmtDate } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

export default function AdminGuests() {
  const { user: me } = useAuth();
  const isAdmin = me.role === 'admin';
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [create, setCreate] = useState(null);
  const [formError, setFormError] = useState('');

  const load = () =>
    api.get('/users', { params: { role: role || undefined, search: search || undefined } })
      .then((r) => { setUsers(r.data.users); setError(''); })
      .catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  const view = async (u) => {
    try { const { data } = await api.get(`/users/${u._id}`); setDetail(data); } catch (e) { setError(errMsg(e)); }
  };
  const changeRole = async (u, r) => {
    try { await api.put(`/users/${u._id}/role`, { role: r }); load(); } catch (e) { setError(errMsg(e)); }
  };
  const remove = async (u) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    try { await api.delete(`/users/${u._id}`); load(); } catch (e) { setError(errMsg(e)); }
  };
  const createUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try { await api.post('/users', create); setCreate(null); load(); } catch (err) { setFormError(errMsg(err)); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Guests & Staff</h3>
        {isAdmin && <button className="btn btn-primary" onClick={() => setCreate({ name: '', email: '', password: '', phone: '', role: 'staff' })}><i className="bi bi-person-plus me-1" />Add user</button>}
      </div>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option><option>guest</option><option>staff</option><option>admin</option>
          </select>
        </div>
        <div className="col-md-5">
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="input-group">
            <input className="form-control" placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.phone || '-'}</td>
                <td>
                  {isAdmin && u._id !== me._id ? (
                    <select className="form-select form-select-sm" style={{ width: 110 }} value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      <option>guest</option><option>staff</option><option>admin</option>
                    </select>
                  ) : <span className="badge bg-secondary text-capitalize">{u.role}</span>}
                </td>
                <td>{fmtDate(u.createdAt)}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => view(u)}><i className="bi bi-eye" /></button>
                  {isAdmin && u._id !== me._id && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)}><i className="bi bi-trash" /></button>}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No users found</td></tr>}
          </tbody>
        </table>
      </div></div>

      {detail && (
        <Modal title={detail.user.name} onClose={() => setDetail(null)} size="modal-lg">
          <p className="mb-1"><i className="bi bi-envelope me-2" />{detail.user.email}</p>
          <p className="mb-1"><i className="bi bi-telephone me-2" />{detail.user.phone || '-'}</p>
          <p><i className="bi bi-geo-alt me-2" />{detail.user.address || '-'}</p>
          <h6>Stay history</h6>
          {detail.bookings.length === 0 ? <p className="text-muted">No bookings.</p> : (
            <table className="table table-sm">
              <thead><tr><th>Room</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {detail.bookings.map((b) => (
                  <tr key={b._id}><td>#{b.room?.number}</td><td>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</td><td>{money(b.totalAmount)}</td><td><StatusBadge value={b.status} /></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {create && (
        <Modal title="Add user" onClose={() => setCreate(null)}>
          <form onSubmit={createUser}>
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            {[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['password', 'Password', 'password']].map(([k, label, type]) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{label}</label>
                <input type={type} className="form-control" value={create[k]} onChange={(e) => setCreate({ ...create, [k]: e.target.value })} required={k !== 'phone'} minLength={k === 'password' ? 6 : undefined} />
              </div>
            ))}
            <div className="mb-3"><label className="form-label">Role</label>
              <select className="form-select" value={create.role} onChange={(e) => setCreate({ ...create, role: e.target.value })}>
                <option>staff</option><option>admin</option><option>guest</option>
              </select></div>
            <div className="text-end"><button className="btn btn-primary">Create user</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
