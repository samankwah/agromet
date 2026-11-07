# AgroMet Website

The public website and staff dashboard for AgroMet Ghana.

**Live:** https://agromet-ghana.vercel.app

Built with React 18, Vite, Tailwind CSS, Leaflet maps and Recharts.

## Pages

**For the public**
- Weather map, today's forecast and 7-day forecast (Open-Meteo)
- Flood and drought monitoring (from the backend)
- Seasonal and subseasonal forecast pages (sample content; the live outlooks
  are in the mobile app)
- Crop and poultry advisories, crop and poultry calendars, agro bulletins
- Crop disease diagnosis from a photo
- Market prices with WhatsApp ordering (example prices)
- News, media, services, about, contact, terms and privacy
- `/app`: download page for the Android app

**For staff** (`/admin-login`, then `/dashboard`)
- Upload crop and poultry calendars and advisories from Excel, preview, then
  publish
- Dashboard counts

Publishing is checked by the backend: only accounts listed in its
`ADMIN_EMAILS` can publish.

## Run it

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens at http://localhost:3000. Start the backend first; in development,
`/api` calls go to it.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_BACKEND_BASE_URL` | Backend address (default `http://localhost:8000`) |
| `VITE_MARKET_WHATSAPP` | WhatsApp number for market orders |
| `VITE_MARKET_PHONE` | Number for the "Call to order" button (defaults to the WhatsApp number) |

These are fixed when the site is built, so redeploy after changing them.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build to dist/
npm run preview   # serve the build
npm run lint      # ESLint
```

## Deploy

```bash
npx vercel --prod
```

Run it from this folder. `vercel.json` sends every path to `index.html` so
page links work.

## Folders

```
src/pages/       One file per page
src/components/  Shared parts (header, chatbot, dashboard panels)
src/services/    Calls to the backend and Open-Meteo
src/config/      API and app download settings
public/          App QR code and store badges
```
