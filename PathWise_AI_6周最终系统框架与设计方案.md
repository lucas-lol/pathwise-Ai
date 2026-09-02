# PathWise AI｜6周比赛版最终系统框架与设计方案

> 版本：2026-09-02 Final MVP Design  
> 目标：在 6 周内完成一个可运行、可解释、可演示的「未来的学校」作品。  
> 核心原则：**确定性计算由后端算法负责，AI 负责解释、生成与辅助规划；推荐是“探索匹配度”，不是职业判决。**

---

# 0. 先给最终结论

PathWise AI 最终定位为：

> **一个把学生的多学科知识掌握、能力证据、兴趣、学习行为与真实职业世界连接起来，并根据持续学习结果动态调整学习路线的自适应未来学校系统。**

最终保留：

- 数学
- 物理
- 化学
- 生物
- 会计
- 商业学
- 经济学
- 真实职业与行业数据库 100 个方向
- 学生画像
- 多维能力诊断
- 职业探索匹配
- 个性化学习路线
- MongoDB / SQLite
- AI API
- Orchestrator
- 3 个轻量 Agent
- Event-driven 实时更新
- AI Cache / Token Budget / Fallback
- 用户可随时改变探索方向，不需要“重置人生”

不做：

- 家长端
- 教师端
- 复杂模型训练
- 100 个职业各自独立的 AI Agent
- 实时爬取全球全部职业数据
- 每次点击都调用 AI
- 用一次数学测试直接定义学生综合能力

---

# 1. 最终产品闭环

```text
                         PATHWISE AI
                              │
                         学生进入系统
                              │
                              ▼
                         ① 学生画像
                              │
                              ▼
                     ② 多学科能力探索
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              数学        科学物化生      商业学
                              │
                              ▼
                   Knowledge + Skill Evidence
                              │
                              ▼
                      ③ 100职业匹配
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             有明确目标             暂不确定
                    │                   │
                    ▼                   ▼
             目标导向路线          探索型共同基础路线
                    │                   │
                    └─────────┬─────────┘
                              ▼
                     ④ 个性化学习路线
                              │
                              ▼
                       ⑤ 学习 / 练习
                              │
                              ▼
                          ⑥ 测验
                              │
                              ▼
                          Event
                              │
                              ▼
                      State 更新
                              │
                  ┌───────────┼───────────┐
                  ▼           ▼           ▼
              Knowledge     Skill      Career Match
                 更新        更新          更新
                  │           │           │
                  └───────────┼───────────┘
                              ▼
                       路线动态调整
                              │
                              ▼
                      Future School UI
                              │
                              └──────────────↺
```

原开发说明书已经将 PathWise 定义为“了解 → 测试 → 探索方向 → 科目 → 学习路线 → 学习 → 分析 → 动态调整”的 Adaptive Learning System；本方案是在这个主闭环上扩充多学科、100职业、事件系统与更严格的计算模型。  
【来源：PathWise AI 程序员开发说明书】

---

# 2. 学科体系

## 2.1 最终保留 7 个核心学科

```text
Mathematics
Physics
Chemistry
Biology
Accounting
Business Studies
Economics
```

“科学”是一个学科大类：

```text
Science
├── Physics
├── Chemistry
└── Biology
```

“商业学”也是一个大类：

```text
Business
├── Accounting
├── Business Studies
└── Economics
```

因此 UI 可以显示：

```text
数学
科学
  ├─ 物理
  ├─ 化学
  └─ 生物
商业学
  ├─ 会计
  ├─ 商业
  └─ 经济
```

---

# 3. 知识库如何做到“完整”而不让 6 周爆炸

不要做“互联网上所有知识”。

定义：

> **完整知识树 = 每个学科覆盖一套有层级、有先修关系、有能力标签的核心知识网络。**

建议：

- 每个核心学科 20～35 个知识节点
- 第一版总计约 150～250 个 Knowledge Nodes
- 每个节点有：
  - subject
  - parent
  - prerequisites
  - difficulty
  - skill_tags
  - career_tags

示例：

```json
{
  "id": "math_function",
  "subject": "mathematics",
  "name": "函数",
  "difficulty": 3,
  "prerequisites": ["equation"],
  "skills": ["analytical_reasoning", "quantitative_thinking"],
  "career_clusters": ["technology", "engineering", "data"]
}
```

---

# 4. 100 个职业与行业方向

## 4.1 不建立 100 个独立模型

采用：

```text
100 Careers
      ↓
15～20 Career Clusters
      ↓
共享 Skill / Knowledge / Interest 标签
```

例如：

```text
Technology
├── Software Engineer
├── AI Engineer
├── Data Scientist
├── Cybersecurity Analyst
└── Cloud Engineer

Engineering
├── Mechanical Engineer
├── Civil Engineer
├── Chemical Engineer
└── Electrical Engineer

Business & Finance
├── Accountant
├── Financial Analyst
├── Economist
├── Business Consultant
└── Entrepreneur

Life Science
├── Biologist
├── Biomedical Scientist
├── Biotechnologist
└── Pharmacologist
```

## 4.2 Career Schema

```text
career_id
name
cluster
description
required_skills[]
preferred_knowledge[]
related_subjects[]
interest_tags[]
goal_tags[]
career_path[]
```

---

# 5. 最核心的算法：职业匹配模型

不让 LLM 决定职业分数。

采用：

> **Weighted Cosine Similarity + Rule-based Constraints + Expert/Validation Calibration**

即：

1. 把学生和职业都表示为向量
2. 比较 Skill / Knowledge / Interest / Goal 等维度
3. 用权重合并
4. 对明显不满足基础条件的方向施加惩罚
5. 得到 0～100 的 Exploration Match Score

---

## 5.1 学生向量

学生状态：

```text
Student Vector =
[Skills, Knowledge, Interests, Goals, Behavior]
```

例如：

```text
Skills:
Analytical Reasoning = 0.82
Problem Solving = 0.76
Quantitative Thinking = 0.91
Scientific Thinking = 0.72
Business Thinking = 0.54
Learning Agility = 0.80
```

---

## 5.2 职业向量

例如 Data Scientist：

```text
Analytical Reasoning = 0.90
Problem Solving = 0.85
Quantitative Thinking = 0.95
Scientific Thinking = 0.65
Business Thinking = 0.50
Learning Agility = 0.85
```

---

## 5.3 Skill Match

使用加权余弦相似度：

\[
S_c =
\frac{\sum_i w_i s_i c_i}
{\sqrt{\sum_i w_i s_i^2}\sqrt{\sum_i w_i c_i^2}}
\]

其中：

- \(s_i\) = 学生在第 i 项能力的分数
- \(c_i\) = 职业要求的第 i 项能力
- \(w_i\) = 该能力的重要性权重

结果 0～1。

---

# 6. Knowledge Match

知识匹配不是看学生“学过多少科”，而是看：

> 与该职业相关的知识节点掌握了多少。

\[
K_c =
\frac{\sum_j q_j m_j}
{\sum_j q_j}
\]

其中：

- \(m_j\) = 学生对知识点 j 的 Mastery
- \(q_j\) = 该知识点对职业的重要程度

例如 Data Scientist：

```text
Statistics       0.9
Probability      0.8
Functions        0.8
Programming      0.9
```

系统计算加权平均。

---

# 7. Interest Match

学生兴趣和职业标签使用向量相似度：

\[
I_c = Cosine(StudentInterest, CareerInterest)
\]

例如：

```text
Technology = 0.9
Science = 0.8
Business = 0.2
Creative = 0.4
```

与职业的兴趣标签比较。

---

# 8. Goal Match

Goal 不应该由 AI 猜。

学生可以选择：

```text
我想探索：
□ 科技
□ 医疗
□ 商业
□ 金融
□ 工程
□ 科研
□ 设计
□ 暂不确定
```

Goal Match：

\[
G_c = GoalAlignment(StudentGoal, CareerCluster)
\]

如果用户没有目标：

\[
G_c = 0.5
\]

而不是强行推断。

---

# 9. Behavior Match

Behavior 不是“学习成绩”。

它反映：

- 是否持续完成学习
- 是否愿意挑战高难度任务
- 是否能从错误中恢复
- 是否频繁中断
- 是否能够跨知识点迁移

第一版建议只占较小权重。

---

# 10. 最终 Career Score

第一版可采用：

\[
Score_c =
0.30S_c+
0.25K_c+
0.20I_c+
0.15G_c+
0.10B_c
\]

再：

\[
Match_c = Score_c \times 100
\]

注意：

> **86% 是 Match Score，不是 86% 准确率，也不是“你有86%的概率成为这个职业”。**

UI 文案：

> AI Engineer — 86 Exploration Match

中文：

> AI 工程师 — 86% 探索匹配度

---

# 11. ws、wk 等参数怎么获得？

这里需要区分：

## 第一阶段：没有真实数据

不要假装“机器学习学出了权重”。

采用：

### Expert Prior

由项目团队根据职业需求定义初始权重。

例如：

```text
Skill weight = 0.30
Knowledge weight = 0.25
Interest weight = 0.20
Goal weight = 0.15
Behavior weight = 0.10
```

如果需要更正式，可以使用 AHP（Analytic Hierarchy Process）让专家对因素进行两两比较，再计算初始权重。

---

## 第二阶段：有测试数据

准备一组匿名测试案例：

```text
Student A
Student B
Student C
...
```

由教师/学生/职业资料作为参考标签。

然后用：

> Grid Search / Logistic Regression / Learning-to-Rank

寻找能最大化验证集表现的权重。

例如：

```text
w_skill = 0.34
w_knowledge = 0.27
w_interest = 0.19
w_goal = 0.12
w_behavior = 0.08
```

最终锁定。

---

# 12. Accuracy 应该怎么定义？

不要把：

> Match Score

叫：

> Accuracy。

Accuracy 必须有 Ground Truth。

例如测试学生：

```text
真实希望探索：
Data Scientist
```

系统：

```text
Top 5：
AI Engineer
Data Scientist  ← Hit
Software Engineer
Economist
Financial Analyst
```

这就是：

> **Hit@5 = 命中**

“命中”意思：

> 真实标签出现在系统推荐的前 K 个职业中。

---

## Top-1 Accuracy

\[
Accuracy@1 =
\frac{Top1正确人数}{测试人数}
\]

## Hit@5

\[
Hit@5 =
\frac{真实目标出现在Top5的人数}{测试人数}
\]

对于职业探索，建议主要展示：

> **Hit@5 / Top-K Recall**

因为学生可能同时适合多个方向，不存在唯一“正确职业”。

---

# 13. 如果没有真实数据怎么办？

比赛 MVP：

> **不声称准确率。**

可以报告：

- 算法设计
- 人工测试案例
- 一致性测试
- Top-K 命中率（如果有明确标签）
- 推荐结果可解释性

如果没有可靠 Ground Truth，就不要制作虚假的 Accuracy 百分比。

---

# 14. 学习路线到底由什么决定？

答案：

> **不是只由职业目标决定，也不是只由测试结果决定。**

学习路线：

\[
Route =
Goal +
Prerequisite +
Mastery +
Weakness +
AvailableSubjects
\]

也就是：

```text
职业目标
+
职业所需知识
+
先修关系
+
当前掌握度
+
薄弱点
+
学生当前选择
```

---

# 15. 有目标时

例如：

```text
目标：
Data Scientist
```

系统：

```text
Data Scientist
      ↓
Required Knowledge
      ↓
Prerequisites
      ↓
检查学生 Mastery
      ↓
缺口
      ↓
Learning Route
```

例如：

```text
函数基础 ✓
统计基础 ⚠
概率 ⚠
Python ✓
数据分析 🔒
机器学习 🔒
```

---

# 16. 没有目标时

绝对不要强迫学生选。

提供：

# Exploration Mode

例如：

```text
你目前有三个相近方向：

Technology      84
Data & Science  82
Business        79

不需要现在决定。
```

然后生成：

> **共同基础路线**

例如：

```text
数学基础
      ↓
统计
      ↓
数据分析
      ↓
商业案例
      ↓
小型项目
```

这条路线同时为多个方向提供基础。

---

# 17. 解决选择困难：不要让学生“选职业”

这是产品体验上的关键升级。

流程改成：

```text
100 Career
    ↓
Top 10
    ↓
Top 3 Career Cluster
    ↓
共同基础能力
    ↓
Exploration Route
    ↓
学生体验
    ↓
根据体验重新选择
```

学生不是在 15 岁时决定：

> “我这一生必须成为 Data Scientist。”

而是：

> “我先体验这个方向。”

---

# 18. 如果学习途中想换方向怎么办？

不要 Reset。

采用：

# Branching Learning Path

例如：

```text
             数学基础
                │
              统计
                │
        ┌───────┴────────┐
        ▼                ▼
 Data Science       Economics
        │                │
      Python          Economics
        │                │
      AI/Data         Finance
```

如果学生从：

> Data Science

换到：

> Economics

共同基础已经完成：

```text
数学
统计
分析
```

保留。

只切换后面的 Branch。

所以：

> **换方向 = 切换路线分支，而不是清空学习记录。**

这对选择困难用户尤其重要。

---

# 19. 能力诊断：不同任务怎么设计？

不能只用数学题。

题目由：

```text
Knowledge Point
+
Skill Tag
+
Difficulty
+
Task Type
```

共同定义。

例如：

```text
数学：
函数图像 → Analytical Reasoning

物理：
力学实验 → Scientific Thinking

化学：
实验判断 → Scientific Thinking

生物：
数据解释 → Analytical Reasoning

经济：
市场案例 → Business Thinking

会计：
财务记录 → Quantitative + Business Thinking
```

---

# 20. 题目由谁生成？

最终采用：

# 预制核心题库 + AI辅助生成少量变体

而不是完全依赖 AI。

---

## 为什么？

如果所有题都实时调用 AI：

- Token 消耗高
- 题目质量不稳定
- 难以验证答案
- API 出问题就无法测试
- 比赛现场风险高

---

## 题库 Schema

```text
question_id
subject
knowledge_point
skill_tags[]
difficulty
question_type
question
options
answer
explanation
```

建议 MVP：

> 300～500 道题。

不是全部由人工从零写。

可以：

1. 人工建立核心题
2. 使用 AI 辅助生成变体
3. 人工审核
4. 存入数据库

之后用户答题：

> 不调用 AI。

---

# 21. Problem Solving 的 CDITSt 怎么评分？

定义：

```text
C = Correctness
D = Difficulty
I = Independence
T = Transfer
St = Stability
```

---

## C — Correctness

正确率：

\[
C = \frac{Correct}{Attempt}
\]

---

## D — Difficulty

题目难度标准化：

```text
简单 = 0.3
中等 = 0.6
困难 = 1.0
```

学生完成的题目难度加权。

不能简单地：

> 难题答对 = 100。

而是：

> 在较高难度下仍然正确 → 增强 Problem Solving Evidence。

---

## I — Independence

第一版不做复杂眼动/行为识别。

采用：

```text
是否需要提示
是否查看答案
是否重复尝试
```

例如：

```text
独立完成 = 1.0
轻度提示 = 0.7
大量提示 = 0.4
直接查看答案 = 0.2
```

---

## T — Transfer

跨知识/跨学科应用。

例如：

```text
数学函数
→ 物理运动模型
```

或者：

```text
数学统计
→ 经济数据分析
```

能够把一个知识结构应用到新情境：

> Transfer Evidence ↑

---

## St — Stability

观察连续表现。

例如最近 5 次：

```text
70
75
80
78
82
```

稳定性高。

可以使用：

\[
St = 1 - \frac{\sigma}{\mu+\epsilon}
\]

再限制在 0～1。

为了避免极端值，实际代码应做 clipping：

```text
St = clip(1 - std / (mean + 0.01), 0, 1)
```

---

# 22. Problem Solving 最终公式

\[
PS =
0.30C+
0.20D+
0.15I+
0.20T+
0.15St
\]

注意：

> 这些不是心理学意义上的“绝对能力”。

它们是：

# Skill Evidence Score

即：

> 系统根据当前任务证据推断出的能力指标。

---

# 23. Confidence 到底是什么？

最终不叫：

> AI Confidence

而叫：

# Evidence Confidence

它回答：

> “我们目前有多少证据支持这个判断？”

不是：

> “AI觉得自己回答正确的概率是多少？”

---

# 24. Confidence 的 ECSR

定义：

```text
E = Evidence Quantity
C = Cross-domain Coverage
S = Stability
R = Recency
```

最终：

\[
Confidence =
0.35E+
0.25C+
0.20S+
0.20R
\]

---

## E — Evidence Quantity

建议使用饱和函数，而不是：

> 做100题就变成100%。

例如：

\[
E = 1-e^{-n/8}
\]

n = 有效任务数。

这样：

- 1题：证据少
- 5题：明显增加
- 20题：接近充分
- 100题：不会无限增加

---

## C — Cross-domain Coverage

例如 Problem Solving：

```text
数学       ✓
物理       ✓
商业案例   ✓
```

三个不同领域：

> Coverage 高。

只有数学：

> Coverage 低。

可定义：

\[
C = \frac{covered\ domains}{target\ domains}
\]

---

## S — Stability

使用最近任务结果的稳定程度。

---

## R — Recency

最近的数据权重更高。

可以使用指数衰减：

\[
R=e^{-\lambda\Delta t}
\]

其中：

- \(\Delta t\) = 距离当前的时间
- \(\lambda\) = 衰减参数

---

# 25. Confidence 是否就是 AI 答案 Accuracy？

不是。

必须在系统层面区分：

```text
Match Score
= 学生与职业的匹配程度

Evidence Confidence
= 我们有多少证据支持这个匹配/能力判断

Accuracy
= 在有真实标签的测试集上，推荐是否正确
```

三者不能混用。

---

# 26. 用户是否应该看到证据链？

不建议完整显示。

你担心：

> “你的数学能力只有 63，因为证据不足。”

可能伤害学生自信。

因此：

# 后端保存证据，前端展示成长。

数据库：

```text
skill_evidence
confidence
source_tasks
cross_domain_count
stability
recency
```

用户看到：

```text
你的成长

✓ 完成 12 个挑战
✓ 解锁 函数基础
✓ 连续 5 次任务完成
↑ 问题解决能力提升
↑ 科学推理能力提升
```

如果需要解释，显示：

> “系统根据你近期多个数学、物理与商业任务的表现更新了这个方向。”

而不是公开复杂统计量。

---

# 27. Achievement System

把后端证据转换成正向反馈：

```text
Achievement
├── First Assessment
├── 5 Tasks Completed
├── Cross-Subject Explorer
├── Problem Solver
├── Science Explorer
├── Business Explorer
└── Learning Streak
```

这样：

> 后端越来越懂学生，前端越来越鼓励学生。

---

# 28. MongoDB vs SQLite

原开发说明书的 MVP 建议是 SQLite，并将 PostgreSQL作为正式扩展；它也要求 AI Service 独立于前端，通过 FastAPI 统一调用。  
【来源：PathWise AI 程序员开发说明书】

但考虑你现在的目标：

| 项目 | SQLite | MongoDB |
|---|---:|---:|
| 6周风险 | ★★★★★ | ★★★ |
| 本地运行 | ★★★★★ | ★★★ |
| 数据结构简单 | ★★★★★ | ★★★★ |
| 动态 Student State | ★★★ | ★★★★★ |
| Agent JSON | ★★★★ | ★★★★★ |
| Demo部署 | ★★★★★ | ★★★★ |
| 多用户扩展 | ★★ | ★★★★★ |
| 学习成本 | ★★★★★ | ★★★ |

---

# 29. 如果你们是 Vibe Coding

你说你会使用 Vibe Coding 搭数据库。

那么 MongoDB 的开发难度可以下降。

建议：

# MongoDB + Mongoose/PyMongo Schema Contract

但必须先定义 Schema。

Vibe Coding 最怕：

> “让 AI 自己随便设计数据库。”

正确方法：

```text
先定 Schema
↓
再让 AI 生成 Model
↓
再生成 CRUD
↓
再生成 API
↓
测试
```

---

# 30. 我的判断

如果：

> 两个人都能用 Vibe Coding + 愿意花 1～2 天熟悉 MongoDB

那么：

# 选择 MongoDB。

原因不是“MongoDB一定更高级”。

而是你的最终 Student State：

```json
{
  "skills": {},
  "mastery": {},
  "interests": [],
  "goals": [],
  "career_matches": [],
  "route": {},
  "achievements": [],
  "confidence": {}
}
```

非常适合文档型数据库。

如果比赛电脑完全离线或两个人完全没有数据库经验：

# SQLite 更稳。

---

# 31. Agent 到底是什么？

Agent 不是一个神秘的软件。

本质：

> **一个有明确任务、Prompt、输入格式、输出格式和工具权限的 AI 工作模块。**

---

# 32. 三个 Agent

## Career Agent

输入：

```text
Student State
Career Scores
Top Careers
```

负责：

- 解释为什么推荐
- 比较相近职业
- 解释职业之间差异

不负责：

- 计算 Career Score
- 修改学生能力

---

## Learning Agent

输入：

```text
Student State
Knowledge Gaps
Target Career
Learning Route
```

负责：

- 解释为什么学习这个知识点
- 提供学习建议
- 总结错误

---

## Insight Agent

输入：

```text
Recent Events
Skill Changes
Mastery Changes
Achievements
```

负责：

- 成长总结
- 学习趋势解释
- 鼓励与提醒

---

# 33. Orchestrator 是什么？

不是 API。

不是 AI 模型。

它是：

# AI Task Orchestrator

也就是：

> AI任务调度器。

例如：

```text
学生完成测验
       ↓
Orchestrator
       ↓
发现：
Knowledge changed
       ↓
更新 State
       ↓
是否需要 AI？
       ↓
YES
       ↓
Learning Agent
       ↓
是否影响职业推荐？
       ↓
YES
       ↓
Career Agent
```

---

# 34. Orchestrator 从哪里找？

不用找。

**自己用 Python 写一个普通的 Service。**

例如：

```text
backend/
├── services/
│   ├── orchestrator.py
│   ├── career_agent.py
│   ├── learning_agent.py
│   └── insight_agent.py
```

所以它本质上只是：

```python
def handle_event(event):
    ...
```

不是必须购买的第三方产品。

---

# 35. Agent 之间会不会因为分开而降低准确率？

只要：

> **不让 Agent 互相转述事实，就不会因为角色分开而天然降低准确率。**

正确：

```text
                    Student State
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
      Career Agent   Learning Agent  Insight Agent
```

三个 Agent 都读同一个 State。

错误：

```text
Career Agent
     ↓
Learning Agent
     ↓
Insight Agent
```

因为自然语言转述会造成信息损失。

---

# 36. Agent 的权限必须隔离

原则：

> **Agent不能修改核心事实。**

例如：

Career Agent 不能写：

```text
math_mastery = 0.83
```

只能：

```text
read student state
→ generate explanation
```

真正修改：

```text
Assessment Service
State Manager
Rule Engine
```

负责。

---

# 37. Student State 怎么搭？

这是整个 Agent 系统的核心。

建议：

```json
{
  "student_id": "S001",

  "profile": {
    "grade": 10,
    "interests": [],
    "goals": [],
    "preferences": []
  },

  "mastery": {
    "math_function": 0.72,
    "physics_force": 0.81
  },

  "skills": {
    "analytical_reasoning": 0.78,
    "problem_solving": 0.82,
    "quantitative_thinking": 0.88,
    "scientific_thinking": 0.73,
    "business_thinking": 0.61,
    "learning_agility": 0.80
  },

  "confidence": {
    "problem_solving": 0.74
  },

  "career_matches": [],

  "route": {
    "mode": "exploration",
    "current_branch": null
  },

  "achievements": [],

  "version": 12,

  "updated_at": "..."
}
```

---

# 38. 为什么必须有 version？

避免两个 Agent 同时修改学生状态。

例如：

```text
State version = 12
```

Career Agent 读取 version 12。

Learning Agent 更新后：

```text
version = 13
```

Career Agent 回来时发现：

```text
12 != 13
```

就不能覆盖最新数据。

这叫：

# Optimistic Concurrency Control

6周 MVP 不需要做复杂分布式系统，但至少保存：

```text
version
updated_at
event_id
```

---

# 39. Event Router

它回答：

> **“刚才发生了什么？”**

例如：

```text
QUIZ_COMPLETED
LESSON_COMPLETED
CAREER_SELECTED
CAREER_SWITCHED
PROFILE_UPDATED
ASSESSMENT_COMPLETED
```

然后决定交给谁处理。

---

# 40. State Manager

它回答：

> **“学生现在是什么状态？”**

负责：

- 更新 mastery
- 更新 skill
- 更新 confidence
- 保存 achievement
- 更新 route state

---

# 41. Rule Engine

它回答：

> **“根据状态，接下来应该发生什么？”**

例如：

```text
IF mastery < 0.60
→ reinforce knowledge

IF mastery > 0.85
→ unlock next node

IF skill evidence changed > threshold
→ recalculate career matching

IF career branch changed
→ preserve completed common nodes
```

---

# 42. 三者完整关系

```text
用户行为
   ↓
Event Router
“发生什么？”
   ↓
State Manager
“现在状态是什么？”
   ↓
Rule Engine
“接下来应该做什么？”
   ↓
Orchestrator
“是否需要AI？需要哪个Agent？”
   ↓
Agent
“如何解释/生成？”
   ↓
Structured JSON
   ↓
Validator
   ↓
State / Cache
   ↓
Frontend
```

---

# 43. 如何保证用户体验流畅又不烧 Token？

核心原则：

# AI 不参与所有操作。

---

## 不需要 AI 的操作

```text
打开页面
切换标签
查看职业
查看进度
提交选择题
计算分数
更新 mastery
显示学习路线
```

全部本地/后端算法完成。

---

## 需要 AI 的操作

```text
解释职业推荐
生成个性化学习建议
总结一段学习表现
用户主动问复杂问题
```

---

# 44. AI Cache

例如：

```text
Career:
Data Scientist
Student State Version:
12
```

已经生成过：

> 为什么推荐Data Scientist？

那么再次点击：

> 直接读取 Cache。

只有：

```text
Student State Version
发生重大变化
```

才重新生成。

---

# 45. AI Cache Key

建议：

```text
hash(
agent_type +
student_state_version +
task_type +
target_id
)
```

例如：

```text
career_explanation:
career_agent:S001:v12:data_scientist
```

这样不会因为刷新页面重复调用。

---

# 46. Token Budget 会不会影响用户？

设计正确：

> **不会直接影响普通用户。**

Token Budget 是系统的资源保护机制。

例如：

```text
Daily AI Budget
100,000 tokens
```

不是：

```text
User can only use 100,000 tokens
```

用户不需要知道。

---

# 47. API 额度如何计算？

最基本：

\[
TotalTokens =
\sum(InputTokens + OutputTokens)
\]

预计：

\[
DailyTokens =
Users
\times
AIRequestsPerUser
\times
AverageTokensPerRequest
\]

例如：

```text
10 users
×
4 AI requests
×
1500 tokens
=
60,000 tokens/day
```

API 金额：

\[
Cost =
InputTokens \times InputPrice
+
OutputTokens \times OutputPrice
\]

具体金额必须按最终使用的模型当前官方价格计算。

---

# 48. Token Budget 不应该只限制用户

应该有三层：

```text
System Budget
      ↓
Agent Budget
      ↓
Request Budget
```

例如：

```text
System：100,000 tokens/day

Career Agent：600/request
Learning Agent：700/request
Insight Agent：800/request
```

---

# 49. 超预算怎么办？

不是让用户看到：

> API额度用完。

而是：

```text
AI Request
   ↓
Budget Check
   ↓
Cache?
 ┌─┴─┐
Yes  No
 ↓    ↓
返回  是否超过预算？
       ├─ No → AI
       └─ Yes → Rule-based Fallback
```

---

# 50. Fallback 要不要做 UI？

不需要专门设计一个：

> “Fallback页面”。

用户不需要知道后台发生了什么。

例如 AI 暂时不可用：

正常显示：

```text
你的下一步：

① 复习函数图像
② 完成基础练习
③ 尝试综合应用
```

而不是：

```text
⚠ AI API Error
```

开发者后台可以记录：

```text
AI_ERROR
AI_TIMEOUT
RATE_LIMIT
FALLBACK_USED
```

---

# 51. 用户需要消费才能长时间学习吗？

# 不需要。

核心学习系统必须：

> **AI API 不可用也能运行。**

例如：

```text
题库
↓
答题
↓
Mastery
↓
Skill
↓
Career Score
↓
Learning Route
```

全部可以不用 AI。

AI 只负责：

```text
解释
总结
个性化语言
生成建议
```

因此：

> 用户长期学习不应该被 API 消费绑架。

这也是系统稳定性的关键。

---

# 52. 用户做测试时要不要每题都重新计算100职业？

# 不要。

这是非常重要的性能设计。

错误：

```text
第1题 → 100职业
第2题 → 100职业
第3题 → 100职业
...
```

正确：

```text
做题
 ↓
更新知识/能力证据
 ↓
局部更新 Student State
 ↓
达到 Recompute Trigger
 ↓
一次计算100职业
 ↓
保存结果
```

---

# 53. 100职业的计算其实很便宜

职业匹配只是数学计算。

例如：

```text
100 careers
×
6 skills
×
几十个 knowledge tags
```

对普通电脑来说非常轻。

真正昂贵的是：

> LLM API。

所以：

# 100职业计算可以每次重新算；100职业逐个调用AI绝对不要。

---

# 54. 是否需要备份？

需要，但不是“每题备份100职业”。

数据库保存：

```text
assessment_result
answer_record
student_state
career_match_snapshot
learning_event
```

每次重要状态变化：

```text
event_id
student_id
state_version
timestamp
```

即可。

---

# 55. 什么时候重新计算100职业？

建议：

### Assessment 完成

重新计算。

### Skill Score 变化超过阈值

例如：

```text
|new_skill - old_skill| >= 0.05
```

重新计算。

### Interest 改变

重新计算。

### Goal 改变

重新计算。

### Career Branch 改变

重新计算。

普通学习过程中：

> 不需要每一道题都计算。

---

# 56. 用户行为流程必须提前设计

## ① 首次进入

```text
Start
↓
Profile
```

---

## ② 测试做到一半退出

```text
保存进度
↓
下次继续
```

---

## ③ 重复答题

记录 Attempt。

不能无限刷分。

---

## ④ 猜题

Confidence 降低，而不是直接把能力分数拉满。

---

## ⑤ 没有学校成绩

允许：

```text
No Grade Data
```

测试数据权重提高。

---

## ⑥ 用户不接受推荐

允许：

```text
Not Interested
```

这个行为进入 Interest Feedback。

---

## ⑦ 用户不想决定职业

进入：

```text
Exploration Mode
```

---

## ⑧ 用户中途换职业

```text
Career Branch Switch
↓
保留共同基础
↓
切换未来节点
```

---

## ⑨ 用户学习表现突然下降

不要直接认定能力下降。

检查：

- 题目难度
- 最近表现
- 数据量
- 是否是单次异常

---

## ⑩ API失败

Cache → Rule Fallback。

---

## ⑪ 用户刷新页面

不重新调用 AI。

---

## ⑫ 用户大量连续学习

聚合事件：

```text
5～10个学习事件
↓
一次分析
```

---

# 57. 最终页面结构

建议：

```text
/login

/onboarding
    ↓
/profile

/assessment
    ↓
/explore

/careers
    ↓
/career/:id

/route
    ↓
/learn/:node

/progress

/achievements
```

不做家长端。

---

# 58. 页面核心体验

## Dashboard

```text
Welcome back

Your Growth
────────────────
Problem Solving      82
Scientific Thinking  76
Quantitative         88

Recent Progress
────────────────
✓ Functions
✓ Probability
✓ Market Basics

Explore
────────────────
Data Science     86
Engineering      82
Economics        78
```

---

# 59. Career 页面

不要：

> “你应该成为 Data Scientist。”

而：

> **“Data Scientist 是目前与你的学习特征较匹配的一个探索方向。”**

显示：

```text
86 Match

Why it appears:
✓ Quantitative Thinking
✓ Analytical Reasoning
✓ Statistics Interest

Current Gaps:
• Advanced Statistics
• Programming
```

---

# 60. Exploration Mode

如果前三名很接近：

```text
Data Science      86
Engineering       85
Economics         84
```

不要要求学生立即选择。

显示：

```text
These paths share several foundations.

Recommended:
Explore first.

Common Route
↓
Statistics
↓
Data Analysis
↓
Mini Project

After the project,
you can choose a branch.
```

这是 PathWise 针对“选择困难”的核心产品设计。

---

# 61. 学习路线算法

不要让 AI 从零决定路线。

采用：

# Knowledge Graph + Prerequisite + Mastery Gap

算法：

```text
Career Goal
↓
Required Knowledge
↓
Prerequisite Graph
↓
Topological Sort
↓
Remove mastered nodes
↓
Prioritize high-impact gaps
↓
Learning Route
```

例如：

```text
Functions
  ↓
Statistics
  ↓
Probability
  ↓
Data Analysis
  ↓
Machine Learning
```

如果 Functions 已经 90%：

> 路线跳过基础函数。

---

# 62. Mastery 动态更新

原开发说明书的 MVP 目前建议：

\[
Mastery =
Correctness \times 0.6
+
RecentPerformance \times 0.3
+
Completion \times 0.1
\]

并将 Mastery 保持在 0～1。  
【来源：PathWise AI 程序员开发说明书】

最终建议升级为：

# Bayesian Knowledge Tracing（BKT）思想的轻量实现

核心状态：

```text
P(Know)
```

每个知识点都有一个掌握概率。

每次答题后：

```text
P(Know | Answer)
```

更新。

再考虑：

- 正确/错误
- 题目难度
- 猜测概率
- 粗心错误
- 学习后的掌握增长

6周版本不必完整实现复杂 BKT，可使用简化 Bayesian Update。

---

# 63. 推荐的轻量 Mastery 更新

定义：

```text
Prior = 当前 mastery
Evidence = 本次表现
```

采用：

\[
M_{new}
=
(1-\alpha)M_{old}
+
\alpha E
\]

其中：

\[
\alpha =
BaseRate \times DifficultyFactor \times RecencyFactor
\]

例如：

```text
简单题 → α较低
困难题 → α较高
最近连续表现 → α提高
```

这样比“答对一次 +10”稳定。

---

# 64. 最终技术栈

```text
Frontend
React
TypeScript
Tailwind CSS
Chart.js

Backend
Python
FastAPI

Database
MongoDB
（如果离线/数据库经验不足则 SQLite）

AI
LLM API
独立 AI Service

Realtime
WebSocket

Validation
Pydantic

Cache
MongoDB Cache Collection / In-memory Cache

Version Control
Git + GitHub

Development
Vibe Coding + AI Coding Assistant
```

原开发说明书推荐 React + TypeScript + Tailwind CSS、Python + FastAPI，并要求前端不要直接调用 AI API，而由 FastAPI → AI Service → LLM API。  
【来源：PathWise AI 程序员开发说明书】

---

# 65. 最终后端目录

```text
backend/
│
├── main.py
│
├── api/
│   ├── students.py
│   ├── assessment.py
│   ├── careers.py
│   ├── learning.py
│   └── events.py
│
├── models/
│   ├── student.py
│   ├── knowledge.py
│   ├── career.py
│   └── event.py
│
├── services/
│   ├── state_manager.py
│   ├── rule_engine.py
│   ├── event_router.py
│   ├── recommendation.py
│   ├── mastery.py
│   └── learning_route.py
│
├── ai/
│   ├── orchestrator.py
│   ├── career_agent.py
│   ├── learning_agent.py
│   ├── insight_agent.py
│   ├── cache.py
│   ├── budget.py
│   └── validator.py
│
└── data/
    ├── subjects.json
    ├── knowledge.json
    ├── careers.json
    └── questions.json
```

---

# 66. 最终数据库 Collections

```text
students
student_states
subjects
knowledge_nodes
skills
careers
questions
assessment_results
answer_records
learning_events
learning_routes
route_nodes
career_match_snapshots
ai_cache
achievements
```

---

# 67. 最终系统架构图

```text
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              React + TypeScript                     │
│                                                     │
│ Profile │ Assessment │ Explore │ Career │ Learning │
│ Dashboard │ Progress │ Achievements                │
└───────────────────────┬─────────────────────────────┘
                        │
                     REST / WS
                        │
┌───────────────────────▼─────────────────────────────┐
│                    FASTAPI                          │
│                                                     │
│ Student │ Assessment │ Career │ Learning │ Events  │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
      ┌──────────────┐     ┌──────────────┐
      │ Core Engine  │     │ AI Service   │
      │              │     │              │
      │ Mastery      │     │ Orchestrator │
      │ Skill        │     │      │       │
      │ Recommendation│    │ ┌────┼────┐  │
      │ Route        │     │ ▼    ▼    ▼  │
      │ Rule Engine  │     │Career Learn │Insight
      └──────┬───────┘     │Agent Agent Agent
             │             └────┬───────┘
             │                  │
             │               AI API
             │
             └────────┬─────────┘
                      ▼
                 Student State
                      │
                      ▼
                   MongoDB
                      │
              ┌───────┼────────┐
              ▼       ▼        ▼
          Knowledge Careers  Events
              │       │        │
              └───────┼────────┘
                      ▼
                  WebSocket
                      │
                      ▼
                 LIVE UPDATE
```

---

# 68. 最终“未来学校”真正的创新点

不是：

> “我们用了 ChatGPT。”

也不是：

> “我们有100个职业。”

真正创新的是：

```text
学生做一个动作
      ↓
系统获得一个 Evidence
      ↓
更新 Knowledge
      ↓
更新 Skill
      ↓
更新 Confidence
      ↓
更新 Career Match
      ↓
更新 Learning Route
      ↓
学校界面发生变化
```

即：

# The School Learns You.

---

# 69. 六周开发计划

## Week 1 — Foundation

完成：

- React
- FastAPI
- MongoDB/SQLite
- Schema
- API结构
- Git
- Student State

---

## Week 2 — Knowledge + Career

完成：

- 7科知识树
- 150～250知识节点
- 100职业
- Career Schema
- Skill Schema
- Knowledge ↔ Skill ↔ Career 标签

---

## Week 3 — Assessment

完成：

- 300～500题
- Assessment
- Knowledge Mastery
- 6项 Skill
- Evidence
- Confidence
- Achievement

---

## Week 4 — Recommendation + Learning Route

完成：

- Career Score
- Top-K
- Exploration Mode
- Branching Route
- Knowledge Graph
- Prerequisite Route
- 动态 Mastery

---

## Week 5 — AI + Realtime

完成：

- Orchestrator
- Career Agent
- Learning Agent
- Insight Agent
- AI Cache
- Token Budget
- Fallback
- Event Router
- State Manager
- Rule Engine
- WebSocket

---

## Week 6 — Demo + Stability

禁止新增大型功能。

重点：

- API错误处理
- AI timeout
- Cache
- Fallback
- 数据 Seed
- UI
- 动画
- Demo流程
- PPT
- 5～10分钟现场展示

比赛章程规定作品需符合“未来的学校”、具备完整功能、创新性和展示效果；初审重点包括创意与实用性30%、技术表现30%、展示互动25%、团队协作15%。快闪展示要求5～10分钟。  
【来源：2026年第一届“码梦成真”编程进班快闪活动章程】

---

# 70. 最终 8 分钟 Demo

```text
00:00
痛点：
“学生不是不知道答案，而是不知道自己应该走哪条路。”

01:00
建立学生画像

02:00
跨学科测试

03:00
系统产生：
100 → Top 5
并显示 Match Score + Exploration

04:00
学生没有立即选择
进入 Exploration Mode

05:00
系统生成共同基础路线

06:00
完成一个学习任务

07:00
Event → State → Skill → Career → Route
实时更新

08:00
Future School 改变

结尾：
“PathWise 不替学生决定未来。
它让学生在探索未来的过程中，让学校不断理解他。”
```

---

# 71. 你们最终应该在 PPT 中强调的技术逻辑

```text
                    DATA
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Knowledge    Skill     Interest
          │          │          │
          └──────────┼──────────┘
                     ▼
              Recommendation
                     │
              100 Careers
                     │
                     ▼
             Exploration Mode
                     │
              Career Branch
                     │
                     ▼
              Knowledge Graph
                     │
                     ▼
              Learning Route
                     │
                     ▼
                  Learning
                     │
                     ▼
                   Event
                     │
                     ▼
                  State
                     │
                     └────────────↺
```

这就是你们作品最完整、最容易在评审面前讲清楚的一条技术故事线。

---

# 72. 最终决策清单

| 问题 | 最终决定 |
|---|---|
| 学科 | 数学 + 物理 + 化学 + 生物 + 会计 + 商业 + 经济 |
| 职业 | 100 个 |
| 职业推荐 | Weighted Cosine + Rule Constraints |
| 推荐结果 | Exploration Match Score |
| Accuracy | 另行用测试集计算 |
| 评价指标 | Accuracy@1 + Hit@5 |
| 选择困难 | Exploration Mode |
| 换方向 | Branching Route，不 Reset |
| 能力 | 6项 Skill Evidence |
| Problem Solving | C/D/I/T/St |
| Confidence | E/C/S/R Evidence Confidence |
| 证据链 | 后端保存，前端主要显示成长 |
| 题目 | 预制题库 + AI辅助变体 |
| Mastery | 轻量 Bayesian/BKT 思路 |
| 路线 | Knowledge Graph + Prerequisite + Mastery Gap |
| AI | 只负责解释、建议、总结 |
| Orchestrator | 自己写的 Python Service |
| Agent | Career / Learning / Insight |
| State | 单一 Student State |
| 实时 | Event-driven + WebSocket |
| DB | 推荐 MongoDB；极端离线/经验不足可 SQLite |
| Token | System/Agent/Request 三层 Budget |
| Cache | 必须 |
| Fallback | 必须，无需专门 UI |
| 长期学习 | 不要求用户持续消费 AI |
| 100职业重算 | 触发式，不每题调用 AI |
| 家长端 | 删除 |
| 6周 | 可完成，但不再增加大型功能 |

---

# 73. 一句话定义整个系统

> **PathWise AI 是一个以知识掌握为基础、以能力证据为核心、以真实职业世界为目标空间、以学习路线为行动路径，并通过事件驱动持续更新学生状态的自适应未来学校。**

