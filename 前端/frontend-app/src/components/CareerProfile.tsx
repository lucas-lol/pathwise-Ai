// src/components/CareerProfile.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Html, OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// 复用之前的星球组件
function ProfilePlanet({ data, position }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffd700" 
          emissiveIntensity={2} 
          toneMapped={false} 
        />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={10} className="pointer-events-none">
        <div className="bg-black/80 border border-yellow-500/50 text-yellow-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

// 连线组件
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
      points.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
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

  useFrame((state, delta) => {
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
  const r = 3.2;  //  增大半径
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

// 🌟 3D 雷达图外层组件
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
}

export default function CareerProfile({ userSkills, careers, onBack, abilityScores }: CareerProfileProps) {
  const masteredCareers = useMemo(() => {
    return careers.filter(c => userSkills.has(c.id));
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

  const hasRealData = abilityScores ? abilityScores.some(score => score > 0) : false;
  const radarSkills: number[] = hasRealData && abilityScores ? abilityScores : [12, 12, 12, 12, 12, 12];
  const categoryCount = [0, 0, 0, 0, 0];
  masteredCareers.forEach(c => categoryCount[c.category]++);
  const topCategory = categoryCount.indexOf(Math.max(...categoryCount));
  const futureTitles = ["首席 AI 架构师", "数据科学总监", "全栈技术专家", "产品副总裁", "设计总监"];
  const predictedTitle = userSkills.size > 0 ? futureTitles[topCategory] : "未知";

  const aiComment = userSkills.size === 0 
    ? "你尚未开始探索。回到宇宙，点亮你的第一个技能吧！"
    : userSkills.size < 5 
    ? "你已踏上旅程。继续保持好奇心，探索更多可能性。"
    : "你展现了强大的学习能力。你的技能树正在形成独特的形状。";

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex">
      <div className="w-[70%] h-full relative">
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
       const radarSkills = hasRealData ? abilityScore   <Stars radius={50} depth={30} count={1000} factor={2} saturation={0} fade speed={1} />
          
          {masteredCareers.map(career => (
            <ProfilePlanet 
              key={career.id} 
              data={career} 
              position={career.position} 
            />
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
            {userSkills.size} <span className="text-white/40 text-lg">/ 100 Skills</span>
          </div>
        </div>
      </div>

      <div className="w-[30%] h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-8 overflow-y-auto flex flex-col">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">全息职业档案</h2>
          <p className="text-white/60 text-sm">基于你的学习轨迹生成</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6 mb-6"
        >
          <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">AI 预测你的未来</div>
          <div className="text-2xl font-bold text-white">{predictedTitle}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
        >
          <h3 className="text-white/80 font-bold text-sm mb-4">能力模型</h3>
          <RadarChart3D skills={radarSkills} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1"
        >
          <h3 className="text-white/80 font-bold text-sm mb-4">AI 深度复盘</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {aiComment}
          </p>
        </motion.div>
      </div>
    </div>
  );
}