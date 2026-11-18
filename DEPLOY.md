# Put your site online: GitHub + Render (step by step)

## Part A — GitHub (stores your files)
1. Go to https://github.com and sign in (or Sign up — it is free).
2. Click the **+** at the top right, then **New repository**.
3. Repository name: `hanoi-toy-tower`. Choose **Public**. Click **Create repository**.
4. On the new empty repository page, click **uploading an existing file**.
5. Open the extracted `hanoi-v2` folder on your computer. Go INSIDE it, press **Ctrl+A** to select everything
   (Dockerfile, hanoi.pl, server.pl, tests.pl, README.md, DEPLOY.md, public) and drag it all into the GitHub page.
   Do NOT drag the outer `hanoi-v2` folder itself.
6. Wait until every file finishes uploading. Click **Commit changes**.
7. CHECK: the main page of the repository must list `Dockerfile`, `server.pl`, `hanoi.pl` and `public` directly.
   Click `public` — it must contain `index.html`, `style.css`, `app.js`.

## Part B — Render (runs your site on the internet)
1. Go to https://render.com and sign in with GitHub (**Sign in with GitHub**), then allow access.
2. Click **New +** (top right) then **Web Service**. (NOT "Static Site".)
3. Choose **Build and deploy from a Git repository**, find `hanoi-toy-tower`, click **Connect**.
4. Fill in:
   - Name: `hanoi-toy-tower`
   - Language: **Docker**   (important)
   - Branch: `main`
   - Root Directory: leave empty
   - Instance Type: **Free**
   - Build Command / Start Command: leave empty (the Dockerfile handles it)
5. Click **Create Web Service**.
6. Wait 3-5 minutes. Click the **Logs** tab. Success looks like:
   `Tower of Hanoi server listening on port 10000` and then `Your service is live`.
7. Click the link near the top (https://hanoi-toy-tower-xxxx.onrender.com).
   The free plan sleeps after 15 minutes idle; the first visit afterwards takes 30-60 seconds. This is normal.

## Updating the site later
Change a file on GitHub (open it, click the pencil icon, edit, **Commit changes**). Render redeploys automatically.

## Troubleshooting
| Problem | Fix |
|---|---|
| "Not Found" on the page | The service is a Static Site, or files are inside an extra folder. Delete the service, redo Part B with **Web Service + Docker**, and make sure Dockerfile is at the top level of the repo |
| Render says "Dockerfile not found" | The file must be named exactly `Dockerfile` (no .txt) and sit at the top level of the repo |
| Build fails | Open **Logs**, read the last red lines, and send them to your instructor/Claude |
| Page loads but badge says "not reachable" | Wait a minute and refresh (the free server was waking up) |
| Page is slow on first visit | Normal on the free plan (service wakes from sleep) |
