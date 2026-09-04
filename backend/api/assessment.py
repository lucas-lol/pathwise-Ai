import json
import random
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.base import get_db
from models.tables import Question, Subject
from schemas import QuestionResponse

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
        raise HTTPException(status_code=404, detail=f"No questions found for subject: {subject_id}")

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
