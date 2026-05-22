import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { discussionAPI } from '../../services/api';
import type { DiscussionMessage } from '../../types';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './DiscussionPanel.css';

interface Props {
  cardId: string;
  accessLevel: string;
}

export default function DiscussionPanel({ cardId, accessLevel }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canPost = accessLevel === 'owner' || accessLevel === 'granted' || accessLevel === 'approved';

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await discussionAPI.getMessages(cardId);
      setMessages(res.data.messages || []);
    } catch {
      if (!silent) toast.error('Failed to load discussion');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 10 seconds for new messages
    intervalRef.current = setInterval(() => fetchMessages(true), 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cardId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await discussionAPI.postMessage(cardId, input.trim());
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await discussionAPI.deleteMessage(cardId, msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) return <div className="discussion-loading"><div className="spinner" /></div>;

  return (
    <div className="discussion-panel">
      <div className="discussion-messages">
        {messages.length === 0 ? (
          <div className="discussion-empty">
            <MessageCircle size={40} className="discussion-empty-icon" />
            <p>No messages yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.author?._id === user?._id;
            const isOwner = accessLevel === 'owner';
            const canDelete = isMe || isOwner;
            return (
              <div key={msg._id} className={`discussion-message ${isMe ? 'mine' : 'theirs'}`}>
                {!isMe && (
                  <div className="discussion-avatar">
                    {msg.author?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="discussion-bubble-wrap">
                  {!isMe && (
                    <div className="discussion-author">
                      <span className="discussion-author-name">{msg.author?.name}</span>
                      <span className={`badge ${msg.author?.role === 'teacher' ? 'badge-violet' : 'badge-cyan'} badge-xs`}>
                        {msg.author?.role}
                      </span>
                    </div>
                  )}
                  <div className="discussion-bubble">
                    <p>{msg.content}</p>
                    <span className="discussion-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {canDelete && (
                    <button
                      className="discussion-delete"
                      onClick={() => handleDelete(msg._id)}
                      title="Delete message"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canPost ? (
        <div className="discussion-input-row">
          <textarea
            className="discussion-input"
            placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={2000}
          />
          <button
            className="btn btn-primary discussion-send"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? <span className="spinner spinner-sm" /> : <Send size={18} />}
          </button>
        </div>
      ) : (
        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '0.75rem' }}>
          You need access to this card to participate in the discussion.
        </p>
      )}
    </div>
  );
}
