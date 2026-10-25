import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, fmtDate } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const NEXT = { pending: ['confirmed', 'Confirm'], confirmed: ['checked-in', 'Check in'], 'checked-in': ['checked-out', 'Check out'] };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/bookings', { params: { status: status || undefined, search: search || undefined } })
      .then((r) => { setBookings(r.data.bookings); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const act = async (fn) => { try { await fn(); load(); } catch (e) { setError(errMsg(e)); } };
  const advance = (b, to) => act(() => api.put(`/bookings/${b._id}/status`, { status: to }));
  const cancel = (b) => confirm('Cancel this booking?') && act(() => api.put(`/bookings/${b._id}/cancel`, {}));

  return (
    <>
      <h3 className="mb-3">Bookings</h3>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-5">
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="input-group">
            <input className="form-control" placeholder="Search guest, email or room no." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th /></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>}
            {!loading && bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.user?.name}<div className="small text-muted">{b.user?.email}</div></td>
                <td>#{b.room?.number} <small className="text-muted">{b.room?.type}</small></td>
                <td className="text-nowrap">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}<div className="small text-muted">{b.nights} night(s)</div></td>
                <td>{money(b.totalAmount)}</td>
                <td><StatusBadge value={b.status} /></td>
                <td><StatusBadge value={b.paymentStatus} /></td>
                <td className="text-end text-nowrap">
                  {b.status !== 'cancelled' && b.paymentStatus === 'unpaid' && (
                    <Link className="btn btn-sm btn-outline-success me-1" to={`/pay/${b._id}`}>Collect payment</Link>
                  )}
                  {NEXT[b.status] && (
                    <button className="btn btn-sm btn-primary me-1" onClick={() => advance(b, NEXT[b.status][0])}>{NEXT[b.status][1]}</button>
                  )}
                  {['pending', 'confirmed'].includes(b.status) && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No bookings found</td></tr>}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
