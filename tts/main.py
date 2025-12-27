import os

from fastapi import FastAPI

from api.v1.routes import router

app = FastAPI()
app.include_router(router, prefix="/api/v1")


if __name__ == "__main__":
	import uvicorn

	host = os.getenv("HOST", "0.0.0.0")
	port = int(os.getenv("PORT", "8000"))
	uvicorn.run("main:app", host=host, port=port, reload=True)
