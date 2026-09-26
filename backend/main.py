from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import Response

app = FastAPI(title="PathWise AI")

# ✅ 新增：启动时自动调用你的初始化函数，创建数据库表
try:
    from init_db import init_database
    init_database()  # <--- 这里直接调用你写好的函数
    print("✅ 数据库表已自动创建/同步")
except Exception as e:
    print(f"⚠️ 警告: 数据库初始化失败，请检查 init_db.py ({e})")

# 配置跨域 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有网站访问
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载路由
try:
    from api.careers import router as careers_router
    app.include_router(careers_router, prefix="/api", tags=["careers"])
    print("✅ 成功加载 careers 路由")
except Exception as e:
    print(f"⚠️ 警告: 无法加载 careers 路由 ({e})")

try:
    from api.students import router as students_router
    app.include_router(students_router, prefix="/api", tags=["students"])
    print("✅ 成功加载 students 路由")
except Exception as e:
    print(f"️ 警告: 无法加载 students 路由 ({e})")

try:
    from api.assessment import router as assessment_router
    app.include_router(assessment_router, prefix="/api", tags=["assessment"])
    print("✅ 成功加载 assessment 路由")
except Exception as e:
    print(f"⚠️ 警告: 无法加载 assessment 路由 ({e})")

# 基础接口
# 基础接口
@app.get("/")
def read_root():
    return {"message": "PathWise AI Backend is running!"}

# 👇 保持最简单！FastAPI 会自动处理 UptimeRobot 的 HEAD 请求并返回 200 OK
@app.get("/health")
def health():
    return {"ok": True}
