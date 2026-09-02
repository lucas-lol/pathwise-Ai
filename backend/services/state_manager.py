from datetime import datetime, timezone
import json

from sqlalchemy.orm import Session

from backend.models.tables import StudentState


def default_state(user_id: int) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "student_id": str(user_id),
        "profile": {
            "grade": None,
            "interests": [],
            "goals": [],
            "scores": {},
            "self_assessment": [],
            "no_grade": False,
        },
        "mastery": {},
        "skills": {},
        "confidence": {},
        "career_matches": [],
        "route": {"mode": None, "current_branch": None},
        "achievements": [],
        "funnel": {
            "profile_complete": False,
            "assessment_complete": False,
            "career_selected": False,
            "route_ready": False,
        },
        "version": 1,
        "updated_at": now,
    }


def get_or_create_state(db: Session, user_id: int) -> StudentState:
    row = db.query(StudentState).filter(StudentState.user_id == user_id).one_or_none()
    if row:
        return row
    payload = default_state(user_id)
    row = StudentState(user_id=user_id, state_json=json.dumps(payload, ensure_ascii=False), version=1)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def read_state(row: StudentState) -> dict:
    return json.loads(row.state_json)


def write_state(db: Session, row: StudentState, data: dict) -> StudentState:
    data["version"] = int(data.get("version", row.version)) + 1
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    row.state_json = json.dumps(data, ensure_ascii=False)
    row.version = data["version"]
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
