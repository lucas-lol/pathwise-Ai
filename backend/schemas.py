from pydantic import BaseModel, Field


class CreateUserBody(BaseModel):
    name: str = "学生"


class ScoresBody(BaseModel):
    math: float | None = None
    science: float | None = None

class AnswerItem(BaseModel):
    question_id: str
    answer: str


class AssessmentSubmit(BaseModel):
    subject_id: str
    answers: list[AnswerItem]

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


class QuestionResponse(BaseModel):
    id: str
    subject_id: str
    knowledge_point_id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    answer: str
    difficulty: int | str
    explanation: str

    class Config:
        from_attributes = True

