import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const TABS = ['Overview', 'My Requests', 'My Offers', 'Agreements', 'Transactions', 'Skills'];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const [skillForm, setSkillForm] = useState({ skill: '', skillLevel: 'Intermediate', description: '', hourlyCreditRate: '' });

  useEffect(() => {
    api.get('/skills').then(r => setAllSkills(r.data));
    refreshUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetches = {
      'My Requests': () => api.get('/requests/my').then(r => setMyRequests(r.data)),
      'My Offers': () => api.get('/offers/my').then(r => setMyOffers(r.data)),
      'Agreements': () => api.get('/agreements/my').then(r => setAgreements(r.data)),
      'Transactions': () => api.get('/transactions/my').then(r => setTransactions(r.data)),
      'Skills': () => api.get(`/users/${user._id}`).then(r => setUserSkills(r.data.userSkills)),
      'Overview': () => Promise.all([
        api.get('/requests/my').then(r => setMyRequests(r.data)),
        api.get('/agreements/my').then(r => setAgreements(r.data)),
        refreshUser(),
      ]),
    };
    fetches[tab]?.().finally(() => setLoading(false));
  }, [tab]);

  const addSkill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/skills', skillForm);
      setSkillForm({ skill: '', skillLevel: 'Intermediate', description: '', hourlyCreditRate: '' });
      api.get(`/users/${user._id}`).then(r => setUserSkills(r.data.userSkills));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add skill');
    }
  };

  const removeSkill = async (id) => {
    try {
      await api.delete(`/users/skills/${id}`);
      setUserSkills(s => s.filter(us => us._id !== id));
    } catch { alert('Failed to remove'); }
  };

  const activeAgreements = agreements.filter(a => a.status === 'active');
  const completedAgreements = agreements.filter(a => a.status === 'completed');

  return (
    <div className="container dashboard">
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text2)' }}>Welcome back, <strong>{user?.name}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-secondary">Edit Profile</Link>
          <Link to="/requests/new" className="btn btn-primary">+ Post Request</Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="dash-stats">
        <div className="stat-card card">
          <div className="stat-card-val accent2">◈ {user?.skillCreditBalance}</div>
          <div className="stat-card-label">Credit Balance</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-val">{user?.reputationScore?.toFixed(1)}</div>
          <div className="stat-card-label">Reputation Score</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-val">{user?.completedTasks}</div>
          <div className="stat-card-label">Tasks Completed</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card-val">{user?.avgRating ? user.avgRating.toFixed(1) + ' ★' : '—'}</div>
          <div className="stat-card-label">Average Rating</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {TABS.map(t => (
          <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="dash-content">

          {/* OVERVIEW */}
          {tab === 'Overview' && (
            <div className="overview-grid">
              <div className="card">
                <h3 className="rd-section-title">Active Agreements</h3>
                {activeAgreements.length === 0
                  ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No active agreements.</p>
                  : activeAgreements.map(a => (
                    <Link to={`/agreements/${a._id}`} key={a._id} className="dash-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.request?.title || 'Agreement'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          with {String(a.provider._id) === String(user._id) ? a.requester.name : a.provider.name}
                        </div>
                      </div>
                      <span className="info-val accent2">◈ {a.creditAmount}</span>
                    </Link>
                  ))
                }
              </div>

              <div className="card">
                <h3 className="rd-section-title">My Open Requests</h3>
                {myRequests.filter(r => r.status === 'open').length === 0
                  ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No open requests. <Link to="/requests/new">Post one →</Link></p>
                  : myRequests.filter(r => r.status === 'open').slice(0, 4).map(r => (
                    <Link to={`/requests/${r._id}`} key={r._id} className="dash-row">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </Link>
                  ))
                }
              </div>
            </div>
          )}

          {/* MY REQUESTS */}
          {tab === 'My Requests' && (
            <div className="card">
              <h3 className="rd-section-title">My Requests</h3>
              {myRequests.length === 0
                ? <div className="empty-state"><h3>No requests yet</h3><p><Link to="/requests/new">Post your first request →</Link></p></div>
                : myRequests.map(r => (
                  <Link to={`/requests/${r._id}`} key={r._id} className="dash-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.skill?.icon} {r.skill?.name} · {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="info-val accent2">◈ {r.creditOffer}</span>
                      <span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}

          {/* MY OFFERS */}
          {tab === 'My Offers' && (
            <div className="card">
              <h3 className="rd-section-title">Offers I've Made</h3>
              {myOffers.length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No offers sent yet. Browse <Link to="/requests">open requests</Link>.</p>
                : myOffers.map(o => (
                  <Link to={`/requests/${o.request?._id}`} key={o._id} className="dash-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{o.request?.title || 'Request'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className="info-val accent2">◈ {o.proposedCredits}</span>
                      <span className={`badge badge-${o.status === 'pending' ? 'open' : o.status === 'accepted' ? 'completed' : 'cancelled'}`}>{o.status}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}

          {/* AGREEMENTS */}
          {tab === 'Agreements' && (
            <div className="card">
              <h3 className="rd-section-title">Agreements</h3>
              {agreements.length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No agreements yet.</p>
                : agreements.map(a => (
                  <Link to={`/agreements/${a._id}`} key={a._id} className="dash-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{a.request?.title || 'Agreement'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {String(a.provider._id) === String(user._id) ? '▲ Provider' : '▼ Requester'} ·{' '}
                        with {String(a.provider._id) === String(user._id) ? a.requester?.name : a.provider?.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className="info-val accent2">◈ {a.creditAmount}</span>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}

          {/* TRANSACTIONS */}
          {tab === 'Transactions' && (
            <div className="card">
              <h3 className="rd-section-title">Transaction History</h3>
              {transactions.length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No transactions yet.</p>
                : transactions.map(t => {
                  const isIncoming = String(t.toUser?._id) === String(user._id) && t.type === 'transfer';
                  return (
                    <div key={t._id} className="dash-row">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{t.note || t.type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          {t.type === 'transfer'
                            ? `${t.fromUser?.name} → ${t.toUser?.name}`
                            : t.type
                          } · {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontFamily: 'Syne', color: isIncoming ? 'var(--success)' : 'var(--danger)' }}>
                        {isIncoming ? '+' : '-'}◈ {t.credits}
                      </span>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* SKILLS */}
          {tab === 'Skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <h3 className="rd-section-title">My Skills</h3>
                {userSkills.length === 0
                  ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No skills added yet.</p>
                  : userSkills.map(us => (
                    <div key={us._id} className="dash-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{us.skill.icon} {us.skill.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{us.skillLevel} · ◈ {us.hourlyCreditRate}/hr</div>
                        {us.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{us.description}</div>}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeSkill(us._id)}>Remove</button>
                    </div>
                  ))
                }
              </div>

              <div className="card">
                <h3 className="rd-section-title">Add a Skill</h3>
                <form onSubmit={addSkill}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Skill</label>
                      <select value={skillForm.skill} onChange={e => setSkillForm(f => ({ ...f, skill: e.target.value }))} required>
                        <option value="">Select…</option>
                        {allSkills.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select value={skillForm.skillLevel} onChange={e => setSkillForm(f => ({ ...f, skillLevel: e.target.value }))}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Expert</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Short Description</label>
                    <input placeholder="What can you do?" value={skillForm.description} onChange={e => setSkillForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Credit Rate (per hour)</label>
                    <input type="number" min="1" placeholder="e.g. 5" value={skillForm.hourlyCreditRate} onChange={e => setSkillForm(f => ({ ...f, hourlyCreditRate: e.target.value }))} required />
                  </div>
                  <button className="btn btn-primary">Add Skill</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
