// src/components/AIMentorChat.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function AIMentorChat({ onBack, userSkills, careers, abilityScores }: AIMentorChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: '你好！我是你的 AI 职业规划师。我已经分析了你的 3D 宇宙探索数据和学习轨迹。有什么我可以帮你的吗？',
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

  // 智能生成快捷提问
  const quickPrompts = useMemo(() => {
    const prompts = [
      "我目前的技能树适合什么方向？",
      "如何提升我的综合能力？",
    ];
    
    if (lowScore < 60) {
      prompts.unshift(`我的${abilityLabels[lowAbilityIdx]}能力较弱 (${lowScore}分)，该怎么提升？`);
    }
    if (topScore > 70) {
      prompts.push(`我想发挥${abilityLabels[topAbilityIdx]}优势 (${topScore}分)，有什么建议？`);
    }
    
    return prompts.slice(0, 3);
  }, [abilityLabels, lowAbilityIdx, lowScore, topAbilityIdx, topScore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 🎯 改进：更自然、更有深度的 AI 回复
  const generateAIResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    const skillCount = userSkills?.size || 0;
    
    // 1. 关于"方向"的问题
    if (lowerText.includes('适合') || lowerText.includes('方向') || lowerText.includes('选')) {
      if (skillCount === 0) {
        return `我注意到你还没有点亮任何技能节点。别担心，这是探索的第一步！\n\n我建议你从"AI 与数据"或"全栈与云"这两个方向入手，它们的基础技能比较容易上手，而且市场需求很大。先去宇宙里点击几个基础星球，完成模拟体验，我会根据你的表现给出更精准的建议。`;
      }
      
      if (skillCount < 5) {
        return `你已经点亮了 ${skillCount} 个技能，这是个不错的开始！\n\n从你目前的选择来看，你似乎对${abilityLabels[topAbilityIdx]}方面比较感兴趣。我的建议是：先不要急着确定方向，继续探索 2-3 个不同类别的基础技能，看看自己在哪个领域最有成就感。方向是在实践中慢慢清晰的，不是一开始就定死的。`;
      }
      
      return `太棒了！你已经点亮了 ${skillCount} 个技能，形成了初步的技能树。\n\n根据你的数据，你的 **${abilityLabels[topAbilityIdx]}能力** 非常突出 (${topScore}分)，这是一个很强的信号。我建议你：\n\n1. **深耕优势**：继续在这个方向上解锁高级技能\n2. **补齐短板**：适当提升 **${abilityLabels[lowAbilityIdx]}** (${lowScore}分)，让它不成为瓶颈\n3. **寻找交叉点**：看看有没有需要同时用到这两项能力的"跨领域配方"\n\n记住，最好的职业方向不是"最热门的"，而是"最适合你的"。`;
    }
    
    // 2. 关于"弱项/提升"的问题
    if (lowerText.includes(abilityLabels[lowAbilityIdx]) || lowerText.includes('弱') || lowerText.includes('提升') || lowerText.includes('差')) {
      if (lowScore === 0) {
        return `我理解你的担忧。${abilityLabels[lowAbilityIdx]}能力确实需要重视，但也不要给自己太大压力。\n\n我的建议是"小步快跑"：\n- 每天花 15 分钟做针对性的练习\n- 在学习中心完成 1-2 个相关任务\n- 不要追求完美，先完成再完善\n\n能力是慢慢积累的，一个月后你回头看，会发现自己进步了很多。加油！`;
      }
      
      return `${abilityLabels[lowAbilityIdx]}能力 ${lowScore} 分，确实有提升空间，但这完全不是问题。\n\n我给你三个具体建议：\n\n**1. 刻意练习**：在学习中心，优先选择标注为"限时训练"的任务，这能快速提升${abilityLabels[lowAbilityIdx]}\n\n**2. 找到应用场景**：${abilityLabels[lowAbilityIdx]}不是孤立的，试着在你擅长的${abilityLabels[topAbilityIdx]}领域中运用它\n\n**3. 接受不完美**：没有人六边形战士，${abilityLabels[lowAbilityIdx]}只要达到 60 分就够用了，把更多精力放在发挥优势上\n\n需要我帮你制定一个具体的提升计划吗？`;
    }

    // 3. 关于"优势"的问题
    if (lowerText.includes(abilityLabels[topAbilityIdx]) || lowerText.includes('优势') || lowerText.includes('强') || lowerText.includes('擅长')) {
      return `你的 **${abilityLabels[topAbilityIdx]}能力** 达到了 ${topScore} 分，这真的很出色！🎉\n\n这是你的核心竞争力，要好好利用：\n\n**1. 选择高杠杆场景**：找那些能最大化发挥${abilityLabels[topAbilityIdx]}的工作和项目\n\n**2. 建立个人品牌**：在团队中主动承担需要${abilityLabels[topAbilityIdx]}的任务，让别人记住你的这个标签\n\n**3. 持续精进**：即使已经很强了，也要保持学习。看看宇宙里有没有需要高${abilityLabels[topAbilityIdx]}的"隐藏配方"\n\n记住：优势不是用来"保持"的，是用来"放大"的。`;
    }

    // 4. 关于"综合能力"的问题
    if (lowerText.includes('综合') || lowerText.includes('平衡') || lowerText.includes('全面')) {
      return `想要提升综合能力，这个想法很好！但我要告诉你一个真相：**不需要每项都强**。\n\n真正的"综合"不是六边形战士，而是：\n- **1-2 项突出**（你的${abilityLabels[topAbilityIdx]}已经是了）\n- **其他项不拖后腿**（达到 60 分即可）\n- **知道如何协作**（用团队弥补个人短板）\n\n我的建议：先把${abilityLabels[lowAbilityIdx]}提升到 60 分，然后就把 80% 的精力放在发挥${abilityLabels[topAbilityIdx]}优势上。这才是最高效的策略。`;
    }

    // 5. 默认回复（更友好）
    return `这是个好问题！不过我需要更多上下文才能给你精准的建议。\n\n你可以试试：\n- 告诉我你具体困惑什么（比如"该选 AI 还是全栈"）\n- 问问关于某个具体能力的提升方法\n- 让我帮你分析当前的技能树\n\n或者，先去"学习执行中心"看看今日任务，有时候行动比思考更能带来答案。😊`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiText = generateAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
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
                <span className="text-cyan-400 mr-2 group-hover:mr-3 transition-all"></span>
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Chat History</h3>
          <div className="space-y-3 opacity-50">
            <div className="p-3 rounded-lg bg-white/5 text-xs text-white/60 truncate">
              昨天：关于量化交易的学习路径...
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-xs text-white/60 truncate">
              前天：如何平衡技术与沟通能力...
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 */}
      <div className="w-[70%] h-full flex flex-col z-10">
        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-2' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${msg.sender === 'user' ? 'bg-cyan-500 text-black' : 'bg-purple-500 text-white'}`}>
                      {msg.sender === 'user' ? 'Me' : 'AI'}
                    </div>
                    <span className="text-xs text-white/40">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.sender === 'user' 
                      ? 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
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
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-white/20 mt-3">
            AI 规划师基于你的 3D 宇宙数据生成回答 · 仅供参考
          </p>
        </div>
      </div>
    </div>
  );
}