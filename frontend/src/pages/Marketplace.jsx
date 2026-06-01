import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Marketplace.css';

function StarRating({ rating }) {
  return (
    <span className="star-row">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star' : 'star-empty'}>★</span>
      ))}
      <span className="rating-num">{rating ? rating.toFixed(1) : '—'}</span>
    </span>
  );
}

export default function Marketplace() {
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: '', search: '', minRating: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => { api.get('/skills').then(r => setSkills(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, ...filters });
    api.get(`/users?${params}`)
      .then(r => { setUsers(r.data.users); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [filters, page]);

  return (
    <div className="marketplace container">
      <div className="page-header">
        <h1>Skill Marketplace</h1>
        <p>Discover talented people to exchange skills with</p>
      </div>

      <div className="marketplace-filters">
        <input
          placeholder="Search by name…"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ maxWidth: 220 }}
        />
        <select
          value={filters.skill}
          onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Skills</option>
          {skills.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </select>
        <select
          value={filters.minRating}
          onChange={e => setFilters(f => ({ ...f, minRating: e.target.value }))}
          style={{ maxWidth: 180 }}
        >
          <option value="">Any Reputation</option>
          <option value="3">3+ score</option>
          <option value="5">5+ score</option>
          <option value="10">10+ score</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No members found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="users-grid">
            {users.map(user => (
              <Link to={`/profile/${user._id}`} key={user._id} className="user-card card">
                <div className="user-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} />
                    : <div className="avatar-placeholder">{user.name[0].toUpperCase()}</div>
                  }
                  <div className="reputation-badge">◈ {user.reputationScore.toFixed(1)}</div>
                </div>
                <h3 className="user-name">{user.name}</h3>
                {user.location && <p className="user-location">📍 {user.location}</p>}
                <StarRating rating={user.avgRating} />
                <div className="user-stats">
                  <span>✓ {user.completedTasks} tasks</span>
                </div>
                {user.bio && <p className="user-bio">{user.bio.slice(0, 80)}{user.bio.length > 80 ? '…' : ''}</p>}
              </Link>
            ))}
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
