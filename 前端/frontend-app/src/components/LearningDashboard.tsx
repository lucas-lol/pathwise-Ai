// src/components/LearningDashboard.tsx
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { GALAXY_NAMES } from '../data/careerAdapter';

const ROUTE_DATABASE: Record<number, { name: string; xp: number; description: string }[]> = {
  0: [ 
    { name: "机器学习基础：回归与分类", xp: 120, description: "掌握逻辑回归、决策树与 SVM" },
    { name: "深度学习进阶：CNN 与 RNN", xp: 180, description: "卷积神经网络与序列模型实战" },
    { name: "Transformer 与大语言模型", xp: 250, description: "Attention 机制与 GPT 架构解析" },
    { name: "强化学习与多智能体系统", xp: 400, description: "Q-Learning 与多智能体博弈" },
    { name: "AI Agent 与具身智能", xp: 600, description: "LangChain、RAG 与机器人控制" },
  ],
  1: [ 
    { name: "分布式系统基础与共识算法", xp: 180, description: "CAP 定理、Paxos 与 Raft 协议" },
    { name: "微服务架构与容器化编排", xp: 280, description: "Docker、Kubernetes 与 Service Mesh" },
    { name: "高并发系统设计与调优", xp: 350, description: "缓存策略、消息队列与限流熔断" },
    { name: "云原生基础设施与 DevOps", xp: 450, description: "CI/CD 流水线、IaC 与可观测性" },
    { name: "大型复杂系统工程与重构", xp: 700, description: "DDD 领域驱动设计与遗留系统演进" },
  ],
  2: [ 
    { name: "统计学进阶与假设检验", xp: 150, description: "t 检验、ANOVA 与贝叶斯推断" },
    { name: "时间序列分析与预测", xp: 220, description: "ARIMA、GARCH 与状态空间模型" },
    { name: "量化策略回测与因子挖掘", xp: 350, description: "多因子模型与 Backtrader 实战" },
    { name: "机器学习在金融中的应用", xp: 450, description: "随机森林与 XGBoost 预测资产价格" },
    { name: "高频交易与微观结构", xp: 700, description: "订单簿动态、TWAP/VWAP 算法" },
  ],
  3: [ 
    { name: "计算生物学与基因组学", xp: 300, description: "序列比对、NGS 数据分析" },
    { name: "生物信息学与系统生物学", xp: 450, description: "代谢网络建模与通路分析" },
    { name: "分子动力学模拟与计算化学", xp: 550, description: "GROMACS 与蛋白质折叠预测" },
    { name: "医疗数据挖掘与临床信息学", xp: 800, description: "EHR 数据处理与疾病风险预测" },
    { name: "脑机接口与神经计算", xp: 1200, description: "EEG 信号处理与神经解码算法" },
  ],
  4: [ 
    { name: "用户研究与数据驱动决策", xp: 100, description: "A/B 测试、漏斗分析与 KANO 模型" },
    { name: "B 端产品架构与商业化设计", xp: 200, description: "SaaS 定价策略与多租户架构" },
    { name: "增长黑客与病毒循环机制", xp: 350, description: "PLG 模式、留存优化与裂变营销" },
    { name: "组织行为学与敏捷管理", xp: 500, description: "Scrum 框架、OKR 与团队动力学" },
    { name: "宏观经济学与公共政策分析", xp: 700, description: "博弈论、市场失灵与政策评估" },
  ]
};

const TASK_TEMPLATES = {
  theory: "研读《{topic}》核心章节并完成笔记",
  code: "完成 {topic} 的代码实现与单元测试",
  quiz: "通过 {topic} 的阶段性测验 (80 分以上)",
};

interface LearningDashboardProps {
  onBack: () => void;
  onGoToCareer?: (careerId: number) => void; // 🌟 新增：跳转宇宙回调
  userSkills?: Set<number>;
  careers?: any[];
  abilityScores?: number[];
}

export default function LearningDashboard({ onBack, onGoToCareer, userSkills, careers, abilityScores }: LearningDashboardProps) {
  const [, setActiveNodeId] = useState<number | null>(2);
  const categoryNames = GALAXY_NAMES; 

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
    return { category: topCategory, route: ROUTE_DATABASE[topCategory] || ROUTE_DATABASE[0], activeIndex };
  }, [userSkills, careers]);

  const masteredSkillNames = useMemo(() => {
    if (!userSkills || !careers) return [];
    return Array.from(userSkills).slice(0, 3).map(id => careers.find(c => c.id === id)?.name).filter(Boolean);
  }, [userSkills, careers]);

  // 🌟 核心重构：生成“当前+后续”任务链，并计算真实进度
  const dailyTasks = useMemo(() => {
    if (!careers) return [];
    const categoryCareers = careers
      .filter(c => c.category === routeData.category)
      .sort((a, b) => a.tier - b.tier);
    
    const tasks = [];
    const taskTypes = ['theory', 'code', 'quiz'] as const;

    // 取当前节点及后续节点（最多展示 3 个阶段）
    for (let i = 0; i < 3; i++) {
      const nodeIdx = routeData.activeIndex + i;
      if (nodeIdx >= routeData.route.length) break;
      
      const node = routeData.route[nodeIdx];
      const targetCareer = categoryCareers[nodeIdx] || categoryCareers[categoryCareers.length - 1];
      
      // 🌟 真实进度计算：当前阶段及之前所有基础职业的完成率
      const requiredCareers = categoryCareers.slice(0, nodeIdx + 1);
      const completedCareers = requiredCareers.filter(c => userSkills?.has(c.id));
      const progress = requiredCareers.length > 0 
        ? Math.floor((completedCareers.length / requiredCareers.length) * 100) 
        : 0;

      tasks.push({
        id: nodeIdx,
        type: taskTypes[i % 3], 
        title: TASK_TEMPLATES[taskTypes[i % 3]].replace("{topic}", node.name),
        sourceTopic: `${categoryNames[routeData.category]} · 阶段 ${nodeIdx + 1}`,
        progress,
        total: 100,
        targetCareerId: targetCareer?.id,
        isLocked: nodeIdx > routeData.activeIndex // 后续节点锁定
      });
    }
    return tasks;
  }, [routeData, userSkills, careers, categoryNames]);

  const abilityLabels = ["技术", "逻辑", "沟通", "抗压", "创新", "领导"];
  const topAbilityIdx = abilityScores ? abilityScores.indexOf(Math.max(...abilityScores)) : 0;
  const lowAbilityIdx = abilityScores ? abilityScores.indexOf(Math.min(...abilityScores)) : 0;
  const topScore = abilityScores ? abilityScores[topAbilityIdx] : 0;
  const lowScore = abilityScores ? abilityScores[lowAbilityIdx] : 0;

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
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.12, type: "spring" }} onClick={() => setActiveNodeId(idx)}
                className={`relative z-10 w-full max-w-md p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer group
                  ${status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-400' : 
                    status === 'active' ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-105' : 
                    'bg-white/[0.02] border-white/5 opacity-40 grayscale hover:opacity-60'}`}>
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
                {status === 'active' && (<div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 w-[35%] shadow-[0_0_10px_#22d3ee]"></div></div>)}
                {status === 'active' && (<div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-cyan-400 rounded-l-full shadow-[0_0_15px_#22d3ee]"></div>)}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 右侧：任务与数据面板 (60%) */}
      <div className="w-[60%] h-full flex flex-col z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-500/10 to-blue-500/5 border border-purple-500/20 p-8 relative overflow-hidden flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-transparent to-black/40">
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-3 tracking-tight">EXECUTION HUB</h1>
            <p className="text-white/60 text-base">基于 <span className="text-cyan-400">技能树</span> 与 <span className="text-purple-400">能力雷达</span> 生成今日路径。</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold tracking-wide">Learning Path Missions</h3>
              <span className="text-sm text-white/50 font-mono">SYNCED WITH UNIVERSE</span>
            </div>
            
            {dailyTasks.map((task, idx) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}
                className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 group relative overflow-hidden
                  ${task.progress === 100 ? 'bg-emerald-500/5 border-emerald-500/20' : 
                    task.isLocked ? 'bg-white/[0.01] border-white/5 opacity-50 grayscale' : 
                    'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-cyan-500/30'}`}>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex-shrink-0
                      ${task.type === 'code' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        task.type === 'theory' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {task.type.toUpperCase()}
                    </span>
                    <span className={`font-bold text-lg leading-tight ${task.progress === 100 ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
                      {task.title} {task.isLocked && <span className="text-xs text-white/40 ml-2">🔒 需先完成前置</span>}
                    </span>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className={`text-base font-mono font-bold ${task.progress === 100 ? 'text-emerald-400' : 'text-white/70'}`}>
                      {task.progress}%
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Source:</span>
                  <span className="text-xs text-cyan-400/70 bg-cyan-500/5 px-3 py-1 rounded-lg border border-cyan-500/10">{task.sourceTopic}</span>
                </div>

                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative mb-4">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${task.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} style={{ width: `${task.progress}%` }}>
                    {task.progress < 100 && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>}
                  </div>
                </div>

                {/* 🌟 新增：前往宇宙完成按钮 */}
                {!task.isLocked && task.progress < 100 && task.targetCareerId !== undefined && (
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onGoToCareer?.(task.targetCareerId!); }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 group/btn"
                    >
                      🚀 前往宇宙完成 
                      <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}