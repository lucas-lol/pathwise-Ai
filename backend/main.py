from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.students import router as students_router
from api.assessment import router as assessment_router
from api.careers import router as careers_router
from models.base import init_db, SessionLocal
from api import knowledge




app = FastAPI(title="PathWise AI")
app.include_router(careers_router, prefix="/api", tags=["careers"])
app.include_router(knowledge.router)
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
    # P0-01: 移除自动 seeding，改用专门的 load_knowledge.py 和 load_questions.py 脚本管理数据
    # seed_questions_and_subjects(db) 
    pass  # 如果没有其他启动逻辑，就留个 pass


@app.get("/health")
def health():
    return {"ok": True, "service": "pathwise"}

