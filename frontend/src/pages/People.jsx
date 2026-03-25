import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPeople, deletePerson } from '../services/api';
import './People.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function People() {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeople();
      setPeople(data);
    } catch {
      setError('Failed to load people. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  const handleDelete = async (person) => {
    if (!window.confirm(`Delete "${person.name}" and all their memories? This cannot be undone.`)) return;
    setDeletingId(person.person_id);
    try {
      await deletePerson(person.person_id);
      setPeople((prev) => prev.filter((p) => p.person_id !== person.person_id));
    } catch {
      setError('Failed to delete person. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="people-page">
      {/* Header */}
      <header className="ppl-header">
        <button className="btn-back" onClick={() => navigate('/')} aria-label="Back to dashboard">
          ← Back
        </button>
        <h1>Registered People</h1>
        <button className="btn btn-primary" onClick={() => navigate('/add-person')}>
          ➕ Add Person
        </button>
      </header>

      <main className="ppl-main">
        {loading && (
          <div className="ppl-loading">
            <span className="ppl-spinner" />
            Loading…
          </div>
        )}

        {error && <div className="ppl-error" role="alert">{error}</div>}

        {!loading && people.length === 0 && (
          <div className="ppl-empty">
            <span className="ppl-empty-icon">👤</span>
            <p>No people registered yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/add-person')}>
              Register First Person
            </button>
          </div>
        )}

        <div className="ppl-grid">
          {people.map((person) => {
            const photoSrc = person.photo_path
              ? `${BASE_URL}${person.photo_path}`
              : null;
            const initials = (person.name || '?')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <article
                key={person.person_id}
                className="ppl-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/people/${person.person_id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/people/${person.person_id}`)}
              >
                <div className="ppl-card-photo">
                  {photoSrc ? (
                    <img src={photoSrc} alt={person.name} />
                  ) : (
                    <span className="ppl-initials">{initials}</span>
                  )}
                </div>
                <div className="ppl-card-info">
                  <strong className="ppl-name">{person.name}</strong>
                  {person.relationship && (
                    <span className="ppl-rel">{person.relationship}</span>
                  )}
                  {person.notes && (
                    <p className="ppl-notes">{person.notes}</p>
                  )}
                </div>
                <div className="ppl-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/people/${person.person_id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={deletingId === person.person_id}
                    onClick={() => handleDelete(person)}
                  >
                    {deletingId === person.person_id ? '…' : 'Delete'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
