# SteezeDrip Frontend

The SteezeDrip site — built with React + Vite. Single-page, no routing.

## Local setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `VITE_BACKEND_URL` to wherever your `steezedrip-backend`
is running (e.g. `http://localhost:4000` while developing, or your live
Render/Railway URL once deployed).

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Before you go live, edit these in `src/App.jsx`

- **`WHATSAPP_NUMBER`** (near the top) — replace the placeholder with your real WhatsApp Business number.
- **Product prices** in the `COLLECTION` array — currently placeholders (`₦45,000` etc). Keep these in sync with `utils/catalog.js` in the backend, since that's what actually gets charged.
- **Bank details** inside `CheckoutModal` — the "Manual bank transfer" panel currently shows placeholder account info.

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/` — that's what you deploy.

## Deploying

Any static host works. **Vercel** or **Netlify** are the easiest:

1. Push this repo to GitHub.
2. On Vercel/Netlify: **New Project → Import** this repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add the environment variable `VITE_BACKEND_URL` (same as your local `.env`) in the host's project settings.
5. Deploy. You'll get a live URL (e.g. `https://steezedrip.vercel.app`) — or attach your own domain.

Once deployed, go back to your **backend's** environment variables and set `FRONTEND_URL` to this exact URL — it's used for CORS and for redirecting customers back after payment.

## Project structure

```
src/
  App.jsx        — the entire site (nav, hero, collection, cart, checkout, etc.)
  main.jsx        — React entry point
  assets/         — real product photos, imported directly (front/back + detail crops)
```

There's no component-per-file split — everything lives in `App.jsx` on purpose, since the site is one continuous page rather than multiple routes.
