"""
summarizer.py
Summarise a person's memories into a short paragraph using GPT.
Used optionally when the frontend requests a summary.
"""
from openai import OpenAI

from app.config import OPENAI_API_KEY

_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if not OPENAI_API_KEY:
        return None
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def summarise_memories(person_name: str, memories: list[dict]) -> str:
    """Return a short natural-language summary of *memories* for *person_name*."""
    client = _get_client()
    if client is None:
        return f"[AI unavailable] {len(memories)} memories stored for {person_name}."

    if not memories:
        return f"No memories have been stored for {person_name} yet."

    bullets = "\n".join(
        f"- [{m.get('type', 'note')}] {m.get('title') or ''}: {m.get('content') or ''}".strip(": ")
        for m in memories[:20]
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant for a dementia care app. "
                    "Summarise the following memories about a person in 2–3 warm, concise sentences."
                ),
            },
            {"role": "user", "content": f"Person: {person_name}\nMemories:\n{bullets}"},
        ],
        max_tokens=120,
        temperature=0.5,
    )
    return response.choices[0].message.content.strip()
