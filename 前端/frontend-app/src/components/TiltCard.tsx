import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // 最大倾斜角度，默认 8 度
}

export default function TiltCard({ children, className = '', maxTilt = 8 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // 计算鼠标在卡片内的相对位置 (0 到 1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // 计算倾斜角度 (中心点为 0，边缘为 maxTilt)
    const rotateX = (0.5 - y) * maxTilt * 2; 
    const rotateY = (x - 0.5) * maxTilt * 2;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePosition({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    // 鼠标离开时，平滑恢复原位
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        transform, 
        transition: 'transform 0.1s ease-out', // 极短的过渡时间，实现实时跟随
        transformStyle: 'preserve-3d' 
      }}
      className={`relative ${className}`}
    >
      {/* 内部反光层 (Glare Effect) */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none z-20 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
        }}
      />
      {/* 实际内容 */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}