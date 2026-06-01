import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './RequestDetail.css';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState({ message: '', proposedCredits: '', proposedDeadline: '' });
  const [msgText, setMsgText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const msgEnd = useRef(null);

  const load = async () => {
    const [reqRes, offRes, msgRes] = await Promise.all([
      api.get(`/requests/${id}`),
      user ? api.get(`/offers/request/${id}`) : Promise.resolve({ data: [] }),
      user ? api.get(`/requests/${id}/messages`) : Promise.resolve({ data: [] }),
    ]);
    setRequest(reqRes.data);
    setOffers(offRes.data);
    setMessages(msgRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isRequester = user && request && String(request.requester._id) === String(user._id);
  const hasOffer = user && offers.some(o => String(o.provider._id) === String(user._id));

  const sendOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/offers', { request: id, ...offerForm });
      toast.success('Offer sent!');
      setOfferForm({ message: '', proposedCredits: '', proposedDeadline: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptOffer = async (offerId) => {
    try {
      const res = await api.put(`/offers/${offerId}/accept`);
      toast.success('Offer accepted! Agreement created.');
      navigate(`/agreements/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const rejectOffer = async (offerId) => {
    try {
      await api.put(`/offers/${offerId}/reject`);
      toast.success('Offer rejected');
      load();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const withdrawOffer = async (offerId) => {
    try {
      await api.put(`/offers/${offerId}/withdraw`);
      toast.success('Offer withdrawn');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  const cancelRequest = async () => {
    if (!window.confirm('Cancel this request? Credits will be returned.')) return;
    try {
      await api.put(`/requests/${id}/cancel`);
      toast.success('Request cancelled. Credits returned.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    try {
      await api.post(`/requests/${id}/messages`, { text: msgText });
      setMsgText('');
      const res = await api.get(`/requests/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!request) return <div className="container"><p>Request not found</p></div>;

  return (
    <div className="container rd-layout">
      <div className="rd-main">
        {/* Request card */}
        <div className="card rd-card">
          <div className="rd-top">
            <span className={`badge badge-${request.status}`}>{request.status.replace('_',' ')}</span>
            {request.skill && <span className="request-skill">{request.skill.icon} {request.skill.name}</span>}
            {isRequester && ['open','negotiating'].includes(request.status) && (
              <button className="btn btn-danger btn-sm" onClick={cancelRequest}>Cancel</button>
            )}
          </div>
          <h1 className="rd-title">{request.title}</h1>
          <p className="rd-desc">{request.description}</p>
          <div className="rd-info">
            <div className="info-item">
              <span className="info-label">Credit Offer</span>
              <span className="info-val accent2">◈ {request.creditOffer}</span>
            </div>
            {request.deadline && (
              <div className="info-item">
                <span className="info-label">Deadline</span>
                <span className="info-val">{new Date(request.deadline).toLocaleDateString()}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Posted by</span>
              <span className="info-val">{request.requester.name}</span>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div className="card">
          <h3 className="rd-section-title">Offers ({offers.length})</h3>
          {offers.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>No offers yet.</p>
          ) : (
            <div className="offers-list">
              {offers.map(offer => (
                <div key={offer._id} className={`offer-item ${offer.status !== 'pending' ? 'offer-dim' : ''}`}>
                  <div className="offer-header">
                    <div className="poster-avatar">{offer.provider.name[0]}</div>
                    <div>
                      <strong>{offer.provider.name}</strong>
                      <span className="offer-rep"> ◈ {offer.provider.reputationScore?.toFixed(1)}</span>
                    </div>
                    <span className={`badge badge-${offer.status === 'pending' ? 'open' : offer.status === 'accepted' ? 'completed' : 'cancelled'}`}>{offer.status}</span>
                    <span className="offer-credits">◈ {offer.proposedCredits}</span>
                  </div>
                  <p className="offer-msg">{offer.message}</p>
                  {offer.proposedDeadline && (
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>By {new Date(offer.proposedDeadline).toLocaleDateString()}</p>
                  )}
                  {isRequester && offer.status === 'pending' && request.status !== 'in_progress' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-success btn-sm" onClick={() => acceptOffer(offer._id)}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => rejectOffer(offer._id)}>Reject</button>
                    </div>
                  )}
                  {user && String(offer.provider._id) === String(user._id) && offer.status === 'pending' && (
                    <div style={{ marginTop: 10 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => withdrawOffer(offer._id)}>Withdraw Offer</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Make offer */}
        {user && !isRequester && !hasOffer && request.status === 'open' && (
          <div className="card">
            <h3 className="rd-section-title">Make an Offer</h3>
            <form onSubmit={sendOffer}>
              <div className="form-group">
                <label>Your Proposal</label>
                <textarea rows={3} placeholder="Describe what you'll do and how…"
                  value={offerForm.message}
                  onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Credits requested</label>
                  <input type="number" min="1" placeholder="e.g. 5"
                    value={offerForm.proposedCredits}
                    onChange={e => setOfferForm(f => ({ ...f, proposedCredits: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Proposed deadline</label>
                  <input type="date" value={offerForm.proposedDeadline}
                    onChange={e => setOfferForm(f => ({ ...f, proposedDeadline: e.target.value }))}
                  />
                </div>
              </div>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Offer'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Chat */}
      {user && (
        <div className="rd-sidebar">
          <div className="card chat-card">
            <h3 className="rd-section-title">Negotiation Chat</h3>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 24 }}>No messages yet. Start the conversation.</p>
              ) : (
                messages.map(m => (
                  <div key={m._id} className={`chat-msg ${String(m.sender._id) === String(user._id) ? 'chat-mine' : ''}`}>
                    <div className="chat-sender">{m.sender.name}</div>
                    <div className="chat-bubble">{m.text}</div>
                    <div className="chat-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))
              )}
              <div ref={msgEnd} />
            </div>
            <form onSubmit={sendMessage} className="chat-form">
              <input
                placeholder="Type a message…"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
              />
              <button className="btn btn-primary btn-sm">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
