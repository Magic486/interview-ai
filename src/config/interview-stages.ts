import type { CompanyFlow } from "@/types";

export const COMPANY_FLOWS: Record<string, CompanyFlow> = {
  bytedance: {
    name: "字节跳动",
    stages: [
      {
        id: "algorithm",
        name: "算法面",
        duration: 45,
        focus: "数据结构与算法",
        topics: "数组、链表、二叉树、动态规划、排序算法，2道中等难度题",
      },
      {
        id: "project",
        name: "项目深挖面",
        duration: 45,
        focus: "项目经验与技术深度",
        topics: "简历项目深挖、系统设计基础、技术选型理由、常见后端问题",
      },
      {
        id: "hr",
        name: "HR 面",
        duration: 30,
        focus: "综合素质与职业规划",
        topics: "价值观匹配、职业规划、团队协作、薪资期望",
      },
    ],
    stressAvailable: ["algorithm", "project"],
  },
  alibaba: {
    name: "阿里巴巴",
    stages: [
      {
        id: "algorithm",
        name: "算法面",
        duration: 45,
        focus: "算法与编程能力",
        topics: "常见算法题2道，侧重工程实现和代码质量",
      },
      {
        id: "project",
        name: "技术一面",
        duration: 45,
        focus: "技术基础与项目经验",
        topics: "Java基础、Spring框架、数据库、中间件、项目深挖",
      },
      {
        id: "cross",
        name: "交叉面",
        duration: 45,
        focus: "跨团队技术视野",
        topics: "系统设计、架构能力、技术广度、业务理解",
      },
      {
        id: "hr",
        name: "HR 面",
        duration: 30,
        focus: "价值观与文化匹配",
        topics: "阿里价值观、职业规划、压力应对、团队协作",
      },
    ],
    stressAvailable: ["algorithm", "project", "cross"],
  },
  tencent: {
    name: "腾讯",
    stages: [
      {
        id: "project",
        name: "技术一面",
        duration: 45,
        focus: "技术基础与项目",
        topics: "C++/Go基础、网络编程、数据库、项目经验深挖",
      },
      {
        id: "project",
        name: "技术二面",
        duration: 45,
        focus: "架构设计与深度技术",
        topics: "系统架构设计、分布式系统、高可用方案、技术选型对比",
      },
      {
        id: "hr",
        name: "HR 面",
        duration: 30,
        focus: "综合素质",
        topics: "沟通能力、团队协作、职业规划、文化适应",
      },
    ],
    stressAvailable: ["project"],
  },
  meituan: {
    name: "美团",
    stages: [
      {
        id: "algorithm",
        name: "算法面",
        duration: 45,
        focus: "算法与数据结构",
        topics: "2道算法题，侧重实际问题建模和代码质量",
      },
      {
        id: "project",
        name: "技术面",
        duration: 45,
        focus: "技术深度与项目",
        topics: "Java/Go技术栈、MySQL优化、Redis应用、项目深挖",
      },
      {
        id: "hr",
        name: "HR 面",
        duration: 30,
        focus: "综合素质",
        topics: "学习能力、团队精神、抗压能力、职业规划",
      },
    ],
    stressAvailable: ["algorithm", "project"],
  },
};

export const ROLES = [
  "后端开发工程师",
  "前端开发工程师",
  "全栈开发工程师",
  "算法工程师",
  "数据分析师",
  "产品经理",
  "测试开发工程师",
  "运维开发工程师",
];

export const DEFAULT_COMPANY = "bytedance";
