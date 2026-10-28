# Hing Yip Wu — Portfolio

Public portfolio at the Vercel URL for this project. Visitors see the home page.
The owner uploads from `/admin.html` with the admin password.

## Setup for uploads (owner only)

1. In Vercel, open this project → Settings → Environment Variables.
   Add `ADMIN_PASSWORD` with a password only you know, for Production (and Preview if you want).
   Redeploy after adding it. Do not put the password in this repo.
2. In Vercel, Storage → Create a Blob store and link it to this project, then redeploy.
   Uploads are stored as `projects.json` in Blob; images can be added via `imageUrl` for v1.
3. Without those two steps, the public portfolio still works, but shows
   "No projects uploaded yet" (there are no seed projects, by design),
   and `/admin.html` will show that admin is not configured yet.

## Local structure

- `index.html` — public portfolio
- `admin.html` — admin login + upload form
- `api/projects.js` — GET public projects, POST new project (admin password required, Blob-backed)
- `styles.css` — shared styling
