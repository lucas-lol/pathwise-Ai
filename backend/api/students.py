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

    # ==========================================
# 👇 补全：学习路线详情接口 (MVP 演示专用)
# ==========================================
# ==========================================
# 👇 终极保底版：完全不查数据库，保证演示成功
# ==========================================
@router.get("/students/{user_id}/route")
def get_student_route(user_id: int):
    """
    MVP 演示专用：直接返回预设的路线数据，不依赖数据库查询，防止 500 错误。
    """
    return {
        "student_name": "探索者",
        "grade": "高一",
        "target_career": "Machine Learning Engineer",
        "phases": [
            {
                "id": 1,
                "name": "阶段一：夯实学科基础",
                "description": "针对高一核心薄弱点进行专项突破，建立知识自信。",
                "tasks": [
                    {"id": "t1", "title": "完成【集合与逻辑】专项测验", "type": "quiz", "status": "ready", "desc": "15道精选题目，预计20分钟"},
                    {"id": "t2", "title": "观看：函数单调性本质解析", "type": "video", "status": "locked", "desc": "名师视频课，30分钟"}
                ]
            },
            {
                "id": 2,
                "name": "阶段二：职业启蒙与探索",
                "description": "初步了解 Machine Learning Engineer 的工作日常与核心技能要求。",
                "tasks": [
                    {"id": "t3", "title": "阅读：AI工程师的一天", "type": "article", "status": "locked", "desc": "行业前沿文章阅读"},
                    {"id": "t4", "title": "动手：用代码画一个正弦波", "type": "project", "status": "locked", "desc": "Python 基础实践项目"}
                ]
            },
            {
                "id": 3,
                "name": "阶段三：实战项目挑战",
                "description": "将所学知识应用于解决实际问题，产出第一个作品集。",
                "tasks": [
                    {"id": "t5", "title": "期末项目：个人数据分析报告", "type": "project", "status": "locked", "desc": "综合运用统计与图表知识"}
                ]
            }
        ]
    }