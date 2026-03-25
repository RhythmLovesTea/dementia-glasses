"""
face_service.py
Manages face encodings (stored in a numpy .npy file) and links them
to Person DB records via face_index.
"""
import os
import numpy as np

from app.config import ENCODINGS_FILE
from ai.face_recognition.encoder import encode_face
from ai.face_recognition.matcher import match_face


# ── Encoding persistence ──────────────────────────────────────────────────────

def load_encodings() -> list:
    if not os.path.exists(ENCODINGS_FILE):
        return []
    return list(np.load(ENCODINGS_FILE, allow_pickle=True))


def save_encodings(encodings: list) -> None:
    np.save(ENCODINGS_FILE, encodings)


# ── Public API ────────────────────────────────────────────────────────────────

def register_face_encoding(image_path: str) -> int | None:
    """
    Encode the face in *image_path*, append to the store, and return the
    index (== face_index on the Person row).  Returns None if no face found.
    """
    encoding = encode_face(image_path)
    if encoding is None:
        return None

    encodings = load_encodings()
    encodings.append(encoding)
    save_encodings(encodings)
    return len(encodings) - 1


def recognize_face_encoding(image_path: str) -> int | None:
    """
    Encode the face in *image_path* and return its index in the store, or
    None if unrecognised.
    """
    encoding = encode_face(image_path)
    if encoding is None:
        return None

    encodings = load_encodings()
    return match_face(encodings, encoding)
