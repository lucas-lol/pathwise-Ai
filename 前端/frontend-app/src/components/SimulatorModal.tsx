// src/components/SimulatorModal.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 🎬 终极剧本库：5 大类别全覆盖
const SCENARIOS: Record<number, any> = {
  0: {
    bossName: "Alex (技术总监)", bossAvatar: "👨‍💻", themeColor: "cyan",
    rounds: [
      {
        messages: ["Lucas,还没睡吧?", "线上推荐系统延迟突然飙升到 2 秒,客诉爆了！🔥", "你只有 5 分钟。告诉我排查思路。"],
        options: [
          { text: "先查数据库 CPU 和慢查询日志。", next: 1, anger: 20, reply: "数据库 CPU 才 30%,根本不是瓶颈！你连监控面板都没看就瞎猜?" },
          { text: "先看 Grafana 监控,确认是接口超时还是下游服务问题。同时准备回滚。", next: 1, anger: 0, reply: "这就对了。监控显示是模型推理服务 OOM 了。回滚后恢复了。" },
          { text: "这代码不是我写的,我去问问后端组。", next: 1, anger: 50, reply: "现在不是甩锅的时候！你是 On-call 负责人,先解决问题,再复盘。" }
        ]
      },
      {
        messages: ["既然排查方向对了,那你来看看这段昨天刚合并的代码。", "为什么这个简单的推理接口会导致内存持续飙升?找出问题。"],
        artifact: {
          type: "code", language: "python", filename: "inference_service.py",
          code: `def batch_predict(user_ids, model):
    results = []
    for uid in user_ids:
        features = get_features(uid)
        prediction = model.predict(features)
        results.append({
            "user_id": uid,
            "score": prediction,
            "raw_features": features #  问题在这里
        })
    return results`,
          commentLine: 8, commentText: "这里把完整的 features 字典存进了 results 列表。如果 user_ids 有 10 万个,内存直接爆掉。"
        },
        options: [
          { text: "在 append 之前,只保留必要的 score,去掉 raw_features。", next: -1, anger: 0, reply: "正解。大对象绝对不能塞进批量返回的列表里。立刻发个 Hotfix。" },
          { text: "把 results 列表换成生成器 (yield),边处理边返回。", next: -1, anger: 10, reply: "生成器能缓解内存,但没解决根本问题。先按我说的改。" },
          { text: "增加服务器的内存配置,从 8G 升级到 32G。", next: -1, anger: 40, reply: "用加机器来解决代码缺陷?你的架构思维呢?驳回！" }
        ]
      }
    ]
  },
  1: {
    bossName: "David (量化交易总监)", bossAvatar: "📈", themeColor: "green",
    rounds: [
      {
        messages: ["Lucas,早上的实盘数据看了吗?", "我们回测夏普比率 3.5 的模型,实盘第一天就亏了 2%！💸", "老板在群里发火了,立刻给我原因。"],
        options: [
          { text: "可能是实盘滑点和手续费没算进去,我重新跑一遍回测。", next: 1, anger: 10, reply: "滑点不可能造成 2% 的差距。你的模型在实盘环境下完全失效了。" },
          { text: "我怀疑是过拟合。回测数据包含了未来函数,或者参数调得太死。", next: 1, anger: 0, reply: "终于说到点子上了。去检查你的特征工程,看看有没有用到 T+1 才能拿到的数据。" },
          { text: "市场今天情绪不好,属于正常波动,建议持仓不动。", next: 1, anger: 40, reply: "正常波动?我们的模型是市场中性策略！亏钱就是模型逻辑错了,别拿大盘当借口。" }
        ]
      },
      {
        messages: ["找到了,看看这段特征提取代码。", "为什么这个模型在历史数据上表现完美,一上实盘就拉胯?"],
        artifact: {
          type: "code", language: "python", filename: "feature_engineering.py",
          code: `def calculate_moving_avg(df, window=5):
    df['avg_vol_5d'] = df['volume'].rolling(window=window).mean()
    df['target'] = df['close'].shift(-1) / df['close'] - 1
    df['future_high'] = df['high'].shift(-1) # 👈 致命错误
    return df`,
          commentLine: 4, commentText: "这里用到了明天的最高价 (shift(-1)) 作为今天的特征。回测时当然准,实盘根本拿不到未来数据！"
        },
        options: [
          { text: "删掉 future_high 特征,只用截止到今天的滞后特征 (shift(1))。", next: -1, anger: 0, reply: "这就对了。做量化第一条铁律：绝对不能用到未来数据。立刻重训模型。" },
          { text: "把 window 从 5 改成 20,平滑一下数据。", next: -1, anger: 20, reply: "治标不治本。只要用了未来数据,窗口多大都是过拟合。" },
          { text: "在回测代码里加上更严格的交叉验证。", next: -1, anger: 10, reply: "交叉验证救不了数据泄露。先把特征改对。" }
        ]
      }
    ]
  },
  2: {
    bossName: "Mike (首席架构师)", bossAvatar: "☁️", themeColor: "blue",
    rounds: [
      {
        messages: ["Lucas,双十一预演刚结束,系统差点挂了。", "订单服务 QPS 到 5000 时,数据库 CPU 直接飙到 100%。🔥", "给你 10 分钟,说出你的优化方案。"],
        options: [
          { text: "给数据库加几个从库,做读写分离。", next: 1, anger: 10, reply: "读写分离能解决读多写少,但订单创建是写操作,主库一样会挂。" },
          { text: "在 Redis 里加一层缓存,把热点商品数据拦住,别打到 DB。", next: 1, anger: 0, reply: "方向对了。但如果是秒杀场景,缓存击穿怎么办?想想分布式锁。" },
          { text: "把单体应用拆分成 50 个微服务,分散压力。", next: 1, anger: 30, reply: "现在拆微服务?光网络延迟就够你喝一壶的。先解决眼前的 DB 瓶颈。" }
        ]
      },
      {
        messages: ["缓存方案通过了。但 DBA 还是报警,说有一条 SQL 拖慢了整体。", "看看这段订单查询代码,找出性能杀手。"],
        artifact: {
          type: "code", language: "sql", filename: "order_query.sql",
          code: `SELECT * FROM orders WHERE user_id = 12345 AND created_at > '2023-10-01' ORDER BY created_at DESC;
SELECT user_id, COUNT(*) FROM orders WHERE status = 'PAID' GROUP BY user_id; # 👈 全表扫描警告`,
          commentLine: 2, commentText: "这个统计查询没有走索引,且对全表进行了 GROUP BY。几千万数据跑一次要 5 分钟！"
        },
        options: [
          { text: "给 status 字段加索引,或者把统计数据异步写入 Redis/ES。", next: -1, anger: 0, reply: "正解。这种聚合统计绝对不能实时查主库。去做异步聚合。" },
          { text: "把 COUNT(*) 改成 COUNT(1),据说会快一点。", next: -1, anger: 20, reply: "这是上古时代的谣言。在 InnoDB 里没区别。根本问题是没走索引。" },
          { text: "增加数据库连接池的大小,从 50 改到 200。", next: -1, anger: 30, reply: "连接池越大,DB 上下文切换开销越大,死得更快。驳回！" }
        ]
      }
    ]
  },
  3: {
    bossName: "Sarah (产品副总裁)", bossAvatar: "‍💼", themeColor: "pink",
    rounds: [
      {
        messages: ["Lucas,来我办公室一下。", "刚看了你提交的 Q3 产品规划。", "太保守了！竞品上周已经上了 AI 助手功能,我们还在做基础优化?"],
        options: [
          { text: "竞品那个功能日活很低,我们调研过,用户核心痛点还是稳定性。", next: 1, anger: 10, reply: "稳定性是底线,不是增长点。老板要的是故事,是 DAU 的翻倍。" },
          { text: "明白,我马上调整方向。我们可以把 AI 助手作为 Q3 的核心亮点,先做个 MVP 试水。", next: 1, anger: 0, reply: "这就对了。我要的就是这种魄力。明天早会你来讲这个新方案。" },
          { text: "但是研发资源不够啊,后端组根本排不开期。", next: 1, anger: 40, reply: "不要跟我谈困难,我要的是结果！资源不够你去协调,协调不来我换人。" }
        ]
      },
      {
        messages: ["另外,设计组说你的原型图交互太复杂。", "用户学习成本太高。你打算怎么改?"],
        options: [
          { text: "砍掉 50% 的次要功能,只保留核心路径,做极简设计。", next: -1, anger: 0, reply: "同意。Less is more。去跟设计组对齐吧。" },
          { text: "加一个新手引导弹窗,一步步教用户怎么用。", next: -1, anger: 20, reply: "用户没耐心看弹窗。直接改交互,别打补丁。" }
        ]
      }
    ]
  },
  4: {
    bossName: "Eve (CISO 首席安全官)", bossAvatar: "🛡️", themeColor: "red",
    rounds: [
      {
        messages: ["Lucas,凌晨 3 点把你叫起来,出大事了。", "核心用户数据库被勒索软件加密了,黑客留了比特币地址。🚨", "现在全公司都在等你,第一步做什么?"],
        options: [
          { text: "立刻联系黑客谈判,尽量压低赎金,保住数据。", next: 1, anger: 50, reply: "绝对不行！公司政策严禁支付赎金。而且付了钱他们也不一定给解密钥匙。" },
          { text: "立刻断开受感染服务器的网络,隔离内网,防止横向扩散。", next: 1, anger: 0, reply: "反应很快。物理隔离是第一步。然后立刻启动冷备份恢复流程。" },
          { text: "先发公关声明,安抚用户情绪,再慢慢排查。", next: 1, anger: 30, reply: "还没搞清楚状况就发声明?如果最后发现数据没泄露,你让公司信誉往哪放?" }
        ]
      },
      {
        messages: ["网络隔离完成了。现在要查入侵源头。", "看看这段防火墙和登录日志,找出黑客是怎么进来的。"],
        artifact: {
          type: "code", language: "log", filename: "auth_server.log",
          code: `[2023-10-24 02:14:01] INFO: User 'admin' login success from 192.168.1.10
[2023-10-24 02:14:05] WARN: Failed password for 'root' from 45.33.12.11 port 22
[2023-10-24 02:14:10] INFO: Accepted publickey for 'deploy' from 10.0.0.5
[2023-10-24 02:15:00] CRIT: Sudo command executed by 'deploy': rm -rf / # 👈 异常行为`,
          commentLine: 4, commentText: "deploy 账号通常只用于发布代码,为什么会在凌晨 2 点执行删除根目录的命令?而且来源 IP 是内网！"
        },
        options: [
          { text: "deploy 账号的私钥泄露了,或者内网 10.0.0.5 机器已被攻陷。立刻吊销该 Key。", next: -1, anger: 0, reply: "正解。这是典型的内网横向移动。立刻吊销 Key,排查 10.0.0.5 的进程。" },
          { text: "可能是 deploy 用户误操作,发个邮件警告他一下。", next: -1, anger: 30, reply: "误操作会执行 rm -rf /?这是明显的恶意破坏或黑客在清理痕迹。太天真了！" },
          { text: "把 45.33.12.11 这个 IP 加入防火墙黑名单。", next: -1, anger: 10, reply: "那个 IP 只是在外网试探 SSH 爆破,根本不是入侵源头。别被误导了。" }
        ]
      }
    ]
  }
};

// 🌟 Phase 4：星系与剧本的完美映射
const SCENARIO_MAP: Record<number, number> = {
  0: 0, // 科技与 AI -> Alex
  1: 2, // 工程与建造 -> Mike
  2: 1, // 数据与金融 -> David
  3: 4, // 科学与生命 -> Eve
  4: 3, // 商业与社会 -> Sarah
};

const DEFAULT_SCENARIO = SCENARIOS[0];

interface SimulatorModalProps {
  isOpen: boolean;
  career: any;
  onClose: () => void;
  onComplete: (success: boolean, abilityChanges?: any) => void;
}

export default function SimulatorModal({ isOpen, career, onClose, onComplete }: SimulatorModalProps) {
  const scenarioKey = SCENARIO_MAP[career?.category] ?? 0;
  const scenario = SCENARIOS[scenarioKey] || DEFAULT_SCENARIO;
  
  const [roundIndex, setRoundIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [bossResponse, setBossResponse] = useState("");
  const [angerLevel, setAngerLevel] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, bossResponse]);

  // 🛡️ 修复隐患 2：打字机 useEffect 加入清理函数，防止组件卸载后幽灵更新
      useEffect(() => {
    if (!isOpen) {
      setRoundIndex(0); setStep(0); setVisibleMessages([]); setBossResponse(""); setAngerLevel(0);
      return;
    }
    if (roundIndex >= scenario.rounds.length) return;


    const currentRound = scenario.rounds[roundIndex];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delaySum = 0;

    currentRound.messages.forEach((msg: string, index: number) => {
      delaySum += 800;
      timers.push(setTimeout(() => {
        setVisibleMessages(prev => [...prev, { id: Date.now() + index, text: msg }]);
        if (index === currentRound.messages.length - 1) {
          timers.push(setTimeout(() => setStep(2), 1000));
        }
      }, delaySum));
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [isOpen, roundIndex, scenario]);

  const handleOptionClick = (option: any) => {
    const abilityChanges = {
      technical: option.text.match(/代码|技术|监控|数据库|SQL|缓存|索引|隔离|密钥/i) ? 20 : 10,
      logic: option.text.match(/排查|分析|逻辑|优化|重构|回测|特征/i) ? 20 : 10,
      communication: option.text.match(/沟通|团队|协调|汇报|解释|公关/i) ? 20 : 5,
      stress: option.text.match(/压力|紧急|加班|冷静|稳定|回滚/i) ? 20 : 10,
      innovation: option.text.match(/创新|新方案|创意|改进|MVP/i) ? 20 : 5,
      leadership: option.text.match(/管理|带领|决策|负责|主导|协调/i) ? 20 : 5,
    };

    // 🛡️ 修复隐患 1：闭包陷阱，提前计算真实的愤怒值
    const newAngerLevel = angerLevel + option.anger; 

    setStep(3);
    setBossResponse("Typing...");
    setAngerLevel(newAngerLevel);

    setTimeout(() => {
      setBossResponse(option.reply);
      setTimeout(() => {
        if (option.next === -1) {
          setTimeout(() => {
            // 使用计算好的 newAngerLevel，而不是闭包里的旧 angerLevel
            onComplete(newAngerLevel < 50, abilityChanges); 
          }, 2000);
        } else {
          setRoundIndex(prev => prev + 1);
          setStep(0);
          setBossResponse("");
          setVisibleMessages(prev => [...prev, { id: Date.now(), text: "--- 20 分钟后 ---", isSystem: true }]);
        }
      }, 2500);
    }, 1500);
  };

  if (!isOpen) return null;

  const currentRound = scenario.rounds[roundIndex];
  const hasArtifact = currentRound?.artifact;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-3xl bg-[#1a1d21] rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-[650px]`} onClick={(e: any) => e.stopPropagation()}>
        <div className="bg-[#222529] p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${scenario.themeColor}-500/20 flex items-center justify-center text-xl`}>{scenario.bossAvatar}</div>
            <div>
              <h3 className="text-white font-bold text-sm">{scenario.bossName}</h3>
              <p className="text-green-400 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Online · {career?.name} 专属挑战</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1a1d21] relative">
          <AnimatePresence>
            {visibleMessages.map((msg) => (
              msg.isSystem ? (
                <div key={msg.id} className="text-center text-white/30 text-xs my-4">- {msg.text} -</div>
              ) : (
                <motion.div key={msg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                  <div className={`w-8 h-8 rounded bg-${scenario.themeColor}-500/20 flex items-center justify-center text-sm flex-shrink-0`}>{scenario.bossAvatar}</div>
                  <div className="bg-[#2d3136] p-3 rounded-r-lg rounded-bl-lg text-white/90 text-sm max-w-[80%] shadow-sm">{msg.text}</div>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {hasArtifact && step >= 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-[#0d1117] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#161b22] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  {hasArtifact.filename}
                </div>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">1 Comment</span>
              </div>
              <div className="p-4 font-mono text-sm overflow-x-auto">
                {hasArtifact.code.split('\n').map((line: string, idx: number) => {
                  const lineNumber = idx + 1;
                  const isCommentLine = lineNumber === hasArtifact.commentLine;
                  return (
                    <div key={idx} className={`flex ${isCommentLine ? 'bg-red-500/10 border-l-2 border-red-500' : ''}`}>
                      <span className="w-8 text-right pr-4 text-white/30 select-none">{lineNumber}</span>
                      <span className={`${isCommentLine ? 'text-red-300' : 'text-blue-300'}`}>{line}</span>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-[#161b22] border-t border-white/5">
                <div className="flex gap-3">
                  <div className={`w-6 h-6 rounded bg-${scenario.themeColor}-500/20 flex items-center justify-center text-xs flex-shrink-0`}>{scenario.bossAvatar}</div>
                  <div className="bg-[#2d3136] p-3 rounded-lg text-white/90 text-sm shadow-sm border border-white/5">
                    <div className="text-xs text-white/40 mb-1">{scenario.bossName} · Line {hasArtifact.commentLine}</div>
                    {hasArtifact.commentText}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {bossResponse && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
              <div className={`w-8 h-8 rounded bg-${scenario.themeColor}-500/20 flex items-center justify-center text-sm flex-shrink-0`}>{scenario.bossAvatar}</div>
              <div className={`p-3 rounded-r-lg rounded-bl-lg text-sm max-w-[80%] shadow-sm ${angerLevel > 40 ? "bg-red-900/30 text-red-100 border border-red-500/30" : "bg-green-900/30 text-green-100 border border-green-500/30"}`}>{bossResponse}</div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#222529] p-4 border-t border-white/5 min-h-[120px] flex items-center justify-center">
          {step === 2 ? (
            <div className="grid grid-cols-1 gap-2 w-full">
              {currentRound.options.map((opt: any, idx: number) => (
                <button key={idx} onClick={() => handleOptionClick(opt)} className="text-left bg-[#2d3136] hover:bg-[#383c42] text-white/90 p-3 rounded-lg text-sm transition-all border border-transparent hover:border-cyan-500/50 group">
                  <span className={`text-${scenario.themeColor}-400 font-bold mr-2 group-hover:text-${scenario.themeColor}-300`}>{String.fromCharCode(65 + idx)}.</span>{opt.text}
                </button>
              ))}
            </div>
          ) : step === 3 ? (
            <div className="text-white/50 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>{scenario.bossName} 正在输入...
            </div>
          ) : (
            <div className="text-white/30 text-sm">等待消息...</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}