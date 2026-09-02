from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.students import router as students_router
from backend.models.base import init_db

app = FastAPI(title="PathWise AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(students_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"ok": True, "service": "pathwise"}
