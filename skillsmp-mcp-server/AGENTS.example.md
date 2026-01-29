# AGENTS.md Example

This is an example AGENTS.md file showing how to add the SkillsMP skill discovery workflow.

Copy the `<workflow>` section below and paste it at the top of your AGENTS.md file (before `<skills_system>`).

---

```markdown
<workflow priority="0">
## Pre-Task Discovery

Before starting any complex task, use `skillsmp_ai_search_skills` MCP tool to discover relevant skills from SkillsMP marketplace that can help complete the task more effectively.

Example: If asked to "build a landing page", search for skills first:
```

skillsmp_ai_search_skills({ query: "build a landing page" })

```

If a relevant skill is found, load it with:
```

npx openskills read <skill-name>

```
</workflow>
```

---

## Setup Requirements

1. **MCP Server**: Add to your VS Code `mcp.json` or Claude Desktop config:

```json
{
  "mcp": {
    "servers": {
      "skillsmp": {
        "type": "stdio",
        "command": "node",
        "args": ["path/to/skillsmp-mcp-server/dist/index.js"],
        "env": {
          "SKILLSMP_API_KEY": "your-api-key-here"
        }
      }
    }
  }
}
```

2. **API Key**: Get your API key from https://skillsmp.com/docs/api

3. **Build the server** (if not already built):

```bash
cd skillsmp-mcp-server
npm install
npm run build
```

## How It Works

1. AI receives a complex task
2. AI searches SkillsMP for relevant skills using `skillsmp_ai_search_skills`
3. If a relevant skill is found, AI loads it with `npx openskills read <skill-name>`
4. AI follows the skill's instructions to complete the task
