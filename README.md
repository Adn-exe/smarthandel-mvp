<div align="center">
  <h1>SmartHandel MVP �✨</h1>
  <p><strong>Your Ultimate AI-Powered Grocery Shopping Assistant</strong></p>
  <p>Find the best prices, compare stores, and optimize your grocery routes in Trondheim.</p>

  [![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4x-000000?logo=express)](https://expressjs.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![PWA Support](https://img.shields.io/badge/PWA-Ready-purple?logo=pwa)](https://web.dev/explore/progressive-web-apps)

</div>

---

SmartHandel uses **Google Gemini 2.0 Flash** to instantly parse your natural language shopping lists and the **Kassalapp API** to scan the entire grocery market in Trondheim, Norway. It intelligent routing engine tells you exactly where to shop to save the most money—whether that means a quick trip to one store, or splitting your list across multiple.

## 🌟 Key Features

### 🤖 Intelligent AI Parsing & Matching
- **Natural Language Parsing**: Just type *"2 liters of milk, a load of bread, and some eggs"* and Gemini AI instantly structures your cart.
- **Strict Prefix Pattern Matching**: Our enhanced algorithm strictly filters irrelevant recommendations, ensuring high-accuracy brand matching so you aren't recommended "Chocolate with Sea Salt" when you just asked for "Salt."

### 💰 Real-Time Savings & Selectable Offers
- **Price Comparison & Offers**: Integrates direct promotional data from stores like Joker, Coop Marked, and Bunpris.
- **Interactive Selectable Offers**: Instantly select active promotional campaigns right from the Item Card. Automatically applies "30% OFF" or fixed-price discounts, instantly updating your cart budget.
- **"Leave Flexible" Mode**: Unsure what brand to get? Click *Leave Flexible* and let the routing engine find the absolute cheapest substitute available.

### 🗺️ Route Optimization Engine
- **Single vs. Multi-Store Maps**: Instantly compares the convenience of visiting the cheapest single store vs. the savings of splitting your trip across multiple stores.
- **Dynamic Proximity**: Automatically toggles between meters (m) and kilometers (km) based on your real-time GPS location compared to the store.
- **Interactive Leaflet Maps**: View store locations with optimized road-following routes.

### 📱 Premium Mobile-First PWA Experience
- **Progressive Web App (PWA)**: Install SmartHandel directly to your home screen. Fully configured with high-res icons and up to 5MB offline caching limits.
- **Dynamic Bento Grid**: A polished, 6-item "Magic Bento" home screen featuring global spotlight mouse tracking and rich promotional imagery.
- **App-Like Interactions**: Sticky price footers, horizontal category scroll-rows, and touch-optimized bottom sheet modals.

### 🔒 Enterprise-Grade Security
- **Hardened API Routes**: Comprehensive `.trim().escape()` XSS sanitization across all AI and Search endpoints.
- **Strict Rate Limiting**: Intelligent traffic throttling via Express Middleware chained limits.
- **Ephemeral Storage Safe**: Designed to boot safely even if deployed to read-only containerized environments like Vercel or Railway.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4.0, Framer Motion
- **State & Data**: TanStack Query (React Query), Context API
- **Maps**: React Leaflet
- **Localization**: i18next (English & Norwegian Bokmål)

### Backend
- **Server**: Node.js & Express, TypeScript
- **AI Core**: Google Gemini 2.0 Flash (for parsing & suggestions)
- **Data Source**: Kassalapp API
- **Performance**: Node-Cache (In-memory TTL)
- **Security**: Helmet, HPP (HTTP Parameter Pollution), express-rate-limit

---

## 🚀 Getting Started

### 🌍 International Usage
**Important:** If you are outside Norway, you **must** connect to a VPN server located in **Norway** (e.g., via [Urban VPN](https://www.urban-vpn.com/)) to successfully proxy requests to the localized Kassalapp grocery data API.

### Prerequisites
- Node.js 18+
- NPM 9+
- API Keys: 
  - Kassalapp API Key
  - Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd smarthandel-mvp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Setup

#### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
KASSAL_API_KEY=your_kassal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CACHE_TTL=3600
ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Run the Application
Start the backend and frontend development servers concurrently:
```bash
# Backend Terminal
npm run dev --prefix backend

# Frontend Terminal
npm run dev --prefix frontend
```

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Basic system uptime check |
| `POST` | `/api/ai/parse` | Parse natural language to a structured shopping cart |
| `GET` | `/api/products/search` | Exact-match query for specific items or brands |
| `POST` | `/api/route/optimize` | Main Store Comparison & Route Engine (Calculates Single vs Multi-Store paths) |
| `POST` | `/api/report` | User-driven system to submit product mismatch reports |

---

## 🚢 Deployment

### Production Build
```bash
cd frontend && npm run build
cd backend && npm run build
```

### Hosting Recommendations
- **Backend**: Railway, Render, or Docker (Note: If using ephemeral local storage for reports, ensure a persistent volume is attached, or expect reports to wipe on restart).
- **Frontend**: Vercel, Netlify, or static S3 hosting.

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **AI Parse Error (500)** | Gemini Quota | Verify `GEMINI_API_KEY` is valid and review your Google Cloud quota. |
| **"Too Many Requests"** | Rate Limiting | The backend actively enforces strict limits on AI routes to prevent abuse. Wait 1 minute. |
| **No Stores Found** | Geo-Constraint | All searches are constrained to **Trondheim**. Ensure your provided GPS coordinates match the region, and that you are using a Norway VPN. |
| **Vercel Build Fails** | PWA Caching | Fixed! If you see Workbox size limit errors, check `vite.config.ts` to ensure `maximumFileSizeToCacheInBytes` is set high enough for your image assets. |

---
*Created with ❤️ by the SmartHandel Team.*
