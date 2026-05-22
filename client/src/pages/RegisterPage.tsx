import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', institution: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        institution: form.institution
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="auth-card glass-strong" id="register-form">
        <div className="auth-header">
          <GraduationCap size={36} className="auth-logo" />
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Institute Card Network</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input type="text" name="name" className="form-input input-with-icon"
                placeholder="John Doe" value={form.name} onChange={handleChange} required id="register-name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input type="email" name="email" className="form-input input-with-icon"
                placeholder="you@example.com" value={form.email} onChange={handleChange} required id="register-email" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} name="password" className="form-input input-with-icon"
                  placeholder="Min 6 characters" value={form.password} onChange={handleChange} required id="register-password" />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" className="form-input"
                placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required id="register-confirm" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">I am a...</label>
              <div className="role-selector">
                <label className={`role-option ${form.role === 'student' ? 'active' : ''}`}>
                  <input type="radio" name="role" value="student" checked={form.role === 'student'} onChange={handleChange} />
                  <span>👩‍🎓 Student</span>
                </label>
                <label className={`role-option ${form.role === 'teacher' ? 'active' : ''}`}>
                  <input type="radio" name="role" value="teacher" checked={form.role === 'teacher'} onChange={handleChange} />
                  <span>👨‍🏫 Teacher</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Institution (optional)</label>
              <div className="input-icon-wrapper">
                <Building size={16} className="input-icon" />
                <input type="text" name="institution" className="form-input input-with-icon"
                  placeholder="Your university" value={form.institution} onChange={handleChange} id="register-institution" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} id="register-submit">
            {loading ? <span className="spinner spinner-sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
