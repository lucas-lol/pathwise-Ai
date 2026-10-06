import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite test database with StaticPool so all connections share the same in-memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

import models.base
import models.tables

import models.tables
from main import app
from api.assessment import seed_questions_and_subjects

@pytest.fixture(autouse=True)
def setup_test_db():
    models.base.Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        seed_questions_and_subjects(db)
        yield db
    finally:
        db.close()
        models.base.Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def override_get_db(monkeypatch):
    def _override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    monkeypatch.setattr(models.base, "SessionLocal", TestSessionLocal)
    app.dependency_overrides[models.base.get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()

