import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.base import get_db
from backend.models.tables import StudentProfile, User
from backend.schemas import CreateUserBody, ProfileUpdate
from backend.services import state_manager

router = APIRouter(prefix="/api", tags=["students"])


def _profile_to_dict(user: User, profile: StudentProfile) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "grade": user.grade,
        "interests": json.loads(profile.interests),
        "self_assessment": json.loads(profile.self_assessment),
        "scores": json.loads(profile.scores),
        "goals": json.loads(profile.goals),
        "no_grade": profile.no_grade,
        "funnel": {
            "profile_complete": profile.profile_complete,
            "assessment_complete": profile.assessment_complete,
            "career_selected": profile.career_selected,
            "route_ready": profile.route_ready,
        },
    }


@router.post("/users")
def create_user(body: CreateUserBody, db: Session = Depends(get_db)):
    user = User(name=body.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    profile = StudentProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    state_manager.get_or_create_state(db, user.id)
    return _profile_to_dict(user, profile)


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).one()
    return _profile_to_dict(user, profile)


@router.get("/students/{user_id}/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    return get_user(user_id, db)


@router.put("/students/{user_id}/profile")
def put_profile(user_id: int, body: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).one()
    if body.name is not None:
        user.name = body.name
    if body.grade is not None:
        user.grade = body.grade
    if body.scores is not None:
        profile.scores = json.dumps(body.scores.model_dump(), ensure_ascii=False)
    profile.no_grade = body.no_grade
    profile.interests = json.dumps(body.interests[:3], ensure_ascii=False)
    profile.self_assessment = json.dumps(body.self_assessment, ensure_ascii=False)
    profile.goals = json.dumps(body.goals, ensure_ascii=False)
    profile.profile_complete = body.profile_complete
    db.add(user)
    db.add(profile)
    db.commit()

    row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(row)
    state["profile"] = {
        "grade": user.grade,
        "interests": json.loads(profile.interests),
        "goals": json.loads(profile.goals),
        "scores": json.loads(profile.scores),
        "self_assessment": json.loads(profile.self_assessment),
        "no_grade": profile.no_grade,
    }
    state["funnel"]["profile_complete"] = profile.profile_complete
    state_manager.write_state(db, row, state)
    db.refresh(user)
    db.refresh(profile)
    return _profile_to_dict(user, profile)


@router.get("/students/{user_id}/state")
def get_state(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    row = state_manager.get_or_create_state(db, user_id)
    data = state_manager.read_state(row)
    data["version"] = row.version
    return data
