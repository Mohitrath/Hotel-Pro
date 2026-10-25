import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../api';

export function RoomImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="room-img-fallback">
        <i className="bi bi-door-open" />
      </div>
    );
  return <img className="room-img" src={src} alt={alt} onError={() => setFailed(true)} />;
}

export default function RoomCard({ room, query = '' }) {
  return (
    <div className="card room-card h-100 border-0 shadow-sm">
      <RoomImage src={room.image} alt={`Room ${room.number}`} />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title mb-1">{room.type} Room</h5>
          <span className="badge bg-light text-dark border">#{room.number}</span>
        </div>
        <p className="text-muted small mb-2">
          <i className="bi bi-people me-1" />Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}
          <span className="mx-2">·</span>Floor {room.floor}
        </p>
        <div className="mb-3">
          {room.amenities?.slice(0, 4).map((a) => (
            <span key={a} className="badge bg-light text-secondary border me-1 mb-1">{a}</span>
          ))}
        </div>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <div>
            <span className="h5 text-accent mb-0">{money(room.price)}</span>
            <small className="text-muted"> / night</small>
          </div>
          <Link to={`/rooms/${room._id}${query}`} className="btn btn-sm btn-primary">View & Book</Link>
        </div>
      </div>
    </div>
  );
}
