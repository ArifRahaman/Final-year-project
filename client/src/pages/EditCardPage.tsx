import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cardsAPI } from '../services/api';
import { Save, Upload, X, Tag, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './EditCardPage.css';

export default function EditCardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subject: '', textContent: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Existing files on the server (we only show them, they can't be deleted from this UI yet easily)
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // New files to upload
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await cardsAPI.getById(id!);
        const card = res.data.card;
        setForm({
          title: card.title,
          description: card.description,
          subject: card.subject,
          textContent: card.textContent || ''
        });
        setTags(card.tags || []);
        setExistingFiles(card.resources || []);
      } catch (error) {
        toast.error('Failed to load card for editing');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('subject', form.subject);
      formData.append('textContent', form.textContent);
      formData.append('tags', JSON.stringify(tags));
      newFiles.forEach(file => formData.append('files', file));

      await cardsAPI.update(id!, formData);
      toast.success('Card updated successfully!');
      navigate(`/cards/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update card');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="edit-page"><div className="loader"><div className="spinner" /></div></div>;

  return (
    <div className="edit-page" id="edit-card-page">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="edit-header">
        <h1>Edit Card</h1>
        <p className="text-muted">Update your educational resources</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="edit-section glass">
          <h2>Card Details</h2>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input type="text" name="title" className="form-input"
              value={form.title} onChange={handleChange} required maxLength={100} />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea name="description" className="form-textarea"
              value={form.description} onChange={handleChange} required maxLength={1000} />
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input type="text" name="subject" className="form-input"
              value={form.subject} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tag-input-wrapper">
              <Tag size={16} className="tag-input-icon" />
              <input type="text" className="form-input" style={{ paddingLeft: '36px' }}
                placeholder="Add a tag and press Enter" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDown} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>Add</button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="edit-section glass">
          <h2>Text Content</h2>
          <textarea name="textContent" className="form-textarea" rows={6}
            value={form.textContent} onChange={handleChange} />
        </div>

        <div className="edit-section glass">
          <h2>Resources & PDFs</h2>

          {existingFiles.length > 0 && (
            <div className="existing-files mb-lg">
              <h4 className="text-sm mb-sm text-muted">Already Uploaded</h4>
              <div className="files-list">
                {existingFiles.map((file, i) => (
                  <div key={i} className="file-item existing">
                    <FileText size={16} />
                    <span className="file-name">{file.originalName}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-muted mb-md">Upload more PDFs or resources (max 50MB each)</p>

          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <Upload size={32} className="upload-icon" />
            <p>Click to browse or drag files here</p>
            <span className="text-xs text-muted">PDF, Images, Videos, Documents</span>
          </div>
          <input type="file" ref={fileInputRef} multiple onChange={handleFiles}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.txt,.md,.doc,.docx,.ppt,.pptx"
            style={{ display: 'none' }} />

          {newFiles.length > 0 && (
            <div className="files-list mt-md">
              <h4 className="text-sm mb-sm text-muted">New Files to Upload</h4>
              {newFiles.map((file, i) => (
                <div key={i} className="file-item">
                  <FileText size={16} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeNewFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="edit-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner spinner-sm" /> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
