# Kyaw Myo Khant portfolio

Next.js 15 (App Router) + Firebase. Public site: `components/home/` (Home, Scene = three.js background, ui, BlogShell).
Admin panel: `app/admin/`. Data lives in Firestore; the public site reads it server-side in `app/page.tsx`.
GitHub: `KyawMyo78/philip-portfolio` (remote `origin`). Do not push to `template` (portfolio-template).

## Updating portfolio content (live site)

Changes go live immediately. Use the facts the user gives you (CV, messages) and do not invent dates,
numbers or achievements. Ask before deleting anything.

**Preferred: the MCP connector** at `https://kyawmyokhant.com/api/mcp` (key as Bearer header, or in the path: `/api/mcp/<key>` for claude.ai) (tools: `get_overview`,
`update_profile`, `update_site_settings`, `list_items`, `create_item`, `update_item`, `delete_item`,
`list_contact_messages`, `list_recent_changes`). Every write is logged in the `claude-audit`
Firestore collection with the data before the change, so it can be undone.

**Or the REST API** with the key from `.env.local` (`CLAUDE_API_KEY`) as `Authorization: Bearer <key>`.
Never print, commit or paste the key. The key may only:
- GET/PUT `/api/profile`, `/api/site-settings`
- GET/POST/PUT/DELETE `/api/portfolio/{projects,skills,experience,achievements}[/id]`
- any method on `/api/admin/blog[/id]`
- GET `/api/portfolio/contacts[/id]` (contact messages, read only)
- POST `/api/upload`, DELETE `/api/delete-file`

Login, password reset, admin credentials and everything else are refused even with the key
(see `lib/claude-key.ts`, enforced in `middleware.ts` and `lib/admin-auth.ts`).

Before a big update, save a backup (`get_overview`, or GET each endpoint) to `.claude/backups/`.

## Data locations (Firestore)
- profile: `profile/main` · site settings: `siteSettings/main`
- projects / skills / achievements: collections of the same name · blog posts: `blogPosts`
- experience and contact messages: arrays `experience` and `contacts` on `portfolio/data`

## Checks before pushing
`npm run type-check` and `npm run build` (CI runs both without secrets, so never initialize Firebase
at import time; always import from `lib/firebase-admin.ts`).
