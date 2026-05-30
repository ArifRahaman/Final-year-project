import { useState, useEffect } from 'react';
import { cardsAPI } from '../services/api';
import type { Card } from '../types';
import CardPreview from '../components/Cards/CardPreview';
import { Search, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './BrowsePage.css';

export default function BrowsePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCards();
  }, [page, subject]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (subject) params.subject = subject;
      const res = await cardsAPI.getAll(params);
      setCards(res.data.cards);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards();
  };

  return (
    <div className="browse-page" id="browse-page">
      <div className="browse-header">
        <h1><BookOpen size={28} /> <span className="text-gradient">Discover</span> Cards</h1>
        <p className="text-muted">Browse course containers from teachers across the network</p>
      </div>

      <form className="browse-search glass" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text" className="form-input search-main-input"
            placeholder="Search cards by title, subject, or tags..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            id="browse-search"
          />
        </div>
        <input type="text" className="form-input subject-filter"
          placeholder="Filter by subject" value={subject}
          onChange={(e) => setSubject(e.target.value)} id="browse-subject"
        />
        <button type="submit" className="btn btn-primary" id="browse-submit">
          <Search size={16} /> Search
        </button>
      </form>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : cards.length > 0 ? (
        <>
          <div className="card-grid">
            {cards.map((card, i) => (
              <div key={card._id} style={{ animationDelay: `${i * 0.05}s` }}>
                <CardPreview card={card} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state glass">
          <BookOpen size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No cards found</h3>
          <p className="empty-state-desc">Try adjusting your search or check back later for new content.</p>
        </div>
      )}
    </div>
  );
}
