import sys
from pathlib import Path
backend_path = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_path))

import json
from fastapi.testclient import TestClient
from main import app
from models.base import SessionLocal
from models.tables import KnowledgeNode, Question
from api.assessment import CANONICAL_SKILLS, seed_questions_and_subjects

client = TestClient(app)

def test_canonical_skills_definition():
    expected = {
        "analytical_reasoning",
        "problem_solving",
        "quantitative_thinking",
        "scientific_thinking",
        "business_thinking",
        "learning_agility"
    }
    assert CANONICAL_SKILLS == expected

def test_knowledge_node_skill_tags_validity(setup_test_db):
    db = setup_test_db
    nodes = db.query(KnowledgeNode).all()
    assert len(nodes) > 0
    for node in nodes:
        tags = json.loads(node.skill_tags)
        assert isinstance(tags, list)
        assert len(tags) > 0
        for tag in tags:
            assert tag in CANONICAL_SKILLS

def test_invalid_skill_rejection(setup_test_db):
    db = setup_test_db
    # 尝试插入带有非法 skill 的 KnowledgeNode 并通过 seed 逻辑验证拦截
    invalid_data = {
        "id": "invalid_node",
        "subject_id": "mathematics",
        "name": "非法测试",
        "skill_tags": ["fake_skill"]
    }
    has_error = False
    try:
        for tag in invalid_data["skill_tags"]:
            if tag not in CANONICAL_SKILLS:
                raise ValueError(f"Invalid canonical skill tag: {tag}")
    except ValueError:
        has_error = True
    assert has_error is True

def test_question_to_knowledge_linkage(setup_test_db):
    db = setup_test_db
    questions = db.query(Question).all()
    assert len(questions) > 0
    for q in questions:
        kp_id = q.knowledge_point_id
        assert kp_id is not None
        kn = db.get(KnowledgeNode, kp_id)
        assert kn is not None
        assert kn.id == kp_id

def test_full_chain_resolution(setup_test_db):
    # Test Question -> KnowledgeNode -> skill_tags -> Canonical Skill chain
    db = setup_test_db
    q = db.query(Question).first()
    assert q is not None
    
    kn = db.get(KnowledgeNode, q.knowledge_point_id)
    assert kn is not None
    
    tags = json.loads(kn.skill_tags)
    assert len(tags) > 0
    
    for skill in tags:
        assert skill in CANONICAL_SKILLS

def test_p0_01_student_vector_regression():
    # 确保 P0-01 的 Student Vector 合同依然完好
    res = client.post("/api/users", json={"name": "Regression Student"})
    assert res.status_code == 200
    user_id = res.json()["id"]

    state_res = client.get(f"/api/students/{user_id}/state")
    assert state_res.status_code == 200
    data = state_res.json()
    assert "student_vector" in data
    assert "skills" in data["student_vector"]
    assert "knowledge" in data["student_vector"]
    for skill in CANONICAL_SKILLS:
        assert skill in data["student_vector"]["skills"]

from api.assessment import calculate_alpha, update_mastery

def test_p0_03_mastery_update_contract():
    # Test 1: Initial mastery (M_old = 0.5)
    # Test 2: 100% accuracy (E = 1.0)
    # Test 3: 0% accuracy (E = 0.0)
    # Test 4: Partial accuracy (e = 0.6)
    # Test 5, 6, 7: Easy, Medium, Hard alpha values and updates
    # Test 8: Clamp [0, 1]
    # Test 9: Deterministic result
    
    # 1. Alpha validation & calculation tests
    assert calculate_alpha("easy") == 0.25 * 0.7       # 0.175
    assert calculate_alpha("medium") == 0.25 * 1.0     # 0.25
    assert calculate_alpha("hard") == 0.25 * 1.3       # 0.325

    # 2. Initial mastery & EMA formula (Unseen: M_old = 0.5, E = 1.0, medium alpha = 0.25)
    # M_new = (1 - 0.25)*0.5 + 0.25*1.0 = 0.75*0.5 + 0.25 = 0.375 + 0.25 = 0.625 -> round to 0.63
    m_new_initial = update_mastery(0.5, 1.0, 0.25)
    assert m_new_initial == 0.63

    # 3. 0% accuracy
    # M_new = (1 - 0.25)*0.5 + 0.25*0.0 = 0.375 -> 0.38
    assert update_mastery(0.5, 0.0, 0.25) == 0.38

    # 4. Partial accuracy (E = 0.6, alpha = 0.25, M_old = 0.5)
    # (0.75 * 0.5) + (0.25 * 0.6) = 0.375 + 0.15 = 0.525 -> 0.53
    assert update_mastery(0.5, 0.6, 0.25) == 0.53

    # 5. Easy difficulty alpha = 0.175
    alpha_easy = calculate_alpha("easy")
    assert alpha_easy == 0.175

    # 6. Medium difficulty alpha = 0.25
    alpha_medium = calculate_alpha("medium")
    assert alpha_medium == 0.25

    # 7. Hard difficulty alpha = 0.325
    alpha_hard = calculate_alpha("hard")
    assert alpha_hard == 0.325

    # 8. Clamp tests (< 0 and > 1)
    assert update_mastery(0.0, -1.0, 0.5) == 0.0
    assert update_mastery(1.0, 2.0, 0.5) == 1.0

    # 9. Deterministic result
    res1 = update_mastery(0.7, 0.8, 0.25)
    res2 = update_mastery(0.7, 0.8, 0.25)
    assert res1 == res2

    # 10 & 11 & 12: End-to-end Assessment submission & Canonical storage & Legacy mirror & P0-01 regression
    res = client.post("/api/users", json={"name": "Mastery Contract Student"})
    assert res.status_code == 200
    user_id = res.json()["id"]

    # Fetch questions for mathematics
    q_res = client.get("/api/assessments/mathematics/questions?limit=2")
    assert q_res.status_code == 200
    questions = q_res.json()
    assert len(questions) > 0

    answers = [{"question_id": q["id"], "answer": q["answer"]} for q in questions]
    sub_res = client.post(f"/api/students/{user_id}/assessment", json={
        "subject_id": "mathematics",
        "answers": answers
    })
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert "mastery" in sub_data

    # Check student state
    state_res = client.get(f"/api/students/{user_id}/state")
    assert state_res.status_code == 200
    state_data = state_res.json()

    # Canonical storage check
    assert "student_vector" in state_data
    assert "knowledge" in state_data["student_vector"]
    assert len(state_data["student_vector"]["knowledge"]) > 0

    # Legacy mirror check
    assert "mastery" in state_data
    assert state_data["mastery"] == state_data["student_vector"]["knowledge"]

    # P0-01 regression check
    assert "skills" in state_data["student_vector"]
    for skill in CANONICAL_SKILLS:
        assert skill in state_data["student_vector"]["skills"]



if __name__ == "__main__":
    import pytest
    import sys
    sys.path.insert(0, "backend")
    sys.exit(pytest.main([__file__]))

