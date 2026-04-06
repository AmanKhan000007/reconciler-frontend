# Reconciler Frontend
### Connected · Deployed · Production-Ready

---

## What This Is

The complete React frontend for the **Reconciler** financial transaction reconciliation platform.  
Connects to the `reconciler-backend` Node.js/Express/MongoDB API.

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Landing Page** | `/` | Marketing page with product demo video section |
| **Sign In / Register** | Auth screen | JWT-based auth, connects to `/auth/login` + `/auth/register` |
| **Dashboard** | Portal | KPIs, status breakdown, revenue chart, category analysis |
| **Transactions** | Portal | Full CRUD + CSV bulk import. Filters by source & status |
| **Reconciliation** | Portal | One-click engine run — matched / unmatched / exceptions |
| **Ledger** | Portal | Running balance view (Bank or Internal) |
| **Tickets** | Portal | Create tickets, add comments, admin status management |
| **Admin** | Portal (admin only) | Users, analytics, system monitoring, full audit log |
| **Settings** | Portal | Update profile, currency, change password |

---

## API Integration

Every screen is wired to the backend. All calls are in `src/api/index.js`:

| Frontend Feature | Backend Endpoint |
|-----------------|-----------------|
| Login / Register | `POST /auth/login` · `POST /auth/register` |
| Profile update | `PUT /auth/profile` · `PUT /auth/password` |
| Transaction list | `GET /transactions?source=&status=` |
| Add transaction | `POST /transactions` |
| CSV import | `POST /transactions/import` |
| Run reconciliation | `POST /transactions/reconcile` |
| Ledger view | `GET /transactions/ledger?source=` |
| Summary stats | `GET /transactions/summary` |
| Tickets | `GET/POST/PATCH /tickets` |
| Admin users | `GET/PATCH/DELETE /admin/users` |
| Admin analytics | `GET /admin/analytics` |
| System monitoring | `GET /admin/monitoring` |
| Audit log | `GET /admin/audit` |

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Backend (`reconciler-backend`) running on port 5000

```bash
# 1. Enter the frontend folder
cd reconciler-frontend

# 2. Install dependencies
npm install

# 3. Set your backend URL
cp .env.example .env
# Edit .env → set VITE_API_URL=http://localhost:5000

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Deploy to Production

### Option A — Vercel (recommended, free)
```bash
npm i -g vercel
vercel --prod
# Set VITE_API_URL = https://your-backend.onrender.com
```

### Option B — Netlify
```bash
npm run build
# Drag & drop the /dist folder to netlify.com
# Set environment variable VITE_API_URL in Site settings
```

### Option C — Render (same platform as backend)
1. Push this folder to a GitHub repo
2. Create a new **Static Site** on render.com
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add env var: `VITE_API_URL = https://reconciler-backend.onrender.com`

---

## Demo Video

The landing page includes an embedded YouTube video player.  
To replace the placeholder with your real demo:

1. Upload your screen recording to YouTube
2. Get the video ID from the URL (e.g., `dQw4w9WgXcQ`)
3. In `src/App.jsx`, find the two `<iframe>` tags and replace `dQw4w9WgXcQ` with your video ID

---

## Backend CORS

Make sure your backend allows requests from your frontend URL.  
In `reconciler-backend/server.js`, update:
```js
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend.vercel.app'],
  credentials: true
}));
```

---

## File Structure

```
reconciler-frontend/
├── public/
│   ├── favicon.svg
│   └── _redirects          ← Netlify SPA routing
├── src/
│   ├── api/
│   │   └── index.js        ← All API calls (auth, transactions, admin, tickets)
│   ├── App.jsx             ← All pages & components
│   └── main.jsx            ← React root
├── index.html
├── package.json
├── vite.config.js
├── vercel.json             ← Vercel SPA routing
├── render.yaml             ← Render.com deployment config
├── .env.example
└── README.md
```

---

*Designed for production. Every endpoint wired. Deploy-ready.*
