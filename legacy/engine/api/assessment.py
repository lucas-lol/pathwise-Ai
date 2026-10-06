from fastapi import APIRouter, Depends, HTTPException
from services.funnel import advance_funnel
from sqlalchemy.orm import Session
from models.base import SessionLocal
from models.tables import Question, AnswerRecord, User # <--- 新增 AnswerRecord
from schemas import AssessmentSubmit
from typing import List
import random
from pathlib import Path
import json
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

router = APIRouter(prefix="/api", tags=["assessment"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 修复 P0-02：年级累计诊断范围映射
# ==========================================
GRADE_SCOPE = {
    "初一": ["初一"],
    "初二": ["初一", "初二"],
    "初三": ["初一", "初二", "初三"],
    "高一": ["初一", "初二", "初三", "高一"],
    "高二": ["初一", "初二", "初三", "高一", "高二"],
    "高三": ["初一", "初二", "初三", "高一", "高二", "高三"]
}

# ==========================================
# 修复 P0-04：防答案泄露的抽题接口
# ==========================================
@router.get("/assessments/questions")
def get_assessment_questions(grade: str, subject: str = "math", limit: int = 10, db: Session = Depends(get_db)):
    # 1. 获取累计范围 (P0-02)
    scope = GRADE_SCOPE.get(grade, [grade])
    
    # 2. 在累计范围内抽题
    questions = db.query(Question).filter(
        Question.subject == subject,
        Question.grade.in_(scope)
    ).all()
    
    if not questions:
        raise HTTPException(status_code=404, detail=f"年级 '{grade}' 暂无题目")

    # 3. 随机抽样
    sample_size = min(len(questions), limit)
    selected = random.sample(questions, sample_size)

    # 4. 【关键修复 P0-04】：绝对不返回 answer 和 explanation
    result = []
    for q in selected:
        try:
            diff_val = int(q.difficulty)
        except (ValueError, TypeError):
            diff_val = 1
            
        result.append({
            "id": q.id,
            "subject": q.subject,
            "grade": q.grade,
            "knowledge_point_id": q.knowledge_point_id,
            "content": q.question, # 假设原字段叫 question，如果叫 content 请自行调整
            "options": [q.option_a, q.option_b, q.option_c, q.option_d], # 整合为数组方便前端
            "difficulty": diff_val
            # ⚠️ 注意：这里故意没有 answer 和 explanation！
        })
    return result

# ==========================================
# 保留并增强 P0-03：判题、记录与 Mastery 更新
# ==========================================
@router.post("/students/{user_id}/assessment")
def submit_assessment(user_id: int, body: AssessmentSubmit, db: Session = Depends(get_db)):
    # 1. 验证用户存在
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. 判卷逻辑
    correct_count = 0
    total = len(body.answers)
    mastery_update = {}
    
    for item in body.answers:
        question = db.query(Question).filter(Question.id == item.question_id).first()
        if not question:
            continue
            
        is_correct = (question.answer == item.answer)
        if is_correct:
            correct_count += 1
            
        # 【新增 P0-03 链路】：写入 AnswerRecord，建立追溯链
        record = AnswerRecord(
            student_id=str(user_id),
            question_id=item.question_id,
            student_answer=item.answer,
            is_correct=is_correct,
            submitted_at=datetime.utcnow()
        )
        db.add(record)
            
        # 知识点更新逻辑
        kp = question.knowledge_point_id
        if kp not in mastery_update:
            mastery_update[kp] = {"correct": 0, "total": 0}
        mastery_update[kp]["total"] += 1
        if is_correct:
            mastery_update[kp]["correct"] += 1
            
    score = int((correct_count / total * 100) if total > 0 else 0)
    
    # 3. 状态更新逻辑 (复用 state_manager)
    from services import state_manager
    state_row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(state_row)
    
    # 更新知识状态
    if "student_vector" not in state:
        state["student_vector"] = {"knowledge": {}}
    if "knowledge" not in state["student_vector"]:
        state["student_vector"]["knowledge"] = {}
        
    for kp, counts in mastery_update.items():
        current_mastery = state["student_vector"]["knowledge"].get(kp, 0.5)
        e = counts["correct"] / counts["total"] if counts["total"] > 0 else 0.0
        
        # 获取该知识点对应的题目难度或默认 medium
        sample_q = db.query(Question).filter(Question.knowledge_point_id == kp).first()
        diff = sample_q.difficulty if sample_q else "medium"
        
        alpha = calculate_alpha(diff)
        state["student_vector"]["knowledge"][kp] = update_mastery(current_mastery, e, alpha)
        
    # 同步更新旧 mastery 以保持向下兼容
    state["mastery"] = state["student_vector"]["knowledge"]
        
    # 更新 scores
    if "profile" not in state:
        state["profile"] = {}
    if "scores" not in state["profile"]:
        state["profile"]["scores"] = {}
    state["profile"]["scores"][body.subject_id] = float(score)
    
   # P0-08: 通过统一状态机推进
    state = advance_funnel(state, "assessment_complete")
    
    state_manager.write_state(db, state_row, state)
    db.commit() # <--- 确保 AnswerRecord 也被提交
    
    return {
        "correct": correct_count,
        "total": total,
        "score": score,
        "mastery": state["student_vector"]["knowledge"]
    }

# ==========================================
# 保留原有的 EMA 计算逻辑
# ==========================================
def calculate_alpha(difficulty: str | int) -> float:
    data_dir = Path(__file__).resolve().parents[1] / "data"
    with open(data_dir / "engine_params.json", "r", encoding="utf-8") as f:
        params = json.load(f)
    update_cfg = params.get("mastery", {}).get("update", {})
    base_rate = update_cfg.get("base_rate", 0.25)
    diff_factors = update_cfg.get("difficulty_factor", {"easy": 0.7, "medium": 1.0, "hard": 1.3})
    
    diff_key = "medium"
    if isinstance(difficulty, str):
        diff_key = difficulty.lower()
    elif isinstance(difficulty, (int, float)):
        if difficulty <= 1:
            diff_key = "easy"
        elif difficulty == 2:
            diff_key = "medium"
        else:
            diff_key = "hard"
            
    factor = diff_factors.get(diff_key, 1.0)
    alpha = base_rate * factor
    if not (0 <= alpha <= 1):
        raise ValueError(f"Invalid alpha value generated: {alpha}")
    return alpha
# ==========================================
# P0-05: 统一掌握度算法 (已验证并锁死)
# 最终选定：EMA (Exponential Moving Average)
# 公式: m_new = (1 - alpha) * m_old + alpha * e
# alpha 由题目难度动态计算 (见 calculate_alpha)
# 验证结论：困难题提升幅度 > 简单题；做错会下降；边界值 1.0 安全。
# 警告：此算法已通过 test_mastery.py 验证，请勿随意替换为贝叶斯或其他公式！
# ==========================================
def update_mastery(m_old: float, e: float, alpha: float) -> float:
    m_new = (1 - alpha) * m_old + alpha * e
    m_new = max(0.0, min(1.0, m_new))
    d = Decimal(str(m_new)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float(d)