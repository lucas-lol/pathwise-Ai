// src/components/LearningDashboard.tsx
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';

const ROUTE_DATABASE: Record<number, { name: string; xp: number; description: string }[]> = {
  0: [
    { name: "监督学习：回归与分类", xp: 120, description: "掌握线性回归、逻辑回归、决策树" },
    { name: "无监督学习：聚类与降维", xp: 180, description: "K-Means、PCA、t-SNE 实战" },
    { name: "深度学习基础：CNN 与 RNN", xp: 250, description: "卷积神经网络与循环神经网络" },
    { name: "Transformer 与大语言模型", xp: 400, description: "Attention 机制、GPT、BERT 原理" },
    { name: "AI Agent 与多模态系统", xp: 600, description: "LangChain、RAG、多模态融合" },
  ],
  1: [
    { name: "统计学进阶：假设检验", xp: 150, description: "t 检验、卡方检验、ANOVA" },
    { name: "时间序列分析", xp: 220, description: "ARIMA、GARCH 模型实战" },
    { name: "量化策略回测框架", xp: 350, description: "Backtrader、Zipline 使用" },
    { name: "机器学习在量化中的应用", xp: 450, description: "因子挖掘、模型集成" },
    { name: "高频交易与执行算法", xp: 700, description: "TWAP、VWAP、市场微观结构" },
  ],
  2: [
    { name: "分布式系统基础", xp: 180, description: "CAP 定理、一致性哈希" },
    { name: "微服务与容器化", xp: 280, description: "Docker、Kubernetes 实战" },
    { name: "消息队列与事件驱动", xp: 350, description: "Kafka、RabbitMQ 架构设计" },
    { name: "高并发数据库优化", xp: 450, description: "分库分表、读写分离、缓存策略" },
    { name: "云原生与 DevOps", xp: 600, description: "CI/CD、监控、自动化部署" },
  ],
  3: [
    { name: "用户研究与需求分析", xp: 100, description: "用户画像、旅程地图、KANO 模型" },
    { name: "数据驱动的产品迭代", xp: 200, description: "A/B 测试、漏斗分析、留存优化" },
    { name: "B 端产品架构设计", xp: 350, description: "权限系统、工作流引擎、多租户" },
    { name: "AI 产品商业化落地", xp: 500, description: "Prompt 工程、AI 功能设计" },
    { name: "增长黑客与商业化", xp: 700, description: "PLG、病毒循环、定价策略" },
  ],
  4: [
    { name: "量子计算基础", xp: 300, description: "量子比特、量子门、量子算法" },
    { name: "脑机接口原理", xp: 450, description: "EEG 信号处理、神经反馈" },
    { name: "合成生物学入门", xp: 550, description: "基因编辑、CRISPR 技术" },
    { name: "可控核聚变工程", xp: 800, description: "等离子体物理、磁约束" },
    { name: "星际航行技术", xp: 1200, description: "轨道力学、推进系统" },
  ]
};

const TASK_TEMPLATES = {
  theory: "研读《{topic}》核心章节并完成笔记",
  code: "完成 {topic} 的代码实现与单元测试",
  quiz: "通过 {topic} 的阶段性测验 (80 分以上)",
};

interface LearningDashboardProps {
  onBack: () => void;
  userSkills?: Set<number>;
  careers?: any[];
  abilityScores?: number[];
}

export default function LearningDashboard({ onBack, userSkills, careers, abilityScores }: LearningDashboardProps) {
  const [, setActiveNodeId] = useState<number | null>(2);

  const routeData = useMemo(() => {
    if (!userSkills || userSkills.size === 0 || !careers) {
      return { category: 0, route: ROUTE_DATABASE[0], activeIndex: 0 };
    }

    const categoryCount = [0, 0, 0, 0, 0];
    userSkills.forEach(id => {
      const career = careers.find(c => c.id === id);
      if (career) categoryCount[career.category]++;
    });

    const maxCount = Math.max(...categoryCount);
    const topCategory = categoryCount.indexOf(maxCount);
    const activeIndex = Math.min(Math.floor(userSkills.size / 2), 4);

    return {
      category: topCategory,
      route: ROUTE_DATABASE[topCategory] || ROUTE_DATABASE[0],
      activeIndex
    };
  }, [userSkills, careers]);

  const masteredSkillNames = useMemo(() => {
    if (!userSkills || !careers) return [];
    return Array.from(userSkills)
      .slice(0, 3)
      .map(id => careers.find(c => c.id === id)?.name)
      .filter(Boolean);
  }, [userSkills, careers]);

  const dailyTasks = useMemo(() => {
    const activeTopic = routeData.route[routeData.activeIndex]?.name || routeData.route[0].name;
    const topicShort = activeTopic.split("：")[1] || activeTopic.split(":")[1] || activeTopic;

    const taskTypes = ['theory', 'code', 'quiz'] as const;
    return taskTypes.map((type, i) => ({
      id: i,
      type,
      title: TASK_TEMPLATES[type].replace("{topic}", topicShort),
      sourceTopic: activeTopic,
      progress: i === 0 ? 65 : (i === 1 ? 100 : 0),
      total: 100
    }));
  }, [routeData]);

  const abilityLabels = ["技术", "逻辑", "沟通", "抗压", "创新", "领导"];
  const topAbilityIdx = abilityScores ? abilityScores.indexOf(Math.max(...abilityScores)) : 0;
  const lowAbilityIdx = abilityScores ? abilityScores.indexOf(Math.min(...abilityScores)) : 0;
  const topScore = abilityScores ? abilityScores[topAbilityIdx] : 0;
  const lowScore = abilityScores ? abilityScores[lowAbilityIdx] : 0;

  const categoryNames = ["AI 与数据", "量化与金融", "全栈与云", "产品与设计", "前沿科技"];

  return (
    <div className="w-full h-screen bg-[#050810] relative overflow-hidden flex text-white font-sans selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050810_100%)] pointer-events-none"></div>

      {/* 左侧：动态知识图谱 (40%) */}
      <div className="w-[40%] h-full relative border-r border-white/5 p-10 flex flex-col z-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">KNOWLEDGE GRAPH</h2>
            <button onClick={onBack} className="group flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-all">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-white/60 text-sm tracking-widest">
              {categoryNames[routeData.category]} · {userSkills?.size || 0} SKILLS MASTERED
            </p>
            {masteredSkillNames.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-cyan-400/60 uppercase tracking-wider">Based on:</span>
                {masteredSkillNames.map((name, i) => (
                  <span key={i} className="text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative flex flex-col items-center justify-center space-y-5 overflow-y-auto pr-3 custom-scrollbar">
          <div className="absolute left-1/2 top-10 bottom-10 w-[2px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent -z-0"></div>

          {routeData.route.map((node, idx) => {
            const status = idx < routeData.activeIndex ? 'completed' : (idx === routeData.activeIndex ? 'active' : 'locked');

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.12, type: "spring" }}
                onClick={() => setActiveNodeId(idx)}
                className={`relative z-10 w-full max-w-md p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer group
                  ${status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-400' : 
                    status === 'active' ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-105' : 
                    'bg-white/[0.02] border-white/5 opacity-40 grayscale hover:opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                        status === 'active' ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-white/10 text-white/30'}`}>
                      {status === 'completed' ? '✓' : (status === 'active' ? '▶' : '🔒')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm tracking-wide block truncate">{node.name}</span>
                      <span className="text-xs text-white/50 block mt-0.5 truncate">{node.description}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/50 ml-3 flex-shrink-0">{node.xp} XP</span>
                </div>
                
                {status === 'active' && (
                  <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[35%] shadow-[0_0_10px_#22d3ee]"></div>
                  </div>
                )}

                {status === 'active' && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-cyan-400 rounded-l-full shadow-[0_0_15px_#22d3ee]"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 右侧：任务与数据面板 (60%) */}
      <div className="w-[60%] h-full flex flex-col z-10">
        {/* AI 导师 - 顶部，大幅增大 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/5 border border-purple-500/20 p-8 relative overflow-hidden flex-shrink-0"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="flex items-start gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg flex-shrink-0">🤖</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-purple-300 font-bold text-lg mb-3 uppercase tracking-wider">AI Mentor Insight</h3>
              <p className="text-white/90 text-base leading-relaxed">
                检测到你在宇宙中完成了 <span className="text-cyan-400 font-bold">{masteredSkillNames[0] || '基础探索'}</span> 等技能，
                且 <span className="text-cyan-400 font-bold">{abilityLabels[topAbilityIdx]}能力 ({topScore})</span> 突出。
                <br/>
                <span className="text-white/70 mt-2 block">
                  💡 已为你解锁 <span className="text-white font-bold">{routeData.route[routeData.activeIndex]?.name}</span>，
                  并针对 <span className="text-rose-400 font-bold">{abilityLabels[lowAbilityIdx]} ({lowScore})</span> 安排限时训练。
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* 内容区 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-transparent to-black/40">
          {/* 标题区 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-3 tracking-tight">EXECUTION HUB</h1>
            <p className="text-white/60 text-base">
              基于 <span className="text-cyan-400">技能树</span> 与 <span className="text-purple-400">能力雷达</span> 生成今日路径。
            </p>
          </div>

          {/* 每日任务列表 */}
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold tracking-wide">Daily Missions</h3>
              <span className="text-sm text-white/50 font-mono">REFRESH IN 04:20:11</span>
            </div>
            
            {dailyTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`p-6 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-300 group relative overflow-hidden
                  ${task.progress === 100 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-cyan-500/30'}`}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex-shrink-0
                      ${task.type === 'code' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        task.type === 'theory' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {task.type.toUpperCase()}
                    </span>
                    <span className={`font-bold text-lg leading-tight ${task.progress === 100 ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className={`text-base font-mono font-bold ${task.progress === 100 ? 'text-emerald-400' : 'text-white/70'}`}>
                      {task.progress}/{task.total} XP
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Source:</span>
                  <span className="text-xs text-cyan-400/70 bg-cyan-500/5 px-3 py-1 rounded-lg border border-cyan-500/10">
                    {task.sourceTopic}
                  </span>
                </div>

                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative
                      ${task.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                    style={{ width: `${task.progress}%` }}
                  >
                    {task.progress < 100 && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}