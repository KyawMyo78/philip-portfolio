// Personal API key that lets Claude (Claude Code, or the MCP connector at /api/mcp) edit portfolio
// content without the admin password. Set CLAUDE_API_KEY (32+ random chars) in Vercel and .env.local;
// remove or change it to revoke access. Edge-safe: used by the middleware and by route handlers.

// What the key may do. Anything not listed (login, password reset, admin credentials, theme,
// revalidation) is refused even with a valid key.
const SCOPE: [RegExp, string[]][] = [
  [/^\/api\/(profile|site-settings)$/, ['GET', 'PUT']],
  [/^\/api\/portfolio\/(skills|projects|experience|achievements)(\/[^/]+)?$/, ['GET', 'POST', 'PUT', 'DELETE']],
  [/^\/api\/admin\/blog(\/[^/]+)?$/, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']],
  [/^\/api\/portfolio\/contacts(\/[^/]+)?$/, ['GET']], // contact messages: read only
  [/^\/api\/upload$/, ['POST']],
  [/^\/api\/delete-file$/, ['DELETE']],
];

export function bearerToken(req: Request): string | undefined {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') || '');
  return m?.[1]?.trim();
}

// constant-time comparison so the key can't be guessed character by character
export function isClaudeKey(key: string | null | undefined): boolean {
  const real = process.env.CLAUDE_API_KEY;
  if (!key || !real || real.length < 32 || key.length !== real.length) return false;
  let diff = 0;
  for (let i = 0; i < real.length; i++) diff |= key.charCodeAt(i) ^ real.charCodeAt(i);
  return diff === 0;
}

export function claudeKeyAllows(pathname: string, method: string): boolean {
  return SCOPE.some(([re, methods]) => re.test(pathname) && methods.includes(method));
}
