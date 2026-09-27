// src/components/TaskNode.tsx

// 定义组件接收的属性 (Props)
interface TaskNodeProps {
  title: string;
  description: string;
  status: 'locked' | 'available' | 'completed';
  estimatedTime: string;
  onClick?: () => void; // 新增：点击事件
}

export default function TaskNode({ title, description, status, estimatedTime, onClick }: TaskNodeProps) {
  
  // 处理点击事件
  const handleClick = () => {
    if (status === 'locked') {
      // 锁定状态：弹出优雅提示
      alert('🔒 该任务尚未解锁。请先完成前置阶段的任务。');
      return; // 阻止后续操作
    }
    
    // 可用或已完成状态：执行传入的点击逻辑
    if (onClick) {
      onClick();
    }
  };

  // 🎨 核心：根据状态动态决定样式
  let containerStyle = "relative p-6 rounded-2xl border transition-all duration-300 ";
  let icon = null;

  if (status === 'locked') {
    // 暗淡、灰度、禁止光标
    containerStyle += "bg-white/5 border-white/5 opacity-50 grayscale cursor-not-allowed backdrop-blur-sm";
    icon = <span className="text-slate-600 text-xl mr-3">🔒</span>; 
  } else if (status === 'available') {
    // 正常玻璃拟态，悬停高亮
    containerStyle += "bg-white/10 border-white/20 hover:border-indigo-500/50 hover:bg-white/15 shadow-[0_0_15px_rgba(99,102,241,0.1)] cursor-pointer group";
    icon = <span className="text-indigo-400 text-xl mr-3 group-hover:scale-110 transition-transform">✨</span>;
  } else if (status === 'completed') {
    // 完成状态：绿色边框，微光
    containerStyle += "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-default";
    icon = <span className="text-emerald-400 text-xl mr-3">✅</span>;
  }

  return (
    <div className={containerStyle} onClick={handleClick}>
      <div className="flex items-start">
        {/* 图标区域 */}
        <div className="mt-1">{icon}</div>
        
        {/* 文本区域 */}
        <div className="flex-1">
          <h3 className={`text-lg font-serif font-bold mb-1 ${status === 'locked' ? 'text-slate-500' : 'text-white'}`}>
            {title}
          </h3>
          <p className={`text-sm mb-3 ${status === 'locked' ? 'text-slate-600' : 'text-slate-400'}`}>
            {description}
          </p>
          
          {/* 底部信息：预计时间 */}
          <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
            status === 'locked' ? 'bg-slate-800 text-slate-600' : 'bg-indigo-900/30 text-indigo-300'
          }`}>
             {estimatedTime}
          </div>
        </div>
      </div>
    </div>
  );
}