import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Camera from '../components/Camera';
import Recorder from '../components/Recorder';
import MemoryCard from '../components/MemoryCard';
import { recognizeFace, getPerson, getMemories, sendAudio } from '../services/api';
import './Dashboard.css';

const SCAN_INTERVAL_MS = 3000;

export default function Dashboard() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const scanTimerRef = useRef(null);

  const [person, setPerson] = useState(null);        // recognised person
  const [memories, setMemories] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | found | unknown
  const [conversation, setConversation] = useState([]); // [{role, text}]
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const runScan = useCallback(async () => {
    if (!cameraRef.current?.isActive) return;
    setScanStatus('scanning');
    try {
      const blob = await cameraRef.current.capture();
      if (!blob) return;
      const { match_id } = await recognizeFace(blob);
      if (match_id !== null && match_id !== undefined && match_id !== -1) {
        const [personData, memoriesData] = await Promise.all([
          getPerson(match_id),
          getMemories(match_id),
        ]);
        setPerson(personData);
        setMemories(memoriesData);
        setScanStatus('found');
      } else {
        setPerson(null);
        setMemories([]);
        setScanStatus('unknown');
      }
    } catch {
      setScanStatus('idle');
    }
  }, []);

  const startScanning = useCallback(() => {
    setScanning(true);
    runScan();
    scanTimerRef.current = setInterval(runScan, SCAN_INTERVAL_MS);
  }, [runScan]);

  const stopScanning = useCallback(() => {
    setScanning(false);
    clearInterval(scanTimerRef.current);
    setScanStatus('idle');
  }, []);

  useEffect(() => () => clearInterval(scanTimerRef.current), []);

  const handleRecording = useCallback(async (audioBlob) => {
    setAiLoading(true);
    setError(null);
    try {
      const { transcript, response } = await sendAudio(audioBlob, person?.person_id);
      setConversation((prev) => [
        ...prev,
        { role: 'user', text: transcript },
        { role: 'assistant', text: response },
      ]);
    } catch {
      setError('Could not process audio. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [person]);

  const clearConversation = () => setConversation([]);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <span className="db-logo-icon">🧠</span>
          <span className="db-logo-text">DementiaGlasses</span>
        </div>

        <nav className="db-nav">
          <button id="nav-dashboard" className="db-nav-item db-nav-item--active" aria-current="page">
            📡 Dashboard
          </button>
          <button id="nav-people" className="db-nav-item" onClick={() => navigate('/people')}>
            👥 People
          </button>
          <button id="nav-add-person" className="db-nav-item" onClick={() => navigate('/add-person')}>
            ➕ Add Person
          </button>
        </nav>

        {/* Person card */}
        <div className={`db-person-card ${scanStatus}`}>
          {scanStatus === 'found' && person ? (
            <>
              <div className="db-person-avatar">{person.name?.[0]?.toUpperCase() ?? '?'}</div>
              <div className="db-person-info">
                <strong className="db-person-name">{person.name}</strong>
                {person.relationship && <span className="db-person-rel">{person.relationship}</span>}
              </div>
            </>
          ) : scanStatus === 'unknown' ? (
            <div className="db-unknown">❓ Face not recognised</div>
          ) : scanStatus === 'scanning' ? (
            <div className="db-scanning-indicator">
              <span className="db-pulse" /> Scanning…
            </div>
          ) : (
            <div className="db-idle-msg">Point camera at a face</div>
          )}
        </div>

        <div className="db-scan-controls">
          {scanning ? (
            <button id="stop-scan-btn" className="btn btn-danger btn-full" onClick={stopScanning}>
              ⏹ Stop Scan
            </button>
          ) : (
            <button id="start-scan-btn" className="btn btn-primary btn-full" onClick={startScanning}>
              ▶ Start Scan
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="db-main">
        {/* Camera */}
        <section className="db-camera-section">
          <Camera ref={cameraRef} showOverlay={!scanning} />
          {scanning && (
            <div className={`db-scan-badge db-scan-badge--${scanStatus}`}>
              {scanStatus === 'scanning' ? '●  Live' : scanStatus === 'found' ? '✓ Recognised' : '? Unknown'}
            </div>
          )}
        </section>

        {/* Conversation */}
        <section className="db-conversation-section">
          <div className="db-section-header">
            <h2>Conversation</h2>
            {conversation.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearConversation}>Clear</button>
            )}
          </div>

          <div className="db-conversation-log" aria-live="polite">
            {conversation.length === 0 ? (
              <p className="db-empty">Record audio below to start a conversation.</p>
            ) : (
              conversation.map((msg, i) => (
                <div key={i} className={`db-msg db-msg--${msg.role}`}>
                  <span className="db-msg-role">{msg.role === 'user' ? '🎙 You' : '🤖 AI'}</span>
                  <p className="db-msg-text">{msg.text}</p>
                </div>
              ))
            )}
            {aiLoading && <div className="db-msg db-msg--assistant db-msg--loading">🤖 Thinking…</div>}
          </div>

          <div className="db-recorder-wrapper">
            <Recorder onRecordingComplete={handleRecording} onError={setError} disabled={aiLoading} />
          </div>
          {error && <div className="db-error" role="alert">{error}</div>}
        </section>

        {/* Memories */}
        {person && (
          <section className="db-memories-section">
            <h2>Memories – {person.name}</h2>
            {memories.length === 0 ? (
              <p className="db-empty">No memories saved yet for {person.name}.</p>
            ) : (
              <div className="db-memories-grid">
                {memories.map((m, i) => (
                  <MemoryCard key={m.id ?? i} memory={m} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
