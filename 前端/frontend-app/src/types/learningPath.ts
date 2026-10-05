// src/types/learningPath.ts

// 任务类型
export type TaskType = 'quiz' | 'note' | 'career_map' | 'industry_intro' | 'project' | 'summary' | 'radar' | 'advice';

// 任务状态
export type TaskStatus = 'locked' | 'available' | 'in-progress' | 'completed';

// 阶段状态
export type StageStatus = 'locked' | 'active' | 'completed';

// 任务内容（根据类型不同，结构不同）
export interface TaskContent {
  // 答题类
  questions?: any[]; // 复用之前的 Question 类型
  // 笔记类
  text?: string;
  // 职业路径图类
  pathNodes?: { title: string; description: string; years: string }[];
  // 行业科普类
  industryInfo?: { title: string; content: string };
  // 项目实战类
  projectBrief?: string;
  requirements?: string[];
  // 总结类
  summaryTemplate?: string;
  // 雷达图类
  radarData?: { subject: string; value: number }[];
  // 建议类
  adviceText?: string;
}

// 单个任务
export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  progress: 0; // 0 到 100
  estimatedTime: string;
  content?: TaskContent;
}

// 阶段
export interface Stage {
  id: string;
  title: string;
  subtitle: string; // 例如：针对 高二 高考/竞赛压轴题型...
  description: string;
  status: StageStatus;
  tasks: Task[];
  // 解锁条件（可选）
  unlockCondition?: {
    minAssessmentScore?: number; // 评估最低分
    previousStageCompleted?: boolean;
  };
}

// 完整的学习路径
export interface LearningPath {
  studentId: string;
  grade: string;
  selectedCareer: string;
  mathSelfScore: number; // 0-100
  assessmentScore: number; // 0-100 (根据答题正确率计算)
  stages: Stage[];
  currentStageIndex: number;
  totalProgress: number; // 0-100
}