# Student State 结构定义

> Student State 是系统的核心数据结构，存储学生的完整动态状态。
> 使用 JSON 字段存储，带 version 乐观锁。

---

## 完整结构

```json
{
  "student_id": "S001",
  "profile": {
    "grade": 10,
    "interests": ["technology", "science"],
    "goals": ["advanced_math"],
    "scores": { "math": 78, "science": 82 }
  },
  "mastery": { "math_function": 0.72, "math_algebra": 0.90 },
  "skills": {
    "analytical_reasoning": 0.78,
    "problem_solving": 0.82,
    "quantitative_thinking": 0.88
  },
  "confidence": {},
  "career_matches": [],
  "route": { "mode": "exploration", "current_branch": null },
  "achievements": [],
  "funnel": {
    "profile_complete": true,
    "assessment_complete": false,
    "career_selected": false,
    "route_ready": false
  },
  "version": 1,
  "updated_at": "2026-09-03T14:30:00Z"
}


---

### 文件 5：`docs/ROADMAP.md`
**位置**：`docs/ROADMAP.md`
**作用**：整体项目进度跟踪。

```markdown
# PathWise AI 开发路线图

> 比赛：2026 年第一届「码梦成真」编程进班快闪活动
> 周期：6 周（2026-09-02 至 2026-10-09）

---

## ✅ 已完成（MVP 第一阶段）

- [x] FastAPI 后端骨架 + 健康检查 + CORS
- [x] SQLite 数据库 + 11 张表自动建表
- [x] 学生用户 CRUD + 画像漏斗落库
- [x] 学生动态状态（带版本号）读写
- [x] 项目设计文档
- [x] 核心规则文档 (.clinerules) 和架构文档 (docs/) 创建

---

## 🚧 进行中

- [ ] **能力诊断模块**（当前任务）
  - [ ] 题库数据准备（数学，30~50 题）
  - [ ] 诊断接口（获取题目、提交答案、完成诊断）
  - [ ] 知识点掌握度计算（轻量贝叶斯更新）
  - [ ] 诊断结果页面（前端）

---

## 🔜 待办（按优先级）

### P0：必须完成（比赛核心）

- [ ] 方向探索（文/商/理推荐 + 可解释理由）
- [ ] 科目组合选择与比较
- [ ] 学习路线生成（知识图谱 + 先修关系 + 掌握度缺口）
- [ ] 学习执行（学习 → 练习 → 测验 → 解锁）
- [ ] 前端完整流程（画像 → 诊断 → 选科 → 路线 → 学习）

### P1：建议完成

- [ ] AI Service（Orchestrator + Career/Learning/Insight Agent）
- [ ] AI Cache + Token Budget + Fallback
- [ ] Dashboard（成长数据 + 图表）

---


---

### 文件 5：`docs/ROADMAP.md`
**位置**：`docs/ROADMAP.md`
**作用**：整体项目进度跟踪。

```markdown
# PathWise AI 开发路线图

> 比赛：2026 年第一届「码梦成真」编程进班快闪活动
> 周期：6 周（2026-09-02 至 2026-10-09）

---

## ✅ 已完成（MVP 第一阶段）

- [x] FastAPI 后端骨架 + 健康检查 + CORS
- [x] SQLite 数据库 + 11 张表自动建表
- [x] 学生用户 CRUD + 画像漏斗落库
- [x] 学生动态状态（带版本号）读写
- [x] 项目设计文档
- [x] 核心规则文档 (.clinerules) 和架构文档 (docs/) 创建

---

## 🚧 进行中

- [ ] **能力诊断模块**（当前任务）
  - [ ] 题库数据准备（数学，30~50 题）
  - [ ] 诊断接口（获取题目、提交答案、完成诊断）
  - [ ] 知识点掌握度计算（轻量贝叶斯更新）
  - [ ] 诊断结果页面（前端）

---

## 🔜 待办（按优先级）

### P0：必须完成（比赛核心）

- [ ] 方向探索（文/商/理推荐 + 可解释理由）
- [ ] 科目组合选择与比较
- [ ] 学习路线生成（知识图谱 + 先修关系 + 掌握度缺口）
- [ ] 学习执行（学习 → 练习 → 测验 → 解锁）
- [ ] 前端完整流程（画像 → 诊断 → 选科 → 路线 → 学习）

### P1：建议完成

- [ ] AI Service（Orchestrator + Career/Learning/Insight Agent）
- [ ] AI Cache + Token Budget + Fallback
- [ ] Dashboard（成长数据 + 图表）

---

