import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Camera from '../components/Camera';
import { registerFace, createPerson } from '../services/api';
import './AddPerson.css';

const STEPS = ['Capture', 'Details', 'Done'];

export default function AddPerson() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personId, setPersonId] = useState(null);

  const handleCapture = useCallback(async () => {
    const blob = await cameraRef.current?.capture();
    if (!blob) return;
    setCapturedBlob(blob);
    setPreview(URL.createObjectURL(blob));
    setStep(1);
  }, []);

  const handleRetake = () => {
    setPreview(null);
    setCapturedBlob(null);
    setStep(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedBlob || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Register face embedding
      const { person_id } = await registerFace(capturedBlob, `${name.trim().replace(/\s+/g, '_')}.jpg`);
      // 2. Save person metadata
      await createPerson({ person_id, name: name.trim(), relationship: relationship.trim(), notes: notes.trim() });
      setPersonId(person_id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register person. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-person-page">
      {/* Header */}
      <header className="ap-header">
        <button className="btn-back" onClick={() => navigate('/')} aria-label="Back to dashboard">
          ← Back
        </button>
        <h1>Add Person</h1>
        {/* Step indicator */}
        <div className="ap-steps" aria-label="Progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`ap-step ${i === step ? 'ap-step--active' : ''} ${i < step ? 'ap-step--done' : ''}`}>
              <span className="ap-step-dot">{i < step ? '✓' : i + 1}</span>
              <span className="ap-step-label">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="ap-main">
        {/* Step 0: Capture */}
        {step === 0 && (
          <div className="ap-step-panel ap-capture">
            <p className="ap-hint">Position the person's face inside the oval and capture a clear photo.</p>
            <Camera ref={cameraRef} showOverlay />
            <button id="capture-btn" className="btn btn-primary btn-large" onClick={handleCapture}>
              📸 Capture Photo
            </button>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="ap-step-panel ap-details">
            <div className="ap-preview-wrapper">
              <img className="ap-preview" src={preview} alt="Captured face" />
              <button className="btn btn-ghost" onClick={handleRetake}>Retake</button>
            </div>
            <form className="ap-form" onSubmit={handleSubmit}>
              <label className="ap-label">
                Full Name *
                <input
                  id="person-name"
                  className="ap-input"
                  type="text"
                  placeholder="e.g. Dr. Sarah Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className="ap-label">
                Relationship
                <input
                  id="person-relationship"
                  className="ap-input"
                  type="text"
                  placeholder="e.g. Daughter, Doctor, Neighbour"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </label>
              <label className="ap-label">
                Notes
                <textarea
                  id="person-notes"
                  className="ap-input ap-textarea"
                  placeholder="Any helpful context about this person…"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              {error && <div className="ap-error" role="alert">{error}</div>}

              <button id="save-person-btn" className="btn btn-primary btn-large" type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Saving…' : 'Save Person'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <div className="ap-step-panel ap-done">
            <div className="ap-done-icon">✅</div>
            <h2>Person Added!</h2>
            <p><strong>{name}</strong> has been registered successfully.</p>
            {personId && <p className="ap-person-id">ID: {personId}</p>}
            <div className="ap-done-actions">
              <button className="btn btn-primary" onClick={() => { setStep(0); setName(''); setRelationship(''); setNotes(''); setPreview(null); setCapturedBlob(null); }}>
                Add Another
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/')}>Dashboard</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
