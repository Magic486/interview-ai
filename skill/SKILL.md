# Resume Career Analyzer — 简历解析与职业分析 Skill

> ArkClaw Skill · v1.0.0

## 功能描述

接收用户上传的简历文件（PDF/图片/文本），使用 LLM 提取技能栈、工作经历、项目经验，并与目标岗位要求做差距分析，输出技能差距报告和推荐学习资源。

## 输入

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `resume_file` | file (pdf/jpg/png/txt) | 是 | 简历文件 |
| `target_role` | string | 否 | 目标岗位（不传则只做解析） |

## 输出

| 字段 | 类型 | 说明 |
|---|---|---|
| `parsed_skills` | object[] | `[{name, level, years}]` |
| `parsed_experience` | object[] | `[{title, company, tech_stack}]` |
| `skill_gap` | object | 与 target_role 的差距分析 JSON |
| `recommended_learning` | object[] | 推荐学习资源列表 |

## 实现流程

```
用户上传简历 → Skill 接收文件
  → LLM 解析文本内容
  → 结构化提取技能/经验
  → (如果有 target_role) 对比目标岗位标准能力模型
  → 输出 skill_gap + 建议学习资源
```

## 内部 Prompt 模板

```
## 角色
你是一个职业规划分析专家，专门负责解析求职者简历并进行技能分析。

## 任务
1. 从简历中提取以下信息：
   - 技能列表（技能名称、熟悉程度：入门/熟悉/精通、使用年限）
   - 工作/项目经历（职位、公司、描述、技术栈）
   - 教育背景

2. 如果提供了目标岗位，对比当前技能与目标岗位要求，输出：
   - 当前已有技能
   - 目标岗位要求技能
   - 缺失技能列表
   - 技能匹配率

3. 针对缺失技能，推荐 3-5 个学习资源（课程、书籍、项目），按优先级排序

## 输出格式
严格使用 JSON 格式输出，不要包含其他文字。
```

## 与 Web 应用的集成

```
Web 应用 Server Action
  → /api/chat 路由中的 analyzeResume() 函数
    → 直接调用 LLM（默认方式）
    → 或调用本 Skill 的标准化接口
```

## 独立运行测试

将简历文件放入 skill 目录，运行测试：

```bash
# 测试简历解析
npm run skill:parse -- --file=./skill/sample-resume.pdf

# 测试差距分析  
npm run skill:gap -- --file=./skill/sample-resume.pdf --role="后端开发工程师"
```
