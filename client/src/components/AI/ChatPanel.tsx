import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';
import './ChatPanel.css';

interface ChatPanelProps {
  cardId: string;
  cardTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ cardId, cardTitle, isOpen, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiAPI.chat({
        card_id: cardId,
        question: userMessage.content,
        user_id: user?._id || '',
        conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.answer
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please make sure the AI service is running and try again.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel glass-strong" id="ai-chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-ai-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="chat-title">AI Study Assistant</h3>
            <p className="chat-subtitle">Ask about: {cardTitle}</p>
          </div>
        </div>
        <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <Sparkles size={32} className="chat-welcome-icon" />
            <h4>Welcome to your AI Tutor!</h4>
            <p>Ask me anything about the materials in this card. I'll provide answers based on the content available.</p>
            <div className="chat-suggestions">
              <button className="chat-suggestion" onClick={() => setInput('Summarize the main topics in this card')}>
                📝 Summarize main topics
              </button>
              <button className="chat-suggestion" onClick={() => setInput('What are the key concepts I should understand?')}>
                💡 Key concepts
              </button>
              <button className="chat-suggestion" onClick={() => setInput('Create a study guide from these materials')}>
                📚 Create study guide
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <div className="chat-message-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="chat-message-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-avatar">
              <Bot size={16} />
            </div>
            <div className="chat-message-content">
              <div className="chat-typing">
                <Loader2 size={16} className="spinning" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="form-input chat-input"
          placeholder="Ask a question about this card..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
          id="chat-input"
        />
        <button
          className="btn btn-primary btn-icon chat-send"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          id="chat-send-btn"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
