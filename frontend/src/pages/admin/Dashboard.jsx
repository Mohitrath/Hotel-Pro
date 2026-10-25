import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../../api';
import StatusBadge from '../../components/StatusBadge';

function Stat({ icon, label, value, sub }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="card stat-card shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <div>
              <div className="text-muted small">{label}</div>
              <div className="h3 mb-0">{value}</div>
              {sub && <small className="text-muted">{sub}</small>}
            </div>
            <i className={`bi ${icon} fs-2 text-accent`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setS(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!s) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const max = Math.max(...s.revenueByMonth.map((m) => m.revenue), 1);

  const List = ({ title, items, empty }) => (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white fw-semibold">{title}</div>
      <ul className="list-group list-group-flush">
        {items.length === 0 && <li className="list-group-item text-muted">{empty}</li>}
        {items.map((b) => (
          <li className="list-group-item d-flex justify-content-between" key={b._id}>
            <span>{b.user?.name} <small className="text-muted">· Room {b.room?.number}</small></span>
            <StatusBadge value={b.status} />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <h3 className="mb-3">Dashboard</h3>
      <div className="row g-3 mb-4">
        <Stat icon="bi-door-closed" label="Total rooms" value={s.totalRooms} sub={`${s.maintenanceRooms} under maintenance`} />
        <Stat icon="bi-person-check" label="Occupied now" value={s.occupiedRooms} sub={`${s.occupancyRate}% occupancy`} />
        <Stat icon="bi-door-open" label="Available now" value={s.availableRooms} />
        <Stat icon="bi-currency-rupee" label="Total revenue" value={money(s.totalRevenue)} sub={`${s.totalGuests} registered guests`} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Revenue (last 6 months)</div>
            <div className="card-body">
              <div className="d-flex align-items-end">
                {s.revenueByMonth.map((m) => (
                  <div className="bar-col" key={m.label}>
                    <small className="text-muted">{m.revenue ? money(m.revenue) : ''}</small>
                    <div className="bar" style={{ height: `${(m.revenue / max) * 110}px` }} />
                    <small className="mt-1">{m.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Bookings by status</div>
            <ul className="list-group list-group-flush">
              {Object.keys(s.bookingsByStatus).length === 0 && <li className="list-group-item text-muted">No bookings yet</li>}
              {Object.entries(s.bookingsByStatus).map(([k, v]) => (
                <li className="list-group-item d-flex justify-content-between" key={k}><StatusBadge value={k} /><strong>{v}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6"><List title="Arrivals today" items={s.arrivalsToday} empty="No arrivals today" /></div>
        <div className="col-lg-6"><List title="Departures today" items={s.departuresToday} empty="No departures today" /></div>
      </div>
    </>
  );
}
