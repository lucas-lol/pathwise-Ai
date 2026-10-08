// src/components/CareerProfile.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Html, OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { computeBadges, RARITY_STYLE, type GameStats } from '../utils/badges';

// 复用之前的星球组件
function ProfilePlanet({ data, position }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffd700" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={10} className="pointer-events-none">
        <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

function ProfileConnections({ points }: { points: number[][] }) {
  return (
    <>
      {points.map((line, idx) => (
        <Line key={idx} points={line} color="#ffd700" lineWidth={2} transparent opacity={0.6} />
      ))}
    </>
  );
}

// 🌟 3D 雷达图场景组件
function RadarChartScene({ skills }: { skills: number[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const dimensions = ["技术", "逻辑", "沟通", "抗压", "创新", "领导"];

  const getHexagonPoints = (radius: number) => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      points.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
    }
    return points;
  };

  const dataPoints = useMemo(() => {
    return skills.map((v, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const r = (v / 100) * 2;
      return new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle));
    });
  }, [skills]);

  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    [0.5, 1.0, 1.5, 2.0].forEach(r => {
      const points = getHexagonPoints(r);
      lines.push([...points, points[0]]);
    });
    return lines;
  }, []);

  const radialLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const outerPoints = getHexagonPoints(2.0);
    outerPoints.forEach(p => {
      lines.push([new THREE.Vector3(0, 0, 0), p]);
    });
    return lines;
  }, []);

  // 🛡️ 修复：移除了之前混入的乱码，恢复干净的 useFrame
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {gridLines.map((points, idx) => (
        <Line key={`grid-${idx}`} points={points} color="#ffffff" lineWidth={1} transparent opacity={0.2} />
      ))}
      {radialLines.map((points, idx) => (
        <Line key={`radial-${idx}`} points={points} color="#ffffff" lineWidth={1} transparent opacity={0.15} />
      ))}
      <Line points={[...dataPoints, dataPoints[0]]} color="#06b6d4" lineWidth={3} transparent opacity={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[
          (() => {
            const shape = new THREE.Shape();
            shape.moveTo(dataPoints[0].x, dataPoints[0].z);
            for (let i = 1; i < dataPoints.length; i++) {
              shape.lineTo(dataPoints[i].x, dataPoints[i].z);
            }
            shape.closePath();
            return shape;
          })()
        ]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {dataPoints.map((p, idx) => (
        <mesh key={`vertex-${idx}`} position={p}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
      {dimensions.map((dim, idx) => {
        const angle = (Math.PI / 3) * idx - Math.PI / 2;
        const r = 3.2;
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);
        return (
          <Html key={`label-${idx}`} position={[x, 0, z]} center distanceFactor={6} className="pointer-events-none" style={{ zIndex: 100 }}>
            <div className="text-base text-white font-bold whitespace-nowrap px-2 py-1 bg-black/60 rounded" style={{ textShadow: '0 0 10px rgba(6, 182, 212, 1)' }}>
              {dim}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function RadarChart3D({ skills }: { skills: number[] }) {
  return (
    <div className="relative w-72 h-72 mx-auto">
      <Canvas camera={{ position: [0, 4.5, 5.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={1} color="#06b6d4" />
        <RadarChartScene skills={skills} />
      </Canvas>
    </div>
  );
}

interface CareerProfileProps {
  userSkills: Set<number>;
  careers: any[];
  onBack: () => void;
  abilityScores?: number[];
  unlockedPaths?: Set<number>;
  stats?: GameStats;
}

// ============ 全息升级包 ============
function HoloBootSequence() {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1400); return () => clearTimeout(t); }, []);
  if (done) return null;
  return (
    <motion.div className="absolute inset-0 z-50 pointer-events-none overflow-hidden bg-black/70"
      initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.1, duration: 0.3 }}>
      <motion.div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_25px_#22d3ee]"
        initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 1.0, ease: 'easeInOut' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-cyan-300 font-mono text-sm tracking-[0.5em] animate-pulse">INITIALIZING HOLOGRAPHIC PROFILE…</span>
      </div>
    </motion.div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function TypewriterText({ text, speed = 28 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(t);
  }, [n, text, speed]);
  return <span>{text.slice(0, n)}<span className="animate-pulse text-cyan-400">▍</span></span>;
}

function HoloBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }} />
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #22d3ee 2px, #22d3ee 3px)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
}

export default function CareerProfile({ userSkills, careers, onBack, abilityScores, unlockedPaths, stats }: CareerProfileProps) {
  const masteredCareers = useMemo(() => {
    return careers.filter((c: any) => userSkills.has(c.id));
  }, [careers, userSkills]);

  const connectionPoints = useMemo(() => {
    const lines: number[][] = [];
    for (let i = 0; i < masteredCareers.length; i++) {
      for (let j = i + 1; j < masteredCareers.length; j++) {
        const c1 = masteredCareers[i];
        const c2 = masteredCareers[j];
        if (c1.category === c2.category && c1.position.distanceTo(c2.position) < 15) {
          lines.push([
            c1.position.x, c1.position.y, c1.position.z,
            c2.position.x, c2.position.y, c2.position.z
          ]);
        }
      }
    }
    return lines;
  }, [masteredCareers]);

  // 👇 所有 hooks 与派生数据都在组件顶层计算
  const masteredCount = useCountUp(userSkills.size);
  const hasRealData = abilityScores ? abilityScores.some(score => score > 0) : false;
  const radarSkills: number[] = hasRealData && abilityScores ? abilityScores : [12, 12, 12, 12, 12, 12];

  const categoryCount = [0, 0, 0, 0, 0];
  masteredCareers.forEach((c: any) => { categoryCount[c.category]++; });
  const topCategory = categoryCount.indexOf(Math.max(...categoryCount));
  const futureTitles = ["首席 AI 架构师", "数据科学总监", "全栈技术专家", "产品副总裁", "设计总监"];
  const predictedTitle = userSkills.size > 0 ? futureTitles[topCategory] : "未知";

  const aiComment = userSkills.size === 0
    ? "你尚未开始探索。回到宇宙，点亮你的第一个技能吧！"
    : userSkills.size < 5
    ? "你已踏上旅程。继续保持好奇心，探索更多可能性。"
    : "你展现了强大的学习能力。你的技能树正在形成独特的形状。";

  // 🌟 P3：接入共享的 computeBadges，传入 stats
  const badges = computeBadges(userSkills.size, unlockedPaths?.size ?? 0, abilityScores, stats);

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex">
      <HoloBootSequence />
      <HoloBackdrop />

      {/* 左侧 70%：3D 星座 */}
      <div className="w-[70%] h-full relative">
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars radius={50} depth={30} count={1000} factor={2} saturation={0} fade speed={1} />
          {masteredCareers.map((career: any) => (
            <ProfilePlanet key={career.id} data={career} position={career.position} />
          ))}
          <ProfileConnections points={connectionPoints} />
          <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={50} autoRotate autoRotateSpeed={0.5} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} intensity={1.5} />
          </EffectComposer>
        </Canvas>

        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-40 bg-black/80 border border-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/10 transition-all flex items-center gap-2 font-bold text-sm"
        >
          ← 返回宇宙探索
        </button>

        <div className="absolute top-6 right-6 z-40 text-right">
          <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">YOUR CONSTELLATION</div>
          <div className="text-white font-mono text-3xl font-bold">
            {masteredCount} <span className="text-white/40 text-lg">/ {careers.length} Skills</span>
          </div>
        </div>
      </div>

      {/* 右侧 30%：档案面板 */}
      <div className="w-[30%] h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-8 overflow-y-auto flex flex-col relative z-10">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">全息职业档案</h2>
          <p className="text-white/60 text-sm">基于你的学习轨迹生成</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6 mb-6">
          <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">AI 预测你的未来</div>
          <div className="text-2xl font-bold text-white">{predictedTitle}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-white/80 font-bold text-sm mb-4">能力模型</h3>
          <RadarChart3D skills={radarSkills} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-white/80 font-bold text-sm mb-4">AI 深度复盘</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            <TypewriterText text={aiComment} />
          </p>
        </motion.div>

        {badges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">成就徽章 · Achievements</h3>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <motion.div key={b.name} initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.12, type: 'spring' }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-black/40 backdrop-blur-md ${RARITY_STYLE[b.rarity]}`}>
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <div className="text-xs font-bold">{b.name}</div>
                    <div className="text-[10px] opacity-60">{b.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}