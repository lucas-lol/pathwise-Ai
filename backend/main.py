from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.students import router as students_router
from api.assessment import router as assessment_router, seed_questions_and_subjects
from api.careers import router as careers_router
from models.base import init_db, SessionLocal

app = FastAPI(title="PathWise AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(students_router)
app.include_router(assessment_router)
app.include_router(careers_router)


@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        seed_questions_and_subjects(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"ok": True, "service": "pathwise"}

