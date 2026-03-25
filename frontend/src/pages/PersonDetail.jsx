import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MemoryCard from '../components/MemoryCard';
import {
  getPerson,
  getMemories,
  addMemory,
  deleteMemory,
  deletePerson,
  getMemorySummary,
} from '../services/api';
import './PersonDetail.css';

const MEMORY_TYPES = [
  { value: 'note',  label: '📝 Note' },
  { value: 'event', label: '📅 Event' },
  { value: 'audio', label: '🎙️ Audio URL' },
  { value: 'image', label: '🖼️ Image URL' },
];

export default function PersonDetail() {
  const { personId } = useParams();
  const navigate = useNavigate();

  const [person, setPerson]       = useState(null);
  const [memories, setMemories]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Add memory form
  const [showForm, setShowForm]   = useState(false);
  const [memType, setMemType]     = useState('note');
  const [memTitle, setMemTitle]   = useState('');
  const [memContent, setMemContent] = useState('');
  const [memUrl, setMemUrl]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState(null);

  const id = parseInt(personId, 10);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [personData, memoriesData] = await Promise.all([
        getPerson(id),
        getMemories(id),
      ]);
      setPerson(personData);
      setMemories(memoriesData);
    } catch {
      setError('Failed to load person data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const { summary: text } = await getMemorySummary(id);
      setSummary(text);
    } catch {
      setSummary('Failed to generate AI summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        type: memType,
        title: memTitle.trim() || null,
        content: memType === 'note' || memType === 'event' ? memContent.trim() || null : null,
        audio_url: memType === 'audio' ? memUrl.trim() || null : null,
        image_url: memType === 'image' ? memUrl.trim() || null : null,
      };
      const newMem = await addMemory(id, payload);
      setMemories((prev) => [newMem, ...prev]);
      setShowForm(false);
      setMemTitle(''); setMemContent(''); setMemUrl(''); setMemType('note');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save memory.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (memory) => {
    if (!window.confirm('Delete this memory?')) return;
    try {
      await deleteMemory(id, memory.id);
      setMemories((prev) => prev.filter((m) => m.id !== memory.id));
    } catch {
      setError('Failed to delete memory.');
    }
  };

  const handleDeletePerson = async () => {
    if (!window.confirm(`Delete "${person?.name}" and all their memories? This cannot be undone.`)) return;
    try {
      await deletePerson(id);
      navigate('/people');
    } catch {
      setError('Failed to delete person.');
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-loading"><span className="pd-spinner" /> Loading…</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="pd-page">
        <div className="pd-error">Person not found. <button className="btn btn-ghost" onClick={() => navigate('/people')}>Go back</button></div>
      </div>
    );
  }

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const photoSrc = person.photo_path ? `${BASE_URL}${person.photo_path}` : null;
  const initials = (person.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="pd-page">
      {/* Header */}
      <header className="pd-header">
        <button className="btn-back" onClick={() => navigate('/people')}>← Back</button>
        <h1>{person.name}</h1>
        <button className="btn btn-danger btn-sm" onClick={handleDeletePerson}>Delete Person</button>
      </header>

      {error && <div className="pd-error-bar" role="alert">{error}</div>}

      <main className="pd-main">
        {/* Profile card */}
        <section className="pd-profile">
          <div className="pd-avatar">
            {photoSrc ? (
              <img src={photoSrc} alt={person.name} />
            ) : (
              <span className="pd-initials">{initials}</span>
            )}
          </div>
          <div className="pd-profile-info">
            <h2>{person.name}</h2>
            {person.relationship && (
              <span className="pd-badge">{person.relationship}</span>
            )}
            {person.notes && <p className="pd-notes">{person.notes}</p>}
          </div>
        </section>

        {/* AI Summary */}
        <section className="pd-summary-section">
          <div className="pd-section-header">
            <h3>AI Memory Summary</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGetSummary}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Generating…' : '✨ Generate Summary'}
            </button>
          </div>
          {summary && (
            <blockquote className="pd-summary-text">{summary}</blockquote>
          )}
        </section>

        {/* Memories */}
        <section className="pd-memories-section">
          <div className="pd-section-header">
            <h3>Memories ({memories.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '➕ Add Memory'}
            </button>
          </div>

          {/* Add memory form */}
          {showForm && (
            <form className="pd-memory-form" onSubmit={handleAddMemory}>
              <div className="pd-form-row">
                <label className="pd-label">
                  Type
                  <select
                    className="pd-select"
                    value={memType}
                    onChange={(e) => { setMemType(e.target.value); setMemUrl(''); }}
                  >
                    {MEMORY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="pd-label pd-label--grow">
                  Title
                  <input
                    className="pd-input"
                    type="text"
                    placeholder="e.g. Birthday party 2024"
                    value={memTitle}
                    onChange={(e) => setMemTitle(e.target.value)}
                  />
                </label>
              </div>

              {(memType === 'note' || memType === 'event') && (
                <label className="pd-label">
                  Content
                  <textarea
                    className="pd-input pd-textarea"
                    rows={3}
                    placeholder="Describe the memory…"
                    value={memContent}
                    onChange={(e) => setMemContent(e.target.value)}
                  />
                </label>
              )}

              {(memType === 'audio' || memType === 'image') && (
                <label className="pd-label">
                  {memType === 'audio' ? 'Audio URL' : 'Image URL'}
                  <input
                    className="pd-input"
                    type="url"
                    placeholder="https://…"
                    value={memUrl}
                    onChange={(e) => setMemUrl(e.target.value)}
                  />
                </label>
              )}

              {formError && <div className="pd-form-error">{formError}</div>}

              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Memory'}
              </button>
            </form>
          )}

          {/* Memory list */}
          {memories.length === 0 ? (
            <p className="pd-empty">No memories saved yet. Add the first one above!</p>
          ) : (
            <div className="pd-memories-grid">
              {memories.map((m) => (
                <div key={m.id} className="pd-memory-wrapper">
                  <MemoryCard memory={m} />
                  <button
                    className="pd-delete-mem-btn"
                    aria-label="Delete memory"
                    onClick={() => handleDeleteMemory(m)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
