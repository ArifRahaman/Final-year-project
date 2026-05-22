import { useState } from 'react';
import { Lock, Unlock, Clock, FileText, Image, Video, File, Tag, User } from 'lucide-react';
import type { Card } from '../../types';
import { useNavigate } from 'react-router-dom';
import './CardPreview.css';

interface CardPreviewProps {
  card: Card;
  accessLevel?: string;
  showCreator?: boolean;
}

export default function CardPreview({ card, accessLevel = 'none', showCreator = true }: CardPreviewProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={14} />;
      case 'image': return <Image size={14} />;
      case 'video': return <Video size={14} />;
      default: return <File size={14} />;
    }
  };

  const getAccessBadge = () => {
    switch (accessLevel) {
      case 'owner': return <span className="badge badge-violet">Owner</span>;
      case 'granted':
      case 'approved': return <span className="badge badge-emerald"><Unlock size={12} /> Unlocked</span>;
      case 'pending': return <span className="badge badge-amber"><Clock size={12} /> Pending</span>;
      default: return <span className="badge badge-rose"><Lock size={12} /> Locked</span>;
    }
  };

  const resourceTypes = [...new Set(card.resources.map(r => r.type))];

  return (
    <div
      className={`card-preview glass ${isHovered ? 'hovered' : ''}`}
      onClick={() => navigate(`/cards/${card._id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      id={`card-${card._id}`}
    >
      <div className="card-preview-header">
        <span className="card-subject badge badge-cyan">{card.subject}</span>
        {getAccessBadge()}
      </div>

      <h3 className="card-preview-title">{card.title}</h3>
      <p className="card-preview-desc">{card.description}</p>

      {card.tags.length > 0 && (
        <div className="card-preview-tags">
          <Tag size={12} className="text-muted" />
          {card.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="card-tag">{tag}</span>
          ))}
          {card.tags.length > 3 && <span className="card-tag">+{card.tags.length - 3}</span>}
        </div>
      )}

      <div className="card-preview-footer">
        {showCreator && card.creator && (
          <div className="card-creator">
            <div className="card-creator-avatar">
              {card.creator.name?.charAt(0).toUpperCase()}
            </div>
            <span className="card-creator-name">{card.creator.name}</span>
          </div>
        )}
        <div className="card-resources-info">
          {resourceTypes.map((type, i) => (
            <span key={i} className="resource-type-icon" title={type}>
              {getResourceIcon(type)}
            </span>
          ))}
          <span className="resource-count">{card.resources.length} files</span>
        </div>
      </div>

      <div className="card-preview-shine" />
    </div>
  );
}
