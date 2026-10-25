import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import api, { errMsg, money, todayISO, addDays, fmtDate } from '../api';
import { useAuth } from '../context/AuthContext';
import { RoomImage } from '../components/RoomCard';

const TAX_RATE = 0.12; // display only - the server computes the real amount

export default function RoomDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [booked, setBooked] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    checkIn: params.get('checkIn') || todayISO(),
    checkOut: params.get('checkOut') || addDays(todayISO(), 1),
    guests: Number(params.get('guests')) || 1,
    specialRequests: '',
  });

  useEffect(() => {
    api.get(`/rooms/${id}`).then((r) => setRoom(r.data.room)).catch((e) => setError(errMsg(e)));
    api.get(`/rooms/${id}/booked-dates`).then((r) => setBooked(r.data.ranges)).catch(() => {});
  }, [id]);

  const nights = useMemo(
    () => Math.max(Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000), 0),
    [form.checkIn, form.checkOut]
  );

  if (error && !room) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  if (!room) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const subtotal = nights * room.price;
  const tax = subtotal * TAX_RATE;

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const n = { ...f, [k]: v };
      if (k === 'checkIn' && n.checkOut <= v) n.checkOut = addDays(v, 1);
      return n;
    });
  };

  const book = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: location } });
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', { room: room._id, ...form });
      navigate(`/pay/${data.booking._id}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm overflow-hidden">
            <RoomImage src={room.image} alt={`Room ${room.number}`} />
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h3>{room.type} Room <small className="text-muted">#{room.number}</small></h3>
                <div className="text-end">
                  <div className="h4 text-accent mb-0">{money(room.price)}</div>
                  <small className="text-muted">per night</small>
                </div>
              </div>
              <p className="text-muted">
                <i className="bi bi-people me-1" />Up to {room.capacity} guests · Floor {room.floor}
              </p>
              <p>{room.description}</p>
              <h6>Amenities</h6>
              {room.amenities?.map((a) => (
                <span key={a} className="badge bg-light text-secondary border me-1 mb-1 p-2">
                  <i className="bi bi-check2 me-1" />{a}
                </span>
              ))}
              {booked.length > 0 && (
                <div className="mt-4">
                  <h6>Already booked</h6>
                  <ul className="small text-muted mb-0">
                    {booked.map((b, i) => <li key={i}>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <form onSubmit={book} className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Book this room</h5>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Check-in</label>
                  <input type="date" className="form-control" min={todayISO()} value={form.checkIn} onChange={set('checkIn')} required />
                </div>
                <div className="col-6">
                  <label className="form-label small">Check-out</label>
                  <input type="date" className="form-control" min={addDays(form.checkIn, 1)} value={form.checkOut} onChange={set('checkOut')} required />
                </div>
                <div className="col-12">
                  <label className="form-label small">Guests (max {room.capacity})</label>
                  <input type="number" min="1" max={room.capacity} className="form-control" value={form.guests} onChange={set('guests')} required />
                </div>
                <div className="col-12">
                  <label className="form-label small">Special requests (optional)</label>
                  <textarea rows="2" maxLength="500" className="form-control" value={form.specialRequests} onChange={set('specialRequests')} />
                </div>
              </div>

              <hr />
              <div className="d-flex justify-content-between"><span>{money(room.price)} × {nights} night{nights !== 1 && 's'}</span><span>{money(subtotal)}</span></div>
              <div className="d-flex justify-content-between text-muted"><span>Taxes (12%)</span><span>{money(tax)}</span></div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-1"><span>Total</span><span>{money(subtotal + tax)}</span></div>

              <button className="btn btn-accent w-100 mt-3" disabled={busy || nights < 1}>
                {busy ? 'Reserving…' : user ? 'Reserve & continue to payment' : 'Log in to book'}
              </button>
              <p className="small text-muted text-center mt-2 mb-0">
                Your room is held for 30 minutes while you complete payment.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
