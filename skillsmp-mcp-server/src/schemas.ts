import { z } from "zod";

/**
 * Zod Schemas for SkillsMP Tools
 */

// Sort options enum
export enum SortBy {
  STARS = "stars",
  RECENT = "recent"
}

// Keyword Search Schema
export const KeywordSearchSchema = z.object({
  query: z.string()
    .min(1, "Query is required")
    .max(200, "Query must not exceed 200 characters")
    .describe("Search keywords for finding skills"),
  page: z.number()
    .int()
    .min(1)
    .default(1)
    .optional()
    .describe("Page number (default: 1)"),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .describe("Items per page (default: 20, max: 100)"),
  sortBy: z.nativeEnum(SortBy)
    .optional()
    .describe("Sort by: 'stars' or 'recent'")
}).strict();

export type KeywordSearchInput = z.infer<typeof KeywordSearchSchema>;

// AI Semantic Search Schema
export const AISearchSchema = z.object({
  query: z.string()
    .min(1, "Query is required")
    .max(500, "Query must not exceed 500 characters")
    .describe("Natural language description of what you want to accomplish")
}).strict();

export type AISearchInput = z.infer<typeof AISearchSchema>;
