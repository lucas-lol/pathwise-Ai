from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "pathwise.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from models import tables  # noqa: F401

    Base.metadata.create_all(bind=engine)
    
    # 确保 knowledge_nodes 表存在 skill_tags 字段 (SQLite 轻量迁移)
    try:
        import sqlalchemy
        with engine.connect() as conn:
            res = conn.execute(sqlalchemy.text("PRAGMA table_info(knowledge_nodes)"))
            cols = [row[1] for row in res.fetchall()]
            if cols and "skill_tags" not in cols:
                conn.execute(sqlalchemy.text("ALTER TABLE knowledge_nodes ADD COLUMN skill_tags TEXT DEFAULT '[]'"))
                conn.commit()
    except Exception:
        pass
