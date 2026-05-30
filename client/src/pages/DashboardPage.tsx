import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, cardsAPI } from '../services/api';
import type { DashboardStats, Card } from '../types';
import CardPreview from '../components/Cards/CardPreview';
import {
  LayoutDashboard, BookOpen, Clock, Users, CheckCircle2,
  PlusCircle, ArrowRight, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCards, setRecentCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, cardsRes] = await Promise.all([
        usersAPI.getDashboardStats(),
        user?.role === 'teacher'
          ? cardsAPI.getMyCards()
          : cardsAPI.getAll({ page: 1 })
      ]);
      setStats(statsRes.data);
      const cards = user?.role === 'teacher'
        ? (cardsRes.data as Card[]).slice(0, 4)
        : (cardsRes.data as any).cards?.slice(0, 4) || [];
      setRecentCards(cards);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loader"><div className="spinner" /></div>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="dashboard-page" id="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <LayoutDashboard size={28} />
            Welcome back, <span className="text-gradient">{user?.name}</span>
          </h1>
          <p className="dashboard-subtitle">
            {isTeacher
              ? 'Manage your cards and student access requests'
              : 'Discover new cards and track your learning'}
          </p>
        </div>
        {isTeacher && (
          <Link to="/create-card" className="btn btn-primary" id="create-card-btn">
            <PlusCircle size={18} /> Create Card
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {isTeacher ? (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                <BookOpen size={22} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {stats?.totalCards || 0}
              </div>
              <div className="stat-label">Cards Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <Clock size={22} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {stats?.pendingRequests || 0}
              </div>
              <div className="stat-label">Pending Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle2 size={22} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {stats?.approvedRequests || 0}
              </div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <Users size={22} style={{ color: 'var(--accent-violet)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-violet)' }}>
                {stats?.totalStudentsWithAccess || 0}
              </div>
              <div className="stat-label">Students Reached</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle2 size={22} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {stats?.approvedCards || 0}
              </div>
              <div className="stat-label">Unlocked Cards</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <Clock size={22} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {stats?.pendingRequests || 0}
              </div>
              <div className="stat-label">Pending Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                <TrendingUp size={22} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {stats?.totalAvailableCards || 0}
              </div>
              <div className="stat-label">Available Cards</div>
            </div>
          </>
        )}
      </div>

      {/* Recent Cards */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>{isTeacher ? 'Your Recent Cards' : 'Discover Cards'}</h2>
          <Link to={isTeacher ? '/browse' : '/browse'} className="btn btn-ghost btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {recentCards.length > 0 ? (
          <div className="card-grid">
            {recentCards.map((card) => (
              <CardPreview key={card._id} card={card} accessLevel={isTeacher ? 'owner' : 'none'} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass">
            <BookOpen size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">
              {isTeacher ? 'No cards yet' : 'No cards available'}
            </h3>
            <p className="empty-state-desc">
              {isTeacher
                ? 'Create your first card to start sharing knowledge!'
                : 'Check back soon for new learning materials.'}
            </p>
            {isTeacher && (
              <Link to="/create-card" className="btn btn-primary mt-md">
                <PlusCircle size={16} /> Create Your First Card
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
