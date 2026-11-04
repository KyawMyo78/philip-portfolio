// MCP connector for Claude: lets Claude read and edit portfolio content (and read contact messages)
// from any Claude app. Speaks MCP "Streamable HTTP" with plain JSON responses (no SSE, stateless).
// Auth: CLAUDE_API_KEY as "Authorization: Bearer <key>", or ?key=<key> for apps that can't send headers.
// Never exposes login, password reset or admin credentials. Every write is logged to the
// `claude-audit` collection with a copy of the data before the change.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { bearerToken, isClaudeKey } from '@/lib/claude-key';

export const dynamic = 'force-dynamic';

const COLLECTIONS = { projects: 'projects', skills: 'skills', achievements: 'achievements', blog: 'blogPosts' } as const;
type CollectionType = keyof typeof COLLECTIONS;
const ITEM_TYPES = ['projects', 'skills', 'achievements', 'blog', 'experience'] as const;
type ItemType = (typeof ITEM_TYPES)[number];

const portfolioDoc = () => adminDb.collection('portfolio').doc('data');
const profileDoc = () => adminDb.collection('profile').doc('main');
const settingsDoc = () => adminDb.collection('siteSettings').doc('main');

// Firestore Timestamps -> ISO strings so results are plain JSON
const plain = (v: any): any =>
  v?.toDate ? v.toDate().toISOString() : Array.isArray(v) ? v.map(plain) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) : v;

// never let Claude overwrite ids or bookkeeping fields
const clean = (data: any) => {
  const { id, createdAt, updatedAt, views, ...rest } = data || {};
  return rest;
};

async function audit(tool: string, target: string, id: string | null, before: any, after: any) {
  try {
    await adminDb.collection('claude-audit').add({ at: new Date().toISOString(), tool, target, id, before: plain(before ?? null), after: plain(after ?? null) });
  } catch (e) {
    console.error('claude-audit write failed', e);
  }
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

// ---------------------------------------------------------------- tools
const TYPE_PROP = { type: 'string', enum: ITEM_TYPES, description: 'Which list: projects, skills, achievements, blog (posts) or experience (roles).' };

const TOOLS = [
  {
    name: 'get_overview',
    description: 'Read everything at once: profile, site settings and all projects, skills, experience, achievements and blog posts. Use this first, and to make a backup before big changes.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_profile',
    description: 'Change profile fields (merged into the existing profile). Fields include name, title, specialization, subtitle, description, aboutDescription (paragraphs separated by a blank line), location, email, phone, cvUrl, profileImage, socialLinks, interests.',
    inputSchema: { type: 'object', properties: { fields: { type: 'object', description: 'Only the fields to change.' } }, required: ['fields'] },
  },
  {
    name: 'update_site_settings',
    description: 'Change one section of the site settings (merged). Sections: general (siteTitle, siteDescription, siteKeywords), navigation, hero, about, skills, experience, projects, blog, contact (connectTitle, connectIntro, whyWorkWithMe, primaryEmail, primaryPhone, location, responseTime), footer (copyrightYear, copyrightName, copyrightText). Each section can have visible: true/false to show or hide it on the site.',
    inputSchema: { type: 'object', properties: { section: { type: 'string' }, fields: { type: 'object' } }, required: ['section', 'fields'] },
  },
  {
    name: 'list_items',
    description: 'List all items of one type with their ids.',
    inputSchema: { type: 'object', properties: { type: TYPE_PROP }, required: ['type'] },
  },
  {
    name: 'create_item',
    description: 'Create an item. Typical fields — projects: title, description, longDescription, category, status (completed|in-progress|planned), featured, technologies[], highlights[], images[], liveUrl, githubUrl, startDate, endDate, order. skills: name, category, level (1-5), yearsOfExperience, icon (lucide icon name), featured, order. achievements: title, description, category (award|certification|recognition|achievement|other), date (YYYY-MM-DD), issuer, credentialUrl, featured, order. experience: title, company, location, startDate, endDate, current, description, responsibilities[], achievements[], technologies[], companyUrl, order. blog: title, excerpt, content (HTML), category, tags[], status (draft|published), author, readTime, featuredImage, featured.',
    inputSchema: { type: 'object', properties: { type: TYPE_PROP, data: { type: 'object' } }, required: ['type', 'data'] },
  },
  {
    name: 'update_item',
    description: 'Change fields of one item (merged). Get the id from list_items.',
    inputSchema: { type: 'object', properties: { type: TYPE_PROP, id: { type: 'string' }, fields: { type: 'object' } }, required: ['type', 'id', 'fields'] },
  },
  {
    name: 'delete_item',
    description: 'Delete one item. A copy is kept in the change log so it can be restored. Confirm with the user before deleting.',
    inputSchema: { type: 'object', properties: { type: TYPE_PROP, id: { type: 'string' } }, required: ['type', 'id'] },
  },
  {
    name: 'list_contact_messages',
    description: 'Read messages sent through the contact form (read only), newest first.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Default 20.' }, unread_only: { type: 'boolean' } } },
  },
  {
    name: 'list_recent_changes',
    description: 'Show the latest changes made through this connector, including the data before each change (use it to undo).',
    inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Default 20.' } } },
  },
];

async function listItems(type: ItemType) {
  if (type === 'experience') {
    const d = (await portfolioDoc().get()).data();
    return plain(d?.experience || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }
  const snap = await adminDb.collection(COLLECTIONS[type as CollectionType]).get();
  // the site and admin panel sort by `order`, which silently skips items without it (old demo data)
  return snap.docs
    .map((d: any) => {
      const item = plain({ id: d.id, ...d.data() });
      return type !== 'blog' && typeof item.order !== 'number' ? { ...item, hiddenFromSite: 'no order field, so the site and admin panel do not show it' } : item;
    })
    .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
}

async function runTool(name: string, args: any) {
  const type = args?.type as ItemType;
  if (['list_items', 'create_item', 'update_item', 'delete_item'].includes(name) && !ITEM_TYPES.includes(type)) {
    throw new Error(`type must be one of: ${ITEM_TYPES.join(', ')}`);
  }
  const now = new Date().toISOString();

  switch (name) {
    case 'get_overview': {
      const [profile, settings, ...lists] = await Promise.all([
        profileDoc().get(), settingsDoc().get(), ...ITEM_TYPES.map((t) => listItems(t)),
      ]);
      return { profile: plain(profile.data() || {}), siteSettings: plain(settings.data() || {}), ...Object.fromEntries(ITEM_TYPES.map((t, i) => [t, lists[i]])) };
    }
    case 'update_profile': {
      const before = (await profileDoc().get()).data();
      const fields = clean(args.fields);
      await profileDoc().set({ ...fields, updatedAt: now }, { merge: true });
      await audit(name, 'profile', 'main', before, fields);
      return { ok: true, changed: Object.keys(fields) };
    }
    case 'update_site_settings': {
      const section = String(args.section || '');
      if (!/^[a-zA-Z]+$/.test(section)) throw new Error('section must be a plain name like "contact" or "footer"');
      const before = (await settingsDoc().get()).data()?.[section];
      await settingsDoc().set({ [section]: { ...(before || {}), ...args.fields } }, { merge: true });
      await audit(name, `siteSettings.${section}`, 'main', before, args.fields);
      return { ok: true, section, changed: Object.keys(args.fields || {}) };
    }
    case 'list_items':
      return listItems(type);
    case 'create_item': {
      const data = clean(args.data);
      if (type === 'experience') {
        if (!data.title || !data.company || !data.startDate) throw new Error('experience needs title, company and startDate');
        const item = { responsibilities: [], achievements: [], technologies: [], description: '', location: '', current: false, order: 0, ...data, id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`, createdAt: now, updatedAt: now };
        const list = (await portfolioDoc().get()).data()?.experience || [];
        await portfolioDoc().set({ experience: [...list, item] }, { merge: true });
        await audit(name, type, item.id, null, item);
        return { ok: true, id: item.id };
      }
      if (type === 'blog') {
        if (!data.title || !data.content) throw new Error('blog posts need title and content');
        const slug = data.slug ? slugify(data.slug) : slugify(data.title);
        const exists = await adminDb.collection('blogPosts').where('slug', '==', slug).limit(1).get();
        if (!exists.empty) throw new Error(`a post with slug "${slug}" already exists`);
        const status = data.status === 'published' ? 'published' : 'draft';
        const post = { excerpt: '', category: 'general', tags: [], author: 'Kyaw Myo Khant', readTime: 5, featured: false, featuredImage: null, ...data, slug, status, views: 0, publishedAt: status === 'published' ? new Date() : null, createdAt: new Date(), updatedAt: new Date() };
        const ref = await adminDb.collection('blogPosts').add(post);
        await audit(name, type, ref.id, null, post);
        return { ok: true, id: ref.id, slug };
      }
      // new items need an order number or the site won't show them
      if (typeof data.order !== 'number') data.order = (await listItems(type)).filter((x: any) => typeof x.order === 'number').length;
      const ref = await adminDb.collection(COLLECTIONS[type as CollectionType]).add({ ...data, createdAt: now, updatedAt: now });
      await audit(name, type, ref.id, null, data);
      return { ok: true, id: ref.id };
    }
    case 'update_item': {
      const id = String(args.id || '');
      const fields = clean(args.fields);
      if (type === 'experience') {
        const list = (await portfolioDoc().get()).data()?.experience || [];
        const i = list.findIndex((e: any) => e.id === id);
        if (i < 0) throw new Error(`no experience with id ${id}`);
        const before = list[i];
        list[i] = { ...before, ...fields, id, updatedAt: now };
        if (fields.current === true) delete list[i].endDate;
        await portfolioDoc().set({ experience: list }, { merge: true });
        await audit(name, type, id, before, fields);
        return { ok: true };
      }
      const ref = adminDb.collection(COLLECTIONS[type as CollectionType]).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error(`no ${type} item with id ${id}`);
      const extra: any = type === 'blog' ? { updatedAt: new Date() } : { updatedAt: now };
      if (type === 'blog' && fields.status === 'published' && !snap.data()?.publishedAt) extra.publishedAt = new Date();
      if (type === 'blog' && fields.slug) fields.slug = slugify(fields.slug);
      await ref.update({ ...fields, ...extra });
      await audit(name, type, id, snap.data(), fields);
      return { ok: true };
    }
    case 'delete_item': {
      const id = String(args.id || '');
      if (type === 'experience') {
        const list = (await portfolioDoc().get()).data()?.experience || [];
        const before = list.find((e: any) => e.id === id);
        if (!before) throw new Error(`no experience with id ${id}`);
        await portfolioDoc().set({ experience: list.filter((e: any) => e.id !== id) }, { merge: true });
        await audit(name, type, id, before, null);
        return { ok: true };
      }
      const ref = adminDb.collection(COLLECTIONS[type as CollectionType]).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error(`no ${type} item with id ${id}`);
      await ref.delete();
      await audit(name, type, id, snap.data(), null);
      return { ok: true };
    }
    case 'list_contact_messages': {
      const limit = Math.min(Math.max(Number(args?.limit) || 20, 1), 100);
      let msgs = plain((await portfolioDoc().get()).data()?.contacts || []);
      if (args?.unread_only) msgs = msgs.filter((m: any) => !m.isRead);
      msgs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return { total: msgs.length, messages: msgs.slice(0, limit) };
    }
    case 'list_recent_changes': {
      const limit = Math.min(Math.max(Number(args?.limit) || 20, 1), 100);
      const snap = await adminDb.collection('claude-audit').orderBy('at', 'desc').limit(limit).get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    }
    default:
      throw new Error(`unknown tool ${name}`);
  }
}

// ---------------------------------------------------------------- JSON-RPC / MCP plumbing
const INSTRUCTIONS =
  "Tools for Kyaw Myo Khant's portfolio website (kyawmyokhant.com). Changes go live immediately. " +
  'Before large updates call get_overview and keep the result as a backup. Ask the user before deleting anything. ' +
  'Only use facts the user gave you (CV, messages); do not invent dates, numbers or achievements. ' +
  'Contact messages are private: summarise them only for the user.';

async function handle(msg: any) {
  const { id, method, params } = msg || {};
  const reply = (result: any) => ({ jsonrpc: '2.0', id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
  if (id === undefined || id === null) return null; // notification (e.g. notifications/initialized): no response

  switch (method) {
    case 'initialize':
      return reply({
        protocolVersion: params?.protocolVersion || '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'kyaw-portfolio', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS });
    case 'tools/call':
      try {
        const out = await runTool(params?.name, params?.arguments || {});
        return reply({ content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e: any) {
        return reply({ content: [{ type: 'text', text: `Error: ${e?.message || e}` }], isError: true });
      }
    default:
      return fail(-32601, `Method not found: ${method}`);
  }
}

function authorized(req: NextRequest) {
  return isClaudeKey(bearerToken(req) || req.nextUrl.searchParams.get('key'));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
  }
  const results = (await Promise.all((Array.isArray(body) ? body : [body]).map(handle))).filter(Boolean);
  if (!results.length) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? results : results[0]);
}

// no server-initiated stream; clients fall back to plain request/response
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
