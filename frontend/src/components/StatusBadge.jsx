const COLORS = {
  pending: 'warning text-dark',
  confirmed: 'primary',
  'checked-in': 'success',
  'checked-out': 'secondary',
  cancelled: 'danger',
  unpaid: 'warning text-dark',
  paid: 'success',
  refunded: 'info text-dark',
  success: 'success',
  failed: 'danger',
  available: 'success',
  maintenance: 'danger',
};

export default function StatusBadge({ value }) {
  return <span className={`badge bg-${COLORS[value] || 'secondary'} text-capitalize`}>{value}</span>;
}
