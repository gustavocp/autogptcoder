from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/")
async def root():
    return {"html": "index.html"}

@app.get("/ping")
async def ping(request: Request):
    return {"pong": "1"}

@app.post("/api/notify", name="test-notifica玢o")
async def notify(
    request: Request,
    message: str = ""
):
    from fastapi import HTTPException
    from socketio import emit

    if not isinstance(message, str):
        raise HTTPException(status_code=422, detail="Message must be a string")

    emit("test-event", {"message": message})

app.mount("/index.html", StaticFiles(directory="."))

if __name__ == "__main__":
    from fastapi.staticfiles import serve
    serve(app)