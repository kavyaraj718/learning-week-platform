# 🏆 Learning Week — Gamification & Engagement Platform

A full **MERN** (MongoDB · Express · React · Node) application that runs an organization's Learning Week: employees enroll in activities, earn points, climb **live leaderboards**, and collect recognition — while admins manage activities, assign winners, award bonuses, bulk-upload results, and watch **real-time analytics**.

Built with a clean **MVC** separation and a centralized **points engine** as the single source of truth for scoring, with **Socket.IO** pushing every change to all connected clients instantly.

---

## ✨ Features

**Employee portal**
- Home with hero, animated live stats, quick-access tiles, live Top-10 preview, and a team competition tracker
- Personal dashboard: total points, org rank, activities joined/won, participation ring, social score, team rank, points breakdown, recent history, nearest rivals, next activity
- Activities: searchable/filterable grid, detail view, one-click enroll with **confetti** + instant points
- Four **live leaderboards** — Organization, Team (with manager → team drill-down), Department, Location — with ▲/▼ rank-change indicators
- Achievements & recognition hall of fame (6 auto-computed awards) + personal badges
- Upcoming events timeline
- Profile with full points audit trail

**Admin portal**
- Analytics dashboard: KPIs, participation/engagement/team/trend charts (Chart.js), department & location filters
- Manage activities (create / edit / delete)
- Registrations & attendance toggle + ad-hoc bonus awards
- Winner selection (1st/2nd/3rd → auto points + badges)
- Bulk upload (Excel/CSV) for winners, participation, bonus, attendance — with template download, drag-drop, validation **preview**, and confirm-to-**apply**
- Points configuration (participation + winner values)
- Social engagement integration with **Sync now** + status

**Platform**
- JWT auth with bcrypt-hashed passwords and role-based route guards (employee vs admin)
- Centralized points engine (participation + winner + bonus + social) with a full `PointsHistory` audit trail
- Socket.IO real-time updates across dashboards and leaderboards
- Light/dark theme, count-up animations, progress rings, responsive down to mobile

---

## 🧱 Architecture (MVC)

```
learning-week-platform/
├── server/        # Express API  →  Controller + Model
│   ├── models/        ── MODEL ──      Mongoose schemas (the MongoDB layer)
│   ├── controllers/   ── CONTROLLER ── thin request handlers
│   ├── routes/        Express routers map endpoints → controllers
│   ├── services/      reusable domain logic (points engine, leaderboards, social sync, realtime)
│   ├── middleware/    auth, roleCheck, validate, errorHandler
│   ├── sockets/       Socket.IO server init
│   ├── seed/          demo data seeder
│   ├── app.js         express app + route mounting
│   └── server.js      http + Socket.IO bootstrap
└── client/        ── VIEW ──  React (Vite) frontend
    └── src/{api, components, pages, layouts, context, hooks, routes}
```

- **Model** → `server/models/*` (Employee, Activity, Registration, PointsHistory, PointsConfig, SocialEngagement)
- **View** → the entire `client/` React app
- **Controller** → `server/controllers/*`, wired by `server/routes/*`. Business logic lives in `server/services/*` and controllers stay thin.
- **Points engine** (`server/services/pointsEngine.js`) is the *only* module that mutates point buckets; it recomputes `totalPoints`, updates participation %, writes history, and triggers real-time broadcasts.

---

## 🚀 Getting started

### Prerequisites
- **Node.js** 18+ (works on 20/22)
- **MongoDB** running locally (or a connection string to Atlas)
  - Local quick start: install MongoDB Community and run `mongod`, or use Docker:
    `docker run -d -p 27017:27017 --name lw-mongo mongo:7`

### 1) Backend

```bash
cd server
npm install
cp .env.example .env          # then edit if needed (defaults work for local Mongo)
npm run seed                  # wipes + populates demo data, prints demo logins
npm run dev                   # starts API + Socket.IO on http://localhost:5000
```

`.env` keys:

| Key | Default | Notes |
|-----|---------|-------|
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/learning_week` | MongoDB connection |
| `JWT_SECRET` | _change me_ | sign JWTs |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `SOCIAL_SYNC_INTERVAL_MS` | `0` | >0 enables periodic auto social sync |

### 2) Frontend

```bash
cd client
npm install
cp .env.example .env          # leave values blank to use the Vite dev proxy
npm run dev                   # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:5000`, so the client uses same-origin relative URLs — no extra config needed for local dev.

Open **http://localhost:5173**.

> The repo ships with ready-to-use `.env` files in both `server/` and `client/`, so the `cp .env.example .env` step is optional — it's only there if you want to customize values.

---

## 🐳 Run with Docker (one command)

If you have Docker installed, you don't need Node or MongoDB locally:

```bash
docker compose up --build
```

This starts three containers — **MongoDB**, the **API** (which auto-seeds the database on boot), and the **client** — and wires them together. Then open **http://localhost:5173**.

- API → http://localhost:5000
- MongoDB → localhost:27017 (data persisted in a named volume)

> The server **re-seeds (wipes + rebuilds) the demo data every time it starts**, so the app always opens in a known state. After your first run, if you want data to persist across restarts, change the `server` service `command` in `docker-compose.yml` from `npm run seed && npm start` to just `npm start`.

Stop everything with `Ctrl+C`, then `docker compose down` (add `-v` to also delete the Mongo volume).

---

## 🔑 Demo credentials

After `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| 👤 Employee | `demo@learningweek.test` | `password123` |
| 🛡️ Admin | `admin@learningweek.test` | `admin123` |

The employee **Aarav Mehta** is engineered to sit mid-table (~250 points) so the dashboard and "nearby rivals" look realistic. The seeder prints the exact final leaderboard and the demo user's rank.

> Tip: open the app in two browser windows (employee + admin). Assign a winner or run a social sync as admin and watch the employee's leaderboard re-rank live.

---

## 🔌 API overview (prefix `/api`)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Employees | `GET /employees`, `GET /employees/:id`, `GET /employees/:id/dashboard`, `GET /employees/:id/points-history` |
| Activities | `GET/POST /activities`, `GET/PUT/DELETE /activities/:id`, `POST /activities/:id/enroll` |
| Registrations | `GET /activities/:id/registrations`, `PATCH /activities/:id/attendance`, `POST /activities/:id/winners` |
| Points | `POST /points/bonus`, `GET/PUT /points/config` |
| Leaderboards | `GET /leaderboards/{organization,team,team/:manager,department,location}` |
| Analytics | `GET /analytics/{participation,engagement,team,trends}` |
| Recognition | `GET /recognition` |
| Integration | `POST /integration/social/sync`, `GET /integration/social/status` |
| Bulk upload | `POST /upload/{winners,participation,bonus,attendance}`, `GET /upload/template/:type` |
| Stats | `GET /stats/live` |

Admin-only routes are guarded by `auth` + `roleCheck('admin')`.

### Testing the API

Two ready-made collections live in [`docs/`](./docs):

- **`Learning-Week.postman_collection.json`** — import into Postman. Run **Auth → Login (Admin)** first; it auto-captures the JWT into a `{{token}}` variable that every other request reuses. Running **List Employees** and **List Activities** auto-captures sample IDs too, so the whole collection is runnable top-to-bottom.
- **`api.http`** — for the VS Code **REST Client** extension. Run a login request, paste the returned token into `@token`, and fire away.

---

## 📡 Real-time events (Socket.IO)

Emitted by controllers after a successful mutation, consumed by the `useLiveRefresh` hook:

`leaderboard:update` · `points:update` · `activity:update` · `stats:update` · `recognition:update`

---

## 🌱 Reseeding

`npm run seed` (in `server/`) is idempotent — it wipes all collections and rebuilds a deterministic dataset (25 employees, 10 activities spread Mon–Fri, winners on completed activities, seeded social metrics, default points config).

---

## 🧪 Notes & next steps

- The social integration reads from the seeded `SocialEngagement` collection. Point `services/socialSyncService.js` at a real API, scheduled DB job, or secure file feed to take it live.
- Scoring is fully config-driven — change participation/winner values from the admin **Points Config** page and all future awards follow.
- For production: set a strong `JWT_SECRET`, run MongoDB with auth, build the client (`npm run build`) and serve `client/dist` behind your web server while pointing it at the API origin via `VITE_API_URL` / `VITE_SOCKET_URL`.

---

Built for Learning Week 2026 — **Learn • Engage • Compete • Win**.
