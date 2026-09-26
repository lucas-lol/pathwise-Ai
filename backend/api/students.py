import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.base import get_db
from models.tables import StudentProfile, User
from schemas import CreateUserBody, ProfileUpdate
from services import state_manager

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
    # 1. 查找用户，如果不存在则自动创建
    user = db.get(User, user_id)
    if not user:
        # 自动创建新用户 (MVP 极简版：只需要 ID)
        user = User(id=user_id) 
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # 2. 查找 Profile，如果不存在则自动创建
    # 注意：这里用 .first() 代替 .one()，防止找不到时报错崩溃
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # 3. 更新数据
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
    
    # 保存职业选择
    if body.selected_career is not None:
        profile.selected_career = body.selected_career
        
    profile.profile_complete = bool((user.grade and body.interests) or body.profile_complete or profile.profile_complete)
    
    db.add(user)
    db.add(profile)
    db.commit()

    # 4. 更新 State 状态机
    row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(row)
    state["profile"] = {
        "grade": user.grade,
        "interests": json.loads(profile.interests) if profile.interests else [],
        "goals": json.loads(profile.goals) if profile.goals else [],
        "scores": json.loads(profile.scores) if profile.scores else {},
        "self_assessment": json.loads(profile.self_assessment) if profile.self_assessment else [],
        "no_grade": profile.no_grade,
    }
    state["selected_career"] = profile.selected_career
    state["funnel"]["profile_complete"] = profile.profile_complete
    
    #  添加这一行：如果用户选了职业，就把“职业选择”节点也点亮
    if profile.selected_career:
        state["funnel"]["career_selected"] = True
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

# ==========================================
# 👇 补全：评估提交接口 (MVP 核心闭环)
# ==========================================
@router.post("/students/{user_id}/assessment")
def submit_assessment(user_id: int, body: dict, db: Session = Depends(get_db)):
    """
    接收前端提交的评估答案，并点亮漏斗的“评估完成”和“路线就绪”节点。
    """
    # 1. 简单校验用户是否存在
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
        
    # 2. 获取或创建状态行
    row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(row)
    
    # 3. 🔥 核心动作：点亮评估和路线节点
    state["funnel"]["assessment_complete"] = True
    state["funnel"]["route_ready"] = True
    
    # (可选) 模拟生成一个掌握度分数，让 Dashboard 看起来更真实
    if "mastery" not in state:
        state["mastery"] = {}
    state["mastery"]["mathematics"] = 0.75 # 模拟 75% 的掌握度
    
    # 4. 保存状态
    state_manager.write_state(db, row, state)
    db.commit()
    
    return {"message": "评估提交成功，学习路线已生成"}