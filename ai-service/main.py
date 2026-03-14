from fastapi import FastAPI

app = FastAPI(title="MeowMarket AI Service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "meowmarket-ai"}
