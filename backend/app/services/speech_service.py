# backend/app/services/face_service.py

import os
import numpy as np
from ai.face_recognition.encoder import encode_face
from ai.face_recognition.matcher import match_face

ENCODINGS_FILE = "data/embeddings/encodings.npy"

def load_encodings():
    if not os.path.exists(ENCODINGS_FILE):
        return []

    return list(np.load(ENCODINGS_FILE, allow_pickle=True))

def save_encodings(encodings):
    np.save(ENCODINGS_FILE, encodings)

def register_face(image_path):
    encoding = encode_face(image_path)
    if encoding is None:
        return None

    encodings = load_encodings()
    encodings.append(encoding)
    save_encodings(encodings)

    return len(encodings) - 1


def recognize_face(image_path):
    encoding = encode_face(image_path)
    if encoding is None:
        return None

    encodings = load_encodings()
    match_index = match_face(encodings, encoding)

    return match_index
