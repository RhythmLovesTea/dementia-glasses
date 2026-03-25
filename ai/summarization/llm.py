"""
ai/summarization/llm.py

Low-level LLM helpers.  The high-level summariser logic lives in
`backend/app/services/summarizer.py`; this module provides the shared
OpenAI client factory and a generic chat-completion helper so other
AI modules don't each maintain their own client instance.
"""

from __future__ import annotations

import os
from typing import List, Dict

_client = None


def get_openai_client():
    """Return a cached OpenAI client (None if no key is configured)."""
    global _client
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return None
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(api_key=api_key)
    return _client


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = "gpt-4o-mini",
    max_tokens: int = 200,
    temperature: float = 0.7,
) -> str | None:
    """
    Thin wrapper around OpenAI chat completions.

    Returns the assistant message string, or None if the client is
    unavailable (missing API key or network error).

    Args:
        messages:    List of {"role": ..., "content": ...} dicts.
        model:       OpenAI model name.
        max_tokens:  Maximum tokens in the response.
        temperature: Sampling temperature (0 = deterministic).
    """
    client = get_openai_client()
    if client is None:
        return None
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:  # noqa: BLE001
        # Surface the error to callers; let them decide how to handle it.
        raise RuntimeError(f"LLM call failed: {exc}") from exc


def summarise_text(text: str, instruction: str = "Summarise the following text concisely.") -> str | None:
    """Convenience wrapper: one-shot text summarisation."""
    return chat_completion(
        messages=[
            {"role": "system", "content": instruction},
            {"role": "user", "content": text},
        ],
        max_tokens=150,
        temperature=0.4,
    )
