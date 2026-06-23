# HomeGuard — Beta Setup Guide

Control which devices can access your home network, from any browser.

---

## Prerequisites

- Node.js 20+
- Git
- A free account on: [Vercel](https://vercel.com), [Fly.io](https://fly.io), and [Supabase](https://supabase.com) (or any Postgres host)

---

## 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/homeguard.git
cd homeguard

cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

---

## 2. Set up the database (Supabase — free tier)

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Database URL** from Project Settings → Database
3. Run the schema:

```bash
psql YOUR_DATABASE_URL -f backend/schema.sql
```

---

## 3. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL  — from Supabase
#   JWT_SECRET    — run: openssl rand -base64 48
#   INVITE_CODES  — comma-separated codes for your testers
```

---

## 4. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:3000

---

## 5. Deploy to production

### Backend → Fly.io

```bash
# Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
cd backend
fly auth login
fly launch          # first time: creates the app
fly secrets set JWT_SECRET="your_secret_here"
fly secrets set DATABASE_URL="your_postgres_url"
fly secrets set ALLOWED_ORIGIN="https://your-app.vercel.app"
fly secrets set INVITE_CODES="FAMILY2024,BETA001"
fly deploy
```

### Frontend → Vercel

```bash
# Install Vercel CLI: npm i -g vercel
cd frontend
vercel env add VITE_API_URL   # paste your Fly.io URL, e.g. https://homeguard-api.fly.dev
vercel --prod
```

---

## 6. Set up GitHub Actions (CI/CD)

Add these secrets in GitHub → Settings → Secrets → Actions:

| Secret | Where to get it |
|--------|----------------|
| `FLY_API_TOKEN` | `fly auth token` |
| `VERCEL_TOKEN` | Vercel dashboard → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel whoami --json` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after first `vercel` deploy |

From now on, every push to `main` auto-deploys through the full security pipeline.

---

## 7. Set up pre-commit hooks (local security)

```bash
pip install pre-commit
pre-commit install
```

Every `git commit` now automatically scans for secrets and runs linting.

---

## 8. Share with testers

Send your friends and family:
- Your Vercel URL (e.g. `https://homeguard-xyz.vercel.app`)
- An invite code from your `INVITE_CODES` list
- The README for the local agent (coming soon — needed to talk to their router)

---

## Project structure

```
homeguard/
├── frontend/          # React + Vite (deployed to Vercel)
│   ├── src/
│   │   ├── pages/     # Login, Devices, Settings
│   │   └── App.tsx
│   ├── public/
│   │   └── manifest.json   # PWA manifest
│   └── vercel.json
├── backend/           # Fastify API (deployed to Fly.io)
│   ├── src/
│   │   ├── routes/    # auth, devices, account
│   │   └── db/        # Postgres client
│   ├── schema.sql     # Run once to set up tables
│   ├── fly.toml
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml     # Full DevSecOps pipeline
└── .pre-commit-config.yaml
```

---

## Security checklist before sharing

- [ ] `JWT_SECRET` is random (≥32 chars) — not the example value
- [ ] `.env` is in `.gitignore` and not committed
- [ ] Supabase DB has SSL enabled
- [ ] Fly.io app shows HTTPS (padlock) in browser
- [ ] GitHub Actions pipeline is passing (green)
- [ ] Invite codes are set — only friends/family can register
