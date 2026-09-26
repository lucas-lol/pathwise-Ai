from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PathWise AI")

# 1. 最宽松的跨域配置 (MVP 演示专用，允许任何来源)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 必须是星号，允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 安全加载路由 (如果某个文件缺失，不会导致整个后端崩溃)
try:
    from api.careers import router as careers_router
    app.include_router(careers_router, prefix="/api", tags=["careers"])
    print("✅ 成功加载 careers 路由")
except Exception as e:
    print(f"⚠️ 警告: 无法加载 careers 路由 ({e})")

try:
    from api.students import router as students_router
    # 👇 关键：这里只写 /api
    app.include_router(students_router, prefix="/api", tags=["students"])
    print("✅ 成功加载 students 路由")
except Exception as e:
    print(f"⚠️ 警告: 无法加载 students 路由 ({e})")

try:
    from api.assessment import router as assessment_router
    app.include_router(assessment_router, prefix="/api", tags=["assessment"])
    print("✅ 成功加载 assessment 路由")
except Exception as e:
    print(f"⚠️ 警告: 无法加载 assessment 路由 ({e})")

# 3. 基础接口
@app.get("/")
def read_root():
    return {"message": "PathWise AI Backend is running!"}

@app.get("/health")
def health():
    return {"ok": True}