# SmartHandel MVP 🛍️

SmartHandel is an AI-powered shopping assistant that helps users find the best prices for their grocery lists across multiple stores in Trondheim, Norway. It uses intelligent optimization to recommend whether to shop at a single store or split the trip between multiple locations for maximum savings.

## ✨ Features

- **AI-Powered Search**: Natural language processing via **Google Gemini 2.0 Flash** to understand your shopping list.
- **Price Comparison**: Real-time integration with Norwegian grocery data (Kassalapp API).
- **Route Optimization**: Intelligent logic to find the cheapest single-store or multi-store options.
- **Interactive Maps**: Leaflet-powered store locations and optimized road-following routes.
- **Mobile-First Experience**: Tab-based List/Map toggle, sticky price footer, and touch-optimized interactions.
- **Multilingual Support**: Fully localized in English and Norwegian (Bokmål).
- **Price Mismatch Reporting**: Community-driven data accuracy with a built-in reporting system.
- **Smart Distance Logic**: Automatic switching between meters (m) and kilometers (km) based on proximity.
- **Performance Optimized**: Lazily loaded components, code splitting, and memoization.
- **Trondheim Region**: All store searches are geographically constrained to the Trondheim area.

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** (v4.0)
- **TanStack Query** (React Query)
- **React Leaflet** (Interactive Maps)
- **Lucide React** (Icons)
- **React Router**
- **i18next** (Multilingual Support)

### Backend
- **Node.js** & **Express**
- **TypeScript**
- **Google Gemini 2.0 Flash** for AI list parsing
- **Kassalapp API** for grocery pricing and store data
- **Node-Cache** for in-memory performance caching
- **Helmet & HPP** for security
- **express-rate-limit** for abuse prevention

## 🚀 Getting Started

### 🌍 International Usage
**Important:** If you are outside Norway, you **must** connect to a VPN server located in **Norway** to access Kassalapp API data.
- **Recommended:** [Urban VPN](https://www.urban-vpn.com/) (Browser Extension or App)

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
```bash
PORT=3001
NODE_ENV=development
KASSAL_API_KEY=your_kassal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CACHE_TTL=3600
ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (`frontend/.env.local`)
```bash
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Run the Application

```bash
# Backend
npm run dev --prefix backend

# Frontend (in a separate terminal)
npm run dev --prefix frontend
```

### 📱 Mobile Testing
To test on a mobile device on the same network:
1. Find your computer's local IP (e.g. `192.168.1.14`).
2. Set `VITE_API_URL=http://192.168.1.14:3001` in `frontend/.env.local`.
3. Access the app at `http://<YOUR_LOCAL_IP>:5173`.

## 📁 Project Structure

```text
smarthandel-mvp/
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # API Endpoints (ai, route, report, health)
│   │   ├── services/       # AI, Pricing, Comparison, Report logic
│   │   ├── middleware/     # Error handling, rate limiting
│   │   └── server.ts       # Entry point
│   ├── data/               # Persisted report data (item_mismatch_reports.json)
│   ├── Dockerfile          # Multi-stage production build
│   └── ecosystem.config.js # PM2 configuration
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI Components (StoreMap, ResultsDisplay, etc.)
│   │   ├── pages/          # Views (Home, Selection, Results)
│   │   ├── locales/        # i18n translations (en.json, no.json)
│   │   └── hooks/          # useLocation and other custom hooks
│   └── vercel.json         # Vercel SPA configuration
├── docker-compose.yml      # Orchestration for local development
└── railway.json            # Railway deployment configuration
```

## 🔌 API Documentation

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Basic system check |
| `GET` | `/api/health/ready` | Full readiness check (Kassal, Gemini, Cache) |
| `POST` | `/api/ai/parse` | Convert natural language to a product list |
| `GET` | `/api/products/search` | Search for specific items |
| `POST` | `/api/route/optimize` | Main store comparison & route engine |
| `POST` | `/api/report` | Submit a product mismatch report |

### Example Optimization Request
```json
POST /api/route/optimize
{
  "items": [{ "name": "Melk", "quantity": 1 }, { "name": "Brød", "quantity": 1 }],
  "userLocation": { "lat": 63.4305, "lng": 10.3951 },
  "preferences": { "maxStores": 3, "maxDistance": 10000, "sortBy": "cheapest" }
}
```

## 🧪 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run test     # Run test suites
npm run lint     # Check code quality
```

### Testing
- **Backend**: Jest (`cd backend && npm test`)
- **Frontend**: Vitest (`cd frontend && npm test`)

## 🚢 Deployment

### Production Build
```bash
cd frontend && npm run build
cd backend && npm run build
```

### Hosting
- **Backend**: Docker, PM2, or Railway
- **Frontend**: Vercel, Netlify, or static hosting

> **Note:** Ensure the `backend/data/` directory exists in production for the mismatch report storage. It is created automatically on first run.

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **API Connection Failed** | Missing env vars | Check `KASSAL_API_KEY` and `GEMINI_API_KEY` in `backend/.env` |
| **AI Parse Error (500)** | Gemini quota or key | Verify `GEMINI_API_KEY` is valid; check Gemini API quota |
| **Map blank/grey on mobile** | Leaflet init issue | Fixed in latest version — ensure you are on the latest commit |
| **"Too Many Requests"** | Rate limiting | Wait 1 minute; strict limits prevent abuse |
| **CORS Errors** | Mismatched origins | Ensure `ALLOWED_ORIGINS` in backend matches the frontend URL |
| **No stores found** | Outside Trondheim region | All searches are geo-constrained to Trondheim; use a Norway VPN |

## 📄 License
This project is licensed under the MIT License.

---
Created with ❤️ by the SmartHandel Team.
