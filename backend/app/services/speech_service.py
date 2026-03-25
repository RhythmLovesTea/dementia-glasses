"""
speech_service.py
Transcribes audio using OpenAI Whisper API and generates a context-aware
AI response using GPT, taking into account the recognised person's details.
Falls back to a local echo response when no API key is configured.
"""
import os
import tempfile
from openai import OpenAI

from app.config import OPENAI_API_KEY
from app.utils.audio_utils import convert_to_wav

_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if not OPENAI_API_KEY:
        return None
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe an audio file using OpenAI Whisper.
    `audio_path` may be any format; it gets converted to WAV first.
    """
    client = _get_client()
    if client is None:
        return "[No OpenAI API key configured — transcription unavailable]"

    wav_path = convert_to_wav(audio_path)
    try:
        with open(wav_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language="en",
            )
        return result.text.strip()
    finally:
        os.unlink(wav_path)


def generate_response(
    transcript: str,
    person_name: str | None = None,
    relationship: str | None = None,
    notes: str | None = None,
    memories: list[dict] | None = None,
) -> str:
    """
    Generate a helpful AI reply for a dementia patient.
    Incorporates context about the identified person if available.
    """
    client = _get_client()
    if client is None:
        person_hint = f" (speaking with {person_name})" if person_name else ""
        return f"[AI unavailable] I heard: \"{transcript}\"{person_hint}."

    # Build system prompt
    context_parts: list[str] = [
        "You are a compassionate AI assistant helping a person with dementia.",
        "Speak in a calm, clear, and reassuring tone.",
        "Keep responses brief (2–3 sentences max).",
    ]

    if person_name:
        intro = f"The person the patient is looking at is {person_name}"
        if relationship:
            intro += f", their {relationship}"
        intro += "."
        context_parts.append(intro)

    if notes:
        context_parts.append(f"Notes about {person_name}: {notes}")

    if memories:
        mem_texts = "; ".join(
            m.get("content") or m.get("title") or ""
            for m in memories[:5]
            if m.get("content") or m.get("title")
        )
        if mem_texts:
            context_parts.append(f"Relevant memories: {mem_texts}")

    system_prompt = " ".join(context_parts)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript},
        ],
        max_tokens=150,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
