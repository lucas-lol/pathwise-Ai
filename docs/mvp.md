
---

### 文件 3：`docs/API_CONTRACT.md`
**位置**：`docs/API_CONTRACT.md`
**作用**：前后端接口的契约。

```markdown
# PathWise AI API 接口契约

> 所有接口前缀：`/api`
> 响应格式：JSON
> 错误格式：`{"detail": "错误信息"}`

---

## 已实现接口

### 用户

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/users` | 创建学生用户（自动初始化画像 + 状态） |
| `GET` | `/api/users/{user_id}` | 获取用户信息 |

### 学生画像

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/students/{user_id}/profile` | 获取学生画像 |
| `PUT` | `/api/students/{user_id}/profile` | 更新画像（同步写入学生状态） |

### 学生状态

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/students/{user_id}/state` | 获取学生完整动态状态（含版本号） |

---

## 待开发接口

### 能力诊断

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/assessments/{subject_id}/questions` | 获取诊断题目 |
| `POST` | `/api/assessments/{student_id}/answer` | 提交答题记录 |
| `POST` | `/api/assessments/{student_id}/complete` | 完成诊断，更新掌握度 |