import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.base import get_db
from models.tables import User
from services import state_manager

router = APIRouter(prefix="/api", tags=["careers"])


def _knowledge01(scores: dict, subject: str) -> float:
    v = scores.get(subject)
    if isinstance(v, (int, float)):
        return float(v) / 100.0
    return 0.5  # 缺失或 null 一律当中性 0.5


@router.get("/students/{user_id}/careers")
def get_careers(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data_dir = Path(__file__).resolve().parents[1] / "data"
    with open(data_dir / "careers.json", "r", encoding="utf-8") as f:
        careers = json.load(f)["careers"]
    with open(data_dir / "engine_params.json", "r", encoding="utf-8") as f:
        weights = json.load(f)["career_score_weights"]

    state_row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(state_row)
    profile = state.get("profile", {})
    scores = profile.get("scores", {}) or {}
    skills = state.get("skills", {}) or {}

    results = []
    for c in careers:
        subj = [_knowledge01(scores, s) for s in c.get("related_subjects", [])]
        knowledge = sum(subj) / len(subj) if subj else 0.5

        user_interests = set(profile.get("interests", []) or [])
        related_int = set(c.get("related_interests", []) or [])
        interest = len(user_interests & related_int) / len(related_int) if related_int else 0.5

        user_goals = set(profile.get("goals", []) or [])
        related_goal = set(c.get("related_goals", []) or [])
        goal = len(user_goals & related_goal) / len(related_goal) if related_goal else 0.5

        skill = sum(skills.values()) / len(skills) if skills else 0.5
        behavior = 0.5

        score = (
            knowledge * weights["knowledge"]
            + interest * weights["interest"]
            + goal * weights["goal"]
            + skill * weights["skill"]
            + behavior * weights["behavior"]
        )
        results.append({"career_id": c["id"], "name": c["name"], "score": round(score, 4)})

    results.sort(key=lambda x: x["score"], reverse=True)
    state["career_matches"] = results
    state_manager.write_state(db, state_row, state)
    return results