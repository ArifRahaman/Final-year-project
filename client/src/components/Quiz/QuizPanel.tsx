import { useState, useEffect } from 'react';
import { quizAPI } from '../../services/api';
import type { Quiz, QuizAttempt } from '../../types';
import { Trophy, Plus, Trash2, CheckCircle2, XCircle, ChevronRight, BarChart2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './QuizPanel.css';

interface Props {
  cardId: string;
  accessLevel: string;
}

interface DraftQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

const emptyQuestion = (): DraftQuestion => ({ text: '', options: ['', ''], correctIndex: 0 });

export default function QuizPanel({ cardId, accessLevel }: Props) {
  const isTeacher = accessLevel === 'owner';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'create' | 'take' | 'result' | 'results'>('view');

  // Create form state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  // Taking quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  // Teacher results state
  const [results, setResults] = useState<QuizAttempt[]>([]);

  useEffect(() => { fetchQuiz(); }, [cardId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await quizAPI.get(cardId);
      setQuiz(res.data);
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Teacher: create ----------
  const addQuestion = () => setDraftQuestions(prev => [...prev, emptyQuestion()]);

  const removeQuestion = (i: number) =>
    setDraftQuestions(prev => prev.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, field: keyof DraftQuestion, value: any) =>
    setDraftQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));

  const updateOption = (qi: number, oi: number, value: string) =>
    setDraftQuestions(prev => prev.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? value : o) } : q
    ));

  const addOption = (qi: number) =>
    setDraftQuestions(prev => prev.map((q, idx) =>
      idx === qi && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q
    ));

  const removeOption = (qi: number, oi: number) =>
    setDraftQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const newOpts = q.options.filter((_, oidx) => oidx !== oi);
      const newCorrect = q.correctIndex >= newOpts.length ? 0 : q.correctIndex;
      return { ...q, options: newOpts, correctIndex: newCorrect };
    }));

  const handleCreate = async () => {
    if (!draftTitle.trim()) return toast.error('Quiz title is required');
    for (const [i, q] of draftQuestions.entries()) {
      if (!q.text.trim()) return toast.error(`Question ${i + 1} text is empty`);
      if (q.options.some(o => !o.trim())) return toast.error(`Question ${i + 1} has empty options`);
    }
    setSaving(true);
    try {
      await quizAPI.create(cardId, { title: draftTitle, description: draftDesc, questions: draftQuestions });
      toast.success('Quiz created!');
      await fetchQuiz();
      setMode('view');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!confirm('Delete this quiz? All student attempts will be lost.')) return;
    try {
      await quizAPI.delete(cardId);
      setQuiz(null);
      setMode('view');
      toast.success('Quiz deleted');
    } catch {
      toast.error('Failed to delete quiz');
    }
  };

  // ---------- Student: take ----------
  const startQuiz = () => {
    setSelectedAnswers(new Array(quiz!.questions.length).fill(-1));
    setMode('take');
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswers.includes(-1)) return toast.error('Please answer all questions');
    setSubmitting(true);
    try {
      const res = await quizAPI.submit(cardId, selectedAnswers);
      setLastResult(res.data);
      setMode('result');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Teacher: results ----------
  const fetchResults = async () => {
    try {
      const res = await quizAPI.getResults(cardId);
      setResults(res.data.attempts || []);
      setMode('results');
    } catch {
      toast.error('Failed to load results');
    }
  };

  if (loading) return <div className="quiz-loading"><div className="spinner" /></div>;

  // ======= NO QUIZ =======
  if (!quiz) {
    return (
      <div className="quiz-panel">
        {isTeacher ? (
          mode === 'create' ? (
            <QuizCreateForm
              title={draftTitle} setTitle={setDraftTitle}
              desc={draftDesc} setDesc={setDraftDesc}
              questions={draftQuestions}
              saving={saving}
              onAdd={addQuestion} onRemove={removeQuestion}
              onUpdate={updateQuestion} onUpdateOption={updateOption}
              onAddOption={addOption} onRemoveOption={removeOption}
              onSave={handleCreate} onCancel={() => setMode('view')}
            />
          ) : (
            <div className="quiz-empty">
              <BookOpen size={48} className="quiz-empty-icon" />
              <h3>No Quiz Yet</h3>
              <p>Create a quiz so students can test their knowledge of this card's content.</p>
              <button className="btn btn-primary" onClick={() => setMode('create')}>
                <Plus size={16} /> Create Quiz
              </button>
            </div>
          )
        ) : (
          <div className="quiz-empty">
            <BookOpen size={48} className="quiz-empty-icon" />
            <h3>No Quiz Available</h3>
            <p>The teacher hasn't created a quiz for this card yet.</p>
          </div>
        )}
      </div>
    );
  }

  // ======= TAKING QUIZ =======
  if (mode === 'take') {
    return (
      <div className="quiz-panel">
        <h2 className="quiz-title">{quiz.title}</h2>
        <div className="quiz-questions">
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="quiz-question glass">
              <p className="quiz-question-text"><span className="quiz-q-num">Q{qi + 1}.</span> {q.text}</p>
              <div className="quiz-options">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className={`quiz-option ${selectedAnswers[qi] === oi ? 'selected' : ''}`}
                    onClick={() => setSelectedAnswers(prev => prev.map((a, i) => i === qi ? oi : a))}
                  >
                    <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="quiz-actions">
          <button className="btn btn-ghost" onClick={() => setMode('view')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmitQuiz} disabled={submitting}>
            {submitting ? <span className="spinner spinner-sm" /> : <><ChevronRight size={16} /> Submit</>}
          </button>
        </div>
      </div>
    );
  }

  // ======= RESULT =======
  if (mode === 'result' && lastResult) {
    const pct = lastResult.percentage;
    const passed = pct >= 60;
    return (
      <div className="quiz-panel">
        <div className="quiz-result glass">
          <div className={`quiz-result-icon ${passed ? 'pass' : 'fail'}`}>
            {passed ? <Trophy size={48} /> : <XCircle size={48} />}
          </div>
          <h2>{passed ? '🎉 Well done!' : 'Keep Practising!'}</h2>
          <div className="quiz-score-ring">
            <span className="quiz-score-pct">{pct}%</span>
            <span className="quiz-score-detail">{lastResult.score} / {lastResult.total} correct</span>
          </div>
          <div className="quiz-result-actions">
            <button className="btn btn-ghost" onClick={() => { setMode('view'); fetchQuiz(); }}>Back</button>
            <button className="btn btn-primary" onClick={startQuiz}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ======= TEACHER RESULTS LIST =======
  if (mode === 'results') {
    return (
      <div className="quiz-panel">
        <div className="quiz-results-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('view')}>← Back</button>
          <h2>Student Results — {quiz.title}</h2>
        </div>
        {results.length === 0 ? (
          <p className="text-muted">No attempts yet.</p>
        ) : (
          <div className="quiz-results-list">
            {results.map((a, i) => (
              <div key={i} className="quiz-result-row glass">
                <div className="quiz-result-student">
                  <div className="card-creator-avatar">{(a.student as any)?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{(a.student as any)?.name}</strong>
                    <span className="text-sm text-muted">{(a.student as any)?.email}</span>
                  </div>
                </div>
                <div className="quiz-result-score">
                  <span className={`badge ${Math.round(a.score / a.total * 100) >= 60 ? 'badge-emerald' : 'badge-rose'}`}>
                    {a.score}/{a.total} ({Math.round(a.score / a.total * 100)}%)
                  </span>
                  <span className="text-xs text-muted">{new Date(a.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ======= QUIZ VIEW (default) =======
  return (
    <div className="quiz-panel">
      <div className="quiz-header-card glass">
        <div>
          <h2 className="quiz-title"><Trophy size={20} /> {quiz.title}</h2>
          {quiz.description && <p className="quiz-desc">{quiz.description}</p>}
          <span className="badge badge-cyan">{quiz.questions.length} questions</span>
        </div>
        <div className="quiz-header-actions">
          {isTeacher ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={fetchResults}><BarChart2 size={16} /> Results</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteQuiz}><Trash2 size={16} /> Delete</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={startQuiz}><ChevronRight size={16} /> Take Quiz</button>
          )}
        </div>
      </div>

      {/* Student: show past attempts */}
      {!isTeacher && quiz.myAttempts && quiz.myAttempts.length > 0 && (
        <div className="quiz-past-attempts">
          <h3>Your Attempts</h3>
          {quiz.myAttempts.slice(-3).reverse().map((a, i) => (
            <div key={i} className="quiz-attempt-row glass">
              <span className={`badge ${Math.round(a.score / a.total * 100) >= 60 ? 'badge-emerald' : 'badge-rose'}`}>
                {a.score}/{a.total} ({Math.round(a.score / a.total * 100)}%)
              </span>
              <span className="text-xs text-muted">{new Date(a.submittedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Teacher: question preview */}
      {isTeacher && (
        <div className="quiz-preview">
          {quiz.questions.map((q, i) => (
            <div key={i} className="quiz-preview-q glass">
              <span className="quiz-q-num">Q{i + 1}</span>
              <span>{q.text}</span>
              <span className="badge badge-violet">{q.options.length} options</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Create Form sub-component ----
function QuizCreateForm({ title, setTitle, desc, setDesc, questions, saving, onAdd, onRemove, onUpdate, onUpdateOption, onAddOption, onRemoveOption, onSave, onCancel }: any) {
  return (
    <div className="quiz-create-form">
      <h2><Plus size={18} /> Create Quiz</h2>
      <div className="form-group">
        <label className="form-label">Quiz Title *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Test" />
      </div>
      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief instructions..." />
      </div>

      <div className="quiz-questions-builder">
        {questions.map((q: DraftQuestion, qi: number) => (
          <div key={qi} className="quiz-question-card glass">
            <div className="quiz-question-header">
              <span className="quiz-q-num">Q{qi + 1}</span>
              {questions.length > 1 && (
                <button className="btn btn-ghost btn-xs" onClick={() => onRemove(qi)}><Trash2 size={14} /></button>
              )}
            </div>
            <input
              className="form-input"
              placeholder="Question text..."
              value={q.text}
              onChange={e => onUpdate(qi, 'text', e.target.value)}
            />
            <div className="quiz-options-builder">
              {q.options.map((opt: string, oi: number) => (
                <div key={oi} className="quiz-option-row">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => onUpdate(qi, 'correctIndex', oi)}
                    title="Mark as correct answer"
                  />
                  <input
                    className="form-input"
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={e => onUpdateOption(qi, oi, e.target.value)}
                  />
                  {q.options.length > 2 && (
                    <button className="btn btn-ghost btn-xs" onClick={() => onRemoveOption(qi, oi)}><XCircle size={14} /></button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button className="btn btn-ghost btn-sm" onClick={() => onAddOption(qi)}><Plus size={14} /> Add Option</button>
              )}
            </div>
            <p className="quiz-hint">Select the radio button next to the correct answer.</p>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost btn-sm" onClick={onAdd}><Plus size={14} /> Add Question</button>

      <div className="quiz-form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <><CheckCircle2 size={16} /> Save Quiz</>}
        </button>
      </div>
    </div>
  );
}
