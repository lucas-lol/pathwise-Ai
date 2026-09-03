# 当前任务：能力诊断模块 - 第一步

> 创建时间：2026-09-04
> 状态：进行中
> 优先级：P0

---

## 目标

创建数学题库数据，并实现“获取诊断题目”的后端接口。

---

## 具体任务

### 1. 题库数据准备
- 在 `backend/data/` 下创建 `questions_math.json`
- 包含 10～15 道初中/高中数学题
- 每题必须包含字段：id, subject_id, knowledge_point_id, question, option_a, option_b, option_c, option_d, answer, difficulty, explanation。
- `knowledge_point_id` 限制为：基础运算 / 代数 / 方程 / 函数 / 几何 / 综合应用。
- `difficulty` 取值为 1~4。

### 2. 实现诊断 API
- 创建 `backend/api/assessment.py`
- 实现接口：`GET /api/assessments/{subject_id}/questions`
- 逻辑：从题库随机抽取题目返回。
- 请求和响应必须使用 Pydantic 模型。

### 3. 注册路由
- 在 `backend/main.py` 中注册 assessment 路由。

---

## 不要修改

- `backend/models/base.py`
- `backend/api/students.py` 的现有逻辑
- `.env` 文件

---

## 需要阅读的文件

- `.clinerules`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACT.md`
- `backend/models/tables.py`
- `backend/schemas.py`
- `backend/main.py`