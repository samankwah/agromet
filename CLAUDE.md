# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production 
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Architecture

**TriAgro AI** is a React-based agricultural web application with the following core structure:

### Routing & Layout System
- Main router in `src/App.jsx` with comprehensive route definitions
- Two layout systems:
  - `RootLayout` - Main public site with Header/Footer and ChatbotWidget
  - `AdminLayout` - Administrative dashboard interface
- Route groups:
  - Public pages (weather, forecasts, advisories, market)
  - Blog posts for agricultural updates
  - Admin dashboard at `/dashboard`
  - Production calendar routes (`/production/*`)

### Key Feature Areas

**Weather & Forecasting**
- Multiple forecast types: 7-day, seasonal, subseasonal
- Weather data integration with external APIs
- Ghana regions mapping (`assets/ghana-regions.json`)

**Agricultural Services**
- Crop calendar and planting advisories
- Disease detection tool (`CropDiagnosticTool.jsx`)
- Market pricing for agricultural products (hardcoded product data in App.jsx)
- Poultry and crop advisory services

**Chatbot Integration**
- Context-aware chatbot using `ChatbotProvider`
- Integrated across the application via `RootLayout`
- Service layer in `services/chatbotService.js`

### API Configuration
- Axios client configured in `services/config.js` with JWT token interceptor
- Environment-based base URL (`VITE_BASE_URL`)
- Vite proxy configuration for GhanaNLP translation and TTS services
- Firebase integration (placeholder config in `firebase/firebaseConfig.js`)

### Technology Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS with custom animations
- **Routing**: React Router v6
- **Maps**: React Leaflet, Google Maps, React Simple Maps
- **Charts**: Chart.js, Recharts, AmCharts5
- **UI Components**: Radix UI, Lucide React icons
- **File Processing**: PDF generation, Excel handling, image compression

### Development Notes
- Environment variables expected: `VITE_BASE_URL`
- Firebase configuration needs real credentials (currently placeholder)
- Translation services configured for GhanaNLP API
- Market product data is currently hardcoded in App.jsx (lines 62-242)
- Admin authentication uses localStorage token (`donatrakAccessToken`)