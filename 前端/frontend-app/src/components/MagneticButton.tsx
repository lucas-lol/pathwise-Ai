import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  strength?: number; // 磁吸强度，默认 0.3
}

export default function MagneticButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  strength = 0.3 
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!btnRef.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于按钮中心的偏移量
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    // 应用磁吸效果 (轻微跟随)
    setPosition({ x: x * strength, y: y * strength });
  };

  const handleMouseLeave = () => {
    // 鼠标离开时，按钮弹回原位
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      // 使用 transform 实现平滑的物理跟随效果
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
      }}
      className={`group relative overflow-hidden rounded-xl font-bold transition-all duration-300 
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : 'cursor-pointer'}
        ${className}`}
    >
      {/* 1. 全息微光边框 (Holographic Border) */}
      <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />
      <div className="absolute inset-0 rounded-xl bg-slate-900/90 backdrop-blur-md -z-10" />
      
      {/* 2. 内部扫光效果 (Shine Effect) */}
      <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] group-hover:animate-[shine_0.75s_ease-in-out]" />
      
      {/* 3. 按钮内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2 px-8 py-3">
        {children}
      </span>
    </button>
  );
}