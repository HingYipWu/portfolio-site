# Hing Yip Wu — Portfolio

Public portfolio at the Vercel URL for this project. Visitors see the home page.
The owner uploads from `/admin.html` with the admin password.

## Backend (free, no separate MongoDB account needed)

The backend is `api/projects.js` on Vercel. It stores uploaded projects in
Vercel Blob — Vercel's free built-in storage — as `projects.json`, and
uploaded images under `images/` in the same store. Visitors' home page
reads that same store, so an upload shows up publicly without a redeploy.
A separate MongoDB Atlas account would work the same way (swap the Blob
read/write for a MongoDB driver + `MONGODB_URI`), but it would need an
Atlas signup, cluster, user, and connection string, with no benefit at
this scale — Blob is the free database for this site.

## Setup for uploads (owner only)

1. In Vercel, open this project → Settings → Environment Variables.
   Add `ADMIN_PASSWORD` with a password only you know, for Production (and Preview if you want).
   Redeploy after adding it. Do not put the password in this repo.
2. In Vercel, Storage → Create a Blob store and link it to this project, then redeploy.
   Uploads are stored as `projects.json` in Blob; images uploaded in the
   admin form are stored in Blob too.
3. Without those two steps, the public portfolio still works, but shows
   "No projects uploaded yet" (there are no seed projects, by design),
   and `/admin.html` will show that admin is not configured yet.

## Local structure

- `index.html` — public portfolio
- `admin.html` — admin login + upload form
- `api/projects.js` — GET public projects, POST new project (admin password required, Blob-backed)
- `styles.css` — shared styling
