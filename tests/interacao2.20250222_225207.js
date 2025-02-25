from fastapi import HTTPException, status, Depends, Request
from fastapi.staticfiles import StaticFiles
import socketio

app = FastAPI()

# Configuração para Socket.IO para permitir conexões WebSocket
sio = socketio.SocketIO(app)

@app.websocket("/ws")
async def websocket_endpoint(websocket: Request):
    await sio.accept()  # Aceita a conexão

@app.get("/")
async def root():
    return {"html": "index.html"}

@app.get("/ping")
async def ping(request: Request):
    data = {"pong": "1"}
    emit("test-event", data)
    return {"pong": "1"}

@app.post("/api/notify", name="test-notifica玢o")
async def notify(
    request: Request,
    message: str = ""
):
    # Verificação do tipo de dados usando isinstance
    if not isinstance(message, str):
        raise HTTPException(status_code=422, detail="Message must be a string")

    data = {"message": message}
    emit("test-event", data)
    return {"message": message}

if __name__ == "__main__":
    from fastapi.staticfiles import serve
    app.mount("/index.html", StaticFiles(directory=""))
    serve(app)