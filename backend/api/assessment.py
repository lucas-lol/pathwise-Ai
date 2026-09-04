import json
import random
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.base import get_db
from models.tables import Question, Subject
from schemas import QuestionResponse, AssessmentSubmit

router = APIRouter(prefix="/api", tags=["assessment"])


def seed_questions_and_subjects(db: Session):
    data_dir = Path(__file__).resolve().parents[1] / "data"

    # 1. Seed Subjects
    subjects_file = data_dir / "subjects.json"
    if subjects_file.exists():
        with open(subjects_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            subjects = data.get("subjects", []) if isinstance(data, dict) else data
            for item in subjects:
                sub = db.get(Subject, item["id"])
                if not sub:
                    sub = Subject(
                        id=item["id"],
                        name=item["name"],
                        track=item.get("track", "")
                    )
                    db.add(sub)
        db.commit()

    # 2. Seed Questions
    questions_file = data_dir / "questions_math.json"
    if questions_file.exists():
        with open(questions_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            q_list = data.get("questions", []) if isinstance(data, dict) else data
            for item in q_list:
                q = db.get(Question, item["id"])
                if not q:
                    q = Question(
                        id=item["id"],
                        subject_id=item["subject_id"],
                        knowledge_point_id=item["knowledge_point_id"],
                        question=item["question"],
                        option_a=item["option_a"],
                        option_b=item["option_b"],
                        option_c=item["option_c"],
                        option_d=item["option_d"],
                        answer=item["answer"],
                        difficulty=str(item["difficulty"]),
                        explanation=item["explanation"]
                    )
                    db.add(q)
        db.commit()


@router.get("/assessments/{subject_id}/questions", response_model=list[QuestionResponse])
def get_assessment_questions(subject_id: str, limit: int = 10, db: Session = Depends(get_db)):
    # Query all questions for this subject
    questions = db.query(Question).filter(Question.subject_id == subject_id).all()
    if not questions:
        subjects = db.query(Subject).all()
        ids = [s.id for s in subjects]
        raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found. Available subjects: {ids}")

    # Randomly select a sample from questions
    sample_size = min(len(questions), limit)
    selected = random.sample(questions, sample_size)

    result = []
    for q in selected:
        try:
            diff_val = int(q.difficulty)
        except ValueError:
            diff_val = q.difficulty

        result.append(
            QuestionResponse(
                id=q.id,
                subject_id=q.subject_id,
                knowledge_point_id=q.knowledge_point_id,
                question=q.question,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                answer=q.answer,
                difficulty=diff_val,
                explanation=q.explanation
            )
        )
    return result


@router.post("/students/{user_id}/assessment")
def submit_assessment(user_id: int, body: AssessmentSubmit, db: Session = Depends(get_db)):
    # 1. 验证用户存在
    from models.tables import User
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
    
    # 更新 mastery
    if "mastery" not in state:
        state["mastery"] = {}
    for kp, counts in mastery_update.items():
        current_mastery = state["mastery"].get(kp, 0.5)
        # 简单的正确率计算更新
        new_rate = counts["correct"] / counts["total"]
        state["mastery"][kp] = round(0.7 * current_mastery + 0.3 * new_rate, 2)
        
    # 更新 scores
    if "scores" not in state["profile"]:
        state["profile"]["scores"] = {}
    state["profile"]["scores"][body.subject_id] = float(score)
    
    # 更新漏斗
    state["funnel"]["assessment_complete"] = True
    
    state_manager.write_state(db, state_row, state)
    
    return {
        "correct": correct_count,
        "total": total,
        "score": score,
        "mastery": state["mastery"]
    }


@router.get("/assessments/subjects")
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    return [{"id": s.id, "name": s.name} for s in subjects]

