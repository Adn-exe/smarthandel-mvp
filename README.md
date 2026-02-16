# SmartHandel MVP 🛍️

SmartHandel is an AI-powered shopping assistant that helps users find the best prices for their grocery lists across multiple stores. It uses intelligent optimization to recommend whether to shop at a single store or split the trip between multiple locations for maximum savings.

## ✨ Features

- **AI-Powered Search**: Natural language processing to understand your shopping list.
- **Price Comparison**: Real-time integration with Norwegian grocery data (Kassalapp API).
- **Route Optimization**: Intelligent logic to find the cheapest single-store or multi-store options.
- **Smart Route Cost Breakdown**: Detailed analysis of groceries vs. travel costs.
- **Dynamic Loading UI**: Engaging visual feedback during complex backend operations.
- **Interactive Maps**: Visualized store locations and optimized routes (Mapbox).
- **Performance Optimized**: Lazily loaded components, code splitting, and memoization for a smooth experience.
- **Error Boundaries**: Robust error handling with granular recovery logic.
- **Analytics Tracking**: Insights into user behavior and application health.

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** (v4.0)
- **TanStack Query** (React Query)
- **Lucide React** (Icons)
- **React Router**

### Backend
- **Node.js** & **Express**
- **TypeScript**
- **Google Gemini AI** (Flash Preview) for list parsing
- **Kassalapp API** for grocery pricing and store data
- **Node-Cache** for performance
- **Helmet & HPP** for security

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- NPM 9+
- API Keys:
  - Kassalapp API Key
  - Gemini API Key
  - Mapbox Token (Optional)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd smarthandel-mvp
   ```

2. **Install dependencies**:
   ```bash
   # Install root and workspace dependencies
   npm install
   ```

3. **Environment Setup**:
   - Backend: Copy `backend/.env.example` to `backend/.env` and add your keys.
   - Frontend: Copy `frontend/.env.example` to `frontend/.env.local` and add your keys.

4. **Run the application**:
   ```bash
   # Start backend and frontend concurrently (requires individual setup usually)
   # Run Backend
   npm run dev --prefix backend
   
   # Run Frontend in a separate terminal
   npm run dev --prefix frontend
   ```

## 📁 Project Structure

```text
smarthandel-mvp/
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # API Endpoints
│   │   ├── services/       # AI, Pricing, and Comparison logic
│   │   └── server.ts       # Entry point
│   ├── Dockerfile          # Multi-stage production build
│   └── ecosystem.config.js # PM2 configuration
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI Components (Memoized & Lazy)
│   │   ├── pages/          # Views (Lazy Loaded)
│   │   └── utils/          # Analytics and Helpers
│   └── vercel.json         # Vercel SPA configuration
├── docker-compose.yml      # Orchestration for local development
└── railway.json            # Railway deployment configuration
```

## 🔌 API Documentation

### Key Endpoints

- `GET /api/health`: Basic system check.
- `GET /api/health/ready`: Full readiness check (service connectivity).
- `POST /api/ai/parse`: Uses AI to convert natural language into a product list.
- `GET /api/products/search`: Search for specific items in the catalog.
- `POST /api/route/optimize`: Main intelligence engine for store comparison.

### Example Optimization Request
```json
POST /api/route/optimize
{
  "items": ["Melk", "Brød"],
  "userLocation": { "lat": 59.91, "lng": 10.75 },
  "preferences": { "maxDistance": 5000 }
}
```

## 🧪 Development

### Available Scripts
- `npm run dev`: Start development server.
- `npm run build`: Create production build.
- `npm run test`: Run test suites.
- `npm run lint`: Check code quality.

### Testing
We use **Vitest** for frontend component testing and **Jest** for backend API testing.
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🚢 Deployment

### Production Build
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build
```

### Hosting Platforms Support
- **Backend**: Docker, PM2, or Railway.
- **Frontend**: Vercel, Netlify, or static hosting.

## 🤝 Contributing
1. Create a feature branch.
2. Ensure tests pass (`npm test`).
3. Submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.

---
Created with ❤️ by the SmartHandel Team.
