# CLAUDE.md

## Web / UI development

For any request to create or update a website, page, or UI component:

- **Always use the `ui-ux-pro-max` skill** (`.claude/skills/ui-ux-pro-max/`) for design decisions — grids, typography, color, accessibility, responsive layout. Run its search tool (`python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>` or `--design-system` for a new page/project) before hand-picking styles or colors.
- **Always use the Magic MCP (`21st`) tools** to search and pull in existing React/Tailwind components instead of building common UI patterns from scratch, when the stack supports it.
- Requires `TWENTY_FIRST_API_KEY` to be set as an environment variable (see `.mcp.json`) — get a free key at 21st.dev/mcp.
