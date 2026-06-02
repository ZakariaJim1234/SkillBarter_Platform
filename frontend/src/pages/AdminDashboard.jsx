import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const OUTCOMES = [
  { value: 'provider', label: 'Provider wins' },
  { value: 'requester', label: 'Requester wins' },
  { value: 'split', label: 'Split 50/50' },
];

const isActiveDispute = (status) => ['open', 'under_review'].includes(status);

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/disputes');
      setDisputes(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) loadDisputes();
  }, [user?.isAdmin]);

  const summary = useMemo(() => {
    const open = disputes.filter((d) => isActiveDispute(d.status)).length;
    return {
      open,
      resolved: disputes.length - open,
      total: disputes.length,
    };
  }, [disputes]);

  const updateForm = (id, patch) => {
    setForms((current) => ({
      ...current,
      [id]: { outcome: 'provider', resolution: '', ...current[id], ...patch },
    }));
  };

  const resolveDispute = async (disputeId) => {
    const form = forms[disputeId] || { outcome: 'provider', resolution: '' };
    const dispute = disputes.find((item) => item._id === disputeId);
    if (dispute?.status !== 'under_review') {
      toast.error('Wait for the other party to submit their response first.');
      return;
    }
    if (!form.resolution.trim()) {
      toast.error('Add a resolution note before resolving.');
      return;
    }

    setSavingId(disputeId);
    try {
      await api.put(`/disputes/${disputeId}/resolve`, form);
      toast.success('Dispute resolved');
      await loadDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="container admin-page">
      <div className="dash-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text2)' }}>Review and resolve disputed agreements.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadDisputes} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="dash-stats admin-stats">
        <div className="stat-card card">
          <div className="stat-card-val">{summary.open}</div>
          <div className="stat-card-label">Open Disputes</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-val">{summary.resolved}</div>
          <div className="stat-card-label">Resolved</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-val">{summary.total}</div>
          <div className="stat-card-label">Total</div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="admin-disputes">
          {disputes.length === 0 ? (
            <div className="empty-state card">
              <h3>No disputes yet</h3>
              <p>Open disputes will appear here for admin resolution.</p>
            </div>
          ) : disputes.map((dispute) => {
            const agreement = dispute.agreement;
            const form = forms[dispute._id] || { outcome: 'provider', resolution: '' };
            const canResolve = dispute.status === 'under_review';
            const isActive = isActiveDispute(dispute.status);

            return (
              <section className="card dispute-card" key={dispute._id}>
                <div className="dispute-card-header">
                  <div>
                    <div className="dispute-title">{agreement?.request?.title || 'Disputed agreement'}</div>
                    <div className="dispute-meta">
                      Opened by {dispute.complainant?.name || 'Unknown'} on{' '}
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${isActive ? 'disputed' : 'completed'}`}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="dispute-grid">
                  <div>
                    <span className="info-label">Requester</span>
                    <strong>{agreement?.requester?.name || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span className="info-label">Provider</span>
                    <strong>{agreement?.provider?.name || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span className="info-label">Credits</span>
                    <strong className="accent2">◈ {agreement?.creditAmount ?? 0}</strong>
                  </div>
                  <div>
                    <span className="info-label">Deadline</span>
                    <strong>{agreement?.deadline ? new Date(agreement.deadline).toLocaleDateString() : '—'}</strong>
                  </div>
                </div>

                <div className="dispute-description">
                  <span className="info-label">Complaint from {dispute.complainant?.name || 'Complainant'}</span>
                  <p>{dispute.description}</p>
                </div>

                <div className={`dispute-description ${dispute.response ? '' : 'pending-response'}`}>
                  <span className="info-label">
                    Response {dispute.respondent?.name ? `from ${dispute.respondent.name}` : ''}
                  </span>
                  <p>{dispute.response || 'Waiting for the other party to submit their side.'}</p>
                </div>

                {isActive ? (
                  <div className="resolve-panel">
                    {canResolve ? (
                      <>
                        <div className="grid-2">
                          <div className="form-group">
                            <label>Outcome</label>
                            <select
                              value={form.outcome}
                              onChange={(e) => updateForm(dispute._id, { outcome: e.target.value })}
                            >
                              {OUTCOMES.map((outcome) => (
                                <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Resolution Note</label>
                            <textarea
                              rows={3}
                              placeholder="Explain why this outcome was selected."
                              value={form.resolution}
                              onChange={(e) => updateForm(dispute._id, { resolution: e.target.value })}
                            />
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => resolveDispute(dispute._id)}
                          disabled={savingId === dispute._id}
                        >
                          {savingId === dispute._id ? 'Resolving...' : 'Resolve Dispute'}
                        </button>
                      </>
                    ) : (
                      <div className="admin-waiting-note">
                        The admin verdict is locked until the other party responds from their agreement page.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="resolution-note">
                    <span className="info-label">Resolution</span>
                    <p>{dispute.resolution || 'No note recorded.'}</p>
                    {dispute.resolvedBy?.name && <small>Resolved by {dispute.resolvedBy.name}</small>}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
