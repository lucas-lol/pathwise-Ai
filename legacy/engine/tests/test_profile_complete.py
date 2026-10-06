import json
from fastapi.testclient import TestClient
from main import app
from models.base import get_db
from models.tables import User, StudentProfile, StudentState
from services import state_manager

client = TestClient(app)

def test_put_profile_sets_profile_complete():
    # Create user
    response = client.post("/api/users", json={"name": "Test Student"})
    assert response.status_code == 200
    user_id = response.json()["id"]

    # Initially state funnel.profile_complete should be false
    state_res = client.get(f"/api/students/{user_id}/state")
    assert state_res.status_code == 200
    assert state_res.json()["funnel"]["profile_complete"] is False

    # PUT profile with grade and interests non-empty
    put_res = client.put(f"/api/students/{user_id}/profile", json={
        "grade": "10",
        "interests": ["technology"],
        "scores": {"math": 85},
        "self_assessment": ["advanced"],
        "goals": ["coding"],
        "profile_complete": True
    })
    assert put_res.status_code == 200

    # Check state again, funnel.profile_complete should now be true
    state_res2 = client.get(f"/api/students/{user_id}/state")
    assert state_res2.status_code == 200
    assert state_res2.json()["funnel"]["profile_complete"] is True
    assert state_res2.json()["version"] > state_res.json()["version"]
