from pydantic import BaseModel

class TtsParams(BaseModel):
    text: str
