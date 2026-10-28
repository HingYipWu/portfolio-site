import { put, list } from '@vercel/blob';

const SEED = [
  {
    id: 'iv-curve-tracer',
    title: 'IV Curve Tracer Build',
    description: 'Low-voltage Arduino-based IV curve tracer — a self-chosen build project to learn semiconductor device characterization hands-on. In progress.',
    tags: ['Semiconductors', 'Arduino', 'Characterization'],
    link: '',
    imageUrl: ''
  },
  {
    id: 'rf1-midterm-practice',
    title: 'RF 1 Midterm Practice Website',
    description: 'Interactive practice site built from past EE 401 exams: Learn, Smith Chart Lab, Quick Drills, Trace ID, Past Exam Problems, and Formula Sheet.',
    tags: ['RF', 'EE 401', 'Web'],
    link: '',
    imageUrl: ''
  },
  {
    id: 'ee467-quiz3-practice',
    title: 'EE 467 Quiz 3 Practice Website',
    description: 'Topic 3 inverters / SPWM learn-first lessons, Waveform Lab, Formula Sheet, interactive H-bridge Circuit Lab, and practice questions.',
    tags: ['Power Electronics', 'EE 467', 'Web'],
    link: '',
    imageUrl: ''
  },
  {
    id: 'semiconductor-learning',
    title: 'Semiconductor Learning Website',
    description: 'Interactive semiconductor learning pages: band diagrams, P–N junctions, threshold voltage, drift-layer tradeoffs, and β-Ga2O3 device stacks.',
    tags: ['Semiconductors', 'Web'],
    link: '',
    imageUrl: ''
  }
];

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

export default async function handler(req, res) {
  const adminConfigured = Boolean(process.env.ADMIN_PASSWORD);
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
    // v1 accepts JSON. Image upload as a file is a future iteration;
    // for now the admin form sends an image URL, stored as imageUrl.
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });
    const stored = await readStored();
    const projects = stored && Array.isArray(stored.projects) ? stored.projects : [...SEED];
    const project = {
      id: Date.now().toString(36),
      title,
      description,
      tags: String(body.tags || '').split(',').map(s => s.trim()).filter(Boolean),
      link: String(body.link || ''),
      imageUrl: String(body.imageUrl || '')
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
