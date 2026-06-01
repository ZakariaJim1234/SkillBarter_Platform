import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function NewRequest() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', skill: '', creditOffer: '', deadline: ''
  });

  useEffect(() => { api.get('/skills').then(r => setSkills(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(form.creditOffer) > user.skillCreditBalance) {
      toast.error('Insufficient credits');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/requests', form);
      await refreshUser();
      toast.success('Request posted! Credits reserved.');
      navigate(`/requests/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640, padding: '40px 24px' }}>
      <div className="page-header">
        <h1>Post a Request</h1>
        <p style={{ color: 'var(--text2)' }}>Your balance: <strong style={{ color: 'var(--accent2)' }}>◈ {user?.skillCreditBalance}</strong></p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              placeholder="e.g. Need help fixing my React app"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={5}
              placeholder="Describe what you need in detail…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Skill Category</label>
              <select
                value={form.skill}
                onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}
                required
              >
                <option value="">Select skill…</option>
                {skills.map(s => (
                  <option key={s._id} value={s._id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Credit Offer</label>
              <input
                type="number" min="1" max={user?.skillCreditBalance}
                placeholder="e.g. 5"
                value={form.creditOffer}
                onChange={e => setForm(f => ({ ...f, creditOffer: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Deadline (optional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            Credits will be reserved and transferred to the provider after completion.
          </p>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
            {loading ? 'Posting…' : 'Post Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
