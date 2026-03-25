"""
ai/speech/whisper_model.py

Optional local-Whisper helper. The production speech_service uses the
OpenAI Whisper API.  If you prefer to run inference fully on-device
(offline / privacy-first) you can switch speech_service to call
`transcribe_local` from here instead.

Requirements (if using local mode):
    pip install openai-whisper
    # or the faster-whisper variant:
    pip install faster-whisper
"""

from __future__ import annotations

_local_model = None


def _load_model(model_name: str = "base"):
    """Lazy-load the local Whisper model (downloads on first use)."""
    global _local_model
    if _local_model is None:
        try:
            import whisper  # openai-whisper
            _local_model = whisper.load_model(model_name)
        except ImportError:
            raise RuntimeError(
                "Local Whisper is not installed. "
                "Run `pip install openai-whisper` or use the API-based mode."
            )
    return _local_model


def transcribe_local(audio_path: str, model_name: str = "base") -> str:
    """
    Transcribe *audio_path* using a locally-running Whisper model.

    Args:
        audio_path: Path to the audio file (wav / mp3 / webm …).
        model_name: Whisper model size – 'tiny', 'base', 'small', 'medium',
                    'large'.  Larger models are more accurate but need more RAM.

    Returns:
        Transcribed text string.
    """
    model = _load_model(model_name)
    result = model.transcribe(audio_path, language="en", fp16=False)
    return result["text"].strip()
