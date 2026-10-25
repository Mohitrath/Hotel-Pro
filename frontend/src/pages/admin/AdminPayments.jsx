import { useEffect, useState } from 'react';
import api, { errMsg, money, fmtDate } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminPayments() {
  const [data, setData] = useState({ payments: [], total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then((r) => setData(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Payments</h3>
        <div className="text-end"><div className="text-muted small">Total collected</div><div className="h4 text-accent mb-0">{money(data.total)}</div></div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th>Transaction</th><th>Guest</th><th>Room</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>}
            {!loading && data.payments.map((p) => (
              <tr key={p._id}>
                <td><code>{p.transactionId}</code></td>
                <td>{p.user?.name}<div className="small text-muted">{p.user?.email}</div></td>
                <td>#{p.booking?.room?.number}</td>
                <td className="text-capitalize">{p.method}{p.cardLast4 && <small className="text-muted"> ••{p.cardLast4}</small>}{p.upiId && <small className="text-muted"> {p.upiId}</small>}</td>
                <td>{money(p.amount)}</td>
                <td><StatusBadge value={p.status} />{p.failureReason && <div className="small text-danger">{p.failureReason}</div>}</td>
                <td>{fmtDate(p.createdAt)}</td>
              </tr>
            ))}
            {!loading && data.payments.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No payments yet</td></tr>}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
