import subprocess
import tempfile
import os


def convert_to_wav(input_path: str) -> str:
    """
    Convert an audio file (e.g. webm/ogg) to WAV using ffmpeg.
    Returns path of the temporary WAV file (caller is responsible for cleanup).
    """
    fd, wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", wav_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"ffmpeg conversion failed: {exc}") from exc
    return wav_path
