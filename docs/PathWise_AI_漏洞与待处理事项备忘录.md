# PathWise AI｜漏洞与待处理事项备忘录

## P0｜必须优先处理

-   [ ] P0-01：重建真实知识库/知识树。建立「年级 → 大领域 → 主题 →
    知识点」，并加入
    Parent、Prerequisite、难度、重要性、Tags；课本章节必须以已确认资料为准，未知年级标记"待确认"。
-   [ ]
    P0-02：修复年级选择与累计诊断范围的连接：初一=初一；初三=初一+初二+初三；高一=初中+高一；高三=初中+高一+高二+高三。
-   [ ] P0-03：把 Assessment
    从「随机抽题→算分」改成完整诊断链：范围→抽题→作答→AnswerRecord→知识点证据→Mastery→诊断报告。
-   [ ] P0-04：修复答案泄露。题目接口不能在提交前返回
    answer/explanation；由服务端判题，提交后才返回必要解析。
-   [ ] P0-05：统一掌握度算法。当前实现偏
    EMA，而文档写过"轻贝叶斯"；同时确保使用本次实际作答题目的难度。统一公式、代码、测试、文档。
-   [ ] P0-06：重做
    Career→Route：职业要求→所需技能/知识→Prerequisite→Mastery→Gap→学习顺序，不能再单纯按题目
    difficulty 排序。
-   [ ] P0-07：修复 route_ready
    过早设置。只有路线真实生成且验证成功后才能 true。
-   [ ] P0-08：建立统一 Funnel State Machine，禁止 API
    各自随意修改状态。
-   [ ] P0-B01：完成学习执行闭环：Route→学习→练习→Quiz→Mastery
    更新→路线调整→解锁下一节点。

## P1｜核心闭环稳定后处理

-   [ ] P1-01：真正实现 OCC/乐观并发控制，`expected_version`
    必须参与更新条件。
-   [ ] P1-02：统一 mastery 数据源，解决 `state["mastery"]` 与
    `student_vector["knowledge"]` 双写/不一致。
-   [ ] P1-03：解决 Career 与 Subject 数据不完整匹配；不要用无依据的默认
    0.5 掩盖缺失数据。
-   [ ] P1-04：为职业建立 required_skills，并建立 Skill→Knowledge 映射。
-   [ ] P1-05：完善 LearningEvent、RouteNode、练习、测验、mastery
    变化与重新评估的记录链。

## P2｜比赛核心闭环完成后

-   [ ] P2-01：WebSocket/实时通信。
-   [ ] P2-02：完整 AI Agent 架构；AI
    主要做解释、总结、个性化表达，核心状态由确定性规则负责。
-   [ ] P2-03：高级 Dashboard、复杂动画和成长可视化。
-   [ ] P2-04：AI Token Cache/高级性能优化。
-   [ ] P2-05：高级 UI/交互优化。

## 系统级待检查漏洞

-   [ ] 前端是否能绕过正常流程直接调用 API？
-   [ ] 后端是否重新验证状态、参数和权限？
-   [ ] 是否泄露答案或内部数据？
-   [ ] 是否用默认值掩盖缺失数据？
-   [ ] 是否存在多个数据源保存同一事实？
-   [ ] 是否存在 API 非法跳过 Funnel？
-   [ ] 更新失败时前端是否仍显示成功？
-   [ ] Question 是否都有 KnowledgePoint？
-   [ ] AnswerRecord 是否能追溯到 Question？
-   [ ] Mastery 更新是否能追溯到 AnswerRecord？
-   [ ] Career→Knowledge→Route 链路是否完整？
-   [ ] 前后端 schema/字段名是否一致？
-   [ ] README 是否与实际代码一致？
-   [ ] 核心规则是否有自动化测试？

## 接下来严格按这个顺序

### 阶段 1：知识库地基

1.  [ ] 整理初中数学课本目录
2.  [ ] 整理高中数学课本目录
3.  [ ] 按年级建立知识树
4.  [ ] 每个节点加入对应课本章节
5.  [ ] 确认章节与年级对应关系
6.  [ ] 细化到 Knowledge Point
7.  [ ] 建立 Parent_ID
8.  [ ] 建立 Prerequisite_ID
9.  [ ] 标注难度、重要性、Tags
10. [ ] 人工检查知识树

### 阶段 2：Knowledge Base 数据化

11. [ ] 定稿 KnowledgePoint Schema
12. [ ] 生成 `knowledge_points.json`
13. [ ] 更新 `subjects.json`
14. [ ] 增加知识库加载/校验
15. [ ] 检查 JSON 与 DB 模型一致性
16. [ ] 写 Knowledge Base 测试

### 阶段 3：Assessment

17. [ ] 四个年级入口
18. [ ] cumulative scope
19. [ ] 抽题策略
20. [ ] Question→KnowledgePoint
21. [ ] 修复答案泄露
22. [ ] AnswerRecord
23. [ ] 知识点证据
24. [ ] Mastery 更新
25. [ ] 诊断报告
26. [ ] Assessment 测试

### 阶段 4：Career

27. [ ] Required Skills
28. [ ] Skill→Knowledge
29. [ ] 统一学生能力向量
30. [ ] 重写 Career Matching
31. [ ] 输出可解释结果
32. [ ] 缺失数据测试

### 阶段 5：Learning Route

33. [ ] Career→Required Knowledge
34. [ ] Required Knowledge→Prerequisites
35. [ ] 与 Mastery 比较
36. [ ] 计算 Knowledge Gap
37. [ ] prerequisite 排序
38. [ ] 生成 Route
39. [ ] Route 合法性验证
40. [ ] 最后设置 `route_ready=true`

### 阶段 6：学习执行

41. [ ] Route→Learning Node
42. [ ] Learning Content
43. [ ] Practice
44. [ ] Quiz
45. [ ] AnswerRecord
46. [ ] Mastery Update
47. [ ] Route Adjustment
48. [ ] Unlock Next Node

### 阶段 7：AI

49. [ ] 定义 AI 输入/输出 JSON
50. [ ] AI 解释诊断
51. [ ] AI 解释职业匹配
52. [ ] AI 解释学习路线
53. [ ] AI 个性化建议
54. [ ] AI 不直接篡改核心状态
55. [ ] AI 失败时系统仍可运行

### 阶段 8：稳定与比赛 Demo

56. [ ] OCC
57. [ ] 统一 mastery 数据源
58. [ ] 错误处理
59. [ ] 核心测试
60. [ ] 前后端联调
61. [ ] 完整跑通 MVP
62. [ ] 清理 README/代码不一致
63. [ ] Demo 数据
64. [ ] 5--10 分钟 Demo 流程
65. [ ] 最后再做 UI/动画

## 当前唯一最高优先级

**P0-01：知识库地基。**

现在不要让 Cline 大规模重写整个项目，也不要先做 WebSocket、复杂
Dashboard 或大量 AI Agent。

先完成：

**初中数学知识树 → 高中数学知识树 → 人工确认 → KnowledgePoint 数据化 →
Assessment 重构。**

核心依赖链：

`知识树 → Knowledge Point → Question → AnswerRecord → Mastery → Skills → Career → Knowledge Gap → Route → Learning → Reassessment → AI`
