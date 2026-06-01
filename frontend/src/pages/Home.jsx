import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const SKILLS = [
  { icon: '💻', label: 'Web Dev' },
  { icon: '🎨', label: 'Design' },
  { icon: '📚', label: 'Tutoring' },
  { icon: '🔧', label: 'Repair' },
  { icon: '🎬', label: 'Video' },
  { icon: '📊', label: 'Data' },
  { icon: '🎵', label: 'Music' },
  { icon: '✍️', label: 'Writing' },
];

const STEPS = [
  { n: '01', title: 'Post a request', desc: 'Describe what you need and offer skill credits.' },
  { n: '02', title: 'Get offers', desc: 'Skilled members propose to help, you negotiate terms.' },
  { n: '03', title: 'Work gets done', desc: 'Collaborate, complete the task, confirm delivery.' },
  { n: '04', title: 'Credits flow', desc: 'Credits transfer automatically. Reputation updates.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="hero-badge">✦ No money. Only skills.</div>
          <h1 className="hero-title">
            Trade skills.<br />
            Build trust.<br />
            <span className="hero-accent">Earn credits.</span>
          </h1>
          <p className="hero-sub">
            SkillBarter is a peer-to-peer skill exchange platform where expertise
            is the currency. Teach Python, get your logo designed. Fix laptops, learn video editing.
          </p>
          <div className="hero-ctas">
            {user ? (
              <>
                <Link to="/requests/new" className="btn btn-primary">Post a Request</Link>
                <Link to="/marketplace" className="btn btn-secondary">Browse Skills</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Start Bartering Free</Link>
                <Link to="/marketplace" className="btn btn-secondary">Browse Marketplace</Link>
              </>
            )}
          </div>
          <div className="hero-stat">
            <span>🎯 New members start with <strong>20 free credits</strong></span>
          </div>
        </div>
      </section>

      <section className="skills-scroll container">
        {SKILLS.map(s => (
          <div key={s.label} className="skill-chip">
            <span>{s.icon}</span> {s.label}
          </div>
        ))}
      </section>

      <section className="how-it-works container">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          {STEPS.map(s => (
            <div key={s.n} className="step">
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <h2>Ready to barter your skills?</h2>
          <p>Join the community where expertise flows freely.</p>
          <Link to="/register" className="btn btn-primary">Get started — it's free</Link>
        </div>
      </section>
    </div>
  );
}
