backend/
├── main.py               # 应用入口 + CORS + 启动初始化
├── schemas.py            # Pydantic 请求/响应模型
├── api/
│   ├── students.py       # 用户 + 学生画像 REST API
│   ├── assessment.py     # 能力诊断 API（待开发）
├── models/
│   ├── base.py           # 数据库引擎与会话（禁止修改）
│   └── tables.py         # 数据表定义
├── services/
│   ├── state_manager.py  # 学生状态读写（带版本乐观锁）
│   └── mastery.py        # 掌握度计算（待开发）
├── ai/
│   ├── orchestrator.py   # AI 任务调度器（待开发）
│   ├── career_agent.py   # Career Agent（待开发）
│   ├── learning_agent.py # Learning Agent（待开发）
│   └── insight_agent.py  # Insight Agent（待开发）
└── data/
    └── engine_params.json# 算法参数