// Same connector as /api/mcp, with the key in the path: /api/mcp/<CLAUDE_API_KEY>.
// For Claude apps that can't send an Authorization header (claude.ai, mobile) and may drop ?key=.
import { NextRequest } from 'next/server';
import { POST as handlePost, GET as handleGet } from '../route';

export const dynamic = 'force-dynamic';

async function withKey(req: NextRequest, params: Promise<{ key: string }>) {
  const { key } = await params;
  const headers = new Headers(req.headers);
  headers.set('authorization', `Bearer ${decodeURIComponent(key)}`);
  return new NextRequest(req.nextUrl.origin + '/api/mcp', { method: req.method, headers, body: req.body, duplex: 'half' } as any);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  return handlePost(await withKey(req, params));
}

export async function GET() {
  return handleGet();
}
