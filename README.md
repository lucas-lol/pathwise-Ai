# 职业宇宙 Career Universe · PathWise AI

一个基于 **3D 可视化 + 游戏化 + 数据感知 AI** 的沉浸式职业探索平台。
把枯燥的职业规划，变成一场看得见的星际航行。

## 🎮 核心玩法闭环
接任务(P4 任务链) → 探索星球(学习/模拟) → 职场危机 QTE(P5) → 获得评级/XP/成就(P2/P3) → 解锁新星系/合成高阶职业 → 新任务

## 🧱 架构
- **双引擎渐进增强**：前端内置 `src/data/careers.json`（100 真实职业）离线可用；可选联调 Python Engine（已归档于 `legacy/engine`，启动后监听 `localhost:8000` 即自动切换远端数据），离线时优雅降级（Console 有绿色/灰色日志）。- **状态驱动渲染**：全局 `GameStats`（XP/连击/评级/合成/危机）打通 3D 场景、HUD、成就面板、AI 导师，一处点亮处处联动。
- **PageOverlay 抽屉架构**：子页面（导师/学习/档案/成就）以 spring 抽屉覆盖，3D Canvas 常驻不卸载，切换零重建、零卡顿。

## 📦 模块
| 文件 | 职责 |
|---|---|
| `CareerUniverse.tsx` | 主场景：3D 星系、相机编排、QTE、任务链、演示过场 |
| `careerAdapter.ts` | 真实职业数据适配：分类/tier/匹配度/兴趣标签 |
| `SimulatorModal.tsx` | 职场情景模拟：对话树 + 愤怒值 + S/A/B/C 评级 |
| `AIMentorChat.tsx` | 数据感知导师：读雷达/合成/星系/兴趣，可一键导航 |
| `LearningDashboard.tsx` | 学习中心：真实进度任务链 + 宇宙跳转 |
| `AchievementPanel.tsx` / `badges.ts` | 成就系统：10 徽章 + 稀有度 + 进度 |
| `gameFx.ts` | WebAudio 合成音效（零资源文件）+ 静音开关 |

## ⚡ 性能优化清单
DPR 限制 [1,1.5] · 几何细分封顶 · Bloom mipmapBlur + 阈值调优 · 连线距离裁剪 · 粒子数动态降级 · 金属度修正（无环境贴图防发黑）

## 🎬 演示快捷键
- `Shift + D`：载入演示状态 + 5 秒电影级过场（连锁点亮/相机导览/数字滚动）
- `?demo=1`：URL 直接进演示态
- `M`：静音 / 取消静音

## 🛠 技术栈
React 18 · TypeScript · Three.js (React Three Fiber / Drei / Postprocessing) · GSAP · Framer Motion · Tailwind CSS · WebAudio API