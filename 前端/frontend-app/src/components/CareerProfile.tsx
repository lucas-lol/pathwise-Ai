// src/components/CareerProfile.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Html, OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { computeBadges, RARITY_STYLE, type GameStats } from '../utils/badges';

// ==================== 常量定义 ====================
const CATEGORY_COLORS: string[] = ["#4f46e5", "#06b6d4", "#eab308", "#d946ef", "#22c55e"];
const FUTURE_TITLES: string[] = [
  "科技与 AI 领航者",
  "工程与建造大宗师",
  "数据与金融掌控者",
  "科学与生命探索者",
  "商业与社会塑造者"
];
const FUTURE_GOALS: string[] = [
  "首席 AI 架构师",
  "分布式系统专家",
  "量化交易总监",
  "生物信息学科学家",
  "产品战略顾问"
];

// ==================== 3D 场景组件 ====================

// 🌟 脉冲星球（带呼吸效果 + 轨道环）
function PulsingPlanet({ data, position, isMastered, color }: {
  data: { name: string; category: number };
  position: THREE.Vector3;
  isMastered: boolean;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      if (isMastered) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
        meshRef.current.scale.set(scale, scale, scale);
      }
    }
    if (glowRef.current && isMastered) {
      const glowScale = 1.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.25;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
    if (ringRef.current && isMastered) {
      ringRef.current.rotation.x += 0.01;
      ringRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group position={position}>
      {/* 外层光晕 */}
      {isMastered && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.BackSide} toneMapped={false} />
        </mesh>
      )}

      {/* 核心星球 */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          color={isMastered ? "#ffffff" : "#333333"}
          emissive={isMastered ? color : "#111111"}
          emissiveIntensity={isMastered ? 2.5 : 0.2}
          toneMapped={false}
        />
      </mesh>

      {/* 轨道环 */}
      {isMastered && (
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.0, 0.025, 8, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      )}

      {/* 名称标签 */}
      <Html position={[0, 1.6, 0]} center distanceFactor={10} className="pointer-events-none">
        <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap backdrop-blur-md border ${
          isMastered
            ? 'bg-black/80 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
            : 'bg-black/60 border-white/20 text-white/40'
        }`}>
          {data.name}
        </div>
      </Html>
    </group>
  );
}

// 🌟 同类别连线（已掌握）
function MasteredConnections({ careers, userSkills }: { careers: any[]; userSkills: Set<number> }) {
  const lines = useMemo(() => {
    const result: number[][] = [];
    const mastered = careers.filter((c: any) => userSkills.has(c.id));
    for (let i = 0; i < mastered.length; i++) {
      for (let j = i + 1; j < mastered.length; j++) {
        if (mastered[i].category === mastered[j].category && mastered[i].position.distanceTo(mastered[j].position) < 15) {
          result.push([
            mastered[i].position.x, mastered[i].position.y, mastered[i].position.z,
            mastered[j].position.x, mastered[j].position.y, mastered[j].position.z
          ]);
        }
      }
    }
    return result;
  }, [careers, userSkills]);

  return (
    <>
      {lines.map((line, idx) => (
        <Line key={idx} points={line} color="#ffd700" lineWidth={2} transparent opacity={0.6} />
      ))}
    </>
  );
}

// 🌟 成长轨迹线（按 tier 从低到高连接已掌握星球）
function GrowthTrajectory({ careers, userSkills }: { careers: any[]; userSkills: Set<number> }) {
  const lines = useMemo(() => {
    const result: number[][] = [];
    const mastered = careers.filter((c: any) => userSkills.has(c.id));
    mastered.sort((a: any, b: any) => a.tier - b.tier);
    for (let i = 0; i < mastered.length - 1; i++) {
      result.push([
        mastered[i].position.x, mastered[i].position.y, mastered[i].position.z,
        mastered[i + 1].position.x, mastered[i + 1].position.y, mastered[i + 1].position.z
      ]);
    }
    return result;
  }, [careers, userSkills]);

  return (
    <>
      {lines.map((line, idx) => (
        <Line key={`traj-${idx}`} points={line} color="#22d3ee" lineWidth={1.5} transparent opacity={0.5} dashed={false} />
      ))}
    </>
  );
}

// 🌟 命运路径（已掌握星球 → 终极目标）
function DestinyPathLines({ careers, userSkills, unlockedPaths }: {
  careers: any[];
  userSkills: Set<number>;
  unlockedPaths: Set<number>;
}) {
  const lines = useMemo(() => {
    const result: { points: number[][]; color: string }[] = [];
    unlockedPaths.forEach((catId: number) => {
      const color = CATEGORY_COLORS[catId] || "#ffffff";
      const masteredInCat = careers.filter((c: any) => c.category === catId && userSkills.has(c.id));
      masteredInCat.forEach((c: any) => {
        const targetPos = c.position.clone().normalize().multiplyScalar(35);
        result.push({
          points: [[c.position.x, c.position.y, c.position.z, targetPos.x, targetPos.y, targetPos.z]],
          color
        });
      });
    });
    return result;
  }, [careers, userSkills, unlockedPaths]);

  return (
    <>
      {lines.map((group, idx) =>
        group.points.map((line, j) => (
          <Line key={`destiny-${idx}-${j}`} points={line} color={group.color} lineWidth={2} transparent opacity={0.7} />
        ))
      )}
    </>
  );
}

// 🌟 终极目标节点
function FutureGoalNode({ category, title, color }: { category: number; title: string; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => {
    // 根据 category 分布到不同方向
    const angle = (category / 5) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 30, Math.sin(angle) * 8, Math.sin(angle) * 30);
  }, [category]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.z += 0.005;
    }
    if (glowRef.current) {
      const s = 1.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.3;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <Html position={[0, 2.5, 0]} center distanceFactor={20} className="pointer-events-none">
        <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.5)] whitespace-nowrap">
          🎯 {title}
        </div>
      </Html>
    </group>
  );
}

// 🌟 3D 雷达图
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
    <div className="relative w-full h-48 mx-auto">
      <Canvas camera={{ position: [0, 4.5, 5.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={1} color="#06b6d4" />
        <RadarChartScene skills={skills} />
      </Canvas>
    </div>
  );
}

// ==================== UI 特效组件 ====================
function HoloBootSequence() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  if (done) return null;
  return (
    <motion.div className="absolute inset-0 z-50 pointer-events-none overflow-hidden bg-black/80"
      initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.1, duration: 0.5 }}>
      <motion.div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_25px_#22d3ee]"
        initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-cyan-300 font-mono text-sm tracking-[0.5em] animate-pulse">INITIALIZING HOLOGRAPHIC PROFILE…</span>
      </div>
    </motion.div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
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

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
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
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #22d3ee 2px, #22d3ee 3px)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
}

// ==================== 主组件 ====================
interface CareerProfileProps {
  userSkills: Set<number>;
  careers: any[];
  onBack: () => void;
  abilityScores?: number[];
  unlockedPaths?: Set<number>;
  stats?: GameStats;
}

export default function CareerProfile({ userSkills, careers, onBack, abilityScores, unlockedPaths, stats }: CareerProfileProps) {
  const masteredCareers = useMemo(() => {
    return careers.filter((c: any) => userSkills.has(c.id));
  }, [careers, userSkills]);

  const masteredCount = useCountUp(userSkills.size);
  const safeAbilityScores = abilityScores && abilityScores.length === 6 ? abilityScores : [12, 12, 12, 12, 12, 12];

  const categoryCount = [0, 0, 0, 0, 0];
  masteredCareers.forEach((c: any) => { categoryCount[c.category]++; });
  const topCategory = categoryCount.indexOf(Math.max(...categoryCount));
  const predictedTitle = userSkills.size > 0 ? FUTURE_GOALS[topCategory] : "未知";

  const aiComment = userSkills.size === 0
    ? "你尚未开始探索。回到宇宙，点亮你的第一个技能吧！"
    : userSkills.size < 5
    ? "你已踏上旅程。继续保持好奇心，探索更多可能性。"
    : "你展现了强大的学习能力。你的技能树正在形成独特的形状。";

  const badges = computeBadges(userSkills.size, unlockedPaths?.size ?? 0, safeAbilityScores, stats);

  const currentLevel = Math.floor((stats?.xp || 0) / 500) + 1;
  const xpProgress = ((stats?.xp || 0) % 500) / 500 * 100;

  const ratingCounts = useMemo(() => {
    const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
    Object.values(stats?.ratings || {}).forEach((r: string) => {
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [stats?.ratings]);

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex text-white font-sans">
      <HoloBootSequence />
      <HoloBackdrop />

      {/* 左侧 60%：3D 星座 */}
      <div className="w-[60%] h-full relative">
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars radius={50} depth={30} count={1000} factor={2} saturation={0} fade speed={1} />

          {/* 所有职业星球（已掌握高亮 + 未掌握暗淡） */}
          {careers.map((career: any) => (
            <PulsingPlanet
              key={career.id}
              data={career}
              position={career.position}
              isMastered={userSkills.has(career.id)}
              color={CATEGORY_COLORS[career.category] || "#ffffff"}
            />
          ))}

          {/* 同类别连线 */}
          <MasteredConnections careers={careers} userSkills={userSkills} />

          {/* 成长轨迹线 */}
          <GrowthTrajectory careers={careers} userSkills={userSkills} />

          {/* 命运路径 */}
          {unlockedPaths && (
            <DestinyPathLines careers={careers} userSkills={userSkills} unlockedPaths={unlockedPaths} />
          )}

          {/* 终极目标节点 */}
          {CATEGORY_COLORS.map((color: string, idx: number) => (
            <FutureGoalNode key={idx} category={idx} title={FUTURE_TITLES[idx]} color={color} />
          ))}

          <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={50} autoRotate autoRotateSpeed={0.3} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} intensity={1.5} />
          </EffectComposer>
        </Canvas>

        <button onClick={onBack} className="absolute top-6 left-6 z-40 bg-black/80 border border-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/10 hover:border-cyan-400/50 transition-all flex items-center gap-2 font-bold text-sm group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙探索
        </button>

        <div className="absolute top-6 right-6 z-40 text-right">
          <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">YOUR CONSTELLATION</div>
          <div className="text-white font-mono text-4xl font-bold">
            {masteredCount} <span className="text-white/40 text-xl">/ {careers.length} Skills</span>
          </div>
        </div>
      </div>

      {/* 右侧 40%：数据驾驶舱 */}
      <div className="w-[40%] h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-8 overflow-y-auto flex flex-col relative z-10 custom-scrollbar">

        {/* 1. 等级与 XP */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">EXPLORER LEVEL</div>
              <div className="text-white font-bold text-3xl">Lv.{currentLevel}</div>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-xs mb-1">Total XP</div>
              <div className="text-cyan-400 font-mono text-xl font-bold">{stats?.xp || 0}</div>
            </div>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            />
          </div>
        </motion.div>

        {/* 2. AI 预测 + 雷达图 */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-cyan-500/20 transition-all" />
            <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">AI PREDICTION</div>
            <div className="text-xl font-bold text-white">{predictedTitle}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-white/80 font-bold text-sm mb-2">能力模型</div>
            <RadarChart3D skills={safeAbilityScores} />
          </motion.div>
        </div>

        {/* 3. 评级分布 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <div className="text-white/80 font-bold text-sm mb-3">评级分布</div>
          <div className="space-y-2">
            {(['S', 'A', 'B', 'C'] as const).map((rating, i) => {
              const count = ratingCounts[rating] || 0;
              const total = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
              const pct = total ? (count / total) * 100 : 0;
              const colorMap: Record<string, string> = {
                S: 'bg-yellow-400',
                A: 'bg-emerald-400',
                B: 'bg-blue-400',
                C: 'bg-slate-400'
              };
              const textColor: Record<string, string> = {
                S: 'text-yellow-400',
                A: 'text-emerald-400',
                B: 'text-blue-400',
                C: 'text-slate-400'
              };
              return (
                <div key={rating}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-bold ${textColor[rating]}`}>{rating}</span>
                    <span className="text-white/60">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      className={`h-full ${colorMap[rating]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. 成就徽章 */}
        {badges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🏆</span> 成就徽章 · Achievements
            </div>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <motion.div key={b.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`flex items-center gap-2 p-3 rounded-lg border bg-black/40 backdrop-blur-md transition-all cursor-default ${RARITY_STYLE[b.rarity]}`}>
                  <span className="text-2xl">{b.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{b.name}</div>
                    <div className="text-[10px] opacity-60 truncate">{b.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 5. AI 深度复盘 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-auto bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-white/80 font-bold text-sm mb-3 flex items-center gap-2">
            <span>🤖</span> AI 深度复盘
          </div>
          <p className="text-white/70 text-sm leading-relaxed min-h-[60px]">
            <TypewriterText text={aiComment} />
          </p>
        </motion.div>
      </div>
    </div>
  );
}