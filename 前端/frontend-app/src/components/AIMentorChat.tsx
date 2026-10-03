// src/components/AIMentorChat.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
type Persona = 'student' | 'career-changer' | 'lifelong-learner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIMentorChatProps {
  onBack: () => void;
  userSkills?: Set<number>;
  careers?: any[];
  abilityScores?: number[];
  userPersona?: Persona | null; // 确保这里是 Persona
}

export default function AIMentorChat({ onBack, userSkills, careers, abilityScores, userPersona }: AIMentorChatProps) {  const [input, setInput] = useState('');
  const getOpeningMessage = () => {
  const skillCount = userSkills?.size || 0;
  
  if (skillCount === 0) {
    const personaMessages: Record<Persona, string> = {
      'student': '你好！我注意到你是一名大学生。别担心迷茫，每个优秀的架构师都从这里开始。去宇宙点击那个发光的"START HERE"星球，迈出第一步吧！',
      'career-changer': '你好！转行需要勇气，但你已经迈出了最重要的一步。告诉我你的目标职业，我会帮你规划最高效的技能路径。',
      'lifelong-learner': '你好！终身学习是最值得敬佩的品质。你的宇宙已经准备好，想从哪个领域开始探索？',
    };
    return userPersona ? personaMessages[userPersona] : '你好！我是你的 AI 职业规划师。今天想聊点什么？';
  }
  
  return `欢迎回来！我看到你已经点亮了 ${skillCount} 个技能，进展不错。${
    userPersona === 'student' ? '作为大学生，你的学习速度很快！' :
    userPersona === 'career-changer' ? '转行之路虽然辛苦，但每一步都算数。' :
    '持续学习的你，正在不断拓展能力边界。'
  } 今天想继续探索哪个方向？`;
};

const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    sender: 'ai',
    text: getOpeningMessage(),
    timestamp: new Date(),
  },
]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const abilityLabels = ["技术", "逻辑", "沟通", "抗压", "创新", "领导"];
  const topAbilityIdx = abilityScores ? abilityScores.indexOf(Math.max(...abilityScores)) : 0;
  const lowAbilityIdx = abilityScores ? abilityScores.indexOf(Math.min(...abilityScores)) : 0;
  const topScore = abilityScores ? abilityScores[topAbilityIdx] : 0;
  const lowScore = abilityScores ? abilityScores[lowAbilityIdx] : 0;
  const skillCount = userSkills?.size || 0;

  // 获取已点亮的技能名称
  const masteredSkills = useMemo(() => {
    if (!userSkills || !careers) return [];
    return Array.from(userSkills).slice(0, 3).map(id => careers.find(c => c.id === id)?.name).filter(Boolean);
  }, [userSkills, careers]);

  // 智能生成快捷提问
  const quickPrompts = useMemo(() => {
  const skillCount = userSkills?.size || 0;
  const prompts: string[] = [];
  
  if (skillCount === 0) {
    prompts.push('我该如何开始探索？');
    prompts.push(`${userPersona === 'student' ? '大学生' : userPersona === 'career-changer' ? '转行者' : '学习者'}适合什么方向？`);
  } else {
    prompts.push('分析一下我目前的技能树');
    if (lowScore < 60 && lowScore > 0) prompts.push(`我的${abilityLabels[lowAbilityIdx]}较弱，怎么补？`);
    if (topScore > 70) prompts.push(`如何发挥我的${abilityLabels[topAbilityIdx]}优势？`);
  }
  
  return prompts.slice(0, 3);
}, [abilityLabels, lowAbilityIdx, lowScore, topAbilityIdx, topScore, userSkills, userPersona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  //  增强版本地智能引擎 (无需联网，极速响应，动态组合话术)
  const generateAIResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    // 1. 关于"方向/适合"
    if (lowerText.includes('适合') || lowerText.includes('方向') || lowerText.includes('选') || lowerText.includes('分析')) {
      if (skillCount === 0) {
        return `我注意到你的宇宙还是暗的。别急，规划的第一步是探索。\n\n建议你点击几个基础星球（比如"AI 算法"或"全栈开发"），完成一次模拟。有了数据，我才能给你精准的画像。去试试吧！`;
      }
      
      const skillsStr = masteredSkills.length > 0 ? masteredSkills.join('、') : '相关基础技能';
      return `根据你点亮的 ${skillCount} 个节点（如${skillsStr}），以及你的能力模型：\n\n你的 **${abilityLabels[topAbilityIdx]}** 是你的核心引擎 (${topScore}分)。这意味着你在需要深度思考和${abilityLabels[topAbilityIdx]}的领域会如鱼得水。\n\n**我的建议**：不要盲目追热点。沿着你已点亮的技能树，向“进阶”和“专家”层级探索。你的路径已经初具雏形了。`;
    }
    
    // 2. 关于"弱项/提升/差"
    if (lowerText.includes(abilityLabels[lowAbilityIdx]) || lowerText.includes('弱') || lowerText.includes('提升') || lowerText.includes('差') || lowerText.includes('补')) {
      if (lowScore === 0) {
        return `${abilityLabels[lowAbilityIdx]}能力暂未评分。这通常意味着你还没有在模拟器中接触过相关挑战。\n\n不用焦虑，去“学习执行中心”找几个相关的 Daily Mission，做完一次模拟，分数自然就有了。`;
      }
      
      return `${abilityLabels[lowAbilityIdx]} (${lowScore}分) 确实是目前木桶的短板，但这也是你进步空间最大的地方。\n\n**三步提升法**：\n1. **刻意练习**：在学习中心，优先做带有“限时”标签的任务，强迫自己在压力下做决策。\n2. **跨界合成**：去图鉴里找找需要 ${abilityLabels[lowAbilityIdx]} 的跨领域配方，逼自己跳出舒适区。\n3. **接受不完美**：不用强求六边形。把它提升到 60 分“不拖后腿”即可，把 80% 的精力留给你的 ${abilityLabels[topAbilityIdx]}。`;
    }

    // 3. 关于"优势/强/擅长"
    if (lowerText.includes(abilityLabels[topAbilityIdx]) || lowerText.includes('优势') || lowerText.includes('强') || lowerText.includes('擅长')) {
      return `你的 **${abilityLabels[topAbilityIdx]}** 达到了 ${topScore} 分，这是你区别于他人的核心竞争力！🌟\n\n**如何放大它？**\n- **寻找高杠杆场景**：在团队中主动承担需要高${abilityLabels[topAbilityIdx]}的难题。\n- **打造个人标签**：让别人一提到${abilityLabels[topAbilityIdx]}就想到你。\n- **探索隐藏配方**：去宇宙深处找找那些需要极高${abilityLabels[topAbilityIdx]}才能解锁的“专家级”星球。\n\n记住，优势不是用来保持的，是用来碾压的。`;
    }

    // 4. 关于"综合/平衡/全面"
    if (lowerText.includes('综合') || lowerText.includes('平衡') || lowerText.includes('全面') || lowerText.includes('六边形')) {
      return `追求“六边形战士”是个陷阱。真正的职场高手都是“T型人才”。\n\n你现在的模型很真实：${abilityLabels[topAbilityIdx]} (${topScore}) 是你的那一竖，足够深；其他几项是你的那一横。\n\n**我的策略**：只要最弱的 ${abilityLabels[lowAbilityIdx]} 不低于 50 分，你就完全具备竞争力。把剩下的时间全部投入到你的长板中，做到极致。`;
    }

    // 5. 默认回复 (引导式)
    const defaultResponses = [
      `这是个好问题。不过为了给你更精准的建议，你能具体说说吗？比如问问“我的${abilityLabels[lowAbilityIdx]}怎么提升”，或者“我适合什么方向”。`,
      `我理解你的困惑。建议你点开左侧的“快捷提问”，那里有几个基于你当前数据生成的好问题。或者，去“学习执行中心”跑几个任务，行动会带来答案。`,
      `作为你的 AI 导师，我随时在这里。你可以问我关于技能合成、职业路径、或者能力雷达图的任何事。试试问我：“分析一下我的技能树”？`
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 模拟思考延迟 (0.8 - 1.5秒)
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const aiText = generateAIResponse(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="w-full h-screen bg-[#050810] relative overflow-hidden flex text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none"></div>

      {/* 左侧 */}
      <div className="w-[30%] h-full border-r border-white/5 p-8 flex flex-col z-10 bg-black/20">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight mb-2">AI MENTOR</h2>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Quick Prompts</h3>
          <div className="space-y-2">
            {quickPrompts.map((prompt, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-sm text-white/80 group"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Chat History</h3>
          <div className="space-y-3 opacity-50">
            <div className="p-3 rounded-lg bg-white/5 text-xs text-white/60 truncate">昨天：关于量化交易的学习路径...</div>
            <div className="p-3 rounded-lg bg-white/5 text-xs text-white/60 truncate">前天：如何平衡技术与沟通能力...</div>
          </div>
        </div>
      </div>

      {/* 右侧 */}
      <div className="w-[70%] h-full flex flex-col z-10">
        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-2' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${msg.sender === 'user' ? 'bg-cyan-500 text-black' : 'bg-purple-500 text-white'}`}>
                      {msg.sender === 'user' ? 'Me' : 'AI'}
                    </div>
                    <span className="text-xs text-white/40">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="询问关于职业规划、技能提升的任何问题..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 pr-16 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-white/20 mt-3">AI 规划师基于你的 3D 宇宙数据生成回答 · 仅供参考</p>
        </div>
      </div>
    </div>
  );
}