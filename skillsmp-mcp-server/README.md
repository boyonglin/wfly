# SkillsMP MCP Server

An MCP (Model Context Protocol) server that enables AI assistants to search for skills from [SkillsMP](https://skillsmp.com) marketplace before starting any task.

## Features

- **Keyword Search**: Search skills using specific keywords like "PDF", "web scraper", "SEO"
- **AI Semantic Search**: Find skills using natural language descriptions powered by Cloudflare AI

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable           | Required | Description           |
| ------------------ | -------- | --------------------- |
| `SKILLSMP_API_KEY` | Yes      | Your SkillsMP API key |

Get your API key from: https://skillsmp.com/docs/api

### VS Code / Cursor Setup

Add to your `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "skillsmp": {
        "command": "node",
        "args": ["path/to/skillsmp-mcp-server/dist/index.js"],
        "env": {
          "SKILLSMP_API_KEY": "sk_live_skillsmp_YOUR_API_KEY"
        }
      }
    }
  }
}
```

### Claude Desktop Setup

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "skillsmp": {
      "command": "node",
      "args": ["/absolute/path/to/skillsmp-mcp-server/dist/index.js"],
      "env": {
        "SKILLSMP_API_KEY": "sk_live_skillsmp_YOUR_API_KEY"
      }
    }
  }
}
```

## Available Tools

### `skillsmp_search_skills`

Search for skills using keywords.

**Parameters:**

- `query` (string, required): Search keywords
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort by "stars" or "recent"

**Example:**

```
Search for "PDF manipulation" skills
```

### `skillsmp_ai_search_skills`

AI semantic search for skills using natural language.

**Parameters:**

- `query` (string, required): Natural language description of what you want to accomplish

**Example:**

```
Find skills for "How to create a web scraper that extracts product data"
```

## Usage Workflow

The recommended workflow is:

1. **Before starting any task**, search for relevant skills
2. If a matching skill is found, use `npx openskills read <skill-name>` to load it
3. Follow the skill's instructions to complete the task

## API Reference

This server uses the SkillsMP REST API:

- `GET /api/v1/skills/search` - Keyword search
- `GET /api/v1/skills/ai-search` - AI semantic search

## License

MIT
