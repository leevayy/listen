from fastapi import APIRouter
from .handlers.tts import tts

router = APIRouter()

router.post("/tts")(tts)

router.get("/ping")(lambda: { "status": "ok" })
