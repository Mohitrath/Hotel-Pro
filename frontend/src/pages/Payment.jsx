import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, money, fmtDate } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Payment() {
  const { bookingId } = useParams();
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState('');
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((r) => setBooking(r.data.booking)).catch((e) => setError(errMsg(e)));
  }, [bookingId]);

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/payments', { bookingId, method, cardNumber: card, upiId: upi });
      setDone(data.payment);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!booking) return <div className="container py-5">{error ? <div className="alert alert-danger">{error}</div> : <div className="text-center"><div className="spinner-border text-primary" /></div>}</div>;

  if (done)
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 520 }}>
        <i className="bi bi-check-circle-fill text-success display-3" />
        <h3 className="mt-3">Payment successful</h3>
        <p className="text-muted">Transaction ID: <strong>{done.transactionId}</strong><br />Amount paid: {money(done.amount)}</p>
        <p>Your booking for room #{booking.room.number} is confirmed.</p>
        <button className="btn btn-primary" onClick={() => navigate(isStaff ? '/admin/bookings' : '/my-bookings')}>View bookings</button>
      </div>
    );

  const unavailable = booking.status === 'cancelled' || booking.paymentStatus === 'paid';

  return (
    <div className="container py-4">
      <div className="row g-4 justify-content-center">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5>Booking summary</h5>
              <p className="mb-1"><strong>{booking.room.type} Room #{booking.room.number}</strong></p>
              <p className="text-muted small">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} night(s) · {booking.guests} guest(s)</p>
              <div className="d-flex justify-content-between"><span>Subtotal</span><span>{money(booking.subtotal)}</span></div>
              <div className="d-flex justify-content-between text-muted"><span>Taxes</span><span>{money(booking.tax)}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>{money(booking.totalAmount)}</span></div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <form onSubmit={pay} className="card border-0 shadow-sm">
            <div className="card-body">
              <h5>Payment</h5>
              {unavailable ? (
                <div className="alert alert-warning">This booking is {booking.status === 'cancelled' ? 'cancelled' : 'already paid'}. <Link to="/my-bookings">Back to bookings</Link></div>
              ) : (
                <>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="btn-group w-100 mb-3">
                    {['card', 'upi', ...(isStaff ? ['cash'] : [])].map((m) => (
                      <button type="button" key={m} className={`btn btn-outline-primary text-capitalize ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>{m}</button>
                    ))}
                  </div>

                  {method === 'card' && (
                    <>
                      <label className="form-label">Card number</label>
                      <input className="form-control" inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength="23" value={card}
                        onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, ''))} required />
                      <div className="form-text">Demo gateway: <code>4242 4242 4242 4242</code> succeeds, <code>4000 0000 0000 0002</code> is declined. Cards are never stored.</div>
                    </>
                  )}
                  {method === 'upi' && (
                    <>
                      <label className="form-label">UPI ID</label>
                      <input className="form-control" placeholder="name@bank" value={upi} onChange={(e) => setUpi(e.target.value)} required />
                    </>
                  )}
                  {method === 'cash' && <div className="alert alert-secondary">Record a cash payment received at the front desk.</div>}

                  <button className="btn btn-accent w-100 mt-3" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(booking.totalAmount)}`}</button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
