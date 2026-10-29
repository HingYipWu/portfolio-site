import { put, list } from '@vercel/blob';

// No seed projects, per the owner's request (2026-10-28).
// This portfolio shows only projects he uploads himself via /admin.html.
// Stored projects in Blob, if any, are used; otherwise the list is empty.
const SEED = [];

async function readStored() {
  try {
    const blobs = await list({ prefix: 'projects.json' });
    const item = blobs.blobs.find(b => b.pathname === 'projects.json');
    if (!item) return null;
    const res = await fetch(item.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function saveStored(projects) {
  await put('projects.json', JSON.stringify({ projects }, null, 2), { access: 'public', addRandomSuffix: false });
}

export default async function handler(req, res) {
  const adminConfigured = Boolean(process.env.ADMIN_PASSWORD);
  // Admin-only actions: delete a project, and move a project up/down.
  // Both require the admin password header and rewrite projects.json in Blob,
  // so the public page order/content changes immediately, no redeploy needed.
  if (req.method === 'DELETE' || req.method === 'PATCH') {
    if (!adminConfigured) return res.status(503).json({ error: 'Admin password not configured. Set ADMIN_PASSWORD in Vercel.' });
    if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const stored = await readStored();
    let projects = stored && Array.isArray(stored.projects) ? stored.projects : [...SEED];
    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      const before = projects.length;
      projects = projects.filter(p => String(p.id) !== id);
      if (projects.length === before) return res.status(404).json({ error: 'Project not found.' });
    } else {
      let body = req.body || {};
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const id = String(body.id || '');
      const direction = body.direction === 'down' ? 1 : -1;
      const idx = projects.findIndex(p => String(p.id) === id);
      const swap = idx + direction;
      if (idx < 0 || swap < 0 || swap >= projects.length) return res.status(400).json({ error: 'Cannot move that project further.' });
      [projects[idx], projects[swap]] = [projects[swap], projects[idx]];
    }
    try {
      await saveStored(projects);
    } catch (e) {
      return res.status(503).json({ error: 'Blob storage is not linked yet. Link a Blob store in Vercel and redeploy.' });
    }
    return res.status(200).json({ projects });
  }
  if (req.method === 'GET') {
    const stored = await readStored();
    const projects = stored && Array.isArray(stored.projects) ? stored.projects : SEED;
    // Admin check on GET is only used by the admin page to test the password.
    const pw = req.headers['x-admin-password'];
    if (pw !== undefined) {
      if (!adminConfigured) return res.status(200).json({ projects, adminConfigured: false });
      if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'unauthorized' });
    }
    return res.status(200).json({ projects, adminConfigured });
  }

  if (req.method === 'POST') {
    if (!adminConfigured) return res.status(503).json({ error: 'Admin password not configured. Set ADMIN_PASSWORD in Vercel.' });
    if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    // Backend: JSON in, Blob out. The admin form sends an image either as
    // imageUrl, or as a base64 data URL (imageData + imageName) which is
    // decoded here and stored in Blob, so the public page can show it.
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });
    let imageUrl = String(body.imageUrl || '');
    if (body.imageData && typeof body.imageData === 'string' && body.imageData.startsWith('data:')) {
      const match = body.imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const ext = (match[1].split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
        const safeName = String(body.imageName || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
        const buf = Buffer.from(match[2], 'base64');
        if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Image is too large (max 8 MB).' });
        const uploaded = await put(`images/${Date.now()}-${safeName}.${ext}`, buf, { access: 'public', contentType: match[1] });
        imageUrl = uploaded.url;
      }
    }
    const stored = await readStored();
    const projects = stored && Array.isArray(stored.projects) ? stored.projects : [...SEED];
    const project = {
      id: Date.now().toString(36),
      title,
      description,
      tags: String(body.tags || '').split(',').map(s => s.trim()).filter(Boolean),
      link: String(body.link || ''),
      imageUrl
    };
    projects.unshift(project);
    try {
      await put('projects.json', JSON.stringify({ projects }, null, 2), { access: 'public', addRandomSuffix: false });
    } catch (e) {
      return res.status(503).json({ error: 'Blob storage is not linked yet. Link a Blob store in Vercel and redeploy.' });
    }
    return res.status(201).json({ project });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };
