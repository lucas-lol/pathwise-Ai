// src/components/CareerUniverse.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, Html, Sparkles, OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import CareerDetailPanel from './CareerDetailPanel';

// 🧠 1. 斐波那契球面分布算法
function getFibonacciSpherePoints(samples: number, radius: number) {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3. - Math.sqrt(5.));
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return points;
}

// 🎨 2. 生成 100 个职业数据 & 5 个未来节点
const CAREER_COUNT = 100;
const CAREER_NAMES = [
  "AI 算法工程师", "数据科学家", "全栈开发者", "产品经理", "UX 设计师", 
  "量化分析师", "网络安全专家", "云计算架构师", "生物信息学家", "机器人工程师"
];
// 新增：10 个独特的技能等级后缀，确保 100 个职业名字不重复
const SKILL_LEVELS = [
  "基础理论", "核心算法", "工程实践", "系统架构", "数据分析", 
  "模型优化", "业务落地", "团队管理", "战略规划", "行业领袖"
];
const CATEGORY_COLORS = ["#4f46e5", "#06b6d4", "#eab308", "#d946ef", "#22c55e"];
const CATEGORY_NAMES = ["AI 与数据", "量化与金融", "全栈与云", "产品与设计", "前沿科技"];
const FUTURE_TITLES = ["首席 AI 架构师", "数据科学总监", "全栈技术专家", "产品副总裁", "设计总监"];

//  3. 终极合成配方表 (18 个配方)
const CRAFTING_RECIPES: Record<string, number> = {
  "0-1": 5, "0-2": 6, "1-2": 7, "5-6": 15,
  "20-21": 25, "20-22": 26, "25-26": 35,
  "40-41": 45, "40-42": 46, "45-46": 55,
  "60-61": 65, "60-62": 66, "65-66": 75,
  "80-81": 85, "80-82": 86, "85-86": 95,
  "0-20": 90, "40-60": 91, "2-80": 92,
};

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
}

interface FutureNodeData {
  id: number;
  title: string;
  position: THREE.Vector3;
  color: THREE.Color;
  category: number;
}

function generateUniverseData() {
  const positions = getFibonacciSpherePoints(CAREER_COUNT, 22); 
  const careers: CareerData[] = positions.map((pos, i) => {
    const category = Math.floor(i / 20);
    const localIndex = i % 20;
    
    let tier = 0;
    let prerequisites: number[] = [];
    const categoryStartId = category * 20;
    
    if (localIndex < 5) {
      tier = 0;
      prerequisites = [];
    } else if (localIndex < 15) {
      tier = 1;
      const baseIds = Array.from({length: 5}, (_, k) => categoryStartId + k);
      prerequisites = [baseIds[localIndex % 5], baseIds[(localIndex + 1) % 5]];
    } else {
      tier = 2;
      const advIds = Array.from({length: 10}, (_, k) => categoryStartId + 5 + k);
      prerequisites = [advIds[(localIndex - 15) % 10], advIds[(localIndex - 14) % 10]];
    }

    // 修复：生成独一无二的职业名字
    const baseName = CAREER_NAMES[i % CAREER_NAMES.length];
    const levelName = SKILL_LEVELS[Math.floor(i / 10)];
    const uniqueName = `${baseName} · ${levelName}`;

    return {
      id: i,
      name: uniqueName,
      position: pos,
      color: new THREE.Color(CATEGORY_COLORS[category]),
      category: category,
      complexity: 0.3 + Math.random() * 0.7,
      match: Math.floor(60 + Math.random() * 40),
      prerequisites,
      tier,
      isUnderAttack: false
    };
  });

  const futureNodes: FutureNodeData[] = CATEGORY_COLORS.map((color, idx) => {
    const firstCareerInCategory = careers.find(c => c.category === idx);
    const direction = firstCareerInCategory!.position.clone().normalize();
    const position = direction.multiplyScalar(35);
    
    return {
      id: idx,
      title: FUTURE_TITLES[idx],
      position: position,
      color: new THREE.Color(color),
      category: idx
    };
  });

  return { careers, futureNodes };
}

// 🔗 4. 高性能连线系统
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

// 🌟 5. 命运轨迹系统
function DestinyPaths({ careers, userSkills, futureNodes, unlockedPaths }: { careers: CareerData[]; userSkills: Set<number>; futureNodes: FutureNodeData[]; unlockedPaths: Set<number> }) {
  const allLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []; 
    unlockedPaths.forEach((categoryId: number) => {
      const futureNode = futureNodes[categoryId];
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
        <Line 
          key={idx}
          points={points}
          color="#ffffff"
          lineWidth={3} 
          transparent
          opacity={1.0}
          toneMapped={false}
        />
      ))}
    </>
  );
}

// 🪐 6. 未来节点 (超新星)
function FutureNode({ data, isUnlocked }: { data: FutureNodeData; isUnlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
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
    <group position={data.position} frustumCulled={false}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive={data.color} emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.2} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      {isUnlocked && (
        <Html position={[0, 3.5, 0]} center distanceFactor={20} className="pointer-events-none">
          <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.5)] whitespace-nowrap">
            终极目标：{data.title}
          </div>
        </Html>
      )}
    </group>
  );
}

// 🌍 7. 程序化星球组件
function ProceduralPlanet({ data, isActive, onClick, onHover, isMastered, isLocked, isSelected, isUnderAttack }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const dynamicComplexity = isMastered ? Math.min(1, data.complexity + 0.4) : data.complexity;
  const ringCount = Math.floor(dynamicComplexity * 4);
  const rings = useMemo(() => Array.from({ length: ringCount }), [ringCount]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = isLocked ? 0.8 : (isActive ? 2.0 : (hovered || isSelected ? 1.5 : (isMastered ? 1.3 : 1)));
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    if (!isLocked) {
      groupRef.current.rotation.y += delta * 0.15 * dynamicComplexity;
    }
  });

  const lockedColor = new THREE.Color("#333333");
  const attackColor = new THREE.Color("#ff0000");
  const displayColor = isLocked ? lockedColor : (isUnderAttack ? attackColor : (isMastered ? "#ffffff" : data.color));
  const displayEmissive = isLocked ? "#111111" : (isUnderAttack ? "#ff0000" : (isMastered ? "#ffd700" : data.color));

  return (
    <group position={data.position} frustumCulled={false}>
      <group ref={groupRef}>
        <mesh 
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data.id); }} 
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHover(null); }} 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <icosahedronGeometry args={[0.6, Math.floor(dynamicComplexity * 4)]} />
          <meshPhysicalMaterial 
            color={displayColor}
            metalness={0.8} 
            roughness={0.1}
            emissive={displayEmissive}
            emissiveIntensity={isActive ? 3.0 : (isMastered ? 2.5 : (isLocked ? 0.1 : (hovered || isSelected ? 1.5 : 0.3)))}
            wireframe={dynamicComplexity < 0.5}
            toneMapped={false}
          />
        </mesh>
        
        {isLocked && (
          <Html position={[0, 0, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="text-2xl opacity-50">🔒</div>
          </Html>
        )}

        {isUnderAttack && (
          <Html position={[0, 2, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="text-3xl animate-bounce">☄️</div>
          </Html>
        )}

        {isSelected && (
          <Html position={[0, -2, 0]} center distanceFactor={10} className="pointer-events-none">
            <div className="bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">已选中 (点击另一个合成)</div>
          </Html>
        )}

        {!isLocked && rings.map((_, idx) => (
          <mesh key={idx} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
            <torusGeometry args={[1.0 + idx * 0.3, 0.03, 16, 64]} />
            <meshBasicMaterial color={isMastered ? "#ffd700" : data.color} transparent opacity={0.8} toneMapped={false} />
          </mesh>
        ))}
        
        {!isLocked && dynamicComplexity > 0.6 && <Sparkles count={isMastered ? 100 : 30} scale={isMastered ? 3.5 : 2.0} size={isMastered ? 3 : 1.5} speed={0.8} color={isMastered ? "#ffd700" : data.color} />}
      </group>
    </group>
  );
}

// 🎥 8. 相机控制器 (新增 trigger 强制刷新机制)
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
      const dist = targetPosition.length(); 
      const direction = targetPosition.clone().normalize();
      const camTargetPos = targetPosition.clone().add(direction.multiplyScalar(6));

      const tl = gsap.timeline({ onComplete: finishAnimation });

      tl.to(camera.position, { 
        x: camTargetPos.x, y: camTargetPos.y, z: camTargetPos.z, 
        duration: 1.8, ease: "power4.inOut",
        onUpdate: () => camera.lookAt(animatedTarget.current)
      }, 0);

      tl.to(animatedTarget.current, { 
        x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, 
        duration: 1.8, ease: "power4.inOut",
        onUpdate: () => camera.lookAt(animatedTarget.current)
      }, 0);

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

// 📖 9. 合成图鉴组件 (分组显示)
function CraftingCodex({ careers, recipes, isOpen, onClose, onLocate }: { 
  careers: CareerData[]; 
  recipes: Record<string, number>; 
  isOpen: boolean; 
  onClose: () => void;
  onLocate: (idA: number, idB: number) => void;
}) {
  if (!isOpen) return null;

  const groupedRecipes: Record<number | 'cross', any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], cross: [] };
  
  Object.entries(recipes).forEach(([key, resultId]) => {
    const [idA, idB] = key.split('-').map(Number);
    const catA = careers[idA].category;
    const catB = careers[idB].category;
    const entry = { key, a: careers[idA], b: careers[idB], result: careers[resultId] };
    
    if (catA === catB) {
      groupedRecipes[catA].push(entry);
    } else {
      groupedRecipes.cross.push(entry);
    }
  });

  return (
    <motion.div 
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-24 left-6 z-40 w-80 bg-black/90 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-xl shadow-2xl max-h-[80vh] flex flex-col"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0">
        <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">🧪</span> 合成图鉴
        </h3>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-xl">✕</button>
      </div>
      
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {[0, 1, 2, 3, 4].map(catId => (
          groupedRecipes[catId].length > 0 && (
            <div key={catId} className="space-y-2">
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[catId] }}></span>
                {CATEGORY_NAMES[catId]}
              </div>
              {groupedRecipes[catId].map((r, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onLocate(r.a.id, r.b.id)}
                  className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between text-xs hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1 flex-1">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px] group-hover:bg-white/20">{r.a.name}</span>
                    <span className="text-cyan-400 font-bold">+</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px] group-hover:bg-white/20">{r.b.name}</span>
                  </div>
                  <div className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap ml-1">
                    <span className="text-white/40 group-hover:text-white">→</span> {r.result.name}
                  </div>
                </div>
              ))}
            </div>
          )
        ))}

        {groupedRecipes.cross.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">✨</span> 隐藏跨领域配方
            </div>
            {groupedRecipes.cross.map((r, idx) => (
              <div 
                key={idx} 
                onClick={() => onLocate(r.a.id, r.b.id)}
                className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 flex items-center justify-between text-xs hover:bg-purple-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 flex-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.a.name}</span>
                  <span className="text-purple-400 font-bold">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate max-w-[70px]">{r.b.name}</span>
                </div>
                <div className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap ml-1">
                  <span className="text-white/40">→</span> {r.result.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/40 text-center flex-shrink-0">
        💡 点击配方自动定位星球
      </div>
    </motion.div>
  );
}

// 🌌 10. 主场景
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
  
  const [careersWithAttack, setCareersWithAttack] = useState<Set<number>>(new Set());
  
  const [toast, setToast] = useState<{ msg: string, visible: boolean, type: 'error' | 'success' | 'warning' }>({ msg: "", visible: false, type: 'warning' });
  
  const [cameraTrigger, setCameraTrigger] = useState(0);
  
  const { careers, futureNodes } = useMemo(() => generateUniverseData(), []);

  const showToast = (msg: string, type: 'error' | 'success' | 'warning' = 'warning') => {
    setToast({ msg, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const forceFlyTo = (careerId: number) => {
    setActiveId(careerId);
    setCameraTrigger(prev => prev + 1);
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
  }, [userSkills]);

  const handleLocateRecipe = (idA: number, idB: number) => {
    setShowCodex(false);
    const skillA = careers[idA];
    const skillB = careers[idB];
    
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

    let targetId = idA;
    let message = "";

    if (userSkills.has(idA) && !userSkills.has(idB)) {
      targetId = idB;
      message = `原料 ${skillA.name} 已就绪！请飞向 ${skillB.name} 完成模拟解锁它！`;
    } else if (!userSkills.has(idA) && userSkills.has(idB)) {
      targetId = idA;
      message = `原料 ${skillB.name} 已就绪！请飞向 ${skillA.name} 完成模拟解锁它！`;
    } else {
      targetId = idA;
      message = `需要先点亮 ${skillA.name} 和 ${skillB.name}。请先完成 ${skillA.name} 的模拟！`;
    }

    setSelectedForCraft(null);
    forceFlyTo(targetId);
    showToast(`🧭 ${message}`, 'warning');
  };

  const handlePlanetClick = (career: CareerData) => {
    const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every(prereqId => userSkills.has(prereqId));
    
    if (isLocked) {
      forceFlyTo(career.id);
      const prereqNames = career.prerequisites.map(id => careers[id].name).join(", ");
      showToast(`🔒 前置技能未满足！需要先点亮：${prereqNames}`, 'error');
      return;
    }

    if (careersWithAttack.has(career.id)) {
      setCareersWithAttack(prev => {
        const next = new Set(prev);
        next.delete(career.id);
        return next;
      });
      showToast("✅ 危机已解除！技能恢复正常。", 'success');
      return;
    }

    if (selectedForCraft !== null && selectedForCraft !== career.id) {
      const idA = Math.min(selectedForCraft, career.id);
      const idB = Math.max(selectedForCraft, career.id);
      const key = `${idA}-${idB}`;
      const resultId = CRAFTING_RECIPES[key];
      
      if (resultId !== undefined) {
        if (!userSkills.has(resultId)) {
          setUserSkills(prev => new Set(prev).add(resultId));
          showToast(`🎉 合成成功！解锁：${careers[resultId].name}`, 'success');
          forceFlyTo(resultId);
        } else {
          showToast("⚠️ 该技能已解锁。", 'warning');
        }
      } else {
        showToast("❌ 合成失败！配方不正确。", 'error');
      }
      setSelectedForCraft(null);
    } 
    else if (userSkills.has(career.id)) {
      if (selectedForCraft === career.id) {
        setSelectedForCraft(null);
        showToast("已取消合成选中。", 'warning');
      } else {
        setSelectedForCraft(career.id);
        forceFlyTo(career.id);
        showToast("🔧 已选中。点击另一个已点亮技能进行合成。", 'warning');
      }
    } 
    else {
      forceFlyTo(career.id);
      setSelectedCareer(career);
    }
  };

  const handleSimulationComplete = (careerId: number, success: boolean) => {
    if (success) {
      setUserSkills(prev => {
        const newSkills = new Set(prev);
        newSkills.add(careerId);
        
        const currentCareer = careers.find(c => c.id === careerId);
        if (currentCareer) {
          const masteredCount = Array.from(newSkills).filter(id => careers[id].category === currentCareer.category).length;
          if (masteredCount >= 5) {
            setUnlockedPaths(prevPaths => {
              const newPaths = new Set(prevPaths);
              newPaths.add(currentCareer.category);
              return newPaths;
            });
          }
        }
        return newSkills;
      });
    } else {
      showToast("⚠️ 模拟失败！总监对你的表现很不满意。", 'error');
    }
    setSelectedCareer(null);
    setActiveId(null);
  };

  const displayLabelId = activeId !== null ? activeId : hoveredId;
  const labelCareer = careers.find(c => c.id === displayLabelId);

  const toastColor = toast.type === 'error' ? 'bg-red-500/90 border-red-400/50' : (toast.type === 'success' ? 'bg-green-500/90 border-green-400/50' : 'bg-yellow-500/90 border-yellow-400/50');

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className={`${toastColor} text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-md border font-bold text-sm flex items-center gap-2`}>
          {toast.msg}
        </div>
      </div>

      {!selectedCareer && (
        <button 
          onClick={() => setShowCodex(!showCodex)}
          className="absolute top-6 right-6 z-40 bg-black/80 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-bold text-sm"
        >
          <span>🧪</span> 合成图鉴
        </button>
      )}

      <AnimatePresence>
        {showCodex && (
          <CraftingCodex 
            careers={careers} 
            recipes={CRAFTING_RECIPES} 
            isOpen={showCodex} 
            onClose={() => setShowCodex(false)} 
            onLocate={handleLocateRecipe}
          />
        )}
      </AnimatePresence>

      {selectedForCraft !== null && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 border border-cyan-500/50 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl">
          <div className="text-cyan-400 font-bold text-sm">
            🔧 合成台：已选中 <span className="text-white">{careers[selectedForCraft].name}</span> · 点击另一个已点亮技能
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-cyan-400 font-mono text-xs tracking-widest mb-1">SYSTEM STATUS</div>
        <div className="text-white font-mono text-2xl font-bold">
          SKILLS MASTERED: <span className="text-yellow-400">{userSkills.size}</span> / 100
        </div>
        <div className="text-yellow-400 font-mono text-sm mt-2">
          DESTINY PATHS UNLOCKED: <span className="text-white">{unlockedPaths.size}</span> / 5
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 50], fov: 60 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} /> 
          <pointLight position={[50, 50, 50]} intensity={1.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="night" />

          <mesh frustumCulled={false}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} toneMapped={false} />
          </mesh>

          <Connections careers={careers} userSkills={userSkills} />
          
          <DestinyPaths 
            careers={careers} 
            userSkills={userSkills} 
            futureNodes={futureNodes} 
            unlockedPaths={unlockedPaths} 
          />

          {careers.map((career) => {
            const isLocked = career.prerequisites.length > 0 && !career.prerequisites.every(prereqId => userSkills.has(prereqId));
            const isUnderAttack = careersWithAttack.has(career.id);
            const isSelected = selectedForCraft === career.id;
            
            return (
              <ProceduralPlanet
                key={career.id}
                data={career}
                isActive={activeId === career.id}
                isMastered={userSkills.has(career.id)}
                isLocked={isLocked}
                isUnderAttack={isUnderAttack}
                isSelected={isSelected}
                onHover={setHoveredId}
                onClick={() => handlePlanetClick(career)}
              />
            );
          })}

          {futureNodes.map(node => (
            <FutureNode 
              key={node.id} 
              data={node} 
              isUnlocked={unlockedPaths.has(node.category)} 
            />
          ))}

          {!isCameraMoving && !selectedCareer && labelCareer && (
            (userSkills.has(labelCareer.id) || activeId === labelCareer.id || hoveredId === labelCareer.id) && (
              <Html 
                position={[labelCareer.position.x, labelCareer.position.y + 1.8, labelCareer.position.z]} 
                center 
                distanceFactor={15} 
                className="pointer-events-none"
                style={{ transition: 'opacity 0.3s ease-in-out' }}
              >
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.5)] whitespace-nowrap border ${activeId === labelCareer.id ? 'bg-white/20 border-white/50 text-white' : 'bg-black/90 border-white/20 text-white'}`}>
                  {labelCareer.name}
                  <div className="text-[10px] text-white/70 mt-0.5 text-center">匹配度 {labelCareer.match}%</div>
                </div>
              </Html>
            )
          )}

          <OrbitControls 
            ref={controlsRef}
            enablePan={false} 
            enableZoom={true} 
            minDistance={10} 
            maxDistance={80}
            enableDamping 
            dampingFactor={0.05}
          />

          <CameraController 
            trigger={cameraTrigger}
            targetPosition={activeId !== null ? careers.find(c => c.id === activeId)?.position || null : null} 
            isActive={activeId !== null} 
            controlsRef={controlsRef} 
            onAnimStart={() => setIsCameraMoving(true)}
            onAnimEnd={() => setIsCameraMoving(false)}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} /> 
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {selectedCareer && (
        <CareerDetailPanel 
          career={selectedCareer}
          onSimulationComplete={handleSimulationComplete}
          onClose={() => { setActiveId(null); setSelectedCareer(null); }} 
        />
      )}
    </div>
  );
}