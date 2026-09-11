from fastapi import FastAPI

app = FastAPI(title="BodhSight - Agent 10")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "BodhSight",
        "agent": "10"
    }
