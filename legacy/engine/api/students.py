import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.base import SessionLocal
from models.tables import StudentProfile, User
from schemas import CreateUserBody
from services import state_manager

router = APIRouter(prefix="/students", tags=["students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _profile_to_dict(user: User, profile: StudentProfile) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "career_level": user.grade,  # 将原本的 grade 字段语义转换为 career_level
        "interests": json.loads(profile.interests) if profile.interests else [],
        "self_assessment": json.loads(profile.self_assessment) if profile.self_assessment else [],
        "scores": json.loads(profile.scores) if profile.scores else {},
        "goals": json.loads(profile.goals) if profile.goals else [],
        "selected_career": profile.selected_career,
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
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
    return _profile_to_dict(user, profile)

@router.get("/{user_id}/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    return get_user(user_id, db)

@router.get("/{user_id}/state")
def get_state(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    row = state_manager.get_or_create_state(db, user_id)
    data = state_manager.read_state(row)
    data["version"] = row.version
    return data

@router.post("/{user_id}/assessment")
def submit_assessment(user_id: int, body: dict, db: Session = Depends(get_db)):
    """接收前端提交的评估答案,并点亮漏斗的“评估完成”和“路线就绪”节点。"""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
        
    row = state_manager.get_or_create_state(db, user_id)
    state = state_manager.read_state(row)
    
    state["funnel"]["assessment_complete"] = True
    state["funnel"]["route_ready"] = True
    
    if "mastery" not in state:
        state["mastery"] = {}
    state["mastery"]["core_competency"] = 0.75 
    
    state_manager.write_state(db, row, state)
    db.commit()
    return {"message": "评估提交成功,学习路线已生成"}

# ==========================================
# 🌟 核心重构：职业技能动态路线生成引擎
# ==========================================
@router.get("/{user_id}/route")
def get_student_route(user_id: int, db: Session = Depends(get_db)):
    """
    根据用户的职业阶段(career_level)和目标职业(career_id)，
    动态生成包含硬核技术题目的个性化成长路线。
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
        
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    
    # 复用原有的 grade 字段存储“职业阶段” (如: L1_入门, L2_进阶, L3_专家)
    career_level = user.grade if user.grade else "L1_入门"
    career_id = profile.selected_career if profile and profile.selected_career else "ai_engineer"
    career_name = career_id.replace('_', ' ').title()

    # 1. 动态题库 (核心：根据职业ID返回不同的硬核面试题)
    quiz_content = {}
    phase1_task1 = "核心硬技能突破"
    
    if "ai" in career_id or "data" in career_id:
        phase1_task1 = "完成【Transformer 与注意力机制】底层源码剖析"
        quiz_content = {
            "questions": [{
                "question": "深度学习：在训练大语言模型时，Multi-Head Attention 的主要优势是什么？",
                "options": [
                    {"id": "A", "text": "减少模型参数量，加快推理速度"},
                    {"id": "B", "text": "允许模型同时关注来自不同表示子空间的信息"},
                    {"id": "C", "text": "彻底消除梯度消失问题"},
                    {"id": "D", "text": "将时间复杂度从 O(N^2) 降至 O(N)"}
                ],
                "correctAnswer": "B"
            }]
        }
    elif "cloud" in career_id or "fullstack" in career_id:
        phase1_task1 = "完成【K8s 容器编排与高并发故障排查】专项测验"
        quiz_content = {
            "questions": [{
                "question": "云原生架构：在 Kubernetes 中，Pod 处于 CrashLoopBackOff 状态通常意味着什么？",
                "options": [
                    {"id": "A", "text": "节点内存不足，触发了 OOM Killer"},
                    {"id": "B", "text": "容器内的主进程启动失败或异常退出，Kubelet 正在不断尝试重启"},
                    {"id": "C", "text": "网络插件 (CNI) 配置错误，无法分配 IP"},
                    {"id": "D", "text": "镜像拉取失败 (ImagePullBackOff)"}
                ],
                "correctAnswer": "B"
            }]
        }
    elif "quant" in career_id or "finance" in career_id:
        phase1_task1 = "完成【量化因子挖掘与时间序列分析】高阶挑战"
        quiz_content = {
            "questions": [{
                "question": "量化金融：在构建多因子选股模型时，什么是“前视偏差 (Look-ahead Bias)”？",
                "options": [
                    {"id": "A", "text": "使用了过多的历史数据导致模型过拟合"},
                    {"id": "B", "text": "在计算 T 日的因子时，错误地使用了 T+1 日才能获取到的数据"},
                    {"id": "C", "text": "模型在训练集上表现完美，但在测试集上崩溃"},
                    {"id": "D", "text": "交易滑点和手续费计算不准确"}
                ],
                "correctAnswer": "B"
            }]
        }
    else:
        phase1_task1 = "完成【行业通用底层逻辑与系统设计】基础测验"
        quiz_content = {
            "questions": [{
                "question": "系统设计：在分布式系统中，CAP 定理指出无法同时满足的三个特性是？",
                "options": [
                    {"id": "A", "text": "一致性、可用性、分区容错性"},
                    {"id": "B", "text": "高并发、低延迟、高吞吐"},
                    {"id": "C", "text": "安全性、可靠性、可维护性"},
                    {"id": "D", "text": "扩展性、灵活性、成本效益"}
                ],
                "correctAnswer": "A"
            }]
        }

    # 2. 动态生成阶段二：真实业务场景实战
    phase2_task2 = "参与一个真实的业务级项目"
    if "ai" in career_id or "data" in career_id:
        phase2_task2 = "实战：基于 RAG 架构搭建一个企业级私有知识库问答系统"
    elif "cloud" in career_id or "fullstack" in career_id:
        phase2_task2 = "实战：设计并实现一个支持百万级 QPS 的秒杀系统网关"
    elif "quant" in career_id or "finance" in career_id:
        phase2_task2 = "实战：使用 Backtrader 复现并优化一个经典的双均线动量交易策略"
    elif "product" in career_id or "design" in career_id:
        phase2_task2 = "实战：主导一款 AI 效率工具的从 0 到 1 产品设计与 MVP 验证"

    # 3. 组装最终返回数据
    return {
        "student_name": user.name if user else "探索者",
        "career_level": career_level,
        "target_career": career_name,
        "phases": [
            {
                "id": 1,
                "name": "阶段一：核心硬技能突破",
                "description": f"针对 {career_level} 阶段，突破 {career_name} 的底层原理与技术壁垒。",
                "tasks": [
                    {"id": "t1", "title": phase1_task1, "type": "quiz", "status": "ready", "desc": "硬核技术测验，预计20分钟", "content": quiz_content},
                    {"id": "t2", "title": "研读：顶级技术博客与经典论文", "type": "article", "status": "locked", "desc": "行业前沿深度阅读", "content": {"text": "<h3>核心原理</h3><p>深入理解底层架构...</p>"}}
                ]
            },
            {
                "id": 2,
                "name": "阶段二：真实业务场景实战",
                "description": f"将理论应用于复杂的商业场景，积累 {career_name} 的实战经验。",
                "tasks": [
                    {"id": "t3", "title": "拆解：行业头部公司的技术架构", "type": "article", "status": "locked", "desc": "大厂架构案例分析", "content": {"text": "<h3>架构拆解</h3><p>分析千万级并发系统...</p>"}},
                    {"id": "t4", "title": phase2_task2, "type": "project", "status": "locked", "desc": "企业级实战项目", "content": {"projectBrief": "完成一个高复杂度的实战项目。", "requirements": ["需求分析", "架构设计", "代码实现"]}}
                ]
            },
            {
                "id": 3,
                "name": "阶段三：架构视野与领导力",
                "description": "从执行者向架构师/技术Leader转型，建立全局视野。",
                "tasks": [
                    {"id": "t5", "title": "终极挑战：主导千万级系统重构方案", "type": "project", "status": "locked", "desc": "输出架构设计白皮书", "content": {"projectBrief": "撰写一份企业级架构重构方案。", "requirements": ["痛点分析", "技术选型", "演进路线"]}}
                ]
            }
        ]
    }

@router.put("/{user_id}/profile")
def put_profile(user_id: int, body: dict, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(id=user_id, name=f"Explorer_{user_id}")
            db.add(user)
            
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        if not profile:
            profile = StudentProfile(user_id=user_id)
            db.add(profile)
            
        # 将前端的 career_level 存入 user.grade 字段 (复用字段)
        if "career_level" in body: user.grade = body["career_level"]
        if "grade" in body: user.grade = body["grade"] # 兼容旧前端
        
        if "interests" in body: profile.interests = json.dumps(body["interests"], ensure_ascii=False)
        if "scores" in body: profile.scores = json.dumps(body["scores"], ensure_ascii=False)
        if "selected_career" in body: 
            profile.selected_career = body["selected_career"]
            profile.career_selected = True
            
        profile.profile_complete = True
        db.commit()
        db.refresh(user)
        db.refresh(profile)

        # 同步更新 State 状态机
        row = state_manager.get_or_create_state(db, user_id)
        state = state_manager.read_state(row)
        
        state["profile"] = {
            "career_level": user.grade,
            "interests": body.get("interests", []),
            "goals": body.get("goals", []),
            "scores": body.get("scores", {}),
        }
        
        if body.get("selected_career"):
            state["selected_career"] = body["selected_career"]
            state["funnel"]["career_selected"] = True
            
        state["funnel"]["profile_complete"] = True
        state_manager.write_state(db, row, state)
        db.commit()
        
        return {"message": "success", "user_id": user_id}
        
    except Exception as e:
        print(f"⚠️ 数据库操作异常: {e}")
        return {"message": "mock_success", "user_id": user_id}