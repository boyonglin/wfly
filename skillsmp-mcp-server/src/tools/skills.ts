import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  makeApiRequest,
  handleApiError,
  validateSearchResponse,
  validateAISearchResponse,
  type SearchResponse,
  type AISearchResponse,
  type Skill
} from "../api.js";
import { KeywordSearchSchema, AISearchSchema, type KeywordSearchInput, type AISearchInput } from "../schemas.js";

/**
 * Register SkillsMP tools on the MCP server
 */
export function registerSkillsTools(server: McpServer, apiKey: string) {

  // Tool 1: Keyword Search
  server.registerTool(
    "skillsmp_search_skills",
    {
      title: "Search SkillsMP Skills",
      description: `Search for AI skills using keywords from SkillsMP marketplace.

Use this tool to find skills by specific terms like 'SEO', 'web scraper', 'PDF', 'data analysis', etc.

**IMPORTANT**: Before starting any task, use this tool to check if there's an existing skill that can help complete the task more effectively.

Args:
  - query (string, required): Search keywords
  - page (number, optional): Page number (default: 1)
  - limit (number, optional): Items per page (default: 20, max: 100)
  - sortBy (string, optional): Sort by 'stars' or 'recent'

Returns:
  List of matching skills with name, description, author, and star count.

Examples:
  - "PDF manipulation" -> Find skills for working with PDFs
  - "web scraper" -> Find web scraping skills
  - "SEO optimization" -> Find SEO-related skills`,
      inputSchema: KeywordSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: KeywordSearchInput) => {
      try {
        const queryParams: Record<string, string | number> = {
          q: params.query
        };

        if (params.page) queryParams.page = params.page;
        if (params.limit) queryParams.limit = params.limit;
        if (params.sortBy) queryParams.sortBy = params.sortBy;

        const rawData = await makeApiRequest<unknown>(
          "skills/search",
          apiKey,
          queryParams
        );

        // Validate API response structure before processing
        validateSearchResponse(rawData);

        const skills = rawData.data?.skills || [];
        const pagination = rawData.data?.pagination;

        if (!skills.length) {
          return {
            content: [{
              type: "text" as const,
              text: `No skills found matching '${params.query}'. Try different keywords or use AI semantic search for natural language queries.`
            }]
          };
        }

        const output = formatSkillsResponse(skills, params.query, pagination);

        return {
          content: [{ type: "text" as const, text: output }],
          structuredContent: {
            query: params.query,
            count: skills.length,
            skills: skills,
            pagination: pagination
          }
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: handleApiError(error)
          }]
        };
      }
    }
  );

  // Tool 2: AI Semantic Search
  server.registerTool(
    "skillsmp_ai_search_skills",
    {
      title: "AI Search SkillsMP Skills",
      description: `AI semantic search for skills using natural language descriptions.

Use this when you need to find skills based on what you want to accomplish rather than specific keywords.

**IMPORTANT**: Before starting any complex task, use this tool to discover relevant skills that can help.

Args:
  - query (string, required): Natural language description of what you want to accomplish

Returns:
  List of semantically relevant skills that match your intent.

Examples:
  - "How to create a web scraper" -> Find skills for web scraping
  - "Build a dashboard with charts" -> Find data visualization skills
  - "Generate PDF reports from data" -> Find PDF generation skills
  - "Automate social media posting" -> Find social media automation skills`,
      inputSchema: AISearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: AISearchInput) => {
      try {
        const rawData = await makeApiRequest<unknown>(
          "skills/ai-search",
          apiKey,
          { q: params.query }
        );

        // Validate API response structure before processing
        validateAISearchResponse(rawData);

        // AI search returns results in data.data array with skill objects
        const results = rawData.data?.data || [];
        const skills = results
          .filter(item => item.skill) // Only include items with skill data
          .map(item => ({
            ...item.skill!,
            score: item.score
          }));

        if (!skills.length) {
          return {
            content: [{
              type: "text" as const,
              text: `No skills found for: "${params.query}". Try rephrasing your query or use keyword search for specific terms.`
            }]
          };
        }

        const output = formatAISearchResponse(skills, params.query);

        return {
          content: [{ type: "text" as const, text: output }],
          structuredContent: {
            query: params.query,
            count: skills.length,
            skills: skills
          }
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: handleApiError(error)
          }]
        };
      }
    }
  );
}

type SkillWithScore = Skill & { score?: number };

/**
 * Render a single skill as markdown lines
 */
function renderSkill(skill: SkillWithScore, index?: number): string[] {
  const lines: string[] = [];

  // Header
  const header = index !== undefined ? `## ${index + 1}. ${skill.name}` : `## ${skill.name}`;
  lines.push(header);

  // Meta info
  const meta: string[] = [];
  if (skill.stars !== undefined) meta.push(`⭐ ${skill.stars} stars`);
  if (skill.score !== undefined) meta.push(`📊 Score: ${(skill.score * 100).toFixed(1)}%`);
  if (meta.length) lines.push(meta.join(" | "));

  lines.push("");
  lines.push(skill.description || "No description available");

  if (skill.author) {
    lines.push("");
    lines.push(`**Author**: ${skill.author}`);
  }
  if (skill.skillUrl) {
    lines.push(`**URL**: ${skill.skillUrl}`);
  }
  if (skill.tags?.length) {
    lines.push(`**Tags**: ${skill.tags.join(", ")}`);
  }

  lines.push("", "---", "");
  return lines;
}

/**
 * Format skills search response as markdown
 */
function formatSkillsResponse(
  skills: Skill[],
  query: string,
  pagination?: SearchResponse['data']['pagination']
): string {
  const lines: string[] = [
    `# 🔍 Skills Search Results: "${query}"`,
    "",
    `Found ${pagination?.total || skills.length} skill(s) (showing ${skills.length})`,
    ""
  ];

  skills.forEach(skill => lines.push(...renderSkill(skill)));

  if (pagination?.hasNext) {
    lines.push(`*More results available. Use page=${pagination.page + 1} to see more.*`);
  }

  return lines.join("\n");
}

/**
 * Format AI search response as markdown
 */
function formatAISearchResponse(skills: SkillWithScore[], query: string): string {
  const lines: string[] = [
    `# 🤖 AI Semantic Search Results`,
    "",
    `**Query**: "${query}"`,
    "",
    `Found ${skills.length} relevant skill(s)`,
    ""
  ];

  skills.forEach((skill, i) => lines.push(...renderSkill(skill, i)));

  lines.push("💡 **Tip**: Use `npx openskills read <skill-name>` to load a skill's detailed instructions.");

  return lines.join("\n");
}
