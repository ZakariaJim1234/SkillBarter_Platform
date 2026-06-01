import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Requests.css';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: '', status: 'open' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => { api.get('/skills').then(r => setSkills(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10, ...filters });
    api.get(`/requests?${params}`)
      .then(r => { setRequests(r.data.requests); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const timeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="requests-page container">
      <div className="page-header requests-header">
        <div>
          <h1>Skill Requests</h1>
          <p>Browse open requests and make an offer</p>
        </div>
        {user && (
          <Link to="/requests/new" className="btn btn-primary">+ Post Request</Link>
        )}
      </div>

      <div className="requests-filters">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ maxWidth: 160 }}
        >
          <option value="open">Open</option>
          <option value="negotiating">Negotiating</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filters.skill}
          onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Skills</option>
          {skills.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>No requests found</h3>
          <p>Be the first to post one!</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(req => (
            <Link to={`/requests/${req._id}`} key={req._id} className="request-row card">
              <div className="request-main">
                <div className="request-top">
                  <span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span>
                  {req.skill && (
                    <span className="request-skill">{req.skill.icon} {req.skill.name}</span>
                  )}
                  <span className="request-time">{timeAgo(req.createdAt)}</span>
                </div>
                <h3 className="request-title">{req.title}</h3>
                <p className="request-desc">{req.description.slice(0, 120)}{req.description.length > 120 ? '…' : ''}</p>
              </div>
              <div className="request-meta">
                <div className="credit-offer">
                  <span className="credit-icon-sm">◈</span>
                  <strong>{req.creditOffer}</strong>
                  <span>credits</span>
                </div>
                {req.requester && (
                  <div className="request-poster">
                    <div className="poster-avatar">{req.requester.name[0]}</div>
                    <span>{req.requester.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>{page} / {pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
