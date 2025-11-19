from schemas.schemas import TtsParams
from services.speechkit import synthesize
from services.s3 import check_audio_exists, upload_audio
import hashlib

def generate_cache_key(text: str, voice: str = "ermil", role: str = "neutral") -> str:
    content = f"{text}:{voice}:{role}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def s3_path_by_name(name: str) -> str:
    return f"https://storage.yandexcloud.net/listen-s3/audio/{name}.wav"

def tts(text: TtsParams):
    cache_key = generate_cache_key(text.text)
    audio_exists = check_audio_exists(cache_key)

    file_url = s3_path_by_name(cache_key)

    if audio_exists:
        return {"source": "cached", "file_url": file_url}
    
    result = synthesize(text.text)

    upload_audio(cache_key, result)

    return {"source": "on_fly", "file_url": file_url}