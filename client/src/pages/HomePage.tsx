import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap, Shield, Brain, BookOpen, ArrowRight,
  Sparkles, Lock, Unlock, CheckCircle2, Users
} from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Learning Platform</span>
          </div>

          <h1 className="hero-title">
            The Future of{' '}
            <span className="text-gradient">Secure Knowledge</span>
            {' '}Sharing
          </h1>

          <p className="hero-subtitle">
            Institute Card Network modernizes how educational materials are distributed.
            Teachers create encapsulated "Cards" and students request access —
            supercharged by an embedded AI study assistant.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg" id="hero-dashboard-btn">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg" id="hero-register-btn">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-ghost btn-lg" id="hero-login-btn">
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Secure</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">AI</span>
              <span className="hero-stat-label">Powered</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">24/7</span>
              <span className="hero-stat-label">Study Help</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2 className="section-title">Why <span className="text-gradient">Institute Card Network</span>?</h2>
        <p className="section-subtitle">A complete ecosystem for secure, intelligent learning</p>

        <div className="features-grid">
          <div className="feature-card glass" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <BookOpen size={24} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h3>Card Creation Engine</h3>
            <p>Bundle PDFs, videos, images and text into beautiful, organized topic cards.</p>
          </div>

          <div className="feature-card glass" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Shield size={24} style={{ color: 'var(--accent-violet)' }} />
            </div>
            <h3>Access Loop Security</h3>
            <p>Students must request access. Teachers approve or deny, maintaining full control.</p>
          </div>

          <div className="feature-card glass" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Brain size={24} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <h3>AI Study Assistant</h3>
            <p>Google Gemini AI trained on your exact materials for contextual tutoring.</p>
          </div>

          <div className="feature-card glass" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon" style={{ background: 'rgba(244, 63, 94, 0.15)' }}>
              <Users size={24} style={{ color: 'var(--accent-rose)' }} />
            </div>
            <h3>Role-Based Access</h3>
            <p>Separate dashboards for teachers and students with tailored experiences.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <h2 className="section-title">The <span className="text-gradient-secondary">Access Loop</span></h2>
        <p className="section-subtitle">A four-step workflow that enforces secure knowledge distribution</p>

        <div className="steps-container">
          <div className="step glass" style={{ animationDelay: '0.1s' }}>
            <div className="step-number">1</div>
            <div className="step-icon"><BookOpen size={20} /></div>
            <h4>Teacher Creates</h4>
            <p>Bundle resources into a cohesive topic card and publish it.</p>
          </div>

          <div className="step-arrow"><ArrowRight size={20} /></div>

          <div className="step glass" style={{ animationDelay: '0.2s' }}>
            <div className="step-number">2</div>
            <div className="step-icon"><Lock size={20} /></div>
            <h4>Student Requests</h4>
            <p>Students discover cards and submit access requests with a message.</p>
          </div>

          <div className="step-arrow"><ArrowRight size={20} /></div>

          <div className="step glass" style={{ animationDelay: '0.3s' }}>
            <div className="step-number">3</div>
            <div className="step-icon"><CheckCircle2 size={20} /></div>
            <h4>Teacher Approves</h4>
            <p>Teachers review requests and grant or deny access instantly.</p>
          </div>

          <div className="step-arrow"><ArrowRight size={20} /></div>

          <div className="step glass" style={{ animationDelay: '0.4s' }}>
            <div className="step-number">4</div>
            <div className="step-icon"><Unlock size={20} /></div>
            <h4>Student Unlocks</h4>
            <p>Access the full card materials and chat with the AI tutor.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card glass">
          <GraduationCap size={48} className="cta-icon" />
          <h2>Ready to Transform Learning?</h2>
          <p>Join the Institute Card Network and experience the future of secure, AI-powered education.</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Account <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>Built for the future of isolated, secure knowledge sharing.</p>
        <p className="text-xs text-muted">Institute Card Network © 2026</p>
      </footer>
    </div>
  );
}
