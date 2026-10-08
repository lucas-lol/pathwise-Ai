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
import { CAREERS, GALAXY_NAMES, type AdaptedCareer, processRawCareers } from '../data/careerAdapter';

type Persona = 'student' | 'career-changer' | 'lifelong-learner';

const CATEGORY_COLORS = ["#4f46e5", "#06b6d4", "#eab308", "#d946ef", "#22c55e"];
const CATEGORY_NAMES = GALAXY_NAMES;
const FUTURE_TITLES = [
  "科技与 AI 领航者",
  "工程与建造大宗师",
  "数据与金融掌控者",
  "科学与生命探索者",
  "商业与社会塑造者"
];

// 🌟 Phase 4：基于真实职业自动推导合成配方
function generateCraftingRecipes(rawCareers: AdaptedCareer[]): Record<string, number> {
  const recipes: Record<string, number> = {};
  const byCat: Record<number, AdaptedCareer[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  rawCareers.forEach(c => byCat[c.category].push(c));

  Object.values(byCat).forEach(group => {
    const tier0 = group.filter(c => c.tier === 0);
    const tier2 = group.filter(c => c.tier >= 2);
    if (tier0.length >= 2 && tier2.length > 0) {
      recipes[`${Math.min(tier0[0].id, tier0[1].id)}-${Math.max(tier0[0].id, tier0[1].id)}`] = tier2[0].id;
    }
  });

  if (byCat[0].length > 0 && byCat[2].length > 0) {
    const techHigh = byCat[0].filter(c => c.tier >= 2)[1] || byCat[0].filter(c => c.tier >= 2)[0];
    if (techHigh) {
      recipes[`${Math.min(byCat[0][0].id, byCat[2][0].id)}-${Math.max(byCat[0][0].id, byCat[2][0].id)}`] = techHigh.id;
    }
  }

  if (byCat[3].length > 0 && byCat[4].length > 0) {
    const bizHigh = byCat[4].filter(c => c.tier >= 2)[1] || byCat[4].filter(c => c.tier >= 2)[0];
    if (bizHigh) {
      recipes[`${Math.min(byCat[3][0].id, byCat[4][0].id)}-${Math.max(byCat[3][0].id, byCat[4][0].id)}`] = bizHigh.id;
    }
  }

  return recipes;
}

const CRAFTING_RECIPES = generateCraftingRecipes(CAREERS);

interface CareerData {
  id: number;
  name: string;
  position: THREE.Vector3;
  color: THREE.Color;
  category: number;
  complexity: number;
  match: number;
  prerequisites: number[];
  tier: number;
  isUnderAttack?: boolean;
  requiredSkills: string[];
  preferredKnowledge: string[];
  careerPath: string;
  interestTags: string[];
  nameEn: string;
  categoryName: string;
}

interface FutureNodeData {
  id: number;
  title: string;
  position: THREE.Vector3;
  color: THREE.Color;
  category: number;
}

function enrichCareers(rawCareers: AdaptedCareer[]): CareerData[] {
  const byCategory: Record<number, AdaptedCareer[]> = {};
  rawCareers.forEach(c => {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  });

  return rawCareers.map(c => {
    let prerequisites: number[] = [];
    if (c.tier > 0) {
      const sameCat = byCategory[c.category];
      const prevTiers = sameCat.filter(p => p.tier < c.tier);
      if (prevTiers.length > 0) {
        prerequisites = [prevTiers[0].id];
      }
    }
    return {
      id: c.id,
      name: c.name,
      position: c.position,
      color: new THREE.Color(CATEGORY_COLORS[c.category] || "#ffffff"),
      category: c.category,
      complexity: c.complexity,
      match: c.match,
      prerequisites,
      tier: c.tier,
      isUnderAttack: false,
      requiredSkills: c.requiredSkills,
      preferredKnowledge: c.preferredKnowledge,
      careerPath: c.careerPath,
      interestTags: c.interestTags,
      nameEn: c.nameEn,
      categoryName: c.categoryName,
    };
  });
}

// 4. 高性能连线系统
function Connections({ careers, userSkills }: { careers: CareerData[]; userSkills: Set<number> }) {
  const { strongGeometries, weakGeometry, masteredGeometry } = useMemo(() => {
    const strongGeometriesArr: number[][] = [[], [], [], [], []];
    const weakPoints: number[] = [];
    const masteredPoints: number[] = [];

    const maxDistance = 14;
    const categoryDistance = 11;

    for (let i = 0; i < careers.length; i++) {
      for (let j = i + 1; j < careers.length; j++) {
        const p1 = careers[i].position;
        const p2 = careers[j].position;
        const dist = p1.distanceTo(p2);

        if (dist > 14) continue;

        const isMastered = userSkills.has(i) && userSkills.has(j);

        if (dist < maxDistance) {
          if (careers[i].category === careers[j].category && dist < categoryDistance) {
            if (isMastered) {
              masteredPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              strongGeometriesArr[careers[i].category].push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          } else if (dist < 7) {
            weakPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          }
        }
      }
    }

    const createGeometry = (points: number[]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      return geometry;
    };

    return {
      strongGeometries: strongGeometriesArr.map(pts => createGeometry(pts)),
      weakGeometry: createGeometry(weakPoints),
      masteredGeometry: createGeometry(masteredPoints)
    };
  }, [careers, userSkills]);

  return (
    <>
      {strongGeometries.map((geo, idx) => (
        <lineSegments key={idx} geometry={geo}>
          <lineBasicMaterial color={CATEGORY_COLORS[idx]} transparent opacity={0.3} />
        </lineSegments>
      ))}
      <lineSegments geometry={weakGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.05} />
      </lineSegments>
      <lineSegments geometry={masteredGeometry}>
        <lineBasicMaterial color="#ffd700" transparent opacity={1.0} toneMapped={false} />
      </lineSegments>
    </>
  );
}

// 5. 命运轨迹系统
function DestinyPaths({ careers, userSkills, futureNodes, unlockedPaths }: { careers: CareerData[]; userSkills: Set<number>; futureNodes: FutureNodeData[]; unlockedPaths: Set<number> }) {
  const allLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    unlockedPaths.forEach((categoryId: number) => {
      const futureNode = futureNodes.find(f => f.category === categoryId);
      if (!futureNode) return;
      const masteredCareersInCategory = careers.filter(c => c.category === categoryId && userSkills.has(c.id));
      masteredCareersInCategory.forEach(career => {
        lines.push([career.position, futureNode.position]);
      });
    });
    return lines;
  }, [careers, userSkills, futureNodes, unlockedPaths]);

  return (
    <>
      {allLines.map((points, idx) => (
        <Line key={idx} points={points} color="#ffffff" lineWidth={3} transparent opacity={1.0} toneMapped={false} />
      ))}
    </>
  );
}

// 6. 未来节点 (超新星)
function FutureNode({ data, isUnlocked }: { data: FutureNodeData; isUnlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current && glowRef.current) {
      const targetScale = isUnlocked ? 1 : 0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
      glowRef.current.scale.lerp(new THREE.Vector3(targetScale * 3, targetScale * 3, targetScale * 3), 0.05);
      if (isUnlocked) {
        meshRef.current.rotation.y += delta * 0.2;
        glowRef.current.rotation.y -= delta * 0.1;
      }
    }
  });

  return (
    <group position={data.position}> {/* 🌟 恢复视锥剔除 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive={data.color} emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.2} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      {isUnlocked && (
        <Html zIndexRange={[10, 0]} position={[0, 3.5, 0]} center distanceFactor={20} className="pointer-events-none">
          <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.5)] whitespace-nowrap">
            终极目标：{data.title}
          </div>
        </Html>
      )}
    </group>
  );
}

// 7. 程序化星球组件
function ProceduralPlanet({ data, isActive, onClick, onHover, isMastered, isLocked, isSelected, isUnderAttack, prereqNames, isStartNode }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const dynamicComplexity = isMastered ? Math.min(1, data.complexity + 0.4) : data.complexity;
  const ringCount = Math.min(2, Math.floor(dynamicComplexity * 4)); // 🌟 光环数量封顶
  const rings = useMemo(() => Array.from({ length: ringCount }), [ringCount]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const targetScale = isLocked ? 0.8 : (isActive ? 2.0 : (hovered || isSelected ? 1.5 : (isMastered ? 1.3 : 1)));
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    if (!isLocked) {
      groupRef.current.rotation.y += delta * 0.15 * dynamicComplexity;
    }
  });

  const isStartGlow = isStartNode && !isMastered;
  const lockedColor = new THREE.Color("#333333");
  const attackColor = new THREE.Color("#ff0000");

  const displayColor = isLocked ? lockedColor : (isUnderAttack ? attackColor : (isStartGlow ? "#ffffff" : (isMastered ? "#ffffff" : data.color)));
  const displayEmissive = isLocked ? "#111111" : (isUnderAttack ? "#ff0000" : (isStartGlow ? "#ffffff" : (isMastered ? "#ffd700" : data.color)));

  return (
    <group position={data.position}> {/* 🌟 恢复视锥剔除 */}
      <group ref={groupRef}>
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data.id); }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHover(null); }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          {/* 🌟 球体细分封顶 */}
          <icosahedronGeometry args={[0.6, Math.min(2, Math.floor(dynamicComplexity * 4))]} />
          <meshPhysicalMaterial
            color={displayColor}
            metalness={0.8}
            roughness={0.1}
            emissive={displayEmissive}
            emissiveIntensity={isActive ? 3.0 : (isStartGlow ? 2.0 : (isMastered ? 2.5 : (isLocked ? 0.1 : (hovered || isSelected ? 1.5 : 0.3))))}
            wireframe={dynamicComplexity < 0.5}
            toneMapped={false}
          />
        </mesh>

        {isLocked && hovered && prereqNames && prereqNames.length > 0 && (
          <Html zIndexRange={[10, 0]} position={[0, 2.5, 0]} center distanceFactor={8} className="pointer-events-none">
            <div className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg border border-red-400/50 whitespace-nowrap">
              🔒 需要前置：{prereqNames.join(', ')}
            </div>
          </Html>
        )}

        {isUnderAttack && (
          <Html zIndexRange={[10, 0]} position={[0, 2, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="text-3xl animate-bounce">☄️</div>
          </Html>
        )}

        {isSelected && (
          <Html zIndexRange={[10, 0]} position={[0, -2, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">已选中 (点击另一个合成)</div>
          </Html>
        )}

        {isStartGlow && (
          <Html zIndexRange={[10, 0]} position={[0, 2.5, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="bg-white/10 border border-white/50 text-white px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.5)] whitespace-nowrap animate-pulse">
              ✨ START HERE
            </div>
          </Html>
        )}

        {!isLocked && rings.map((_, idx) => (
          <mesh key={idx} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
            {/* 🌟 光环几何体减半 */}
            <torusGeometry args={[1.0 + idx * 0.3, 0.03, 8, 32]} />
            <meshBasicMaterial color={isMastered ? "#ffd700" : data.color} transparent opacity={0.8} toneMapped={false} />
          </mesh>
        ))}

        {!isLocked && (isMastered || isActive) && <Sparkles count={isMastered ? 50 : 20} scale={isMastered ? 3.5 : 2.0} size={isMastered ? 3 : 1.5} speed={0.8} color={isMastered ? "#ffd700" : data.color} />}
      </group>
    </group>
  );
}

// 8. 相机控制器
function CameraController({ targetPosition, isActive, controlsRef, onAnimStart, onAnimEnd, trigger }: {
  targetPosition: THREE.Vector3 | null;
  isActive: boolean;
  controlsRef: any;
  onAnimStart: () => void;
  onAnimEnd: () => void;
  trigger: number;
}) {
  const { camera } = useThree();
  const animatedTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    onAnimStart();
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(animatedTarget.current);

    const originalDamping = controls.enableDamping;
    controls.enableDamping = false;
    controls.enabled = false;

    const finishAnimation = () => {
      controls.target.copy(animatedTarget.current);
      camera.lookAt(controls.target);
      camera.updateMatrixWorld();
      controls.update();
      controls.enableDamping = originalDamping;
      controls.enabled = true;
      onAnimEnd();
    };

    if (isActive && targetPosition) {
      const direction = targetPosition.clone().normalize();
      const camTargetPos = targetPosition.clone().add(direction.multiplyScalar(6));

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

// 9. 合成图鉴组件
function CraftingCodex({ careers, recipes, isOpen, onClose, onLocate, userSkills }: {
  careers: CareerData[];
  recipes: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onLocate: (idA: number, idB: number) => void;
  userSkills: Set<number>;
}) {
  if (!isOpen) return null;

  const groupedRecipes: Record<number | 'cross', any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], cross: [] };

  Object.entries(recipes).forEach(([key, resultId]) => {
    const [idA, idB] = key.split('-').map(Number);
    if (!careers[idA] || !careers[idB] || !careers[resultId]) return;
    const catA = careers[idA].category;
    const catB = careers[idB].category;
    const entry = { key, a: careers[idA], b: careers[idB], result: careers[resultId] };
    if (catA === catB) groupedRecipes[catA].push(entry);
    else groupedRecipes.cross.push(entry);
  });

  const renderRecipeRow = (r: any, idx: number, isCross: boolean) => {
    const hasA = userSkills.has(r.a.id);
    const hasB = userSkills.has(r.b.id);
    const hasResult = userSkills.has(r.result.id);
    let statusClass = "bg-white/5 border-white/10", statusText = "", statusColor = "text-white/40";

    if (hasResult) { statusClass = "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"; statusText = "✅ 已解锁"; }
    else if (hasA && hasB) { statusClass = "bg-green-500/10 border-green-500/50 hover:bg-green-500/20"; statusText = "✨ 可合成"; statusColor = "text-green-400"; }
    else if (hasA || hasB) { statusClass = "bg-yellow-500/5 border-yellow-500/30 opacity-70"; statusText = `⏳ 缺${hasA ? r.b.name : r.a.name}`; statusColor = "text-yellow-400"; }
    else { statusClass = "bg-white/5 border-white/5 opacity-30"; statusText = "🔒 未解锁"; }

    return (
      <div key={idx} onClick={() => !hasResult && onLocate(r.a.id, r.b.id)} className={`border rounded-lg p-2 flex items-center justify-between text-xs transition-all ${statusClass} ${!hasResult ? 'cursor-pointer group' : ''}`}>
        <div className="flex items-center gap-1 flex-1">
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.a.name}</span>
          <span className={`${isCross ? 'text-purple-400' : 'text-cyan-400'} font-bold`}>+</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.b.name}</span>
        </div>
        <div className="flex flex-col items-end ml-1">
          <span className={`text-[10px] ${statusColor} mb-0.5`}>{statusText}</span>
          <div className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap"><span className="text-white/40">→</span> {r.result.name}</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute top-24 left-6 z-40 w-80 bg-black/90 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-xl shadow-2xl max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0">
        <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2"><span className="text-2xl">🧪</span> 合成图鉴</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-xl">✕</button>
      </div>
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {Object.values(groupedRecipes).every(arr => arr.length === 0) ? (
          <div className="text-center text-white/40 py-10 text-sm">
            暂无可用配方。<br />请先点亮更多真实职业星球！
          </div>
        ) : (
          <>
            {[0, 1, 2, 3, 4].map(catId => (
              groupedRecipes[catId].length > 0 && (
                <div key={catId} className="space-y-2">
                  <div className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[catId] }}></span>
                    {CATEGORY_NAMES[catId]}
                  </div>
                  {groupedRecipes[catId].map((r, idx) => renderRecipeRow(r, idx, false))}
                </div>
              )
            ))}
            {groupedRecipes.cross.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2"><span className="text-lg">✨</span> 隐藏跨领域配方</div>
                {groupedRecipes.cross.map((r, idx) => renderRecipeRow(r, idx, true))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/40 text-center flex-shrink-0">点击配方自动定位星球</div>
    </motion.div>
  );
}

// 10. 主场景
export default function CareerUniverse() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerData | null>(null);
  const controlsRef = useRef<any>(null);
  const [isCameraMoving, setIsCameraMoving] = useState(false);

  const [userSkills, setUserSkills] = useState<Set<number>>(new Set());
  const [unlockedPaths, setUnlockedPaths] = useState<Set<number>>(new Set());

  const [selectedForCraft, setSelectedForCraft] = useState<number | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLearningHub, setShowLearningHub] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [userPersona, setUserPersona] = useState<Persona | null>(null);
  const [careersWithAttack, setCareersWithAttack] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ msg: string, visible: boolean, type: 'error' | 'success' | 'warning' }>({ msg: "", visible: false, type: 'warning' });
  const [cameraTrigger, setCameraTrigger] = useState(0);

  const [abilityScores, setAbilityScores] = useState({ technical: 0, logic: 0, communication: 0, stress: 0, innovation: 0, leadership: 0 });

  const [careers, setCareers] = useState(() => enrichCareers(CAREERS));

  useEffect(() => {
    fetch('http://localhost:8000/api/careers')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(rawData => {
        const remoteCareers = processRawCareers(rawData);
        setCareers(enrichCareers(remoteCareers));
        console.log('%c✅ 成功连接 Engine 核心算法引擎！已加载远端真实职业数据。', 'color: #22c55e; font-weight: bold;');
      })
      .catch(() => {
        console.log('%cℹ️ Engine 引擎离线，已自动降级使用本地内置数据，确保演示体验流畅。', 'color: #94a3b8; font-style: italic;');
      });
  }, []);

  const futureNodes = useMemo(() => {
    return CATEGORY_COLORS.map((color, idx) => {
      const firstCareerInCategory = careers.find(c => c.category === idx);
      if (!firstCareerInCategory) return null;
      const direction = firstCareerInCategory.position.clone().normalize();
      const position = direction.multiplyScalar(35);

      return {
        id: idx,
        title: FUTURE_TITLES[idx],
        position: position,
        color: new THREE.Color(color),
        category: idx
      };
    }).filter(Boolean) as FutureNodeData[];
  }, [careers]);

  const showToast = (msg: string, type: 'error' | 'success' | 'warning' = 'warning') => {
    setToast({ msg, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const forceFlyTo = (careerId: number) => {
    setActiveId(careerId);
    setCameraTrigger(prev => prev + 1);
  };

  const handlePersonaSelect = (persona: Persona) => {
    setUserPersona(persona);
    setShowPersonaSelector(false);
    forceFlyTo(0);
  };

  const getGoalTitle = () => {
    if (!userPersona) return '未知';
    const goals: Record<string, string> = {
      'student': '科技与 AI 领航者',
      'career-changer': '工程与建造大宗师',
      'lifelong-learner': '商业与社会塑造者',
    };
    return goals[userPersona] || '未知';
  };

  const getProgressNarrative = () => {
    const total = careers.length;
    const mastered = userSkills.size;
    const percentage = Math.floor((mastered / total) * 100);

    if (mastered === 0) return '旅程尚未开始';
    if (percentage < 10) return `已踏上 ${getGoalTitle()} 之路 (${percentage}%)`;
    if (percentage < 30) return `${getGoalTitle()} 之路进展顺利 (${percentage}%)`;
    if (percentage < 60) return `已成为 ${getGoalTitle()} 的有力竞争者 (${percentage}%)`;
    return `距离 ${getGoalTitle()} 仅一步之遥 (${percentage}%)`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (userSkills.size > 0) {
        const masteredIds = Array.from(userSkills);
        const randomId = masteredIds[Math.floor(Math.random() * masteredIds.length)];
        setCareersWithAttack(prev => new Set(prev).add(randomId));
        showToast("⚠️ 行业危机来袭！点击被攻击的星球修复！", 'error');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userSkills, careers]);

  const handleLocateRecipe = (idA: number, idB: number) => {
    setShowCodex(false);
    const skillA = careers[idA], skillB = careers[idB];
    if (userSkills.has(idA) && userSkills.has(idB)) {
      const key = `${Math.min(idA, idB)}-${Math.max(idA, idB)}`;
      const resultId = CRAFTING_RECIPES[key];
      if (resultId && !userSkills.has(resultId)) {
        setUserSkills(prev => new Set(prev).add(resultId));
        showToast(`🎉 自动合成成功！解锁：${careers[resultId].name}`, 'success');
        forceFlyTo(resultId);
      } else {
        showToast("⚠️ 该技能已解锁或配方无效。", 'warning');
        forceFlyTo(idA);
      }
      return;
    }
    let targetId = idA, message = "";
    if (userSkills.has(idA) && !userSkills.has(idB)) { targetId = idB; message = `原料 ${skillA.name} 已就绪！请飞向 ${skillB.name} 完成模拟解锁它！`; }
    else if (!userSkills.has(idA) && userSkills.has(idB)) { targetId = idA; message = `原料 ${skillB.name} 已就绪！请飞向 ${skillA.name} 完成模拟解锁它！`; }
    else { targetId = idA; message = `需要先点亮 ${skillA.name} 和 ${skillB.name}。请先完成 ${skillA.name} 的模拟！`; }
    setSelectedForCraft(null);
    forceFlyTo(targetId);
    showToast(`🧭 ${message}`, 'warning');
  };

  const handlePlanetClick = (career: CareerData) => {
    const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every(prereqId => userSkills.has(prereqId));
    if (isLocked) {
      forceFlyTo(career.id);
      showToast(`🔒 前置技能未满足！需要先点亮：${career.prerequisites.map(id => careers[id]?.name).join(", ")}`, 'error');
      return;
    }
    if (careersWithAttack.has(career.id)) {
      setCareersWithAttack(prev => { const next = new Set(prev); next.delete(career.id); return next; });
      showToast("✅ 危机已解除！技能恢复正常。", 'success');
      return;
    }
    if (selectedForCraft !== null && selectedForCraft !== career.id) {
      const idA = Math.min(selectedForCraft, career.id), idB = Math.max(selectedForCraft, career.id);
      const resultId = CRAFTING_RECIPES[`${idA}-${idB}`];
      if (resultId !== undefined) {
        if (!userSkills.has(resultId)) { setUserSkills(prev => new Set(prev).add(resultId)); showToast(`🎉 合成成功！解锁：${careers[resultId].name}`, 'success'); forceFlyTo(resultId); }
        else showToast("⚠️ 该技能已解锁。", 'warning');
      } else showToast("❌ 合成失败！配方不正确。", 'error');
      setSelectedForCraft(null);
    } else if (userSkills.has(career.id)) {
      if (selectedForCraft === career.id) { setSelectedForCraft(null); showToast("已取消合成选中。", 'warning'); }
      else { setSelectedForCraft(career.id); forceFlyTo(career.id); showToast("🔧 已选中。点击另一个已点亮技能进行合成。", 'warning'); }
    } else {
      forceFlyTo(career.id);
      setSelectedCareer(career);
    }
  };

  const handleSimulationComplete = (careerId: number, success: boolean, abilityChanges?: any) => {
    if (success) {
      setUserSkills(prev => {
        const newSkills = new Set(prev);
        newSkills.add(careerId);
        const currentCareer = careers.find(c => c.id === careerId);
        if (currentCareer) {
          if (Array.from(newSkills).filter(id => careers[id]?.category === currentCareer.category).length >= 5) {
            setUnlockedPaths(prevPaths => { const newPaths = new Set(prevPaths); newPaths.add(currentCareer.category); return newPaths; });
          }
        }
        return newSkills;
      });
      const changes = abilityChanges || {
        technical: 15, logic: 12, communication: 8, stress: 8, innovation: 10, leadership: 5,
      };
      setAbilityScores(prev => ({
        technical: prev.technical + (changes.technical || 0),
        logic: prev.logic + (changes.logic || 0),
        communication: prev.communication + (changes.communication || 0),
        stress: prev.stress + (changes.stress || 0),
        innovation: prev.innovation + (changes.innovation || 0),
        leadership: prev.leadership + (changes.leadership || 0),
      }));
    } else {
      showToast("⚠️ 模拟失败！总监对你的表现很不满意。", 'error');
    }
    setSelectedCareer(null);
    setActiveId(null);
  };

  const displayLabelId = activeId !== null ? activeId : hoveredId;
  const labelCareer = careers.find(c => c.id === displayLabelId);
  const toastColor = toast.type === 'error' ? 'bg-red-500/90 border-red-400/50' : (toast.type === 'success' ? 'bg-green-500/90 border-green-400/50' : 'bg-yellow-500/90 border-yellow-400/50');

  if (showMentorChat) {
    return <AIMentorChat onBack={() => setShowMentorChat(false)} userSkills={userSkills} careers={careers} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} userPersona={userPersona} recipes={CRAFTING_RECIPES} />;
  }
  if (showLearningHub) {
    return <LearningDashboard onBack={() => setShowLearningHub(false)} userSkills={userSkills} careers={careers} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} />;
  }
  if (showProfile) {
    return <CareerProfile onBack={() => setShowProfile(false)} userSkills={userSkills} careers={careers} abilityScores={[abilityScores.technical, abilityScores.logic, abilityScores.communication, abilityScores.stress, abilityScores.innovation, abilityScores.leadership]} />;
  }

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {showIntro && (
        <IntroSequence
          onComplete={() => {
            setShowIntro(false);
            setShowPersonaSelector(true);
          }}
        />
      )}

      {showPersonaSelector && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center max-w-5xl mx-auto px-8">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              你是谁？
            </h2>
            <p className="text-white/60 text-lg mb-16">
              选择你的身份，我们将为你定制专属的探索之旅
            </p>

            <div className="grid grid-cols-3 gap-8">
              {[
                { id: 'student', icon: '🎓', title: '迷茫的大学生', desc: '想探索职业方向，找到适合自己的路', goal: '科技与 AI 领航者', color: 'from-blue-500 to-cyan-500' },
                { id: 'career-changer', icon: '💼', title: '想转行的职场人', desc: '有明确目标，但需要补齐技能差距', goal: '工程与建造大宗师', color: 'from-purple-500 to-pink-500' },
                { id: 'lifelong-learner', icon: '📚', title: '终身学习者', desc: '想持续成长，不断拓展能力边界', goal: '商业与社会塑造者', color: 'from-orange-500 to-red-500' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePersonaSelect(p.id as Persona)}
                  className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 text-left"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <div className="text-7xl mb-6">{p.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-3">{p.title}</h3>
                    <p className="text-white/60 text-base leading-relaxed">{p.desc}</p>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">目标职业</div>
                      <div className="text-cyan-400 font-bold text-lg">{p.goal}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className={`${toastColor} text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-md border font-bold text-sm flex items-center gap-2`}>{toast.msg}</div>
      </div>

      {!selectedCareer && (
        <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
          <button onClick={() => setShowMentorChat(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">💬 AI 导师</button>
          <button onClick={() => setShowLearningHub(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">🚀 学习中心</button>
          <button onClick={() => setShowProfile(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">✨ 查看我的职业档案</button>
          <button onClick={() => setShowCodex(!showCodex)} className="bg-black/80 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-bold text-sm"><span>🧪</span> 合成图鉴</button>
        </div>
      )}

      <AnimatePresence>
        {showCodex && <CraftingCodex careers={careers} recipes={CRAFTING_RECIPES} isOpen={showCodex} onClose={() => setShowCodex(false)} onLocate={handleLocateRecipe} userSkills={userSkills} />}
      </AnimatePresence>

      {selectedForCraft !== null && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 border border-cyan-500/50 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl">
          <div className="text-cyan-400 font-bold text-sm">🔧 合成台：已选中 <span className="text-white">{careers[selectedForCraft].name}</span> · 点击另一个已点亮技能</div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">
          {userPersona ? `JOURNEY TO ${getGoalTitle().toUpperCase()}` : 'SYSTEM STATUS'}
        </div>
        <div className="text-white font-mono text-xl font-bold">
          {getProgressNarrative()}
        </div>
        <div className="text-yellow-400 font-mono text-xs mt-2">
          已掌握 <span className="text-white">{userSkills.size}</span> / {careers.length} 技能 ·
          命运路径 <span className="text-white">{unlockedPaths.size}</span> / 5
        </div>
      </div>

      {/* 🌟 性能优化：限制 DPR 在 1 到 1.5 之间，关闭抗锯齿，调用高性能模式 */}
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[50, 50, 50]} intensity={1.5} />
          
          {/* 🌟 性能优化：改用本地半球光，移除联网 HDR，星空减半 */}
          <hemisphereLight args={['#404060', '#000000', 0.6]} />
          <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} toneMapped={false} />
          </mesh>

          {userPersona && (
            <group position={[0, 0, 0]}>
              <mesh>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshStandardMaterial
                  color="#ffd700"
                  emissive="#ffd700"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.3}
                  toneMapped={false}
                />
              </mesh>
              <Html zIndexRange={[10, 0]} position={[0, 4, 0]} center distanceFactor={20} className="pointer-events-none">
                <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-6 py-3 rounded-xl text-base font-bold backdrop-blur-md shadow-[0_0_30px_rgba(255,215,0,0.5)] whitespace-nowrap">
                  🎯 目标：{getGoalTitle()}
                  <div className="text-[10px] text-white/60 mt-1 text-center">
                    距离目标还有 {careers.length - userSkills.size} 个技能
                  </div>
                </div>
              </Html>
            </group>
          )}

          <Connections careers={careers} userSkills={userSkills} />
          <DestinyPaths careers={careers} userSkills={userSkills} futureNodes={futureNodes} unlockedPaths={unlockedPaths} />

          {careers.map((career) => {
            const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every(prereqId => userSkills.has(prereqId));
            const isUnderAttack = careersWithAttack.has(career.id);
            const isSelected = selectedForCraft === career.id;
            const prereqNames = isLocked ? career.prerequisites.map(id => careers[id]?.name).filter(Boolean) : [];
            const isStartNode = career.id === 0 && userSkills.size === 0;

            return (
              <ProceduralPlanet
                key={career.id}
                data={career}
                isActive={activeId === career.id}
                isMastered={userSkills.has(career.id)}
                isLocked={isLocked}
                isUnderAttack={isUnderAttack}
                isSelected={isSelected}
                prereqNames={prereqNames}
                isStartNode={isStartNode}
                onHover={setHoveredId}
                onClick={() => handlePlanetClick(career)}
              />
            );
          })}

          {futureNodes.map(node => (
            <FutureNode key={node.id} data={node} isUnlocked={unlockedPaths.has(node.category)} />
          ))}

          {!isCameraMoving && !selectedCareer && labelCareer && (() => {
            const isLocked = labelCareer.prerequisites.length > 0 && !labelCareer.prerequisites.every(prereqId => userSkills.has(prereqId));
            return !isLocked && (userSkills.has(labelCareer.id) || activeId === labelCareer.id || hoveredId === labelCareer.id);
          })() && (
            <Html zIndexRange={[10, 0]} position={[labelCareer.position.x, labelCareer.position.y + 1.8, labelCareer.position.z]} center distanceFactor={15} className="pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out' }}>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.5)] whitespace-nowrap border ${activeId === labelCareer.id ? 'bg-white/20 border-white/50 text-white' : 'bg-black/90 border-white/20 text-white'}`}>
                {labelCareer.name}
                <div className="text-[10px] text-white/70 mt-0.5 text-center">匹配度 {labelCareer.match}%</div>
              </div>
            </Html>
          )}

          <OrbitControls 
            ref={controlsRef} 
            enablePan={false} 
            enableZoom={true} 
            minDistance={10} 
            maxDistance={80} 
            enableDamping={true} 
            dampingFactor={0.08}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
          />
          <CameraController trigger={cameraTrigger} targetPosition={activeId !== null ? careers.find(c => c.id === activeId)?.position || null : null} isActive={activeId !== null} controlsRef={controlsRef} onAnimStart={() => setIsCameraMoving(true)} onAnimEnd={() => setIsCameraMoving(false)} />
          <EffectComposer>
            {/* 🌟 性能优化：Bloom 改用 mipmapBlur 模糊 */}
            <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} intensity={0.8} mipmapBlur />
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {selectedCareer && (
        <CareerDetailPanel career={selectedCareer} onSimulationComplete={handleSimulationComplete} onClose={() => { setActiveId(null); setSelectedCareer(null); }} />
      )}
    </div>
  );
}