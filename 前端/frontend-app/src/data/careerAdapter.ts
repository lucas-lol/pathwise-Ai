// src/data/careerAdapter.ts
// 适配层：把 careers.json 的真实职业数据，翻译成现有 3D 宇宙认识的格式。
// 基石 1：内部 id = 数字索引（兼容现有 userSkills/recipes），原始 id 存为 slug。
// 基石 2：category 通过 CATEGORY_RULES 归并为 5 大星系（兼容现有索引逻辑）。
import * as THREE from 'three';
import rawCareers from './careers.json';

export interface AdaptedCareer {
  id: number;              // 内部数字主键（= 排序后索引）
  slug: string;            // 原始字符串 id（如 software_engineer）
  name: string;            // 中文名
  nameEn: string;          // 英文名
  category: number;        // 0-4 星系编号
  categoryName: string;    // 星系名
  position: THREE.Vector3; // 斐波那契球坐标
  complexity: number;      // 0-1 复杂度
  tier: number;            // 0-3 前置依赖层级
  requiredSkills: string[];
  preferredKnowledge: string[];
  careerPath: string;      // 晋升链
  interestTags: string[];
  goalTags: string[];
  match: number;           // 匹配度（详情面板用）
}

export const GALAXY_NAMES = ['科技与 AI', '工程与建造', '数据与金融', '科学与生命', '商业与社会'];

// 11 类 → 5 星系 的归并规则（先匹配先赢，最后 fallback 到 4）
const CATEGORY_RULES: { test: (c: string) => boolean; galaxy: number }[] = [
  { test: c => c.includes('新兴') || c.includes('Emerging'), galaxy: 0 },
  { test: c => c.includes('科技') || c.includes('Technology'), galaxy: 0 },
  { test: c => c.includes('工程') || c.includes('Engineering'), galaxy: 1 },
  { test: c => c.includes('建筑') || c.includes('设计') || c.includes('Design'), galaxy: 1 },
  { test: c => c.includes('数据') || c.includes('Data') || c.includes('金融') || c.includes('Finance') || c.includes('会计') || c.includes('Accounting'), galaxy: 2 },
  { test: c => c.includes('科学') || c.includes('Science') || c.includes('医疗') || c.includes('Healthcare'), galaxy: 3 },
  { test: () => true, galaxy: 4 }, // 商业、法律、教育等
];

function mapCategory(raw: string): number {
  const rule = CATEGORY_RULES.find(r => r.test(raw));
  return rule ? rule.galaxy : 4;
}

// 高阶技能：含这些软技能/跨领域技能越多的职业，tier 越高（前置依赖越深）
const ADVANCED_SKILLS = ['Scientific Thinking', 'Business Thinking', 'Creative Thinking', 'Social Intelligence', 'Visual Communication'];

function computeTier(requiredSkills: string[]): number {
  const count = requiredSkills.filter(s => ADVANCED_SKILLS.includes(s)).length;
  return Math.min(3, count);
}

// 斐波那契球均匀分布
function fibonacciSphere(index: number, total: number, radius: number): THREE.Vector3 {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(1, total - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * index;
  return new THREE.Vector3(
    Math.cos(theta) * r * radius,
    y * radius,
    Math.sin(theta) * r * radius,
  );
}

export function loadCareers(): AdaptedCareer[] {
  // 先按星系排序，让同星系索引连续 → 在斐波那契球上自然聚集成"星区"
  const sorted = [...(rawCareers as any[])].sort((a, b) => mapCategory(a.category) - mapCategory(b.category));
  const total = sorted.length;

  return sorted.map((raw, index) => {
    const category = mapCategory(raw.category);
    const requiredSkills: string[] = raw.required_skills || [];
    const preferredKnowledge: string[] = raw.preferred_knowledge || [];
    const tier = computeTier(requiredSkills);
    const complexity = Math.min(0.95, Math.max(0.3,
      0.3 + (requiredSkills.length - 4) * 0.1 + (preferredKnowledge.length - 5) * 0.08 + tier * 0.1
    ));

    return {
      id: index,
      slug: raw.id,
      name: raw.name_cn,
      nameEn: raw.name_en,
      category,
      categoryName: GALAXY_NAMES[category],
      position: fibonacciSphere(index, total, 22),
      complexity,
      tier,
      requiredSkills,
      preferredKnowledge,
      careerPath: raw.career_path || '',
      interestTags: raw.interest_tags || [],
      goalTags: raw.goal_tags || [],
      match: Math.round(60 + complexity * 35),
    };
  });
}

// ... 前面保留 CATEGORY_RULES, mapCategory, computeTier, fibonacciSphere 等函数不变 ...

// 🌟 提取核心处理逻辑，供本地和远端复用
export function processRawCareers(rawCareers: any[]): AdaptedCareer[] {
  const sorted = [...rawCareers].sort((a, b) => mapCategory(a.category) - mapCategory(b.category));
  const total = sorted.length;

  return sorted.map((raw, index) => {
    const category = mapCategory(raw.category);
    const requiredSkills: string[] = raw.required_skills || [];
    const preferredKnowledge: string[] = raw.preferred_knowledge || [];
    const tier = computeTier(requiredSkills);
    const complexity = Math.min(0.95, Math.max(0.3,
      0.3 + (requiredSkills.length - 4) * 0.1 + (preferredKnowledge.length - 5) * 0.08 + tier * 0.1
    ));

    return {
      id: index,
      slug: raw.id,
      name: raw.name_cn,
      nameEn: raw.name_en,
      category,
      categoryName: GALAXY_NAMES[category],
      position: fibonacciSphere(index, total, 22),
      complexity,
      tier,
      requiredSkills,
      preferredKnowledge,
      careerPath: raw.career_path || '',
      interestTags: raw.interest_tags || [],
      goalTags: raw.goal_tags || [],
      match: Math.round(60 + complexity * 35),
    };
  });
}

// 本地默认数据（作为 Fallback 保底）
export const CAREERS: AdaptedCareer[] = processRawCareers(rawCareers as any[]);

// 🔍 Phase 1 临时验证日志（确认数据正确后，Phase 2 可删除）
console.log('[careerAdapter] 职业总数:', CAREERS.length);
console.log('[careerAdapter] 星系分布:', GALAXY_NAMES.map((n, i) => `${n}=${CAREERS.filter(c => c.category === i).length}`).join(', '));