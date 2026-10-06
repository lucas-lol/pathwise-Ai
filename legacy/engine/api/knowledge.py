from fastapi import APIRouter
import json
from pathlib import Path

# 保持你原来的路由前缀
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

@router.get("/points")
def get_all_knowledge_points():
    """
    MVP 极速版：直接读取 JSON 文件，绕过数据库。
    确保前端能立刻拿到 224 个知识点。
    """
    data_dir = Path(__file__).resolve().parents[1] / "data"
    json_path = data_dir / "knowledge.json"
    
    if not json_path.exists():
        return {"error": "知识点文件未找到"}
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    return data