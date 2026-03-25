"""
conversation.py — /api/conversation
  POST /audio – receive an audio blob, transcribe it with Whisper,
                generate a context-aware AI reply, return both.
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import memory_service
from app.services.speech_service import transcribe_audio, generate_response
from app.models.conversation import Conversation

router = APIRouter()


@router.post("/audio")
async def handle_audio(
    file: UploadFile = File(...),
    person_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    1. Save the uploaded audio blob to a temporary file.
    2. Transcribe it with Whisper.
    3. (Optional) load person details + recent memories for context.
    4. Generate a GPT reply.
    5. Persist the exchange to the conversations table.
    6. Return { transcript, response }.
    """
    # Save raw audio
    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    fd, audio_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            content = await file.read()
            f.write(content)

        # Transcribe
        try:
            transcript = transcribe_audio(audio_path)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")

        # Load person context if recognised
        person = None
        memories: list[dict] = []
        if person_id is not None:
            person = memory_service.get_person_by_id(db, person_id)
            if person:
                raw = memory_service.get_memories_for_person(db, person_id)
                memories = [m.to_dict() for m in raw[:10]]

        # Generate AI reply
        response_text = generate_response(
            transcript=transcript,
            person_name=person.name if person else None,
            relationship=person.relationship if person else None,
            notes=person.notes if person else None,
            memories=memories,
        )

        # Persist
        conv = Conversation(
            person_id=person_id,
            transcript=transcript,
            response=response_text,
        )
        db.add(conv)
        db.commit()

    finally:
        try:
            os.unlink(audio_path)
        except OSError:
            pass

    return {"transcript": transcript, "response": response_text}
