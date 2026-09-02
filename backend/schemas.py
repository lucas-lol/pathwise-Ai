from pydantic import BaseModel, Field


class CreateUserBody(BaseModel):
    name: str = "学生"


class ScoresBody(BaseModel):
    math: float | None = None
    science: float | None = None
    history: float | None = None
    geography: float | None = None
    business: float | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    grade: str | None = None
    scores: ScoresBody | None = None
    no_grade: bool = False
    interests: list[str] = Field(default_factory=list)
    self_assessment: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    profile_complete: bool = False
