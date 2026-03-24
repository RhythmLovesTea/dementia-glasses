import { useRef, useState, useCallback, useEffect } from 'react';
import './Recorder.css';

export default function Recorder({ onRecordingComplete, onError, disabled = false }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0); // 0-100 audio level for visualiser

  // Audio level analyser
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const stopLevelMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setLevel(0);
  }, []);

  const startLevelMonitor = useCallback((stream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = { ctx, analyser };

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      setLevel(Math.min(100, (avg / 128) * 100));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(blob);
        stopLevelMonitor();
      };
      mediaRecorderRef.current = mr;
      mr.start(100);
      setRecording(true);
      setSeconds(0);
      startLevelMonitor(stream);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      onError?.('Microphone access denied. Please allow microphone permissions.');
    }
  }, [onRecordingComplete, onError, startLevelMonitor, stopLevelMonitor]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    stopLevelMonitor();
    analyserRef.current?.ctx.close();
  }, [stopLevelMonitor]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const bars = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className={`recorder ${recording ? 'recorder--active' : ''}`}>
      {/* Visualiser */}
      <div className="recorder-visualiser" aria-hidden="true">
        {bars.map((i) => (
          <div
            key={i}
            className="recorder-bar"
            style={{
              height: recording
                ? `${Math.max(10, level * Math.sin((i / bars.length) * Math.PI + Date.now() / 300) * 0.5 + level * 0.5)}%`
                : '10%',
            }}
          />
        ))}
      </div>

      {recording && <div className="recorder-timer">{formatTime(seconds)}</div>}

      <button
        id="recorder-btn"
        className={`recorder-btn ${recording ? 'recorder-btn--stop' : 'recorder-btn--start'}`}
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        {recording ? (
          <span className="recorder-stop-icon" />
        ) : (
          <span className="recorder-mic-icon">🎙️</span>
        )}
      </button>

      <p className="recorder-hint">{recording ? 'Tap to stop' : 'Tap to speak'}</p>
    </div>
  );
}
