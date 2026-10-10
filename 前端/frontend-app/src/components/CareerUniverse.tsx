// src/components/CareerUniverse.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html, Sparkles, OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import CareerDetailPanel from './CareerDetailPanel';
import CareerProfile from './CareerProfile';
import LearningDashboard from './LearningDashboard';
import AIMentorChat from './AIMentorChat';
import IntroSequence from './IntroSequence';
import AchievementPanel from './AchievementPanel';
import { type GameStats } from '../utils/badges';
import { CAREERS, GALAXY_NAMES, type AdaptedCareer, processRawCareers } from '../data/careerAdapter';
import { playSound } from '../utils/gameFx';
type Persona = 'student' | 'career-changer' | 'lifelong-learner';
type Rating = 'S' | 'A' | 'B' | 'C';

const CATEGORY_COLORS: string[] = ["#4f46e5", "#06b6d4", "#eab308", "#d946ef", "#22c55e"];
const CATEGORY_NAMES: string[] = GALAXY_NAMES;
const FUTURE_TITLES: string[] = [
  "科技与 AI 领航者", "工程与建造大宗师", "数据与金融掌控者", "科学与生命探索者", "商业与社会塑造者"
];
const GOAL_TITLES: Record<Persona, string> = {
  'student': '科技与 AI 领航者', 'career-changer': '工程与建造大宗师', 'lifelong-learner': '商业与社会塑造者'
};

interface CareerData {
  id: number; name: string; position: THREE.Vector3; color: THREE.Color; category: number;
  complexity: number; match: number; prerequisites: number[]; tier: number; isUnderAttack?: boolean;
  requiredSkills: string[]; preferredKnowledge: string[]; careerPath: string; interestTags: string[];
  nameEn: string; categoryName: string;
}
interface FutureNodeData { id: number; title: string; position: THREE.Vector3; color: THREE.Color; category: number; }
interface BurstData { id: number; position: THREE.Vector3; color: string; }
interface CrisisData { id: number; careerId: number; clicksNeeded: number; timeLeft: number; }

// ==================== 核心逻辑 ====================
function generateCraftingRecipes(rawCareers: CareerData[]): Record<string, number> {
  const recipes: Record<string, number> = {};
  const byCat: Record<number, CareerData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  rawCareers.forEach((c: CareerData) => { if (byCat[c.category]) byCat[c.category].push(c); });
  const sorted = (g: CareerData[]): CareerData[] => [...g].sort((a: CareerData, b: CareerData) => a.tier - b.tier);
  const key = (a: number, b: number): string => `${Math.min(a, b)}-${Math.max(a, b)}`;
  Object.values(byCat).forEach((group: CareerData[]) => {
    if (group.length < 3) return;
    const s = sorted(group); const target = s[s.length - 1];
    if (target.id === s[0].id || target.id === s[1].id) return;
    recipes[key(s[0].id, s[1].id)] = target.id;
  });
  if (byCat[0].length > 2 && byCat[2].length > 0) { const s0 = sorted(byCat[0]), s2 = sorted(byCat[2]); recipes[key(s0[0].id, s2[0].id)] = s0[s0.length - 2].id; }
  if (byCat[3].length > 0 && byCat[4].length > 2) { const s3 = sorted(byCat[3]), s4 = sorted(byCat[4]); recipes[key(s3[0].id, s4[0].id)] = s4[s4.length - 2].id; }
  return recipes;
}

function enrichCareers(rawCareers: AdaptedCareer[]): CareerData[] {
  const byCategory: Record<number, AdaptedCareer[]> = {};
  rawCareers.forEach((c: AdaptedCareer) => { if (!byCategory[c.category]) byCategory[c.category] = []; byCategory[c.category].push(c); });
  return rawCareers.map((c: AdaptedCareer): CareerData => {
    let prerequisites: number[] = [];
    if (c.tier > 0) { const prevTiers = byCategory[c.category].filter((p: AdaptedCareer) => p.tier < c.tier); if (prevTiers.length > 0) prerequisites = [prevTiers[0].id]; }
    return { id: c.id, name: c.name, position: c.position, color: new THREE.Color(CATEGORY_COLORS[c.category] || "#ffffff"), category: c.category, complexity: c.complexity, match: c.match, prerequisites, tier: c.tier, isUnderAttack: false, requiredSkills: c.requiredSkills, preferredKnowledge: c.preferredKnowledge, careerPath: c.careerPath, interestTags: c.interestTags, nameEn: c.nameEn, categoryName: c.categoryName };
  });
}

// ==================== 3D 组件 ====================
function PageOverlay({ show, children, direction = 'right' }: { show: boolean; children: React.ReactNode; direction?: 'right' | 'bottom' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full h-full" initial={direction === 'right' ? { x: '100%' } : { y: '100%' }} animate={{ x: 0, y: 0 }} exit={direction === 'right' ? { x: '100%' } : { y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>{children}</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 🎬 Demo 过场：HUD 数字滚动计数
function useCountUp(target: number, duration = 1400): number {
  const [val, setVal] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// 🎬 电影开场：从深空缓慢 dolly 接近星系
function IntroDolly({ trigger, controlsRef }: { trigger: number; controlsRef: React.MutableRefObject<any> }) {
  const { camera } = useThree();
  useEffect(() => {
    if (trigger === 0 || !controlsRef.current) return;
    const controls = controlsRef.current;
    controls.enabled = false;
    camera.position.set(0, 0, 140);
    const tl = gsap.timeline({ onComplete: () => { controls.enabled = true; controls.update(); } });
    tl.to(camera.position, { x: 0, y: 0, z: 50, duration: 3.2, ease: 'power2.out', onUpdate: () => camera.lookAt(0, 0, 0) }, 0);
    return () => { tl.kill(); controls.enabled = true; };
  }, [trigger, camera, controlsRef]);
  return null;
}

// 🎬 Demo 过场：相机自动导览（拉远俯瞰 → 环绕 → 两站导览 → 归位）
function DemoCameraTour({ trigger, controlsRef }: { trigger: number; controlsRef: React.MutableRefObject<any> }) {
  const { camera } = useThree();
  useEffect(() => {
    if (trigger === 0 || !controlsRef.current) return;
    const controls = controlsRef.current;
    controls.enabled = false;
    const tl = gsap.timeline({ onComplete: () => { controls.enabled = true; controls.update(); } });
    tl.to(camera.position, { x: 0, y: 38, z: 62, duration: 1.2, ease: 'power2.inOut', onUpdate: () => camera.lookAt(0, 0, 0) }, 0);
    const orbit = { a: 0 };
    tl.to(orbit, {
      a: Math.PI * 0.6, duration: 2.2, ease: 'sine.inOut',
      onUpdate: () => {
        const r = camera.position.length();
        camera.position.x = Math.sin(orbit.a) * r * 0.9;
        camera.position.z = Math.cos(orbit.a) * r * 0.9;
        camera.lookAt(0, 0, 0);
      }
    }, 1.2);
    tl.to(camera.position, { x: 22, y: 10, z: 22, duration: 1.1, ease: 'power2.inOut', onUpdate: () => camera.lookAt(0, 0, 0) }, 3.4);
    tl.to(camera.position, { x: 0, y: 0, z: 50, duration: 1.4, ease: 'power3.inOut', onUpdate: () => camera.lookAt(0, 0, 0) }, 4.9);
    return () => { tl.kill(); controls.enabled = true; };
  }, [trigger, camera, controlsRef]);
  return null;
}

function Burst({ data, onDone }: { data: BurstData; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null); const life = useRef(0);
  useFrame((_state, delta) => {
    life.current += delta; const t = life.current / 0.9;
    if (ref.current) { const s = 0.6 + t * 3.2; ref.current.scale.set(s, s, s); (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t); }
    if (t >= 1) onDone(data.id);
  });
  return (<mesh ref={ref} position={data.position}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color={data.color} wireframe transparent opacity={1} toneMapped={false} /></mesh>);
}

function Connections({ careers, userSkills }: { careers: CareerData[]; userSkills: Set<number> }) {
  const { strongGeometries, weakGeometry, masteredGeometry } = useMemo(() => {
    const strongGeometriesArr: number[][] = [[], [], [], [], []]; const weakPoints: number[] = []; const masteredPoints: number[] = [];
    for (let i = 0; i < careers.length; i++) {
      for (let j = i + 1; j < careers.length; j++) {
        const dist = careers[i].position.distanceTo(careers[j].position);
        if (dist > 12) continue;
        const isMastered = userSkills.has(i) && userSkills.has(j);
        if (careers[i].category === careers[j].category && dist < 10) {
          const pts = [careers[i].position.x, careers[i].position.y, careers[i].position.z, careers[j].position.x, careers[j].position.y, careers[j].position.z];
          if (isMastered) masteredPoints.push(...pts); else strongGeometriesArr[careers[i].category].push(...pts);
        } else if (dist < 6) { weakPoints.push(careers[i].position.x, careers[i].position.y, careers[i].position.z, careers[j].position.x, careers[j].position.y, careers[j].position.z); }
      }
    }
    const createGeometry = (points: number[]): THREE.BufferGeometry => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); return g; };
    return { strongGeometries: strongGeometriesArr.map((pts: number[]) => createGeometry(pts)), weakGeometry: createGeometry(weakPoints), masteredGeometry: createGeometry(masteredPoints) };
  }, [careers, userSkills]);
  return (<>
    {/* 亮度回调：连线更清晰 */}
    {strongGeometries.map((geo: THREE.BufferGeometry, idx: number) => (<lineSegments key={idx} geometry={geo}><lineBasicMaterial color={CATEGORY_COLORS[idx]} transparent opacity={0.45} /></lineSegments>))}
    <lineSegments geometry={weakGeometry}><lineBasicMaterial color="#ffffff" transparent opacity={0.08} /></lineSegments>
    <lineSegments geometry={masteredGeometry}><lineBasicMaterial color="#ffd700" transparent opacity={1.0} toneMapped={false} /></lineSegments>
  </>);
}

function DestinyPaths({ careers, userSkills, futureNodes, unlockedPaths }: { careers: CareerData[]; userSkills: Set<number>; futureNodes: FutureNodeData[]; unlockedPaths: Set<number> }) {
  const allLines = useMemo((): THREE.Vector3[][] => {
    const lines: THREE.Vector3[][] = [];
    unlockedPaths.forEach((categoryId: number) => {
      const futureNode = futureNodes.find((f: FutureNodeData) => f.category === categoryId); if (!futureNode) return;
      careers.filter((c: CareerData) => c.category === categoryId && userSkills.has(c.id)).forEach((career: CareerData) => lines.push([career.position, futureNode.position]));
    });
    return lines;
  }, [careers, userSkills, futureNodes, unlockedPaths]);
  return (<>{allLines.map((points: THREE.Vector3[], idx: number) => (<Line key={idx} points={points} color="#06b6d4" lineWidth={1.5} transparent opacity={0.6} />))}</>);
}

function FutureNode({ data, isUnlocked }: { data: FutureNodeData; isUnlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null); const glowRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current && glowRef.current) {
      const ts = isUnlocked ? 1 : 0;
      meshRef.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05); glowRef.current.scale.lerp(new THREE.Vector3(ts * 3, ts * 3, ts * 3), 0.05);
      if (isUnlocked) { meshRef.current.rotation.y += delta * 0.2; glowRef.current.rotation.y -= delta * 0.1; }
    }
  });
  return (<group position={data.position}>
    <mesh ref={meshRef}><sphereGeometry args={[2, 32, 32]} /><meshStandardMaterial color="#ffffff" emissive={data.color} emissiveIntensity={5} toneMapped={false} /></mesh>
    <mesh ref={glowRef}><sphereGeometry args={[2, 32, 32]} /><meshBasicMaterial color={data.color} transparent opacity={0.25} side={THREE.BackSide} toneMapped={false} /></mesh>
    {isUnlocked && (<Html zIndexRange={[10, 0]} position={[0, 3.5, 0]} center distanceFactor={20} className="pointer-events-none"><div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.5)] whitespace-nowrap">终极目标：{data.title}</div></Html>)}
  </group>);
}

function ProceduralPlanet({ data, isActive, onClick, onHover, isMastered, isLocked, isSelected, isUnderAttack, prereqNames, isStartNode, rating, crisisClicksLeft }: any) {
  const groupRef = useRef<THREE.Group>(null); const [hovered, setHovered] = useState(false);
  const dynamicComplexity: number = isMastered ? Math.min(1, data.complexity + 0.4) : data.complexity;
  const rings = useMemo((): number[] => Array.from({ length: Math.min(2, Math.floor(dynamicComplexity * 4)) }, (_v, i) => i), [dynamicComplexity]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const ts = isLocked ? 0.8 : (isActive ? 2.0 : (hovered || isSelected ? 1.5 : (isMastered ? 1.3 : 1)));
    groupRef.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.1);
    if (!isLocked) groupRef.current.rotation.y += delta * 0.15 * dynamicComplexity;
    if (isUnderAttack && crisisClicksLeft > 0) {
      groupRef.current.position.set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15);
    } else if (groupRef.current.position.lengthSq() > 0.0001) {
      groupRef.current.position.set(0, 0, 0);
    }
  });

  const isStartGlow = isStartNode && !isMastered;
  const displayColor = isLocked ? "#444444" : (isUnderAttack ? (crisisClicksLeft > 0 ? "#ff2222" : "#666666") : (isStartGlow || isMastered ? "#ffffff" : data.color));
  const displayEmissive = isLocked ? "#222222" : (isUnderAttack ? (crisisClicksLeft > 0 ? "#ff0000" : "#444444") : (isStartGlow ? "#ffffff" : (isMastered ? "#ffd700" : data.color)));

  return (
    <group position={data.position}>
      <group ref={groupRef}>
        <mesh onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data.id); }} onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHover(null); }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <icosahedronGeometry args={[0.6, Math.min(2, Math.floor(dynamicComplexity * 4))]} />
          {/* 亮度回调：降金属度(无环境贴图时金属发黑)、升漫反射、提自发光基础值 */}
          <meshPhysicalMaterial
            color={displayColor}
            metalness={0.35}
            roughness={0.35}
            emissive={displayEmissive}
            emissiveIntensity={isActive ? 3.5 : (isStartGlow ? 2.6 : (isMastered ? 3.0 : (isLocked ? 0.4 : (hovered || isSelected ? 2.2 : 1.15))))}            wireframe={dynamicComplexity < 0.5}
            toneMapped={false}
          />
        </mesh>
        {isLocked && hovered && prereqNames?.length > 0 && (<Html zIndexRange={[10, 0]} position={[0, 2.5, 0]} center distanceFactor={8} className="pointer-events-none"><div className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg border border-red-400/50 whitespace-nowrap">🔒 需要前置：{prereqNames.join(', ')}</div></Html>)}
        {isUnderAttack && crisisClicksLeft > 0 && (<Html zIndexRange={[20, 0]} position={[0, 2.5, 0]} center distanceFactor={8} className="pointer-events-none"><div className="bg-red-900/90 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(255,0,0,0.8)] border border-red-500 whitespace-nowrap animate-pulse">⚠️ 危机! 点击修复 ({crisisClicksLeft})</div></Html>)}
        {isUnderAttack && crisisClicksLeft === 0 && (<Html zIndexRange={[10, 0]} position={[0, 2.5, 0]} center distanceFactor={8} className="pointer-events-none"><div className="bg-gray-800/90 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold border border-gray-600 whitespace-nowrap">💀 已宕机</div></Html>)}
        {isSelected && <Html zIndexRange={[10, 0]} position={[0, -2, 0]} center distanceFactor={10} className="pointer-events-none"><div className="bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">已选中 (点击另一个合成)</div></Html>}
        {isStartGlow && (<Html zIndexRange={[10, 0]} position={[0, 2.5, 0]} center distanceFactor={10} className="pointer-events-none"><div className="bg-white/10 border border-white/50 text-white px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.5)] whitespace-nowrap animate-pulse">✨ START HERE</div></Html>)}
        {rating && (<Html zIndexRange={[10, 0]} position={[0.9, 0.9, 0]} center distanceFactor={10} className="pointer-events-none"><div className="text-yellow-300 font-black text-base drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]">{rating}</div></Html>)}
        {!isLocked && rings.map((_r: number, idx: number) => (<mesh key={idx} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}><torusGeometry args={[1.0 + idx * 0.3, 0.03, 8, 32]} /><meshBasicMaterial color={isMastered ? "#ffd700" : data.color} transparent opacity={0.9} toneMapped={false} /></mesh>))}
        {!isLocked && (isMastered || isActive) && <Sparkles count={isMastered ? 15 : 8} scale={isMastered ? 2.5 : 1.5} size={isMastered ? 2 : 1} speed={0.5} color={isMastered ? "#ffd700" : data.color} />}
      </group>
    </group>
  );
}

function CameraController({ targetPosition, isActive, controlsRef, onAnimStart, onAnimEnd, trigger }: { targetPosition: THREE.Vector3 | null; isActive: boolean; controlsRef: React.MutableRefObject<any>; onAnimStart: () => void; onAnimEnd: () => void; trigger: number; }) {
  const { camera } = useThree(); const animatedTarget = useRef(new THREE.Vector3(0, 0, 0));
  useEffect(() => {
    if (!controlsRef.current) return; const controls = controlsRef.current; onAnimStart();
    gsap.killTweensOf(camera.position); gsap.killTweensOf(animatedTarget.current);
    const originalDamping = controls.enableDamping; controls.enableDamping = false; controls.enabled = false;
    const finishAnimation = () => { controls.target.copy(animatedTarget.current); camera.lookAt(controls.target); camera.updateMatrixWorld(); controls.update(); controls.enableDamping = originalDamping; controls.enabled = true; onAnimEnd(); };
    if (isActive && targetPosition) {
      const direction = targetPosition.clone().normalize(); const camTargetPos = targetPosition.clone().add(direction.multiplyScalar(6));
      const tl = gsap.timeline({ onComplete: finishAnimation });
      tl.to(camera.position, { x: camTargetPos.x, y: camTargetPos.y, z: camTargetPos.z, duration: 1.8, ease: "power4.inOut", onUpdate: () => camera.lookAt(animatedTarget.current) }, 0);
      tl.to(animatedTarget.current, { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, duration: 1.8, ease: "power4.inOut", onUpdate: () => camera.lookAt(animatedTarget.current) }, 0);
      tl.to(camera, { fov: 45, duration: 0.9, ease: "power2.in", onUpdate: () => camera.updateProjectionMatrix() }, 0);
      tl.to(camera, { fov: 60, duration: 0.9, ease: "power2.out", onUpdate: () => camera.updateProjectionMatrix() }, 0.9);
    } else {
      const tl = gsap.timeline({ onComplete: finishAnimation });
      tl.to(camera.position, { x: 0, y: 0, z: 50, duration: 1.8, ease: "power4.inOut", onUpdate: () => camera.lookAt(animatedTarget.current) }, 0);
      tl.to(animatedTarget.current, { x: 0, y: 0, z: 0, duration: 1.8, ease: "power4.inOut", onUpdate: () => camera.lookAt(animatedTarget.current) }, 0);
      tl.to(camera, { fov: 70, duration: 0.9, ease: "power2.in", onUpdate: () => camera.updateProjectionMatrix() }, 0);
      tl.to(camera, { fov: 60, duration: 0.9, ease: "power2.out", onUpdate: () => camera.updateProjectionMatrix() }, 0.9);
    }
    return () => { controls.enableDamping = originalDamping; };
  }, [trigger, isActive, targetPosition, camera]);
  return null;
}

// ==================== UI 面板 ====================
function CraftingCodex({ careers, recipes, isOpen, onClose, onLocate, userSkills }: { careers: CareerData[]; recipes: Record<string, number>; isOpen: boolean; onClose: () => void; onLocate: (idA: number, idB: number) => void; userSkills: Set<number>; }) {
  if (!isOpen) return null;
  const groupedRecipes: Record<number | 'cross', any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], cross: [] };
  Object.entries(recipes).forEach(([key, resultId]: [string, number]) => {
    const [idA, idB] = key.split('-').map(Number); if (!careers[idA] || !careers[idB] || !careers[resultId]) return;
    const catA = careers[idA].category; const catB = careers[idB].category; const entry = { key, a: careers[idA], b: careers[idB], result: careers[resultId] };
    if (catA === catB) groupedRecipes[catA].push(entry); else groupedRecipes.cross.push(entry);
  });
  const renderRecipeRow = (r: any, idx: number, isCross: boolean) => {
    const hasA = userSkills.has(r.a.id); const hasB = userSkills.has(r.b.id); const hasResult = userSkills.has(r.result.id);
    let statusClass = "bg-white/5 border-white/10", statusText = "", statusColor = "text-white/40";
    if (hasResult) { statusClass = "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"; statusText = "✅ 已解锁"; }
    else if (hasA && hasB) { statusClass = "bg-green-500/10 border-green-500/50 hover:bg-green-500/20"; statusText = "✨ 可合成"; statusColor = "text-green-400"; }
    else if (hasA || hasB) { statusClass = "bg-yellow-500/5 border-yellow-500/30 opacity-70"; statusText = `⏳ 缺${hasA ? r.b.name : r.a.name}`; statusColor = "text-yellow-400"; }
    else { statusClass = "bg-white/5 border-white/5 opacity-30"; statusText = "🔒 未解锁"; }
    return (<div key={idx} onClick={() => !hasResult && onLocate(r.a.id, r.b.id)} className={`border rounded-lg p-2 flex items-center justify-between text-xs transition-all ${statusClass} ${!hasResult ? 'cursor-pointer group' : ''}`}>
      <div className="flex items-center gap-1 flex-1 min-w-0"><span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.a.name}</span><span className={`${isCross ? 'text-purple-400' : 'text-cyan-400'} font-bold`}>+</span><span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.b.name}</span></div>
      <div className="flex flex-col items-end ml-1 flex-shrink-0"><span className={`text-[10px] ${statusColor} mb-0.5`}>{statusText}</span><div className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap"><span className="text-white/40">→</span> {r.result.name}</div></div>
    </div>);
  };
  return (<motion.div initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute top-24 left-6 z-40 w-80 bg-black/90 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-xl shadow-2xl max-h-[80vh] flex flex-col">
    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0"><h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2"><span className="text-2xl">🧪</span> 合成图鉴</h3><button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-xl">✕</button></div>
    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
      {Object.values(groupedRecipes).every((arr: any[]) => arr.length === 0) ? (<div className="text-center text-white/40 py-10 text-sm">暂无可用配方。<br />请先点亮更多真实职业星球！</div>) : (<>
        {[0, 1, 2, 3, 4].map((catId: number) => (groupedRecipes[catId].length > 0 && (<div key={catId} className="space-y-2"><div className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[catId] }}></span>{CATEGORY_NAMES[catId]}</div>{groupedRecipes[catId].map((r: any, idx: number) => renderRecipeRow(r, idx, false))}</div>)))}
        {groupedRecipes.cross.length > 0 && (<div className="space-y-2 pt-2 border-t border-white/10"><div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2"><span className="text-lg">✨</span> 隐藏跨领域配方</div>{groupedRecipes.cross.map((r: any, idx: number) => renderRecipeRow(r, idx, true))}</div>)}
      </>)}
    </div>
    <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/40 text-center flex-shrink-0">点击配方自动定位星球</div>
  </motion.div>);
}

function CareerAtlas({ careers, userSkills, onClose, onPick }: { careers: CareerData[]; userSkills: Set<number>; onClose: () => void; onPick: (id: number) => void; }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<number>(-1);
  const list = useMemo((): CareerData[] => { const q = query.trim().toLowerCase(); return careers.filter((c: CareerData) => { const okQ = !q || c.name.toLowerCase().includes(q) || (c.nameEn || '').toLowerCase().includes(q); const okF = filter === -1 || c.category === filter; return okQ && okF; }); }, [careers, query, filter]);
  const counts = useMemo((): number[] => { const arr = [0, 0, 0, 0, 0]; careers.forEach((c: CareerData) => { arr[c.category]++; }); return arr; }, [careers]);
  return (<motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute top-24 right-6 z-40 w-96 bg-black/90 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-xl shadow-2xl max-h-[80vh] flex flex-col">
    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0"><h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2"><span className="text-2xl">🗺️</span> 职业星图</h3><button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-xl">✕</button></div>
    <div className="text-xs text-white/50 mb-3 flex-shrink-0">收录 <span className="text-cyan-300 font-bold">{careers.length}</span> 个真实职业 · 已掌握 <span className="text-yellow-300 font-bold">{userSkills.size}</span> 个</div>
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索职业，如：医生 / 建筑师 / 精算师…" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50 mb-3 flex-shrink-0 placeholder:text-white/30" />
    <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0"><button onClick={() => setFilter(-1)} className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filter === -1 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-white/10 text-white/50 hover:border-white/30'}`}>全部</button>{CATEGORY_NAMES.map((n: string, i: number) => (<button key={i} onClick={() => setFilter(i)} className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filter === i ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-white/10 text-white/50 hover:border-white/30'}`}>{n} {counts[i]}</button>))}</div>
    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">{list.length === 0 && <div className="text-center text-white/40 py-8 text-sm">没有匹配的职业</div>}{list.map((c: CareerData) => (<button key={c.id} onClick={() => onPick(c.id)} className="w-full text-left border border-white/10 rounded-lg p-2.5 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-white truncate flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c.category] }}></span>{c.name} {userSkills.has(c.id) && <span className="text-yellow-400 text-xs">★</span>}</span><span className="text-[10px] text-cyan-300 flex-shrink-0">匹配 {c.match}%</span></div><div className="text-[10px] text-white/50 mt-1 truncate">{c.nameEn} · {c.careerPath}</div></button>))}</div>
  </motion.div>);
}

function InterestEditor({ allInterests, currentInterests, onSave, onClose }: { allInterests: string[]; currentInterests: Set<string>; onSave: (s: Set<string>) => void; onClose: () => void; }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentInterests));
  return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-2xl bg-[#1a1d21] border border-cyan-500/30 rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-white">🎯 调整你的兴趣领域</h3><button onClick={onClose} className="text-white/50 hover:text-white text-2xl">✕</button></div>
    <p className="text-white/60 text-sm mb-6">重新选择标签，所有星球的匹配度将立刻重新计算。</p>
    <div className="flex flex-wrap gap-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">{allInterests.slice(0, 25).map((tag: string) => (<button key={tag} onClick={() => { const next = new Set(selected); if (next.has(tag)) next.delete(tag); else if (next.size < 5) next.add(tag); setSelected(next); }} className={`px-4 py-2 rounded-full text-sm border transition-all ${selected.has(tag) ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>{tag}</button>))}</div>
    <button onClick={() => onSave(selected)} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:scale-[1.02] transition-all">确认并重新计算宇宙 ({selected.size}/5)</button>
  </motion.div></motion.div>);
}

interface PersonaCard { id: Persona; icon: string; title: string; desc: string; goal: string; color: string; }

// ==================== 主组件 ====================
export default function CareerUniverse() {
  const [activeId, setActiveId] = useState<number | null>(null); const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerData | null>(null); const controlsRef = useRef<any>(null); const [isCameraMoving, setIsCameraMoving] = useState(false);
  const [showAtlas, setShowAtlas] = useState(false); const [showCodex, setShowCodex] = useState(false);
  const [showProfile, setShowProfile] = useState(false); const [showLearningHub, setShowLearningHub] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false); const [showAchievements, setShowAchievements] = useState(false);
  const [showInterestEditor, setShowInterestEditor] = useState(false); const [showIntro, setShowIntro] = useState(true);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false); const [userPersona, setUserPersona] = useState<Persona | null>(null);
  const [userSkills, setUserSkills] = useState<Set<number>>(new Set()); const [unlockedPaths, setUnlockedPaths] = useState<Set<number>>(new Set());
  const [careersWithAttack, setCareersWithAttack] = useState<Set<number>>(new Set()); const [selectedForCraft, setSelectedForCraft] = useState<number | null>(null);
  const [abilityScores, setAbilityScores] = useState({ technical: 0, logic: 0, communication: 0, stress: 0, innovation: 0, leadership: 0 });
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; visible: boolean; type: 'error' | 'success' | 'warning' }>({ msg: "", visible: false, type: 'warning' });
  const [cameraTrigger, setCameraTrigger] = useState(0);
  const [stats, setStats] = useState<GameStats>({ craftCount: 0, crisisFixed: 0, simSuccess: 0, simFail: 0, combo: 0, maxCombo: 0, xp: 0, ratings: {} });
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const [careers, setCareers] = useState<CareerData[]>(() => enrichCareers(CAREERS));
  const [activeCrisis, setActiveCrisis] = useState<CrisisData | null>(null);
  const [downedCareers, setDownedCareers] = useState<Set<number>>(new Set());
  const [demoFlash, setDemoFlash] = useState(0);
  const [demoBanner, setDemoBanner] = useState(false);
  const [demoTour, setDemoTour] = useState(0);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [introDolly, setIntroDolly] = useState(0);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/careers').then((res: Response) => { if (!res.ok) throw new Error(); return res.json(); }).then((rawData: any) => { setCareers(enrichCareers(processRawCareers(rawData))); console.log('%c✅ Engine 连接成功', 'color: #22c55e;'); }).catch(() => { console.log('%cℹ️ Engine 离线，使用本地数据', 'color: #94a3b8;'); });
  }, []);

  const CRAFTING_RECIPES = useMemo((): Record<string, number> => generateCraftingRecipes(careers), [careers]);
  const allInterests = useMemo((): string[] => { const s = new Set<string>(); CAREERS.forEach((c: AdaptedCareer) => (c.interestTags || []).forEach((t: string) => s.add(t))); return Array.from(s); }, []);
  const displayCareers = useMemo((): CareerData[] => { if (userInterests.size === 0) return careers; return careers.map((c: CareerData): CareerData => { const overlap = (c.interestTags || []).filter((t: string) => userInterests.has(t)).length; const bonus = overlap > 0 ? overlap * 15 : -10; return { ...c, match: Math.min(99, Math.max(10, 60 + bonus)) }; }); }, [careers, userInterests]);
  const futureNodes = useMemo((): FutureNodeData[] => { return CATEGORY_COLORS.map((color: string, idx: number) => { const first = careers.find((c: CareerData) => c.category === idx); if (!first) return null; return { id: idx, title: FUTURE_TITLES[idx], position: first.position.clone().normalize().multiplyScalar(35), color: new THREE.Color(color), category: idx }; }).filter(Boolean) as FutureNodeData[]; }, [careers]);

  const showToast = (msg: string, type: 'error' | 'success' | 'warning' = 'warning') => { setToast({ msg, visible: true, type }); setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000); };
  const forceFlyTo = (id: number) => { setActiveId(id); setCameraTrigger((p) => p + 1); };
  const spawnBurst = (position: THREE.Vector3, color: string) => { const id = Date.now() + Math.random(); setBursts((prev) => [...prev, { id, position: position.clone(), color }]); };

    const activateDemoMode = () => {
    const pick = (cat: number, n: number): number[] => careers.filter((x: CareerData) => x.category === cat).sort((a: CareerData, b: CareerData) => a.tier - b.tier).slice(0, n).map((x: CareerData) => x.id);
    const demoSkills = [...pick(0, 5), ...pick(2, 5)];
    playSound('demo');
    setDemoFlash(f => f + 1);
    setDemoBanner(true);
    setTimeout(() => setDemoBanner(false), 2600);
    setUserSkills(new Set(demoSkills));
    setUnlockedPaths(new Set([0, 2]));
    setAbilityScores({ technical: 68, logic: 74, communication: 52, stress: 45, innovation: 61, leadership: 38 });
    setCareersWithAttack(new Set());
    setStats((prev) => ({ ...prev, simSuccess: Math.max(prev.simSuccess, 8), craftCount: Math.max(prev.craftCount, 2), xp: Math.max(prev.xp, 640), maxCombo: Math.max(prev.maxCombo, 3), ratings: { ...prev.ratings, [demoSkills[0]]: 'S', [demoSkills[1]]: 'A', [demoSkills[2]]: 'S', [demoSkills[5]]: 'A' } }));
    // 连锁点亮：每 110ms 炸一颗金色冲击波
    demoSkills.forEach((id, i) => {
      setTimeout(() => {
        const c = careers.find((x: CareerData) => x.id === id);
        if (c) { spawnBurst(c.position, '#ffd700'); playSound('click'); }
      }, 250 + i * 110);
    });
    setTimeout(() => setDemoTour(t => t + 1), 350);
    showToast("✨ 演示状态已载入 · 自动导览中", 'success');
  };

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.shiftKey && e.key.toLowerCase() === 'd') activateDemoMode(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [careers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'm') setMutedState(p => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setMuted(muted); }, [muted]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('demo') === '1') activateDemoMode(); }, [careers]);

  const getGoalTitle = (): string => (userPersona ? GOAL_TITLES[userPersona] : '未知');
  const getProgressNarrative = (): string => { const p = Math.floor((userSkills.size / careers.length) * 100); if (userSkills.size === 0) return '旅程尚未开始'; if (p < 10) return `已踏上 ${getGoalTitle()} 之路 (${p}%)`; if (p < 30) return `${getGoalTitle()} 之路进展顺利 (${p}%)`; if (p < 60) return `已成为 ${getGoalTitle()} 的有力竞争者 (${p}%)`; return `距离 ${getGoalTitle()} 仅一步之遥 (${p}%)`; };

  const nextSteps = useMemo(() => {
    const steps: { id: string; title: string; desc: string; targetId?: number; type: 'craft' | 'unlock' | 'path' }[] = [];
    const readyCrafts = Object.entries(CRAFTING_RECIPES).filter(([key, resId]) => { const [a, b] = key.split('-').map(Number); return userSkills.has(a) && userSkills.has(b) && !userSkills.has(resId); });
    if (readyCrafts.length > 0) { const [key, resId] = readyCrafts[0]; const [a, b] = key.split('-').map(Number); steps.push({ id: 'craft', type: 'craft', title: `✨ 立即合成：${careers[resId]?.name}`, desc: `材料已就绪（${careers[a]?.name} + ${careers[b]?.name}）`, targetId: resId }); }
    const categoryCount = [0, 0, 0, 0, 0];
    userSkills.forEach(id => { const c = careers.find(x => x.id === id); if (c) categoryCount[c.category]++; });
    const almostDoneCat = categoryCount.findIndex(cnt => cnt === 4);
    if (almostDoneCat !== -1 && !unlockedPaths.has(almostDoneCat)) { const nextCareer = careers.find(c => c.category === almostDoneCat && !userSkills.has(c.id) && c.tier === 0); steps.push({ id: 'path', type: 'path', title: `🛤️ 解锁命运轨迹：${CATEGORY_NAMES[almostDoneCat]}`, desc: `再点亮 1 个该星系技能即可 (推荐: ${nextCareer?.name || '任意基础职业'})`, targetId: nextCareer?.id }); }
    if (steps.length < 2 && userInterests.size > 0) { const interestRec = careers.find(c => !userSkills.has(c.id) && (c.interestTags || []).some(t => userInterests.has(t)) && c.tier === 0); if (interestRec) { steps.push({ id: 'interest', type: 'unlock', title: `🎯 探索兴趣领域：${interestRec.name}`, desc: `与你选择的兴趣标签高度匹配`, targetId: interestRec.id }); } }
    if (steps.length < 2) { const topCat = categoryCount.indexOf(Math.max(...categoryCount)); const rec = careers.find(c => c.category === topCat && !userSkills.has(c.id) && c.tier === 0); if (rec && !steps.find(s => s.targetId === rec.id)) { steps.push({ id: 'normal', type: 'unlock', title: `🚀 进阶挑战：${rec.name}`, desc: `继续深耕 ${CATEGORY_NAMES[topCat]} 星系`, targetId: rec.id }); } }
    return steps.slice(0, 2);
  }, [userSkills, careers, CRAFTING_RECIPES, unlockedPaths, userInterests]);

  useEffect(() => {
    if (!activeCrisis) return;
    const timer = setInterval(() => {
      setActiveCrisis(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          playSound('fail'); setStats(p => ({ ...p, combo: 0, xp: Math.max(0, p.xp - 20) }));
          setDownedCareers(p => new Set(p).add(prev.careerId));
          showToast("⚠️ 危机处理失败！星球宕机，连击清零。", 'error');
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCrisis]);

  useEffect(() => {
    if (downedCareers.size === 0) return;
    const timer = setTimeout(() => { setDownedCareers(new Set()); showToast("✅ 宕机星球已恢复运行。", 'success'); }, 10000);
    return () => clearTimeout(timer);
  }, [downedCareers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const uiBusy = showMentorChat || showLearningHub || showProfile || showAchievements || showCodex || showAtlas || showInterestEditor || showPersonaSelector || showIntro || selectedCareer !== null;
      if (userSkills.size > 0 && !activeCrisis && !uiBusy) {
        const ids = Array.from(userSkills).filter(id => !downedCareers.has(id));
        if (ids.length === 0) return;
        const targetId = ids[Math.floor(Math.random() * ids.length)];
        setCareersWithAttack(p => new Set(p).add(targetId));
setActiveCrisis({ id: Date.now(), careerId: targetId, clicksNeeded: 3, timeLeft: 30 });        showToast("⚠️ 行业危机来袭！快速点击红色星球修复！", 'error');
        playSound('fail');
      }
    }, 25000);
    return () => clearInterval(interval);
    }, [userSkills, careers, activeCrisis, downedCareers, showMentorChat, showLearningHub, showProfile, showAchievements, showCodex, showAtlas, showInterestEditor, showPersonaSelector, showIntro, selectedCareer]);

  const handleLocateRecipe = (idA: number, idB: number) => {
    setShowCodex(false);
    if (userSkills.has(idA) && userSkills.has(idB)) {
      const res = CRAFTING_RECIPES[`${Math.min(idA, idB)}-${Math.max(idA, idB)}`];
      if (res && !userSkills.has(res)) { setUserSkills((p) => new Set(p).add(res)); playSound('craft'); spawnBurst(careers[res].position, '#22d3ee'); setStats((p) => ({ ...p, craftCount: p.craftCount + 1, xp: p.xp + 50 })); showToast(`🎉 自动合成成功！解锁：${careers[res].name}`, 'success'); forceFlyTo(res); }
      else { showToast("⚠️ 该技能已解锁或配方无效。", 'warning'); forceFlyTo(idA); }
      return;
    }
    let targetId = idA, message = "";
    if (userSkills.has(idA) && !userSkills.has(idB)) { targetId = idB; message = `原料 ${careers[idA].name} 已就绪！请飞向 ${careers[idB].name} 完成模拟解锁它！`; }
    else if (!userSkills.has(idA) && userSkills.has(idB)) { targetId = idA; message = `原料 ${careers[idB].name} 已就绪！请飞向 ${careers[idA].name} 完成模拟解锁它！`; }
    else { message = `需要先点亮 ${careers[idA].name} 和 ${careers[idB].name}。请先完成 ${careers[idA].name} 的模拟！`; }
    setSelectedForCraft(null); forceFlyTo(targetId); showToast(`🧭 ${message}`, 'warning');
  };

  const handlePlanetClick = (career: CareerData) => {
    if (activeCrisis && activeCrisis.careerId === career.id) {
      const newClicks = activeCrisis.clicksNeeded - 1;
      if (newClicks <= 0) {
        playSound('success'); spawnBurst(career.position, '#00ff00');
        setStats(p => ({ ...p, crisisFixed: p.crisisFixed + 1, xp: p.xp + 50, combo: p.combo + 1 }));
        showToast("✅ 危机解除！系统恢复稳定。", 'success');
        setActiveCrisis(null); setCareersWithAttack(p => { const n = new Set(p); n.delete(career.id); return n; });
      } else { playSound('click'); setActiveCrisis({ ...activeCrisis, clicksNeeded: newClicks }); }
      return;
    }
    if (downedCareers.has(career.id)) { showToast("💀 该星球已宕机，等待恢复...", 'warning'); return; }
    const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every((p: number) => userSkills.has(p));
    if (isLocked) { forceFlyTo(career.id); showToast(`🔒 前置技能未满足！需要先点亮：${career.prerequisites.map((id: number) => careers[id]?.name).join(", ")}`, 'error'); return; }
    if (selectedForCraft !== null && selectedForCraft !== career.id) {
      const res = CRAFTING_RECIPES[`${Math.min(selectedForCraft, career.id)}-${Math.max(selectedForCraft, career.id)}`];
      if (res !== undefined) { if (!userSkills.has(res)) { setUserSkills((p) => new Set(p).add(res)); playSound('craft'); spawnBurst(careers[res].position, '#22d3ee'); setStats((p) => ({ ...p, craftCount: p.craftCount + 1, xp: p.xp + 50 })); showToast(`🎉 合成成功！解锁：${careers[res].name}`, 'success'); forceFlyTo(res); } else showToast("⚠️ 该技能已解锁。", 'warning'); }
      else showToast("❌ 合成失败！配方不正确。", 'error');
      setSelectedForCraft(null);
    } else if (userSkills.has(career.id)) {
      if (selectedForCraft === career.id) { setSelectedForCraft(null); showToast("已取消合成选中。", 'warning'); }
      else { setSelectedForCraft(career.id); forceFlyTo(career.id); playSound('click'); showToast("🔧 已选中。点击另一个已点亮技能进行合成。", 'warning'); }
    } else { forceFlyTo(career.id); playSound('click'); setSelectedCareer(career); }
  };

  const handleSimulationComplete = (careerId: number, success: boolean, abilityChanges?: any, rating?: Rating) => {
    if (success) {
      playSound('success'); const career = careers.find((c: CareerData) => c.id === careerId); if (career) spawnBurst(career.position, '#ffd700');
      const xpGain = (rating === 'S' ? 100 : rating === 'A' ? 70 : rating === 'B' ? 40 : 20);
      setStats((prev) => { const combo = prev.combo + 1; return { ...prev, simSuccess: prev.simSuccess + 1, combo, maxCombo: Math.max(prev.maxCombo, combo), xp: prev.xp + xpGain + (combo > 1 ? combo * 5 : 0), ratings: rating ? { ...prev.ratings, [careerId]: rating } : prev.ratings }; });
      setUserSkills((prev) => { const n = new Set(prev); n.add(careerId); const c = careers.find((x: CareerData) => x.id === careerId); if (c && Array.from(n).filter((id: number) => careers[id]?.category === c.category).length >= 5) { setUnlockedPaths((p) => { const np = new Set(p); np.add(c.category); return np; }); } return n; });
      const ch = abilityChanges || { technical: 15, logic: 12, communication: 8, stress: 8, innovation: 10, leadership: 5 };
      setAbilityScores((p) => ({ technical: p.technical + (ch.technical || 0), logic: p.logic + (ch.logic || 0), communication: p.communication + (ch.communication || 0), stress: p.stress + (ch.stress || 0), innovation: p.innovation + (ch.innovation || 0), leadership: p.leadership + (ch.leadership || 0) }));
      if (rating === 'S') showToast("🏆 完美评级 S！零愤怒通关！", 'success');
    } else { playSound('fail'); setStats((prev) => ({ ...prev, simFail: prev.simFail + 1, combo: 0 })); showToast("⚠️ 模拟失败！总监对你的表现很不满意。", 'error'); }
    setSelectedCareer(null); setActiveId(null);
  };

  const hudXp = useCountUp(stats.xp, 1400);
  const hudSkills = useCountUp(userSkills.size, 1400);
  const labelCareer = displayCareers.find((c: CareerData) => c.id === (activeId !== null ? activeId : hoveredId));
  const toastColor = toast.type === 'error' ? 'bg-red-500/90 border-red-400/50' : (toast.type === 'success' ? 'bg-green-500/90 border-green-400/50' : 'bg-yellow-500/90 border-yellow-400/50');
  const personaCards: PersonaCard[] = [{ id: 'student', icon: '🎓', title: '迷茫的大学生', desc: '想探索职业方向，找到适合自己的路', goal: '科技与 AI 领航者', color: 'from-blue-500 to-cyan-500' }, { id: 'career-changer', icon: '💼', title: '想转行的职场人', desc: '有明确目标，但需要补齐技能差距', goal: '工程与建造大宗师', color: 'from-purple-500 to-pink-500' }, { id: 'lifelong-learner', icon: '📚', title: '终身学习者', desc: '想持续成长，不断拓展能力边界', goal: '商业与社会塑造者', color: 'from-orange-500 to-red-500' }];

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {showIntro && <IntroSequence onComplete={() => { setShowIntro(false); setShowPersonaSelector(true); }} />}
      {showPersonaSelector && (<div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-y-auto py-10"><div className="text-center max-w-5xl mx-auto px-8">
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">你是谁？</h2><p className="text-white/60 text-lg mb-8">选择身份与兴趣，宇宙将为你重新计算星球匹配度</p>
        <div className="grid grid-cols-3 gap-6 mb-10">{personaCards.map((p: PersonaCard) => (<button key={p.id} onClick={() => { setUserPersona(p.id); setShowPersonaSelector(false); setCinemaMode(true); setIntroDolly(d => d + 1); setTimeout(() => { setCinemaMode(false); forceFlyTo(0); }, 3400); }} className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-105 text-left"><div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div><div className="relative z-10"><div className="text-5xl mb-4">{p.icon}</div><h3 className="text-xl font-bold text-white mb-2">{p.title}</h3><p className="text-white/60 text-sm">{p.desc}</p><div className="mt-4 pt-4 border-t border-white/10"><div className="text-xs text-white/40 uppercase tracking-wider mb-1">目标职业</div><div className="text-cyan-400 font-bold text-lg">{p.goal}</div></div></div></button>))}</div>
        <div className="border-t border-white/10 pt-8"><h3 className="text-xl font-bold text-white mb-2">🎯 你的兴趣领域</h3><p className="text-white/40 text-sm mb-4">选择 1~5 个标签，直接影响星球的匹配度百分比</p><div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">{allInterests.slice(0, 20).map((tag: string) => (<button key={tag} onClick={() => { const next = new Set(userInterests); if (next.has(tag)) next.delete(tag); else if (next.size < 5) next.add(tag); setUserInterests(next); }} className={`px-4 py-1.5 rounded-full text-sm border transition-all ${userInterests.has(tag) ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>{tag}</button>))}</div></div>
      </div></div>)}

      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}><div className={`${toastColor} text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-md border font-bold text-sm flex items-center gap-2`}>{toast.msg}</div></div>

      {!selectedCareer && (<div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button onClick={() => setShowInterestEditor(true)} className="bg-black/80 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-purple-500/20 transition-all flex items-center gap-2 font-bold text-sm"><span>🎯</span> 兴趣</button>
        <button onClick={() => setShowMentorChat(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">💬 AI 导师</button>
        <button onClick={() => setShowLearningHub(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">🚀 学习中心</button>
        <button onClick={() => setShowProfile(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">✨ 档案</button>
        <button onClick={() => setShowAchievements(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">🏆 成就</button>
        <button onClick={() => setShowAtlas(!showAtlas)} className="bg-black/80 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-bold text-sm"><span>🗺️</span> 星图</button>
        <button onClick={() => setShowCodex(!showCodex)} className="bg-black/80 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-bold text-sm"><span>🧪</span> 合成</button>
      </div>)}

      <AnimatePresence>{showCodex && <CraftingCodex careers={careers} recipes={CRAFTING_RECIPES} isOpen={showCodex} onClose={() => setShowCodex(false)} onLocate={handleLocateRecipe} userSkills={userSkills} />}{showAtlas && <CareerAtlas careers={displayCareers} userSkills={userSkills} onClose={() => setShowAtlas(false)} onPick={(id: number) => { setShowAtlas(false); forceFlyTo(id); setSelectedCareer(displayCareers.find((c: CareerData) => c.id === id) || null); }} />}</AnimatePresence>

      <PageOverlay show={showMentorChat} direction="right"><AIMentorChat onBack={() => setShowMentorChat(false)} userSkills={userSkills} careers={careers} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} userPersona={userPersona} recipes={CRAFTING_RECIPES} userInterests={userInterests} onFlyToCareer={(id) => { setShowMentorChat(false); forceFlyTo(id); setTimeout(() => setSelectedCareer(careers.find(c => c.id === id) || null), 1000); }} /></PageOverlay>
      <PageOverlay show={showLearningHub} direction="right">
        <LearningDashboard 
          onBack={() => setShowLearningHub(false)} 
          onGoToCareer={(id) => { setShowLearningHub(false); forceFlyTo(id); setTimeout(() => setSelectedCareer(careers.find(c => c.id === id) || null), 1000); }}
          userSkills={userSkills} 
          careers={careers} 
          abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} 
        />
      </PageOverlay>     
      <PageOverlay show={showProfile} direction="bottom"><CareerProfile onBack={() => setShowProfile(false)} userSkills={userSkills} careers={careers} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} unlockedPaths={unlockedPaths} stats={stats} /></PageOverlay>
      <PageOverlay show={showAchievements} direction="bottom"><AchievementPanel onBack={() => setShowAchievements(false)} userSkills={userSkills} unlockedPaths={unlockedPaths} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} stats={stats} /></PageOverlay>
      <AnimatePresence>{showInterestEditor && <InterestEditor allInterests={allInterests} currentInterests={userInterests} onSave={(s: Set<string>) => { setUserInterests(s); setShowInterestEditor(false); showToast("🎯 匹配度已重新计算", 'success'); }} onClose={() => setShowInterestEditor(false)} />}</AnimatePresence>

      {selectedForCraft !== null && (<div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 border border-cyan-500/50 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl"><div className="text-cyan-400 font-bold text-sm">🔧 合成台：已选中 <span className="text-white">{careers[selectedForCraft].name}</span> · 点击另一个已点亮技能</div></div>)}

      {demoFlash > 0 && (
        <motion.div key={demoFlash} className="absolute inset-0 z-[95] pointer-events-none bg-cyan-200" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
      )}
      <AnimatePresence>
        {demoBanner && (
          <motion.div className="absolute inset-0 z-[96] pointer-events-none flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 18 }} className="text-center">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-yellow-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]">DEMO STATE LOADED</div>
              <div className="mt-3 text-cyan-200/80 font-mono text-sm tracking-[0.5em]">演示状态载入 · 自动导览启动</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {cinemaMode && (
          <motion.div className="absolute inset-0 z-[97] pointer-events-none" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <motion.div className="absolute top-0 left-0 right-0 bg-black" initial={{ height: 0 }} animate={{ height: '12vh' }} transition={{ duration: 0.6 }} />
            <motion.div className="absolute bottom-0 left-0 right-0 bg-black" initial={{ height: 0 }} animate={{ height: '12vh' }} transition={{ duration: 0.6 }} />
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.9 }}>
              <div className="text-center">
                <div className="text-white/90 text-3xl font-light tracking-[0.6em] mb-3">职 业 宇 宙</div>
                <div className="text-cyan-300/70 font-mono text-[11px] tracking-[0.4em]">100 REAL CAREERS · 5 GALAXIES · ONE PATH</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeCrisis && (
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border-2 border-red-500 px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(255,0,0,0.6)] flex items-center gap-4">
          <div className="text-red-100 font-bold text-lg animate-pulse">⚠️ 系统危机!</div>
          <div className="text-white font-mono">目标: <span className="text-yellow-300 font-bold">{careers.find(c => c.id === activeCrisis.careerId)?.name}</span></div>
          <div className="text-white font-mono">剩余点击: <span className="text-green-400 font-bold text-xl">{activeCrisis.clicksNeeded}</span></div>
          <div className="text-white font-mono">时间: <span className={`font-bold text-xl ${activeCrisis.timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-300'}`}>{activeCrisis.timeLeft}s</span></div>
          <button onClick={() => forceFlyTo(activeCrisis.careerId)} className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all shadow-[0_0_12px_rgba(234,179,8,0.6)]">🚀 带我去</button>
        </motion.div>
      )}

      <div className="absolute top-6 left-6 z-10 pointer-events-none max-w-sm">
        <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">{userPersona ? `JOURNEY TO ${getGoalTitle().toUpperCase()}` : 'SYSTEM STATUS'}</div>
        <div className="text-white font-mono text-xl font-bold">{getProgressNarrative()}</div>
        <div className="text-yellow-400 font-mono text-xs mt-2">已掌握 <span className="text-white">{hudSkills}</span> / {careers.length} 技能 · 命运路径 <span className="text-white">{unlockedPaths.size}</span> / 5 {userInterests.size > 0 && <span className="ml-2 text-cyan-400">· 兴趣匹配已激活</span>}</div>
        {nextSteps.length > 0 && !selectedCareer && (
          <div className="mt-4 space-y-2 pointer-events-auto">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Current Objectives</div>
            {nextSteps.map((step, idx) => (
              <motion.button key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} onClick={() => {
                if (step.type === 'craft' && step.targetId !== undefined) { const key = Object.keys(CRAFTING_RECIPES).find(k => CRAFTING_RECIPES[k] === step.targetId); if (key) { const [a, b] = key.split('-').map(Number); handleLocateRecipe(a, b); } }
                else if (step.targetId !== undefined) { forceFlyTo(step.targetId); const targetCareer = careers.find(c => c.id === step.targetId); if (targetCareer) setSelectedCareer(targetCareer); }
              }} className="group w-full max-w-sm text-left bg-black/60 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 rounded-lg p-3 backdrop-blur-md transition-all shadow-lg">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-cyan-400 group-hover:animate-pulse">▹</span>
                  <div><div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{step.title}</div><div className="text-[11px] text-white/60 mt-0.5">{step.desc}</div></div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
        <div className="text-cyan-400 font-mono text-xs mt-3 pt-3 border-t border-white/10">
          XP <span className="text-white">{hudXp}</span> · 合成 <span className="text-white">{stats.craftCount}</span> · 危机解除 <span className="text-white">{stats.crisisFixed}</span>
          {stats.combo > 1 && <span className="ml-2 text-orange-400 font-bold">🔥 连击 x{stats.combo}</span>}
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 50], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          {/* 亮度回调：三光源全面提亮 */}
          <ambientLight intensity={0.7} />
          <pointLight position={[50, 50, 50]} intensity={2.6} />
          <pointLight position={[-40, -30, -40]} intensity={1.0} color="#4060ff" />
          <hemisphereLight args={['#707090', '#181822', 1.1]} />
          <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
          <mesh><sphereGeometry args={[1.5, 32, 32]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} toneMapped={false} /></mesh>
          {userPersona && (<group position={[0, 0, 0]}><mesh><sphereGeometry args={[2.5, 32, 32]} /><meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} transparent opacity={0.45} toneMapped={false} /></mesh><Html zIndexRange={[10, 0]} position={[0, 4, 0]} center distanceFactor={20} className="pointer-events-none"><div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-6 py-3 rounded-xl text-base font-bold backdrop-blur-md shadow-[0_0_30px_rgba(255,215,0,0.5)] whitespace-nowrap">🎯 目标：{getGoalTitle()}<div className="text-[10px] text-white/60 mt-1 text-center">距离目标还有 {careers.length - userSkills.size} 个技能</div></div></Html></group>)}
          <Connections careers={careers} userSkills={userSkills} />
          <DestinyPaths careers={careers} userSkills={userSkills} futureNodes={futureNodes} unlockedPaths={unlockedPaths} />
          {displayCareers.map((career: CareerData) => {
            const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every((p: number) => userSkills.has(p));
            const prereqNames = isLocked ? career.prerequisites.map((id: number) => careers[id]?.name).filter(Boolean) : [];
            const crisisClicks = activeCrisis?.careerId === career.id ? activeCrisis.clicksNeeded : 0;
            const isDowned = downedCareers.has(career.id);
            return (<ProceduralPlanet key={career.id} data={career} isActive={activeId === career.id} isMastered={userSkills.has(career.id)} isLocked={isLocked} isUnderAttack={careersWithAttack.has(career.id) || isDowned} isSelected={selectedForCraft === career.id} prereqNames={prereqNames} isStartNode={career.id === 0 && userSkills.size === 0} rating={stats.ratings[career.id]} crisisClicksLeft={crisisClicks} onHover={setHoveredId} onClick={() => handlePlanetClick(career)} />);
          })}
          {futureNodes.map((node: FutureNodeData) => <FutureNode key={node.id} data={node} isUnlocked={unlockedPaths.has(node.category)} />)}
          {bursts.map((b: BurstData) => (<Burst key={b.id} data={b} onDone={(id: number) => setBursts((prev) => prev.filter((x) => x.id !== id))} />))}
          {!isCameraMoving && !selectedCareer && labelCareer && !labelCareer.prerequisites.some((p: number) => !userSkills.has(p)) && (userSkills.has(labelCareer.id) || activeId === labelCareer.id || hoveredId === labelCareer.id) && (<Html zIndexRange={[10, 0]} position={[labelCareer.position.x, labelCareer.position.y + 1.8, labelCareer.position.z]} center distanceFactor={15} className="pointer-events-none" style={{ transition: 'opacity 0.3s' }}><div className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.5)] whitespace-nowrap border ${activeId === labelCareer.id ? 'bg-white/20 border-white/50 text-white' : 'bg-black/90 border-white/20 text-white'}`}>{labelCareer.name}<div className="text-[10px] text-white/70 mt-0.5 text-center">匹配度 {labelCareer.match}%{stats.ratings[labelCareer.id] ? ` · 评级 ${stats.ratings[labelCareer.id]}` : ''}</div></div></Html>)}
          <OrbitControls ref={controlsRef} enablePan={false} enableZoom={true} minDistance={4} maxDistance={80} enableDamping={true} dampingFactor={0.08} rotateSpeed={0.5} zoomSpeed={0.8} />
           <DemoCameraTour trigger={demoTour} controlsRef={controlsRef} />
          <IntroDolly trigger={introDolly} controlsRef={controlsRef} />
          <CameraController trigger={cameraTrigger} targetPosition={activeId !== null ? careers.find((c: CareerData) => c.id === activeId)?.position || null : null} isActive={activeId !== null} controlsRef={controlsRef} onAnimStart={() => setIsCameraMoving(true)} onAnimEnd={() => setIsCameraMoving(false)} />
          <EffectComposer>
            {/* 亮度回调：恢复泛光 glow 感，减轻暗角 */}
            <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.9} intensity={1.3} mipmapBlur />            <Vignette eskil={false} offset={0.1} darkness={0.35} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      {selectedCareer && <CareerDetailPanel career={selectedCareer} rating={stats.ratings[selectedCareer.id]} onSimulationComplete={handleSimulationComplete} onClose={() => { setActiveId(null); setSelectedCareer(null); }} />}
    </div>
  );
}