import { NavLink, Outlet } from 'react-router-dom';

const links = [
  ['/admin', 'bi-speedometer2', 'Dashboard', true],
  ['/admin/rooms', 'bi-door-open', 'Rooms'],
  ['/admin/bookings', 'bi-calendar-check', 'Bookings'],
  ['/admin/guests', 'bi-people', 'Guests & Staff'],
  ['/admin/payments', 'bi-cash-coin', 'Payments'],
];

export default function AdminLayout() {
  return (
    <div className="admin-wrap">
      <aside className="admin-side py-3">
        <ul className="nav flex-column">
          {links.map(([to, icon, label, end]) => (
            <li className="nav-item" key={to}>
              <NavLink to={to} end={end} className="nav-link">
                <i className={`bi ${icon} me-2`} />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
