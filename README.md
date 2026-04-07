# Brakes India — React + Firebase

Single-page app built with **Vite + React 18**. The app **requires** Firebase: site data, zones, FPP, and media URLs live in **Firestore** and **Firebase Storage**. There is **no** `localStorage` or IndexedDB-backed content path (admin “Clear media storage” only wipes legacy IndexedDB if present from older visits).

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Production build:

```bash
npm run build
```

## Environment variables

Firebase core project config is fixed in `src/lib/firebase/config.js` for this deployment.
Optional variable:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional (Analytics) |

**Do not commit `.env.local`** (see `.gitignore`).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. **Build command:** `npm run build`  
   **Output directory:** `dist`
4. Add `VITE_FIREBASE_MEASUREMENT_ID` only if you use Analytics.
5. Redeploy after any env change.

`vercel.json` includes a SPA rewrite so client-side routes work.

## Firebase Console setup

1. Enable **Authentication** → Email/Password; create an admin user.
2. Create **Firestore** database; rules example (adjust for your security needs):

   - Read: allow for public site
   - Write: allow only `request.auth != null` for admin

3. Enable **Storage** with matching read/write rules if you use uploads.

Firestore documents used by the app (collection `config`): `siteContent`, `zonesData`, `fppData` — each has a field `payload` (object).

## Legacy static HTML

The old multi-page HTML site (if present) is kept as `legacy-static-site-index.html` at the repo root for reference only. The live app is served from root `index.html` → `src/index.js`.

## Optional local backend

`npm run server` runs the legacy Express static server from `server.js` (not required for Vercel).
