import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  rawText: text("raw_text").notNull(),
  parsedSkills: jsonb("parsed_skills").$type<
    { name: string; level: string; years: number }[]
  >(),
  parsedExperience: jsonb("parsed_experience").$type<
    { title: string; company: string; description: string; techStack: string[] }[]
  >(),
  education: text("education"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  resumeId: uuid("resume_id").references(() => resumes.id),
  role: text("role").notNull(),
  companyType: text("company_type").notNull(),
  mode: text("mode").$type<"normal" | "reversed">().notNull().default("normal"),
  stressMode: boolean("stress_mode").notNull().default(false),
  status: text("status")
    .$type<"in_progress" | "completed" | "abandoned">()
    .notNull()
    .default("in_progress"),
  currentStage: text("current_stage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id")
    .references(() => interviews.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").$type<"interviewer" | "candidate" | "system">().notNull(),
  content: text("content").notNull(),
  stage: text("stage").notNull(),
  codeSnippet: text("code_snippet"),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id")
    .references(() => interviews.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  overallScore: integer("overall_score").notNull(),
  dimensionScores: jsonb("dimension_scores").notNull(),
  strengths: jsonb("strengths").$type<
    { point: string; example: string }[]
  >(),
  weaknesses: jsonb("weaknesses").$type<
    { point: string; example: string; suggestion: string }[]
  >(),
  perQuestionAnalysis: jsonb("per_question_analysis").$type<
    { question: string; yourAnswer: string; score: number; strengths: string[]; weaknesses: string[]; suggestedAnswer: string }[]
  >(),
  improvementPlan: jsonb("improvement_plan").$type<
    { area: string; action: string; resources: string[] }[]
  >(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const learningPaths = pgTable("learning_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  targetRole: text("target_role").notNull(),
  gapAnalysis: jsonb("gap_analysis").notNull(),
  steps: jsonb("steps").$type<
    { order: number; title: string; description: string; resources: { name: string; url: string; type: string }[]; estimatedDuration: string }[]
  >(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
