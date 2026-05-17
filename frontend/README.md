# AgroMet Frontend

A modern web application for agricultural meteorological advisory services in Ghana. Built for farmers, agricultural extension officers, and agribusiness stakeholders to access weather forecasts, crop calendars, market intelligence, and advisory bulletins.

## Tech Stack

- **Framework:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router v6
- **HTTP Client:** Axios with retry support
- **Maps:** Leaflet / React Leaflet, Google Maps API
- **Charts:** Recharts, Chart.js, amCharts 5
- **Auth:** Firebase Authentication
- **Animations:** Framer Motion, React Spring
- **Export:** jsPDF, html2canvas, xlsx

## Features

### Weather & Forecasts
- Interactive weather map with regional overlays
- 7-day, seasonal, and sub-seasonal forecast views
- Flood and drought monitoring dashboard
- Animated weather icons and themed UI

### Crop Management
- Crop calendar builder and viewer (seasonal + poultry cycles)
- Production cycle tracking with activity timelines
- Agromet and poultry advisory management
- Excel-based calendar upload with smart parsing

### Market Intelligence
- Commodity price listings with trend indicators
- Regional market center data (Greater Accra, Ashanti, Northern, Western)
- Price charts and demand forecasting
- WhatsApp-integrated ordering flow

### Advisory System
- Weekly agro-meteorological bulletins
- SMS advisory generation
- Weather forecast tables with activity recommendations
- Crop-specific and region-specific guidance

### AI & Language
- Crop disease diagnostic tool (image-based)
- AI chatbot with farm profile context
- Multi-language support with browser translation fallback and browser TTS
- Voice input capabilities

### Admin Dashboard
- Content management hub for calendars and advisories
- File upload and management
- Dashboard statistics and reporting
- Role-based access with protected routes

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
git clone https://github.com/samankwah/agromet-frontend.git
cd agromet-frontend
npm install
```

### Configuration

Copy the environment template and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_BACKEND_BASE_URL` | Backend API URL (default: `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `VITE_AMBEE_API_KEY` | Ambee weather data API key |

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173` by default.

### Production Build

```bash
npm run build
npm run preview
```

Output is in the `dist/` directory, ready for static hosting (Netlify, Vercel, etc.).

## Project Structure

```
src/
  assets/          # Images, icons, static data (ghana-regions.json)
  blog/            # Blog post components
  components/      # Reusable UI components
    Chatbot/       # AI chatbot widget
    Dashboard/     # Admin dashboard panels
    WeeklyAdvisory/# Advisory display components
    common/        # Shared components (filters, renderers, dropdowns)
  config/          # API configuration
  contexts/        # React context providers
  data/            # Static datasets (Ghana codes, languages)
  firebase/        # Firebase config and helpers
  hooks/           # Custom React hooks
  pages/           # Route-level page components
  services/        # API service layers and business logic
  styles/          # CSS animations and themes
  utils/           # Parsers, validators, helpers
```

## Related

- **Backend:** [samankwah/agromet-backend](https://github.com/samankwah/agromet-backend)

## License

MIT
