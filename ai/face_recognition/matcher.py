# ai/face_recognition/matcher.py

import face_recognition
import numpy as np

def match_face(known_encodings, unknown_encoding):
    if len(known_encodings) == 0:
        return None

    results = face_recognition.compare_faces(known_encodings, unknown_encoding)
    
    for i, match in enumerate(results):
        if match:
            return i

    return None
