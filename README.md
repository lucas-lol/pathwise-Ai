# PathWise AI 🧭

> **找到你的方向，走出你的路线。**

**2026 年第一届「码梦成真」编程进班快闪活动 参赛作品**

PathWise AI（未来学习规划系统）是一个面向中学生的 **AI 自适应学习规划系统（Adaptive Learning System）**。它先了解学生，再测试学生，然后帮助学生探索学科方向、选择科目组合，自动生成**会随着学习表现持续调整**的个人学习路线。

系统始终回答两个问题：

- **学生现在在哪里？** —— 通过成绩、能力诊断、知识点掌握度、学习行为判断当前水平
- **学生下一步应该去哪里？** —— 根据目标、兴趣、科目和薄弱知识点生成下一阶段学习路线

---

## ✨ 核心特性

| 模块 | 说明 |
|---|---|
| ① 学生画像 | 年级 / 成绩 / 兴趣 / 自我评价，逐步建立学生档案 |
| ② 能力诊断 | 预制题库，每题绑定知识点与难度，判断真实知识水平 |
| ③ 知识点掌握度 | 轻量贝叶斯更新算法，掌握度保持在 0~1 |
| ④ 方向探索 | 文 / 商 / 理方向匹配 + 可解释推荐理由 |
| ⑤ 科目组合 | 选择与比较科目组合，后台可配置，不硬编码 |
| ⑥ AI 学习路线 | 知识图谱 + 先修关系 + 掌握度缺口，生成个性化路线 |
| ⑦ 学习执行 | 学习 → 练习 → 测验 → 解锁，固定学习闭环 |
| ⑧ AI 成长分析 | 根据学习结果动态调整路线，持续循环 |

### 核心创新点

1. **从选科延伸到学习路线** —— 不只是告诉你"你适合理科"，而是告诉你"接下来该学什么"
2. **个性化** —— 根据当前能力决定起点，每个人有不同路径
3. **动态调整** —— 一次生成、持续迭代，路线随成长变化
4. **可解释 AI** —— 告诉你 *为什么* 推荐理科、哪些能力需要提升，而不是黑盒判决

---

## 🔄 系统运行流程

```text
学生进入系统
     │
     ▼
① 建立学生画像 ──────────► 年级 / 成绩 / 兴趣 / 自我评价
     │
     ▼
② 能力诊断 ──────────────► 知识点掌握度 + 能力证据
     │
     ▼
③ 方向探索 + 科目组合 ─────► 文 / 商 / 理 + 科目选择
     │
     ▼
④ AI 生成个性化学习路线
     │
     ▼
⑤ 学习 → 练习 → 测验
     │
     ▼
⑥ 学习数据分析 ──► 是否调整路线？
     │                ↙        ↘
     │             否(继续)   是(路线调整)
     │                └────┬────┘
     ▼                     │
     循环 ◄──────◄─────────┘
```

---

## 🛠 技术栈

| 层次 | 技术 | 状态 |
|---|---|---|
| 后端 | Python + FastAPI + SQLAlchemy | ✅ 已实现 |
| 数据库 | SQLite（正式环境可平滑迁移 PostgreSQL / MongoDB） | ✅ 已实现 |
| 数据校验 | Pydantic v2 | ✅ 已实现 |
| 前端 | React + TypeScript + Tailwind CSS（Vite） | 🚧 开发中 |
| AI | 独立 AI Service → LLM API（DeepSeek），不直接暴露给前端 | 🔜 规划中 |
| 实时更新 | WebSocket 事件驱动 | 🔜 规划中 |

---

## 📁 项目结构

```text
PathWise-AI/
├── backend/                  # FastAPI 后端
│   ├── main.py               # 应用入口 + CORS + 启动初始化
│   ├── schemas.py            # Pydantic 请求/响应模型
│   ├── requirements.txt      # 依赖清单
│   ├── .env.example          # 环境变量示例（DEEPSEEK / DATABASE_URL）
│   ├── api/
│   │   └── students.py       # 用户 + 学生画像 REST API
│   ├── models/
│   │   ├── base.py           # 数据库引擎与会话
│   │   └── tables.py         # 11 张数据表定义
│   ├── services/
│   │   └── state_manager.py  # 学生状态读写（带版本乐观锁）
│   └── data/
│       ├── subjects.json     # 学科预置数据
│       └── engine_params.json# 算法参数（掌握度 / 匹配权重 / 漏斗）
├── demo/                     # 演示用例（预留）
├── 前端/                     # React 前端（开发中）
├── 后端/                     # 预留
├── 数据库/                   # 预留
├── README.md                 # 本文档
├── PathWise_AI_程序员开发说明书.md        # 产品与技术规格说明书
├── PathWise_AI_6周最终系统框架与设计方案.md # 6 周比赛版最终设计方案
└── .gitignore
```

---

## 🚀 快速开始

### 环境要求

- Python 3.10+
- （前端开发时）Node.js 18+

### 1. 启动后端

在仓库根目录执行：

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\pip install -r backend\requirements.txt
backend\.venv\Scripts\uvicorn backend.main:app --reload --app-dir .
```

启动后：

- API 文档（自动生成）：**http://localhost:8000/docs**
- 健康检查：**http://localhost:8000/health**

SQLite 数据库文件会在首次启动时自动创建于 `backend/pathwise.db`。

### 2. 启动前端（开发中）

```powershell
cd frontend
npm install
npm run dev
```

浏览器打开 Vite 提示的地址（默认 http://localhost:5173）。

---

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/users` | 创建学生用户（自动初始化画像 + 状态） |
| `GET` | `/api/users/{user_id}` | 获取用户信息 |
| `GET` | `/api/students/{user_id}/profile` | 获取学生画像 |
| `PUT` | `/api/students/{user_id}/profile` | 更新画像（同步写入学生状态） |
| `GET` | `/api/students/{user_id}/state` | 获取学生完整动态状态（含版本号） |

### 创建用户示例

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "小明"}'
```

### 学生状态的结构

```json
{
  "student_id": "1",
  "profile": { "grade": null, "interests": [], "goals": [], "scores": {} },
  "mastery": {},
  "skills": {},
  "confidence": {},
  "career_matches": [],
  "route": { "mode": null, "current_branch": null },
  "achievements": [],
  "funnel": {
    "profile_complete": false,
    "assessment_complete": false,
    "career_selected": false,
    "route_ready": false
  },
  "version": 1
}
```

> **漏斗（Funnel）** 是产品的核心里程碑：画像完成 → 诊断完成 → 方向选定 → 路线就绪，每次推进都会写入数据库。

---

## 🗄 数据库设计（11 张表）

| 表 | 作用 |
|---|---|
| `users` | 用户基本信息 |
| `student_profiles` | 学生画像（兴趣 / 成绩 / 自我评价，JSON 存储） |
| `student_states` | **学生动态状态**（JSON + version 乐观锁，系统核心） |
| `subjects` | 学科目录 |
| `knowledge_nodes` | 知识点（含先修依赖） |
| `questions` | 预制题库（ABCD + 解析） |
| `answer_records` | 答题记录（能力证据） |
| `learning_events` | 学习事件流 |
| `learning_routes` | 学习路线 |
| `route_nodes` | 路线节点（locked / available / in_progress / completed） |
| `ai_cache` | AI 生成结果缓存（省 Token） |

---

## 📍 当前进度与路线图

### ✅ 已完成（MVP 第一阶段）

- FastAPI 后端骨架 + 健康检查 + CORS
- SQLite 数据库 + 11 张表自动建表
- 学生用户 CRUD + 画像漏斗落库
- 学生动态状态（带版本号）读写

### 🚧 开发中 / 🔜 规划中

- [ ] React + TypeScript 前端
- [ ] 能力诊断接口 + 题库（300~500 题）
- [ ] 知识点掌握度（轻量贝叶斯更新）
- [ ] 文 / 商 / 理方向推荐 + 科目组合
- [ ] 学习路线生成（知识图谱 + 先修 + 缺口）
- [ ] AI Service（Orchestrator + Career / Learning / Insight 三个 Agent）
- [ ] AI Cache + Token Budget + Fallback
- [ ] WebSocket 实时更新

> 完整规划见 **[PathWise_AI_6周最终系统框架与设计方案.md](PathWise_AI_6周最终系统框架与设计方案.md)**

---

## 🏆 参赛信息

- **活动**：2026 年第一届「码梦成真」编程进班快闪活动
- **作品**：PathWise AI · 未来学习规划系统
- **Slogan**：找到你的方向，走出你的路线。

---

## 📝 说明

- 本仓库已通过 `.gitignore` 排除虚拟环境、数据库文件、`.env` 等敏感与生成内容。
- 配置 DeepSeek API Key：复制 `backend/.env.example` 为 `backend/.env` 并填入密钥（不会提交到仓库）。
