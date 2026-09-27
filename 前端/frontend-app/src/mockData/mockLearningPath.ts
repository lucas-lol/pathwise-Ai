// src/data/mockLearningPath.ts
import type { LearningPath, Stage } from '../types/learningPath';

// 辅助函数：根据分数生成阶段一的题目（客制化核心）
const generateStageOneTasks = (grade: string, assessmentScore: number) => {
  const isHighScore = assessmentScore >= 70;
  
  return [
    {
      id: 's1_t1',
      type: 'quiz' as const,
      title: isHighScore ? `【${grade}】高阶思维挑战` : `【${grade}】核心基础巩固`,
      description: isHighScore ? '10道压轴题型，挑战思维极限' : '10道基础概念题，夯实学科根基',
      status: 'available' as const,
      progress: 0,
      estimatedTime: '20分钟',
      content: {
        questions: [] // 这里后续接入真实的根据分数筛选的题目库
      }
    },
    {
      id: 's1_t2',
      type: 'note' as const,
      title: '核心概念精要',
      description: '本阶段必考知识点梳理',
      status: 'locked' as const,
      progress: 0,
      estimatedTime: '15分钟',
      content: {
        text: '这里是核心概念的富文本内容...'
      }
    }
  ];
};

// 生成完整路径的工厂函数
export const generateMockLearningPath = (
  studentId: string,
  grade: string,
  selectedCareer: string,
  mathSelfScore: number,
  assessmentScore: number
): LearningPath => {
  
  const stages: Stage[] = [
    {
      id: 'stage_1',
      title: '阶段一：夯实学科基础',
      subtitle: `针对 ${grade} 学科特点，进行${assessmentScore >= 70 ? '高强度' : '基础性'}思维训练`,
      description: '构建坚实的知识体系，为职业发展打下底层逻辑。',
      status: 'active',
      tasks: generateStageOneTasks(grade, assessmentScore),
      unlockCondition: { previousStageCompleted: false }
    },
    {
      id: 'stage_2',
      title: '阶段二：职业启蒙与探索',
      subtitle: `${selectedCareer} 行业深度解析`,
      description: '认知行业全貌，规划长远发展路径。',
      status: 'locked',
      tasks: [
        {
          id: 's2_t1',
          type: 'career_map',
          title: '职业发展路径图',
          description: '从入门到资深的晋升路线',
          status: 'locked',
          progress: 0,
          estimatedTime: '10分钟',
          content: {
            pathNodes: [
              { title: '初级工程师', description: '掌握基础工具，完成分配任务', years: '0-2年' },
              { title: '中级工程师', description: '独立负责模块，解决复杂问题', years: '2-4年' },
              { title: '技术专家', description: '架构设计，技术选型，团队指导', years: '5年+' }
            ]
          }
        },
        {
          id: 's2_t2',
          type: 'industry_intro',
          title: '行业前沿科普',
          description: '了解行业最新趋势与核心壁垒',
          status: 'locked',
          progress: 0,
          estimatedTime: '15分钟'
        }
      ],
      unlockCondition: { previousStageCompleted: true }
    },
    {
      id: 'stage_3',
      title: '阶段三：实战项目训练',
      subtitle: '知行合一，动手实践',
      description: '通过真实场景项目，检验学习成果。',
      status: 'locked',
      tasks: [
        {
          id: 's3_t1',
          type: 'project',
          title: 'Mini 项目实战',
          description: '独立完成一个小型综合项目',
          status: 'locked',
          progress: 0,
          estimatedTime: '3天',
          content: {
            projectBrief: '项目背景与目标...',
            requirements: ['需求分析', '方案设计', '代码实现']
          }
        },
        {
          id: 's3_t2',
          type: 'summary',
          title: '学习历程总结',
          description: '复盘与反思',
          status: 'locked',
          progress: 0,
          estimatedTime: '30分钟'
        }
      ],
      unlockCondition: { previousStageCompleted: true }
    },
    {
      id: 'stage_4',
      title: '阶段四：综合能力评估',
      subtitle: '数据驱动，精准提升',
      description: '全方位评估能力模型，生成专属建议。',
      status: 'locked',
      tasks: [
        {
          id: 's4_t1',
          type: 'radar',
          title: '能力雷达图评估',
          description: '可视化你的能力分布',
          status: 'locked',
          progress: 0,
          estimatedTime: '5分钟',
          content: {
            radarData: [
              { subject: '逻辑推理', value: 80 },
              { subject: '计算能力', value: 65 },
              { subject: '空间想象', value: 70 },
              { subject: '实际应用', value: 50 },
              { subject: '创新思维', value: 85 }
            ]
          }
        },
        {
          id: 's4_t2',
          type: 'advice',
          title: '个性化学习建议',
          description: '基于评估结果的专属指南',
          status: 'locked',
          progress: 0,
          estimatedTime: '10分钟',
          content: {
            adviceText: '建议加强实际应用能力的训练...'
          }
        }
      ],
      unlockCondition: { previousStageCompleted: true }
    }
  ];

  return {
    studentId,
    grade,
    selectedCareer,
    mathSelfScore,
    assessmentScore,
    stages,
    currentStageIndex: 0,
    totalProgress: 0
  };
};