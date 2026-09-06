import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { ArrowRight, Users, Clock, FileText, BarChart3, ShieldCheck, Zap, Globe, ChevronRight } from 'lucide-react';
import './LandingPage.css';

const BARS = [35, 55, 45, 70, 60, 85, 75, 90, 65, 80, 95, 88];

const FEATURES = [
  {
    icon: '👥',
    iconClass: 'lp-icon-indigo',
    title: 'Employee Management',
    desc: 'Centralised employee records, org charts, and department hierarchies — all in one place. Onboard in minutes.',
  },
  {
    icon: '💰',
    iconClass: 'lp-icon-emerald',
    title: 'Payroll Processing',
    desc: 'Automated payrun calculations with multi-currency support, tax handling, and one-click payslip distribution.',
  },
  {
    icon: '📅',
    iconClass: 'lp-icon-amber',
    title: 'Time Off & Leave',
    desc: 'Self-service leave requests, approval workflows, and real-time balance tracking for every leave type.',
  },
  {
    icon: '⏱️',
    iconClass: 'lp-icon-cyan',
    title: 'Attendance Tracking',
    desc: 'Geo-stamped clock-ins, schedule adherence, overtime calculations and detailed attendance analytics.',
  },
  {
    icon: '📄',
    iconClass: 'lp-icon-purple',
    title: 'Contracts & Offers',
    desc: 'Generate, track and e-sign employment contracts. Full lifecycle management from offer to termination.',
  },
  {
    icon: '🤖',
    iconClass: 'lp-icon-rose',
    title: 'AI Copilot',
    desc: 'Ask payroll questions in plain English. The built-in AI assistant handles reports, anomalies and summaries.',
  },
];

const TESTIMONIALS = [
  {
    stars: '★★★★★',
    quote: '"PeoplePay360 cut our monthly payroll processing time from two days to under two hours. The automation is incredible."',
    name: 'Sarah Chen',
    role: 'Head of HR · Nexus Dynamics',
    avatar: 'SC',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.2)',
  },
  {
    stars: '★★★★★',
    quote: '"The leave management module alone saved us from hundreds of manual emails. Everything is clean and self-service now."',
    name: 'Arjun Mehta',
    role: 'COO · CloudSprint Technologies',
    avatar: 'AM',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.2)',
  },
  {
    stars: '★★★★★',
    quote: '"Finally an HRMS that feels modern. The dark UI, speed, and the AI copilot — our finance team genuinely loves it."',
    name: 'Fatima Al-Rashid',
    role: 'Finance Director · Orbis Ventures',
    avatar: 'FR',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.2)',
  },
];

export const LandingPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/employees');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="lp-root">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-logo">
          <div className="lp-nav-logo-icon">P</div>
          PeoplePay<span style={{ color: '#a5b4fc' }}>360</span>
        </Link>

        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>

        <div className="lp-nav-actions">
          {isAuthenticated ? (
            <button className="lp-btn lp-btn-primary" onClick={() => navigate('/employees')}>
              <span>Go to Dashboard</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-ghost">Sign In</Link>
              <Link to="/login" className="lp-btn lp-btn-primary">
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-grid" />
          <div className="lp-hero-orb lp-orb-1" />
          <div className="lp-hero-orb lp-orb-2" />
          <div className="lp-hero-orb lp-orb-3" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <Zap size={11} />
            Enterprise HR & Payroll Platform
          </div>

          <h1 className="lp-hero-title">
            Run your entire<br />
            <span className="gradient-text">workforce & payroll</span><br />
            from one place.
          </h1>

          <p className="lp-hero-sub">
            PeoplePay360 unifies employee management, payroll automation, time-off tracking, and attendance
            into a single intelligent platform — built for growing teams.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary lp-btn-xl" onClick={handleGetStarted}>
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}</span>
              <ArrowRight size={16} />
            </button>
            <a href="#features" className="lp-btn-outline-xl lp-btn">
              <span>See Features</span>
            </a>
          </div>

          <div className="lp-hero-social-proof">
            <div className="lp-avatar-stack">
              {[
                { t: 'AK', c: '#6366f1', b: 'rgba(99,102,241,0.2)' },
                { t: 'SR', c: '#10b981', b: 'rgba(16,185,129,0.2)' },
                { t: 'MR', c: '#f59e0b', b: 'rgba(245,158,11,0.2)' },
                { t: '+', c: '#8b5cf6', b: 'rgba(139,92,246,0.2)' },
              ].map((a, i) => (
                <div
                  key={i}
                  className="lp-av"
                  style={{ background: a.b, color: a.c }}
                >
                  {a.t}
                </div>
              ))}
            </div>
            <span>Trusted by <strong style={{ color: '#94a3b8' }}>500+</strong> companies worldwide</span>
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview Mock ── */}
      <div className="lp-dashboard-preview lp-float" style={{ marginTop: '-40px', marginBottom: '80px' }}>
        <div className="lp-dashboard-frame">
          <div className="lp-dashboard-topbar">
            <div className="lp-dot lp-dot-r" />
            <div className="lp-dot lp-dot-y" />
            <div className="lp-dot lp-dot-g" />
            <span className="lp-dash-title">PeoplePay360 — Payroll Dashboard</span>
          </div>
          <div className="lp-dashboard-body">
            <div className="lp-stat-card">
              <div className="lp-stat-label">Total Employees</div>
              <div className="lp-stat-val lp-c-indigo">248</div>
              <div className="lp-stat-sub">↑ 12 this month</div>
            </div>
            <div className="lp-stat-card">
              <div className="lp-stat-label">Payroll Processed</div>
              <div className="lp-stat-val lp-c-emerald">$1.4M</div>
              <div className="lp-stat-sub">This pay cycle</div>
            </div>
            <div className="lp-stat-card">
              <div className="lp-stat-label">Leave Requests</div>
              <div className="lp-stat-val lp-c-amber">18</div>
              <div className="lp-stat-sub">4 pending review</div>
            </div>
            <div className="lp-stat-card">
              <div className="lp-stat-label">Attendance Rate</div>
              <div className="lp-stat-val lp-c-rose">96.4%</div>
              <div className="lp-stat-sub">vs 94.1% last month</div>
            </div>

            {/* Bar chart */}
            <div className="lp-chart-row">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="lp-bar"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Employee list */}
            <div className="lp-list-row">
              <div className="lp-list-header">
                <span>Employee</span>
                <span>Department</span>
                <span>Net Pay</span>
                <span>Status</span>
              </div>
              {[
                { n: 'Aisha Rahman', d: 'Engineering', p: '$5,200', s: 'green', st: 'Paid' },
                { n: 'Carlos Vega', d: 'Marketing', p: '$3,800', s: 'blue', st: 'Processed' },
                { n: 'Priya Nair', d: 'Finance', p: '$4,600', s: 'amber', st: 'Pending' },
                { n: 'Jake Morrison', d: 'Design', p: '$4,100', s: 'green', st: 'Paid' },
              ].map((e, i) => (
                <div key={i} className="lp-list-item">
                  <span className="emp-name">{e.n}</span>
                  <span>{e.d}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{e.p}</span>
                  <span className={`lp-pill lp-pill-${e.s}`}>{e.st}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="lp-divider" />
      <div className="lp-stats">
        {[
          { big: '500+', desc: 'Companies onboarded' },
          { big: '50K+', desc: 'Employees managed' },
          { big: '$200M+', desc: 'Payroll processed' },
          { big: '99.9%', desc: 'Platform uptime SLA' },
        ].map((s, i) => (
          <div key={i} className="lp-stat-item">
            <div className="lp-stat-big">{s.big}</div>
            <div className="lp-stat-desc">{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="lp-divider" />

      {/* ── Features ── */}
      <section id="features" className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-eyebrow">
            <BarChart3 size={12} style={{ display: 'inline', marginRight: 4 }} />
            Everything you need
          </div>
          <h2 className="lp-section-title">
            The complete HR & payroll<br />operating system
          </h2>
          <p className="lp-section-sub">
            From hiring to retirement — PeoplePay360 handles every step of the employee lifecycle with
            intelligent automation and real-time insights.
          </p>
        </div>

        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className={`lp-feature-icon ${f.iconClass}`}>{f.icon}</div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" />

      {/* ── Testimonials ── */}
      <section id="testimonials" className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-eyebrow">
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
            Customer stories
          </div>
          <h2 className="lp-section-title">Loved by HR teams globally</h2>
          <p className="lp-section-sub">
            See why hundreds of companies chose PeoplePay360 to modernise their workforce operations.
          </p>
        </div>

        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="lp-testimonial-card">
              <div className="lp-stars">{t.stars}</div>
              <p className="lp-testimonial-quote">{t.quote}</p>
              <div className="lp-testimonial-author">
                <div
                  className="lp-testimonial-avatar"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="lp-testimonial-name">{t.name}</div>
                  <div className="lp-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" />

      {/* ── CTA ── */}
      <section id="pricing" className="lp-cta-section">
        <div className="lp-cta-bg" />
        <div className="lp-cta-content">
          <div className="lp-hero-badge" style={{ marginBottom: '1.5rem' }}>
            <Globe size={11} />
            Start today — no credit card required
          </div>
          <h2 className="lp-cta-title">
            Ready to streamline<br />
            <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 40%, #f0abfc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              your workforce?
            </span>
          </h2>
          <p className="lp-cta-sub">
            Join 500+ companies using PeoplePay360. Get full access to all features instantly.
            Cancel anytime.
          </p>
          <div className="lp-cta-actions">
            <button className="lp-btn lp-btn-primary lp-btn-xl" onClick={handleGetStarted}>
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={16} />
            </button>
            <Link to="/login" className="lp-btn lp-btn-outline-xl lp-btn">
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="lp-divider" />
      <footer className="lp-footer">
        <div className="lp-footer-copy">
          © {new Date().getFullYear()} PeoplePay360. All rights reserved.
        </div>
        <div className="lp-footer-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
};
