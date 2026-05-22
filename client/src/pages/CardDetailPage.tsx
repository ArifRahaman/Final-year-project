import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cardsAPI, accessAPI } from '../services/api';
import type { Card, AccessRequest as AccessReq } from '../types';
import ChatPanel from '../components/AI/ChatPanel';
import QuizPanel from '../components/Quiz/QuizPanel';
import DiscussionPanel from '../components/Chat/DiscussionPanel';
import {
  ArrowLeft, FileText, Image, Video, File,
  Lock, Unlock, Clock, Send, Sparkles, Users, Trash2,
  CheckCircle2, XCircle, ExternalLink, BookOpen, MessageCircle, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import './CardDetailPage.css';

type Tab = 'resources' | 'quiz' | 'discussion';

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [accessLevel, setAccessLevel] = useState('none');
  const [loading, setLoading] = useState(true);
  const [requestMsg, setRequestMsg] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [requests, setRequests] = useState<AccessReq[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('resources');

  // Quick Upload State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      const res = await cardsAPI.getById(id!);
      setCard(res.data.card);
      setAccessLevel(res.data.accessLevel);

      if (res.data.accessLevel === 'owner') {
        try {
          const reqRes = await accessAPI.getCardRequests(id!);
          setRequests(reqRes.data);
        } catch (e) {}
      }
    } catch (error) {
      toast.error('Card not found');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append('files', file);
      });

      await cardsAPI.update(id!, formData);
      toast.success('Files uploaded successfully!');

      // Clear input & refresh card
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchCard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      await accessAPI.requestAccess(id!, requestMsg);
      toast.success('Access request sent!');
      setAccessLevel('pending');
      setRequestMsg('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await accessAPI.handleRequest(requestId, status);
      toast.success(`Request ${status}!`);
      fetchCard();
    } catch (error) {
      toast.error('Failed to update request');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) return;
    try {
      await cardsAPI.delete(id!);
      toast.success('Card deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete card');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} />;
      case 'image': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      default: return <File size={20} />;
    }
  };

  const canViewResources = accessLevel === 'owner' || accessLevel === 'granted' || accessLevel === 'approved';

  if (loading) {
    return <div className="detail-page"><div className="loader"><div className="spinner" /></div></div>;
  }

  if (!card) return null;

  return (
    <div className="detail-page" id="card-detail">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="detail-layout">
        <div className="detail-main">
          {/* Card Header */}
          <div className="detail-header glass">
            <div className="detail-header-top">
              <span className="badge badge-cyan">{card.subject}</span>
              {accessLevel === 'owner' && <span className="badge badge-violet">Your Card</span>}
              {accessLevel === 'granted' && <span className="badge badge-emerald"><Unlock size={12} /> Unlocked</span>}
              {accessLevel === 'pending' && <span className="badge badge-amber"><Clock size={12} /> Pending</span>}
              {accessLevel === 'none' && <span className="badge badge-rose"><Lock size={12} /> Locked</span>}
            </div>

            <h1 className="detail-title">{card.title}</h1>
            <p className="detail-desc">{card.description}</p>

            {card.tags.length > 0 && (
              <div className="detail-tags">
                {card.tags.map((tag, i) => (
                  <span key={i} className="card-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-meta">
              <div className="detail-creator">
                <div className="card-creator-avatar">{card.creator?.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="detail-creator-name">{card.creator?.name}</span>
                  <span className="detail-creator-role">{card.creator?.role}</span>
                </div>
              </div>
              <div className="detail-stats-row">
                <span><Users size={14} /> {card.accessCount} students</span>
                <span><FileText size={14} /> {card.resources.length} resources</span>
              </div>
            </div>

            {/* Owner actions */}
            {accessLevel === 'owner' && (
              <div className="detail-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRequests(!showRequests)}>
                  <Users size={16} /> {showRequests ? 'Hide' : 'View'} Requests ({requests.filter(r => r.status === 'pending').length} pending)
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/edit-card/${id}`)}>
                  <BookOpen size={16} /> Edit Card
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <Trash2 size={16} /> Delete Card
                </button>
              </div>
            )}
          </div>

          {/* Access Request Panel (for students) */}
          {accessLevel === 'none' && user?.role === 'student' && (
            <div className="request-panel glass">
              <h3><Lock size={18} /> Request Access</h3>
              <p>Send a message to the teacher explaining why you need access to this card.</p>
              <textarea
                className="form-textarea"
                placeholder="Hi, I'm interested in this material because..."
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
                rows={3}
              />
              <button className="btn btn-primary" onClick={handleRequestAccess} disabled={requesting}>
                {requesting ? <span className="spinner spinner-sm" /> : <><Send size={16} /> Send Request</>}
              </button>
            </div>
          )}

          {accessLevel === 'pending' && (
            <div className="request-panel glass">
              <Clock size={24} style={{ color: 'var(--accent-amber)' }} />
              <h3>Access Pending</h3>
              <p>Your request has been sent. You'll gain access once the teacher approves it.</p>
            </div>
          )}

          {/* Teacher Requests */}
          {showRequests && requests.length > 0 && (
            <div className="requests-panel glass">
              <h3>Student Requests</h3>
              <div className="requests-list">
                {requests.map((req) => (
                  <div key={req._id} className="request-item">
                    <div className="request-student">
                      <div className="card-creator-avatar">{req.student?.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong>{req.student?.name}</strong>
                        <span className="text-sm text-muted">{req.student?.email}</span>
                        {req.message && <p className="request-message">"{req.message}"</p>}
                      </div>
                    </div>
                    <div className="request-actions">
                      {req.status === 'pending' ? (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleRequest(req._id, 'approved')}>
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRequest(req._id, 'rejected')}>
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${req.status === 'approved' ? 'badge-emerald' : 'badge-rose'}`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          {canViewResources && (
            <div className="detail-tabs">
              <button
                className={`detail-tab ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
                id="tab-resources"
              >
                <FileText size={15} /> Resources
              </button>
              <button
                className={`detail-tab ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
                id="tab-quiz"
              >
                <BookOpen size={15} /> Quiz
              </button>
              <button
                className={`detail-tab ${activeTab === 'discussion' ? 'active' : ''}`}
                onClick={() => setActiveTab('discussion')}
                id="tab-discussion"
              >
                <MessageCircle size={15} /> Discussion
              </button>
            </div>
          )}

          {/* Tab Content */}
          {canViewResources && activeTab === 'resources' && (
            <div className="resources-section">
              {card.resources.length > 0 ? (
                <div className="resources-list mb-lg">
                  {card.resources.map((resource) => (
                    <div key={resource._id} className="resource-item glass">
                      <div className="resource-icon">{getResourceIcon(resource.type)}</div>
                      <div className="resource-info">
                        <span className="resource-name">{resource.originalName}</span>
                        <span className="resource-meta">
                          {resource.type.toUpperCase()} • {(resource.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <a
                        href={`http://localhost:5000${resource.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        <ExternalLink size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-lg">No resources uploaded yet.</p>
              )}

              {/* Quick Upload for Owner */}
              {accessLevel === 'owner' && (
                <div className="quick-upload glass mb-lg" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--accent-violet)' }}>
                  <input type="file" ref={fileInputRef} multiple onChange={handleQuickUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.txt,.md,.doc,.docx,.ppt,.pptx"
                    style={{ display: 'none' }} />
                  {uploadingFile ? (
                    <div><span className="spinner" /> <p className="text-sm mt-sm">Uploading...</p></div>
                  ) : (
                    <div style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                      <Upload size={24} style={{ margin: '0 auto 8px', color: 'var(--accent-violet)' }} />
                      <h4 className="text-sm font-semibold">Quick Upload PDFs</h4>
                      <p className="text-xs text-muted mt-2">Click to directly add more files to this card.</p>
                    </div>
                  )}
                </div>
              )}

              {card.textContent && (
                <div className="text-content glass">
                  <h3>Text Content</h3>
                  <div className="text-content-body">{card.textContent}</div>
                </div>
              )}
            </div>
          )}

          {canViewResources && activeTab === 'quiz' && (
            <QuizPanel cardId={card._id} accessLevel={accessLevel} />
          )}

          {canViewResources && activeTab === 'discussion' && (
            <DiscussionPanel cardId={card._id} accessLevel={accessLevel} />
          )}

          {/* Also show for locked users but tab is hidden — show discussion hint */}
          {!canViewResources && accessLevel === 'none' && (
            <div className="discussion-locked-hint glass">
              <MessageCircle size={20} />
              <span>Request access to join the discussion and view resources.</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat FAB */}
      {canViewResources && (
        <button
          className="chat-fab btn btn-primary"
          onClick={() => setChatOpen(!chatOpen)}
          id="ai-chat-fab"
        >
          <Sparkles size={20} />
          <span>AI Tutor</span>
        </button>
      )}

      {/* Chat Panel */}
      <ChatPanel
        cardId={card._id}
        cardTitle={card.title}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
