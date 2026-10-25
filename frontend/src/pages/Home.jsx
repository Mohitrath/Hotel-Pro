import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { todayISO, addDays } from '../api';
import RoomCard from '../components/RoomCard';

export default function Home() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ checkIn: todayISO(), checkOut: addDays(todayISO(), 1), guests: 1 });
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/rooms').then((r) => setFeatured(r.data.rooms.slice(0, 3))).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'checkIn' && next.checkOut <= v) next.checkOut = addDays(v, 1);
      return next;
    });
  };

  const search = (e) => {
    e.preventDefault();
    navigate(`/rooms?checkIn=${form.checkIn}&checkOut=${form.checkOut}&guests=${form.guests}`);
  };

  return (
    <>
      <section className="hero text-center">
        <div className="container">
          <h1 className="display-4 fw-bold">Welcome to Hotel<span className="text-accent">Pro</span></h1>
          <p className="lead mb-0">Comfortable stays, seamless booking, secure payments.</p>
        </div>
      </section>

      <div className="container search-box">
        <form onSubmit={search} className="card shadow border-0 p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Check-in</label>
              <input type="date" className="form-control" min={todayISO()} value={form.checkIn} onChange={set('checkIn')} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Check-out</label>
              <input type="date" className="form-control" min={addDays(form.checkIn, 1)} value={form.checkOut} onChange={set('checkOut')} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Guests</label>
              <input type="number" min="1" max="10" className="form-control" value={form.guests} onChange={set('guests')} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-accent w-100"><i className="bi bi-search me-2" />Check availability</button>
            </div>
          </div>
        </form>
      </div>

      <section className="container py-5">
        <div className="row text-center g-4">
          {[
            ['bi-shield-lock', 'Secure', 'JWT authentication, hashed passwords and role-based access.'],
            ['bi-calendar-check', 'Real-time availability', 'Rooms are checked against live bookings, no double-booking.'],
            ['bi-credit-card', 'Easy payments', 'Pay by card or UPI and get instant confirmation.'],
          ].map(([icon, title, text]) => (
            <div className="col-md-4" key={title}>
              <i className={`bi ${icon} display-5 text-accent`} />
              <h5 className="mt-2">{title}</h5>
              <p className="text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container pb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Featured rooms</h3>
            <Link to="/rooms">See all rooms →</Link>
          </div>
          <div className="row g-4">
            {featured.map((r) => (
              <div className="col-md-4" key={r._id}><RoomCard room={r} /></div>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-hp text-white-50 text-center py-3">
        © {new Date().getFullYear()} HotelPro. All rights reserved.
      </footer>
    </>
  );
}
