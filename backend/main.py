from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PathWise AI")

# 1. 跨域配置 (允许所有，解决 pending)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 路由注册 (严格对应 /api/students/...)
# 注意：这里必须导入 api 文件夹下的模块
try:
    from api.students import router as students_router
    app.include_router(students_router, prefix="/api", tags=["students"])
    print("✅ 路由加载成功: /api/students/...")
except Exception as e:
    print(f"❌ 路由加载失败: {e}")

try:
    from api.careers import router as careers_router
    app.include_router(careers_router, prefix="/api", tags=["careers"])
except Exception as e:
    print(f"❌ careers 加载失败: {e}")

try:
    from api.assessment import router as assessment_router
    app.include_router(assessment_router, prefix="/api", tags=["assessment"])
except Exception as e:
    print(f"❌ assessment 加载失败: {e}")

try:
    from api.knowledge import router as knowledge_router
    app.include_router(knowledge_router, prefix="/api", tags=["knowledge"])
except Exception as e:
    print(f"❌ knowledge 加载失败: {e}")

@app.get("/")
def root():
    return {"msg": "PathWise API is running"}