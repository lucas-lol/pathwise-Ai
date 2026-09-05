import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.base import get_db
from models.tables import User, LearningRoute, RouteNode, Question
from services import state_manager

router = APIRouter(prefix="/api", tags=["careers"])


def _knowledge01(scores: dict, subject: str) -> float:
    v = scores.get(subject)
    if isinstance(v, (int, float)):
        return float(v) / 100.0
    return 0.5  # 缺失或 null 一律当中性 0.5


@router.post("/students/{user_id}/careers/{career_id}/select")
def select_career(user_id: int, career_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data_dir = Path(__file__).resolve().parents[1] / "data"
    with open(data_dir / "careers.json", "r", encoding="utf-8") as f:
        careers = {c["id"]: c for c in json.load(f)["careers"]}
    
    if career_id not in careers:
        raise HTTPException(status_code=404, detail="Career not found")

    with open(data_dir / "engine_params.json", "r", encoding="utf-8") as f:
        skip_threshold = json.load(f)["mastery"]["skip_threshold"]

    # 1. 更新状态
    state_row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(state_row)
    state["selected_career"] = career_id
    state["route"] = {"mode": "career", "current_branch": career_id}
    
    state["funnel"]["career_selected"] = True
    state["funnel"]["route_ready"] = True
    
    state_manager.write_state(db, state_row, state)

    # 2. 生成路线
    related_subjects = careers[career_id].get("related_subjects", [])
    
    knowledge_points = {}  # id: difficulty_sum, count
    
    questions = (
        db.query(Question)
        .filter(Question.subject_id.in_(related_subjects))
        .all()
    )
    all_questions = [
        {"knowledge_point_id": q.knowledge_point_id, "difficulty": q.difficulty}
        for q in questions
    ]

    for q in all_questions:
        kp_id = q.get("knowledge_point_id")
        if not kp_id: continue
        diff = q.get("difficulty", 1)
        if isinstance(diff, str):
            try: diff = int(diff)
            except: diff = 1
        
        if kp_id not in knowledge_points:
            knowledge_points[kp_id] = {"sum": 0, "count": 0}
        knowledge_points[kp_id]["sum"] += diff
        knowledge_points[kp_id]["count"] += 1

    sorted_kps = []
    for kp_id, d in knowledge_points.items():
        avg = d["sum"] / d["count"]
        sorted_kps.append({"id": kp_id, "avg": avg})
    
    sorted_kps.sort(key=lambda x: x["avg"])

    # 创建 Route
    route = LearningRoute(user_id=user_id, goal=career_id)
    db.add(route)
    db.flush() # 获取 route.id

    mastery = state.get("mastery", {})
    node_ids = []
    for idx, kp in enumerate(sorted_kps):
        score = mastery.get(kp["id"], 0)
        status = "mastered" if score >= skip_threshold else "todo"
        node = RouteNode(
            route_id=route.id,
            knowledge_point_id=kp["id"],
            order_index=idx,
            status=status,
            reason=str(score)
        )
        db.add(node)
        node_ids.append(kp["id"])

    db.commit()

    return {"message": "career selected", "route_id": route.id, "nodes": node_ids}


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