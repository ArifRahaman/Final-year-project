import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardsAPI } from '../services/api';
import { PlusCircle, Upload, X, Tag, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './CreateCardPage.css';

export default function CreateCardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subject: '', textContent: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('subject', form.subject);
      formData.append('textContent', form.textContent);
      formData.append('tags', JSON.stringify(tags));
      files.forEach(file => formData.append('files', file));

      const res = await cardsAPI.create(formData);
      toast.success('Card created successfully!');
      navigate(`/cards/${res.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page" id="create-card-page">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="create-header">
        <h1><PlusCircle size={28} /> Create New Card</h1>
        <p className="text-muted">Bundle your educational resources into a shareable card</p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="create-section glass">
          <h2>Card Details</h2>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input type="text" name="title" className="form-input" placeholder="e.g., Introduction to Machine Learning"
              value={form.title} onChange={handleChange} required id="card-title" maxLength={100} />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea name="description" className="form-textarea" placeholder="Describe what this card covers..."
              value={form.description} onChange={handleChange} required id="card-description" maxLength={1000} />
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input type="text" name="subject" className="form-input" placeholder="e.g., Computer Science"
              value={form.subject} onChange={handleChange} required id="card-subject" />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tag-input-wrapper">
              <Tag size={16} className="tag-input-icon" />
              <input type="text" className="form-input" style={{ paddingLeft: '36px' }}
                placeholder="Add a tag and press Enter" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDown} id="card-tags" />
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

        <div className="create-section glass">
          <h2>Text Content (Optional)</h2>
          <p className="text-sm text-muted mb-md">Add any text-based content, notes, or instructions here. This will also be used by the AI assistant.</p>
          <textarea name="textContent" className="form-textarea" rows={8}
            placeholder="Paste your notes, lecture content, or any text materials here..."
            value={form.textContent} onChange={handleChange} id="card-text-content" />
        </div>

        <div className="create-section glass">
          <h2>Upload Resources</h2>
          <p className="text-sm text-muted mb-md">Upload PDFs, images, videos, or documents (max 50MB each)</p>

          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <Upload size={32} className="upload-icon" />
            <p>Click to browse or drag files here</p>
            <span className="text-xs text-muted">PDF, Images, Videos, Documents</span>
          </div>
          <input type="file" ref={fileInputRef} multiple onChange={handleFiles}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.txt,.md,.doc,.docx,.ppt,.pptx"
            style={{ display: 'none' }} />

          {files.length > 0 && (
            <div className="files-list">
              {files.map((file, i) => (
                <div key={i} className="file-item">
                  <FileText size={16} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} id="submit-card">
          {loading ? <span className="spinner spinner-sm" /> : <><PlusCircle size={18} /> Create Card</>}
        </button>
      </form>
    </div>
  );
}
