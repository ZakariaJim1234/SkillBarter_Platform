import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AgreementDetail.css';

export default function AgreementDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewed, setReviewed] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/agreements/${id}`);
      setAgreement(res.data);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const markComplete = async () => {
    try {
      await api.put(`/agreements/${id}/mark-complete`);
      toast.success('Marked as complete. Waiting for requester confirmation.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const confirm = async () => {
    if (!window.confirm('Confirm completion? Credits will be transferred.')) return;
    try {
      await api.put(`/agreements/${id}/confirm`);
      toast.success('Confirmed! Credits transferred.');
      await refreshUser();
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openDispute = async () => {
    const desc = window.prompt('Describe the issue:');
    if (!desc) return;
    try {
      await api.post('/disputes', { agreementId: id, description: desc });
      toast.success('Dispute opened. An admin will review it.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { agreementId: id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewed(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Already reviewed'); }
  };

  if (loading) return <div className="spinner" />;
  if (!agreement) return null;

  const isProvider = String(agreement.provider._id) === String(user?._id);
  const isRequester = String(agreement.requester._id) === String(user?._id);

  return (
    <div className="container ag-page">
      <div className="page-header">
        <h1>Agreement</h1>
        <span className={`badge badge-${agreement.status}`}>{agreement.status}</span>
      </div>

      <div className="ag-layout">
        <div className="card ag-main">
          <div className="ag-parties">
            <div className="party">
              <div className="poster-avatar large">{agreement.requester.name[0]}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Requester</div>
                <strong>{agreement.requester.name}</strong>
              </div>
            </div>
            <div className="ag-arrow">⇌</div>
            <div className="party">
              <div className="poster-avatar large">{agreement.provider.name[0]}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Provider</div>
                <strong>{agreement.provider.name}</strong>
              </div>
            </div>
          </div>

          <div className="ag-details">
            <div className="info-item">
              <span className="info-label">Credit Amount</span>
              <span className="info-val accent2">◈ {agreement.creditAmount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Deadline</span>
              <span className="info-val">{new Date(agreement.deadline).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-val">{new Date(agreement.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="ag-progress">
            <div className={`ag-step ${agreement.providerMarkedComplete ? 'done' : isProvider ? 'active' : ''}`}>
              <div className="step-dot" />
              <div>
                <div className="step-label">Provider marks complete</div>
                {agreement.providerMarkedComplete
                  ? <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Done</span>
                  : isProvider && agreement.status === 'active'
                    ? <button className="btn btn-primary btn-sm" onClick={markComplete}>Mark as Complete</button>
                    : <span style={{ color: 'var(--text3)', fontSize: 13 }}>Pending</span>
                }
              </div>
            </div>
            <div className={`ag-step ${agreement.requesterConfirmed ? 'done' : isRequester && agreement.providerMarkedComplete ? 'active' : ''}`}>
              <div className="step-dot" />
              <div>
                <div className="step-label">Requester confirms</div>
                {agreement.requesterConfirmed
                  ? <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Confirmed</span>
                  : isRequester && agreement.providerMarkedComplete && agreement.status === 'active'
                    ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={confirm}>Confirm & Pay</button>
                        <button className="btn btn-danger btn-sm" onClick={openDispute}>Dispute</button>
                      </div>
                    )
                    : <span style={{ color: 'var(--text3)', fontSize: 13 }}>Waiting</span>
                }
              </div>
            </div>
          </div>

          {agreement.status === 'active' && (
            <button className="btn btn-danger btn-sm" style={{ marginTop: 16 }} onClick={openDispute}>
              Open Dispute
            </button>
          )}
        </div>

        {/* Leave a review */}
        {agreement.status === 'completed' && !reviewed && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontFamily: 'Syne', fontSize: 17 }}>Leave a Review</h3>
            <form onSubmit={submitReview}>
              <div className="form-group">
                <label>Rating (1–5)</label>
                <div className="star-picker">
                  {[1,2,3,4,5].map(n => (
                    <span key={n}
                      className={n <= reviewForm.rating ? 'star' : 'star-empty'}
                      style={{ fontSize: 24, cursor: 'pointer' }}
                      onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    >★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea rows={3} placeholder="Share your experience…"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary">Submit Review</button>
            </form>
          </div>
        )}
        {reviewed && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--success)' }}>
            ✓ Review submitted. Thank you!
          </div>
        )}
      </div>
    </div>
  );
}
