# Crafthomes (Estate Craft)

**Estate Craft** is a full-stack web application for managing real-estate and construction-style projects end to end: clients and vendors, project timelines and tasks, commercial flows (quotations, payments), collaboration (messages, comments, notifications), and operational tooling (site visits, deliverables, snags, libraries, reporting).

This repository is a **monorepo** with two main packages:

| Directory | Role |
|-----------|------|
| [`estate-craft-fe-dev`](./estate-craft-fe-dev/) | Single-page **frontend** (React + TypeScript + Vite) |
| [`estate-craft-backend-dev`](./estate-craft-backend-dev/) | **REST API** and real-time layer (Node.js + Express) |

The backend exposes versioned HTTP APIs under **`/api/v1`** and uses **Socket.IO** for live updates. The frontend talks to that API and shares auth/session expectations with the server.

---

## What the product covers

At a high level, the codebase supports:

- **Projects & execution** — projects, phases, tasks and subtasks, timelines, calendar, summaries and dashboards  
- **People & access** — users, roles, permissions, module access, organizations and related settings  
- **CRM-style entities** — clients and vendors (including contacts, addresses, and master data)  
- **Commercial** — quotations, payments, and progress tracking  
- **Field & delivery** — site visits, deliverables, snags  
- **Collaboration** — messaging, comments, mentions-rich editing, notifications  
- **Content & files** — libraries, uploads, file manager (with cloud storage integration on the server)  
- **Operations** — timesheets, policies, activities, reporting and exports  

Exact screens and routes live in the frontend under `src/pages/` and `src/navigation/`.

---

## Tech stack

**Frontend** (`estate-craft-fe-dev`)

- React 19, TypeScript, Vite  
- Redux Toolkit, React Router  
- Mantine UI, Tailwind CSS  
- Socket.IO client, Formik + Yup, TipTap and other rich-text pieces  
- Chart.js, calendar, PDF/Excel helpers where needed  

**Backend** (`estate-craft-backend-dev`)

- Node.js (ES modules), Express  
- **Prisma** ORM with PostgreSQL (`pg`)  
- **Redis**, **Socket.IO**  
- JWT auth, Joi validation, Winston logging  
- Integrations: e.g. AWS SDK (uploads/storage), Nodemailer, Firebase (as configured per environment)  

---

## Prerequisites

- **Node.js** (20+ recommended; the frontend Dockerfile uses Node 20)  
- **PostgreSQL** for Prisma  
- **Redis** (used by the API; health check reports Redis status)  
- Environment files as expected by each app (see below)  

---

## Getting started

### 1. Backend

```bash
cd estate-craft-backend-dev
npm install
```

The server loads env from **`.env.<NODE_ENV>`** (for example `.env.dev` when `NODE_ENV=dev`). Create the appropriate file from your team’s template or a committed `.env.example` if you add one—**do not commit secrets** (see root `.gitignore`).

Set at least:

- `DATABASE_URL` (PostgreSQL)  
- `PORT` / `HOST_URL` as needed  
- `REDIS_URL`, CORS (`CORS_ORIGIN`, etc.), and any AWS/email keys your deployment uses  

Generate the Prisma client and run migrations (see `package.json` scripts), then start:

```bash
npm run prisma:generate
npm run prisma:migrate   # or prisma:migrate:deploy in CI/production
npm run dev
```

Default listen port is controlled by **`PORT`** in config (falls back to **5005** if unset/invalid). A simple liveness endpoint is **`GET /health-check`**.

**Database seeding** (super admin and baseline data) is documented in [`estate-craft-backend-dev/README.md`](./estate-craft-backend-dev/README.md).

### 2. Frontend

```bash
cd estate-craft-fe-dev
npm install
```

Add a **`.env`** (or env file your Vite setup expects) with the API base URL and any client-side public keys your build requires. Then:

```bash
npm run dev
```

Vite’s dev server URL is printed in the terminal (commonly port **5173**). For a production-style local run:

```bash
npm run build
npm run preview
```

### 3. Docker (frontend only in-repo)

The frontend includes a **multi-stage Dockerfile** that builds the SPA and serves it with **nginx**. See [`estate-craft-fe-dev/Dockerfile`](./estate-craft-fe-dev/Dockerfile). Prefer build-time args or runtime config patterns that avoid baking secrets into images.

---

## Repository layout

```
Crafthomes/
├── estate-craft-backend-dev/   # API, Prisma schema, sockets, jobs
├── estate-craft-fe-dev/        # React SPA
├── .gitignore                  # Root ignores (env, keys, build artifacts)
└── README.md                   # This file
```

Each subdirectory may have its own `README.md`, lint/format config, and Husky hooks (frontend).

---

## Security notes for public or shared repos

- Never commit **`.env`**, **`.env.*`**, or key material; use **`.env.example`** with dummy values only.  
- Rotate any credentials that were ever committed or shared by mistake.  
- The backend **`repository`** field in `package.json` should use a normal HTTPS Git URL **without** embedded tokens.

---

## License

Component packages may declare their own licenses (e.g. `estate-craft-backend-dev/package.json`). Set or unify a top-level license for the monorepo if you publish this repo publicly.
