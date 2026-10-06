from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Column, String, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from models.base import Base
from typing import Optional


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), default="学生")
    grade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    interests: Mapped[str] = mapped_column(Text, default="[]")
    self_assessment: Mapped[str] = mapped_column(Text, default="[]")
    scores: Mapped[str] = mapped_column(Text, default="{}")
    goals: Mapped[str] = mapped_column(Text, default="[]")
    no_grade: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    assessment_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    selected_career: Mapped[Optional[str]] = mapped_column(default=None)
    career_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    route_ready: Mapped[bool] = mapped_column(Boolean, default=False)


class StudentState(Base):
    __tablename__ = "student_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    state_json: Mapped[str] = mapped_column(Text, default="{}")
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    track: Mapped[str] = mapped_column(String(40), default="")


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    subject_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    name: Mapped[str] = mapped_column(String(120))
    parent_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)
    skill_tags: Mapped[str] = mapped_column(Text, default="[]")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    subject_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    knowledge_point_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    question: Mapped[str] = mapped_column(Text, default="")
    option_a: Mapped[str] = mapped_column(Text, default="")
    option_b: Mapped[str] = mapped_column(Text, default="")
    option_c: Mapped[str] = mapped_column(Text, default="")
    option_d: Mapped[str] = mapped_column(Text, default="")
    answer: Mapped[str] = mapped_column(String(8), default="A")
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    explanation: Mapped[str] = mapped_column(Text, default="")

from datetime import datetime

class AnswerRecord(Base):
    __tablename__ = "answer_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, index=True) # 关联学生
    question_id = Column(String, ForeignKey("questions.id"), index=True) # 关联题目
    student_answer = Column(String) # 学生选的答案
    is_correct = Column(Boolean) # 是否正确
    submitted_at = Column(DateTime, default=datetime.utcnow) # 答题时间


class LearningEvent(Base):
    __tablename__ = "learning_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer)
    event_type: Mapped[str] = mapped_column(String(40))
    payload: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LearningRoute(Base):
    __tablename__ = "learning_routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer)
    goal: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class RouteNode(Base):
    __tablename__ = "route_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(Integer)
    knowledge_point_id: Mapped[str] = mapped_column(String(80))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="locked")
    reason: Mapped[str] = mapped_column(Text, default="")


class AiCache(Base):
    __tablename__ = "ai_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cache_key: Mapped[str] = mapped_column(String(200), unique=True)
    payload: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)



class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True) # 例如: "math-j1-algebra-linear-eq"
    subject: Mapped[str] = mapped_column(String, default="math", index=True)
    grade: Mapped[str] = mapped_column(String, index=True) # 例如: "初一", "高一"
    domain: Mapped[str] = mapped_column(String, index=True) # 例如: "代数"
    topic: Mapped[str] = mapped_column(String) # 例如: "线性方程"
    name: Mapped[str] = mapped_column(String) # 具体知识点名称
    
    # 树状结构与依赖
    parent_id = Column(String, ForeignKey("knowledge_points.id"), nullable=True)
    prerequisite_id = Column(String, ForeignKey("knowledge_points.id"), nullable=True)
    
    # 属性
    difficulty = Column(Integer, default=1) # 1-5
    importance = Column(Integer, default=1) # 1-5
    tags = Column(JSON, nullable=True) # 例如: ["核心", "易错"]

    # 关系（可选，方便后续查询）
    parent = relationship("KnowledgePoint", remote_side=[id], foreign_keys=[parent_id])
    prerequisite = relationship("KnowledgePoint", remote_side=[id], foreign_keys=[prerequisite_id])
