import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const { user: authUser, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', contactEmail: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  const isOwn = authUser && authUser._id === id;

  const load = () => {
    api.get(`/users/${id}`)
      .then(r => {
        setData(r.data);
        setEditForm({
          name: r.data.user.name || '',
          bio: r.data.user.bio || '',
          location: r.data.user.location || '',
          contactEmail: r.data.user.contactEmail || '',
          avatar: r.data.user.avatar || '',
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', editForm);
      await refreshUser();
      await load();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!data) return <div className="container"><p>User not found</p></div>;

  const { user, userSkills, reviews } = data;

  return (
    <div className="container profile-page">
      <div className="profile-header card">
        <div className="profile-avatar-wrap">
          {user.avatar
            ? <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
            : <div className="profile-avatar-placeholder">{user.name[0]}</div>
          }
        </div>

        {editing ? (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="grid-2">
              <div className="form-group">
                <label>Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input placeholder="City, Country" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                placeholder="Public email for skill requests"
                value={editForm.contactEmail}
                onChange={e => setEditForm(f => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Avatar URL</label>
              <input placeholder="https://…" value={editForm.avatar} onChange={e => setEditForm(f => ({ ...f, avatar: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows={3} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              <h1>{user.name}</h1>
              {isOwn && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
              )}
            </div>
            {user.location && <p className="profile-location">📍 {user.location}</p>}
            {user.contactEmail && (
              <p className="profile-contact">
                Contact: <a href={`mailto:${user.contactEmail}`}>{user.contactEmail}</a>
              </p>
            )}
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            {isOwn && (!user.bio || !user.location || !user.contactEmail) && (
              <p className="profile-missing">
                Add your bio, location, and contact email so members can learn about you from the marketplace.
              </p>
            )}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-val accent2">◈ {user.reputationScore.toFixed(1)}</span>
                <span className="stat-label">Reputation</span>
              </div>
              <div className="stat">
                <span className="stat-val">{user.completedTasks}</span>
                <span className="stat-label">Tasks done</span>
              </div>
              <div className="stat">
                <span className="stat-val">{user.avgRating ? user.avgRating.toFixed(1) : '—'}</span>
                <span className="stat-label">Avg rating</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="profile-body">
        <div className="card profile-skills">
          <h3 className="rd-section-title">Skills Offered</h3>
          {userSkills.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>
              No skills listed.{isOwn && <> <a href="/dashboard">Add skills in your dashboard →</a></>}
            </p>
          ) : (
            <div className="skill-list">
              {userSkills.map(us => (
                <div key={us._id} className="skill-item">
                  <div className="skill-top">
                    <span className="skill-name">{us.skill.icon} {us.skill.name}</span>
                    <span className="skill-level">{us.skillLevel}</span>
                    <span className="skill-rate">◈ {us.hourlyCreditRate}/hr</span>
                  </div>
                  {us.description && <p className="skill-desc">{us.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card profile-reviews">
          <h3 className="rd-section-title">Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>No reviews yet.</p>
          ) : (
            <div className="review-list">
              {reviews.map(r => (
                <div key={r._id} className="review-item">
                  <div className="review-header">
                    <div className="poster-avatar">{r.reviewer.name[0]}</div>
                    <div>
                      <strong style={{ fontSize: 14 }}>{r.reviewer.name}</strong>
                      <div className="star-row">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={i <= r.rating ? 'star' : 'star-empty'}>★</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
