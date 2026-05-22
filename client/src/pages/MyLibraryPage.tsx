import { useState, useEffect } from 'react';
import { accessAPI } from '../services/api';
import type { AccessRequest } from '../types';
import { Library, Clock, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './MyLibraryPage.css';

export default function MyLibraryPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await accessAPI.getMyRequests();
      setRequests(res.data);
    } catch (error) {
      toast.error('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />;
      case 'pending': return <Clock size={16} style={{ color: 'var(--accent-amber)' }} />;
      case 'rejected': return <XCircle size={16} style={{ color: 'var(--accent-rose)' }} />;
      default: return null;
    }
  };

  return (
    <div className="library-page" id="my-library">
      <div className="library-header">
        <h1><Library size={28} /> My <span className="text-gradient">Library</span></h1>
        <p className="text-muted">Track your access requests and unlocked cards</p>
      </div>

      <div className="library-filters">
        {['all', 'approved', 'pending', 'rejected'].map((f) => (
          <button
            key={f}
            className={`btn btn-ghost btn-sm ${filter === f ? 'active-filter' : ''}`}
            onClick={() => setFilter(f as any)}
          >
            {f === 'approved' && <CheckCircle2 size={14} />}
            {f === 'pending' && <Clock size={14} />}
            {f === 'rejected' && <XCircle size={14} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">
              {f === 'all' ? requests.length : requests.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : filtered.length > 0 ? (
        <div className="library-list">
          {filtered.map((req) => (
            <div
              key={req._id}
              className="library-item glass"
              onClick={() => req.status === 'approved' ? navigate(`/cards/${req.card._id}`) : null}
              style={{ cursor: req.status === 'approved' ? 'pointer' : 'default' }}
            >
              <div className="library-item-main">
                <div className="library-item-status">{getStatusIcon(req.status)}</div>
                <div className="library-item-info">
                  <h3>{req.card?.title || 'Untitled Card'}</h3>
                  <p className="text-sm text-muted">
                    {req.card?.subject} • by {req.card?.creator?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="library-item-right">
                <span className={`badge ${
                  req.status === 'approved' ? 'badge-emerald' :
                  req.status === 'pending' ? 'badge-amber' : 'badge-rose'
                }`}>
                  {req.status}
                </span>
                <span className="text-xs text-muted">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass">
          <BookOpen size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No cards here</h3>
          <p className="empty-state-desc">
            {filter === 'all'
              ? "You haven't requested access to any cards yet. Browse available cards to get started!"
              : `No ${filter} requests found.`}
          </p>
        </div>
      )}
    </div>
  );
}
