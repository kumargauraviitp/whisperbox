<div align="center">

<!-- Crystal Ball Glow Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0a0a0f&height=280&section=header&text=🔮%20WhisperBox&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Say%20what%20you%20can't%20say%20aloud&descSize=20&descColor=00f2ff" alt="WhisperBox Banner" />

### ✨ Anonymous. Password-Protected. Untraceable. ✨

<i>A neon-dark, glassmorphic anonymous messaging web app — installable on any device.</i>

<p>
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Installable-4285f4?style=flat-square&logo=pwa" alt="PWA" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" alt="Vercel" />
</p>

<p>
  <a href="#-demo"><b>Demo</b></a> •
  <a href="#-features"><b>Features</b></a> •
  <a href="#%EF%B8%8F-quick-start"><b>Quick Start</b></a> •
  <a href="#-tech-stack"><b>Tech Stack</b></a> •
  <a href="#-architecture"><b>Architecture</b></a> •
  <a href="#-security-model"><b>Security</b></a>
</p>

</div>

---

## 🎯 Demo

> Open on your phone → Safari/Chrome will prompt **"Add to Home Screen"** — installs like a native app.

<div align="center">

| 📱 iOS Safari | 🤖 Android Chrome | 💻 Desktop Chrome |
|---|---|---|
| Add to Home Screen | Install App | Install Icon in address bar |

</div>

---

## ✨ Features

### 🎭 Core
- **Anonymous Messaging** — pick any username + password, send messages privately
- **Password-Protected Replies** — re-enter your password every time; server never stores it raw
- **Owner Admin Panel** — read all messages, reply individually, view live stats

### 🎨 UI / UX
- **Three.js Particle Background** — floating wireframe icosahedrons with neon glow
- **Glassmorphism Design** — frosted-glass cards with backdrop blur on a deep-space backdrop
- **Framer Motion** — page transitions, staggered card entrances, pulse glow animations
- **Responsive** — mobile-first, fluid from 320px to 4K

### 🔔 Notifications
- **Web Push** — real-time notifications for new messages + replies
- **PWA Badge** — icon badge on home screen when messages arrive

### 📲 Installable PWA
- Works **offline after first load** (service worker + precache)
- Installable on **iPhone, Android, Windows, macOS**
- Standalone window — no browser chrome

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/avadakedavaraa/whisperbox.git
cd whisperbox

# 2. Install dependencies
npm install

# 3. Set up Supabase
#    - Create a project at supabase.com
#    - Open SQL Editor and run supabase/schema.sql
#    - Copy your project URL and service role key

# 4. Configure environment
cp .env.example .env
#    Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, ADMIN_PASSWORD

# 5. Start both frontend + backend
npm run dev
#    → API  : http://localhost:3001
#    → Vite : http://localhost:5173
```

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                             │
│  React 19  ·  TypeScript  ·  Framer Motion  ·  Three.js │
│  Tailwind CSS 4  ·  Vite 8  ·  vite-plugin-pwa         │
└──────────────────────┬──────────────────────────────────┘
                       │  fetch (credentials: include)
┌──────────────────────▼──────────────────────────────────┐
│                     API SERVER                           │
│  Express 5  ·  Helmet  ·  CORS  ·  Rate Limiting        │
│  JWT  ·  bcrypt  ·  express-validator  ·  Web Push       │
└──────────────────────┬──────────────────────────────────┘
                       │  service_role
┌──────────────────────▼──────────────────────────────────┐
│                     DATABASE                             │
│  Supabase (Postgres)  ·  Row Level Security             │
│  Tables: app_users · messages · admin_config ·            │
│          rate_limit_log · push_subscriptions             │
└─────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + TypeScript | SPA with client-side routing |
| **3D Background** | Three.js | Floating wireframe particles |
| **Animation** | Framer Motion | Page transitions + micro-interactions |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Build** | Vite 8 | HMR + optimized production builds |
| **PWA** | vite-plugin-pwa | Service worker + manifest + offline |
| **API** | Express 5 | REST endpoints, middleware pipeline |
| **Auth** | JWT (httpOnly cookies) | Visitor + admin sessions |
| **Hashing** | bcryptjs | Password + admin PIN hashing |
| **Rate Limiting** | Database-backed | Per-IP, per-endpoint throttling |
| **Database** | Supabase / Postgres | Persistent storage with RLS |
| **Notifications** | Web Push + VAPID | Real-time push to devices |
| **Hosting** | Vercel | Serverless API + static frontend |

---

## 🏗 Architecture

```
                    ┌──────────────┐
                    │   Browser    │
                    │  (React SPA) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌────▼─────┐
        │  Vite Dev │ │ Service │ │  SW      │
        │  Proxy    │ │ Worker  │ │ (Offline)│
        └─────┬─────┘ └────┬────┘ └──────────┘
              │            │
        ┌─────▼────────────▼─────┐
        │     Express API        │
        │  ┌─────────────────┐   │
        │  │   Helmet + CSP   │   │
        │  │   CORS + JSON    │   │
        │  │   Rate Limiter   │   │
        │  │   Cookie Parser  │   │
        │  └────────┬────────┘   │
        │           │            │
        │  ┌────────▼────────┐   │
        │  │  Auth Middleware  │   │
        │  │  (JWT httpOnly)  │   │
        │  └────────┬────────┘   │
        │           │            │
        │  ┌────────▼────────┐   │
        │  │     Routes       │   │
        │  │  /users /messages │  │
        │  │  /admin /cron    │   │
        │  └────────┬────────┘   │
        └───────────┼───────────┘
                    │
              ┌─────▼──────┐
              │  Supabase  │
              │  (Postgres)│
              └────────────┘
```

---

## 🔒 Security Model

| Defense | Implementation |
|---|---|
| **Passwords** | bcrypt (12 salt rounds) — raw password never stored |
| **Session cookies** | `httpOnly` · `secure` (prod) · `sameSite: strict` · path `/` |
| **JWT signing** | Dedicated secret per environment (dev ≠ prod, 128-char hex) |
| **Admin auth** | Separate JWT + bcrypt PIN, 7-day expiry, per-route guard |
| **Rate limiting** | DB-backed per-IP + per-endpoint; per-username login lockout |
| **CSP** | Helmet-managed: `script-src 'self'`, `object-src 'none'` |
| **SQL injection** | Impossible — Supabase client, zero raw SQL |
| **IDOR** | Replies require re-entered password + JWT match |
| **RLS** | Enabled on all tables; no public policies — service-key only |
| **Body size** | 10 KB max JSON payload |
| **Keep-alive** | Cron endpoint gated by timing-safe `CRON_SECRET` comparison |

> **Supabase service role key** bypasses RLS. It lives only in server env vars
> (`.env` is gitignored) and Vercel secrets. The browser never touches Supabase.

---

## 📂 Project Structure

```
whisperbox/
├── api/
│   ├── index.js              # Express app setup + middleware pipeline
│   ├── server.js             # HTTP server entry point
│   ├── database.js           # Supabase client + init + bcrypt seeding
│   ├── middleware/
│   │   ├── auth.js           # JWT verification (admin + visitor)
│   │   ├── rateLimiter.js    # Per-endpoint DB-backed throttling
│   │   └── validator.js      # express-validator schemas
│   ├── routes/
│   │   ├── admin.js          # Login, messages, reply, stats, verify
│   │   ├── messages.js       # Send + check replies (password-gated)
│   │   ├── users.js          # Visitor start, session verify, logout
│   │   ├── notifications.js  # VAPID key + push subscribe
│   │   └── keepalive.js      # Supabase idle-prevention heartbeat
│   └── utils/
│       ├── db.js             # All Supabase queries + rate-limit helpers
│       └── push.js           # Web Push init + send + VAPID keygen
├── src/
│   ├── main.tsx              # React root + SW registration
│   ├── App.tsx               # Router + layout + auth gate
│   ├── sw.ts                 # Service worker (push + precache)
│   ├── index.css             # Global styles + neon theme
│   ├── pages/
│   │   ├── Home.tsx          # Landing + action cards
│   │   ├── SendMessage.tsx    # Compose + send form
│   │   ├── CheckReplies.tsx  # Password-gated reply viewer
│   │   └── Admin.tsx         # Owner dashboard
│   ├── components/
│   │   ├── GlassCard.tsx     # Glassmorphism container
│   │   ├── NeonButton.tsx    # Glow-on-hover button
│   │   ├── NeonInput.tsx     # Styled input + textarea
│   │   ├── ParticleBackground.tsx  # Three.js wireframe particles
│   │   ├── PageTransition.tsx      # Framer Motion route wrapper
│   │   ├── MessageCard.tsx   # Message + reply display
│   │   ├── NotificationToggle.tsx   # Push permission toggle
│   │   └── VisitorGate.tsx   # Login/create session gate
│   └── utils/
│       ├── api.ts            # Typed fetch wrapper
│       ├── auth.tsx          # Admin auth provider
│       ├── visitor.tsx       # Visitor auth provider
│       ├── push.ts           # Push subscription helper
│       └── storage.ts        # LocalStorage utils
├── public/
│   ├── icon.svg              # Source icon (crystal ball on dark)
│   ├── pwa-192x192.png       # Android / desktop PWA icon
│   ├── pwa-512x512.png       # Large PWA icon (maskable)
│   ├── apple-touch-icon.png  # iOS home screen icon
│   ├── badge.png             # Android notification badge
│   ├── mask-icon.svg         # macOS Safari pinned-tab icon
│   └── favicon.ico           # Multi-size browser tab icon
├── supabase/
│   └── schema.sql            # DDL + RLS + indexes
├── .env                      # Secrets (gitignored)
├── vercel.json               # Routing + cron
├── vite.config.ts            # Vite + PWA plugin config
└── package.json
```

---

## 🚀 Deployment (Vercel)

<details>
<summary><b>Click to expand</b></summary>

### One-time setup

1. Push to GitHub
2. Import in [Vercel](https://vercel.com) — framework auto-detected
3. Set environment variables in **Vercel → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (rotate if exposed) |
| `JWT_SECRET` | 64+ char random hex (`openssl rand -hex 64`) |
| `ADMIN_PASSWORD` | Strong 16+ char password |
| `CRON_SECRET` | 32+ char random hex (`openssl rand -hex 32`) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `TRUST_PROXY_HOPS` | `1` |
| `VAPID_MAILTO` | `mailto:you@example.com` (optional) |

4. Redeploy — the Cron job (`/api/cron/keepalive`) auto-registers

</details>

---

## 🤝 Contributing

1. Fork → 2. Branch → 3. Commit → 4. PR

```
git checkout -b feature/my-feature
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

## 📜 License

This project is proprietary software. All rights reserved.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0a0a0f&height=100&section=footer" width="100%" />

<b>built with ❤️ by <a href="https://github.com/avadakedavaraa" style="background:linear-gradient(135deg,#00f2ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700;">avada_kedavaraa</a></b>

</div>
