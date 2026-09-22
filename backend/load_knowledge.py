import json
from sqlalchemy.orm import Session
from models.base import engine, SessionLocal
from models.tables import KnowledgePoint
from schemas import KnowledgePointCreate

# 测试数据（已修正 prerequisite_id）
SAMPLE_DATA = [
  {
    "id": "math-j1",
    "subject": "math",
    "grade": "初一",
    "domain": "综合",
    "topic": "初一数学",
    "name": "初一数学基础",
    "parent_id": None,
    "prerequisite_id": None,
    "difficulty": 1,
    "importance": 5,
    "tags": ["年级基础"]
  },
  {
    "id": "math-j1-algebra",
    "subject": "math",
    "grade": "初一",
    "domain": "代数",
    "topic": "代数基础",
    "name": "代数初步",
    "parent_id": "math-j1",
    "prerequisite_id": None,
    "difficulty": 1,
    "importance": 4,
    "tags": ["核心"]
  },
  {
    "id": "math-j1-linear-eq",
    "subject": "math",
    "grade": "初一",
    "domain": "代数",
    "topic": "线性方程",
    "name": "一元一次方程",
    "parent_id": "math-j1-algebra",
    "prerequisite_id": "math-j1-algebra", # 已修正为真实存在的 ID
    "difficulty": 2,
    "importance": 5,
    "tags": ["重点", "易错"]
  }
]

def load_and_validate_knowledge(data):
    print("--- 开始校验并加载数据 ---")
    
    all_ids = {item['id'] for item in data}
    errors = []
    valid_points = []

    # 1. 逐条校验
    for index, item in enumerate(data):
        try:
            # 注意：这里使用 model_validate 兼容 Pydantic V2
            point = KnowledgePointCreate.model_validate(item)
            valid_points.append(point)
        except Exception as e:
            errors.append(f"行 {index+1} ({item.get('id', '未知')}): 基础字段校验失败 -> {e}")
            continue

        if point.parent_id and point.parent_id not in all_ids:
            errors.append(f"行 {index+1} ({point.id}): 找不到父节点 parent_id='{point.parent_id}'")
        
        if point.prerequisite_id and point.prerequisite_id not in all_ids:
            errors.append(f"行 {index+1} ({point.id}): 找不到前置节点 prerequisite_id='{point.prerequisite_id}'")

    # 2. 处理结果
    if errors:
        print("\n[❌ 发现数据错误，已拦截入库]:")
        for err in errors:
            print(f" - {err}")
        print("请修正数据后重新运行。\n")
    else:
        print(f"\n[✅ 校验通过，共 {len(valid_points)} 个知识点，正在写入数据库...]")
        db: Session = SessionLocal()
        try:
            # 【关键修复】：先清空旧数据，防止 UNIQUE constraint 冲突
            db.query(KnowledgePoint).delete()
            
            # 【关键修复】：使用 model_dump() 替代已废弃的 dict()
            db_points = [KnowledgePoint(**p.model_dump()) for p in valid_points]
            db.add_all(db_points)
            db.commit()
            print(f"[✅ 成功写入 {len(db_points)} 条记录到 SQLite！]\n")
        except Exception as e:
            db.rollback()
            print(f"[❌ 数据库写入失败: {e}]\n")
        finally:
            db.close()

if __name__ == "__main__":
    load_and_validate_knowledge(SAMPLE_DATA)