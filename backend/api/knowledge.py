from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

# 1. 导入数据库会话和表模型（根据你的实际路径调整）
from models.base import engine, SessionLocal
from models.tables import KnowledgePoint
from schemas import KnowledgePointResponse

# 2. 【关键】定义 router，必须叫这个名字
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

# 3. 定义数据库依赖（防止 base.py 里没有 get_db 报错）
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. 获取所有知识点接口
@router.get("/points", response_model=List[KnowledgePointResponse])
def get_all_knowledge_points(db: Session = Depends(get_db)):
    # 暂时只过滤数学
    return db.query(KnowledgePoint).filter(KnowledgePoint.subject == "math").all()

# 5. 获取单个知识点接口
@router.get("/points/{point_id}", response_model=KnowledgePointResponse)
def get_knowledge_point(point_id: str, db: Session = Depends(get_db)):
    point = db.query(KnowledgePoint).filter(KnowledgePoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点未找到")
    return point