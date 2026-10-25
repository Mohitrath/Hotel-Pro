import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, fmtDate } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/bookings/my')
      .then((r) => setBookings(r.data.bookings))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking? Paid amounts will be refunded.')) return;
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : bookings.length === 0 ? (
        <div className="alert alert-info">You have no bookings yet. <Link to="/rooms">Browse rooms</Link></div>
      ) : (
        <div className="row g-3">
          {bookings.map((b) => (
            <div className="col-lg-6" key={b._id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-1">{b.room?.type} Room #{b.room?.number}</h5>
                    <div className="d-flex gap-1"><StatusBadge value={b.status} /><StatusBadge value={b.paymentStatus} /></div>
                  </div>
                  <p className="text-muted mb-2">
                    <i className="bi bi-calendar3 me-1" />{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} ({b.nights} night{b.nights > 1 && 's'})
                    <span className="mx-2">·</span><i className="bi bi-people me-1" />{b.guests}
                  </p>
                  <p className="fw-bold mb-2">{money(b.totalAmount)} <small className="text-muted fw-normal">incl. taxes</small></p>
                  {b.cancelReason && <p className="small text-danger mb-2">{b.cancelReason}</p>}
                  <div className="d-flex gap-2">
                    {b.status !== 'cancelled' && b.paymentStatus === 'unpaid' && (
                      <Link to={`/pay/${b._id}`} className="btn btn-sm btn-accent">Pay now</Link>
                    )}
                    {['pending', 'confirmed'].includes(b.status) && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b._id)}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
