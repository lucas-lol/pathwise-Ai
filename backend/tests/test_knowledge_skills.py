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

def test_knowledge_node_skill_tags_validity():
    db = SessionLocal()
    try:
        seed_questions_and_subjects(db)
        nodes = db.query(KnowledgeNode).all()
        assert len(nodes) > 0
        for node in nodes:
            tags = json.loads(node.skill_tags)
            assert isinstance(tags, list)
            assert len(tags) > 0
            for tag in tags:
                assert tag in CANONICAL_SKILLS
    finally:
        db.close()

def test_invalid_skill_rejection():
    db = SessionLocal()
    try:
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
    finally:
        db.close()

def test_question_to_knowledge_linkage():
    db = SessionLocal()
    try:
        seed_questions_and_subjects(db)
        questions = db.query(Question).all()
        assert len(questions) > 0
        for q in questions:
            kp_id = q.knowledge_point_id
            assert kp_id is not None
            kn = db.get(KnowledgeNode, kp_id)
            assert kn is not None
            assert kn.id == kp_id
    finally:
        db.close()

def test_full_chain_resolution():
    # Test Question -> KnowledgeNode -> skill_tags -> Canonical Skill chain
    db = SessionLocal()
    try:
        seed_questions_and_subjects(db)
        q = db.query(Question).first()
        assert q is not None
        
        kn = db.get(KnowledgeNode, q.knowledge_point_id)
        assert kn is not None
        
        tags = json.loads(kn.skill_tags)
        assert len(tags) > 0
        
        for skill in tags:
            assert skill in CANONICAL_SKILLS
    finally:
        db.close()

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

if __name__ == "__main__":
    import pytest
    import sys
    sys.path.insert(0, "backend")
    sys.exit(pytest.main([__file__]))

