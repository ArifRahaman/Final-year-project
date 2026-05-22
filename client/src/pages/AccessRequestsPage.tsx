import { useState, useEffect } from 'react';
import { accessAPI } from '../services/api';
import type { AccessRequest } from '../types';
import { ClipboardList, CheckCircle2, XCircle, Clock, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './AccessRequestsPage.css';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await accessAPI.getTeacherRequests();
      setRequests(res.data);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await accessAPI.handleRequest(requestId, status);
      toast.success(`Request ${status}!`);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update request');
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="requests-page" id="access-requests">
      <div className="requests-page-header">
        <h1><ClipboardList size={28} /> Access <span className="text-gradient">Requests</span></h1>
        <p className="text-muted">Review and manage student access requests for your cards</p>
      </div>

      <div className="library-filters">
        {['pending', 'all', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            className={`btn btn-ghost btn-sm ${filter === f ? 'active-filter' : ''}`}
            onClick={() => setFilter(f as any)}
          >
            {f === 'pending' && <Clock size={14} />}
            {f === 'approved' && <CheckCircle2 size={14} />}
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
        <div className="requests-list-page">
          {filtered.map((req) => (
            <div key={req._id} className="request-card glass">
              <div className="request-card-header">
                <div className="request-card-student">
                  <div className="card-creator-avatar">{req.student?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{req.student?.name}</strong>
                    <span className="text-sm text-muted">{req.student?.email}</span>
                    {req.student?.institution && (
                      <span className="text-xs text-muted"> • {req.student.institution}</span>
                    )}
                  </div>
                </div>
                <span className={`badge ${
                  req.status === 'approved' ? 'badge-emerald' :
                  req.status === 'pending' ? 'badge-amber' : 'badge-rose'
                }`}>
                  {req.status}
                </span>
              </div>

              <div className="request-card-body">
                <div className="request-card-target"
                  onClick={() => navigate(`/cards/${req.card?._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  📚 <strong>{req.card?.title}</strong>
                  <span className="text-sm text-muted"> — {req.card?.subject}</span>
                </div>
                {req.message && (
                  <p className="request-card-message">"{req.message}"</p>
                )}
                <span className="text-xs text-muted">
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </div>

              {req.status === 'pending' && (
                <div className="request-card-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleRequest(req._id, 'approved')}>
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRequest(req._id, 'rejected')}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass">
          <Inbox size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No requests</h3>
          <p className="empty-state-desc">
            {filter === 'pending'
              ? "No pending requests at the moment. Students will appear here when they request access to your cards."
              : `No ${filter} requests found.`}
          </p>
        </div>
      )}
    </div>
  );
}
