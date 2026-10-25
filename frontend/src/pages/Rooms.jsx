import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg, todayISO, addDays } from '../api';
import RoomCard from '../components/RoomCard';

export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: params.get('guests') || '',
    type: params.get('type') || '',
    maxPrice: params.get('maxPrice') || '',
  });

  useEffect(() => {
    const q = Object.fromEntries(Object.entries(Object.fromEntries(params)).filter(([, v]) => v));
    setLoading(true);
    setError('');
    api
      .get('/rooms', { params: q })
      .then((r) => setRooms(r.data.rooms))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [params]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const apply = (e) => {
    e.preventDefault();
    setParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
  };
  const reset = () => {
    setFilters({ checkIn: '', checkOut: '', guests: '', type: '', maxPrice: '' });
    setParams({});
  };

  // carry the selected dates into the room page
  const query = params.get('checkIn') && params.get('checkOut')
    ? `?checkIn=${params.get('checkIn')}&checkOut=${params.get('checkOut')}&guests=${params.get('guests') || 1}`
    : '';

  return (
    <div className="container py-4">
      <h2 className="mb-3">Our Rooms</h2>

      <form onSubmit={apply} className="card card-body border-0 shadow-sm mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-2">
            <label className="form-label small">Check-in</label>
            <input type="date" className="form-control form-control-sm" min={todayISO()} value={filters.checkIn}
              onChange={(e) => setFilters((f) => ({ ...f, checkIn: e.target.value, checkOut: f.checkOut <= e.target.value ? addDays(e.target.value, 1) : f.checkOut }))} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Check-out</label>
            <input type="date" className="form-control form-control-sm" min={filters.checkIn ? addDays(filters.checkIn, 1) : todayISO()}
              value={filters.checkOut} onChange={set('checkOut')} />
          </div>
          <div className="col-4 col-md-2">
            <label className="form-label small">Guests</label>
            <input type="number" min="1" max="10" className="form-control form-control-sm" value={filters.guests} onChange={set('guests')} />
          </div>
          <div className="col-8 col-md-2">
            <label className="form-label small">Type</label>
            <select className="form-select form-select-sm" value={filters.type} onChange={set('type')}>
              <option value="">All</option>
              {['Single', 'Double', 'Deluxe', 'Suite'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Max price (₹)</label>
            <input type="number" min="0" className="form-control form-control-sm" value={filters.maxPrice} onChange={set('maxPrice')} />
          </div>
          <div className="col-6 col-md-2 d-flex gap-2">
            <button className="btn btn-sm btn-primary flex-fill">Search</button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reset}>Reset</button>
          </div>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : rooms.length === 0 ? (
        <div className="alert alert-info">No rooms match your search. Try different dates or filters.</div>
      ) : (
        <div className="row g-4">
          {rooms.map((r) => (
            <div className="col-sm-6 col-lg-4" key={r._id}><RoomCard room={r} query={query} /></div>
          ))}
        </div>
      )}
    </div>
  );
}
