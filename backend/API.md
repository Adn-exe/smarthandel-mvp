# SmartHandel API Documentation 🔌

Detailed documentation for the SmartHandel MVP backend services.

## Base URL
The backend server typically runs on:
`http://localhost:3001`

All API routes are prefixed with `/api`.

---

## 🏗️ Core Endpoints

### 1. `POST /api/products/search`
Search for products using natural language and get immediate store comparisons.

**Body Parameters:**
- `query` (string, required): The search query (e.g., "Melk og brød")
- `location` (object, required):
  - `lat` (number): Latitude (-90 to 90)
  - `lng` (number): Longitude (-180 to 180)

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Melk og brød",
    "location": { "lat": 59.9139, "lng": 10.7522 }
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "items": [{ "name": "Melk", "quantity": 1 }],
  "budget": 100,
  "comparison": { ... },
  "timestamp": "2024-02-13T22:00:00Z"
}
```

---

### 2. `GET /api/stores/nearby`
Find grocery stores within a specific radius of coordinates.

**Query Parameters:**
- `lat` (number, required): Latitude
- `lng` (number, required): Longitude
- `radius` (number, optional): Search radius in KM (Default: 5, Max: 50)

**Example Request:**
```bash
curl "http://localhost:3001/api/stores/nearby?lat=59.91&lng=10.75&radius=2"
```

---

### 3. `POST /api/route/optimize`
Calculate the optimal shopping route (Single vs. Multi-store comparison).

**Body Parameters:**
- `items` (array, required): Array of objects `{ name: string, quantity: number }`
- `userLocation` (object, required): `{ lat: number, lng: number }`
- `preferences` (object, optional):
  - `maxStores` (number, optional): Max stores to visit (1-5, Default: 3)
  - `maxDistance` (number, optional): Max travel distance in meters (Default: 10000)

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/route/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "name": "Epler", "quantity": 1 }],
    "userLocation": { "lat": 59.91, "lng": 10.75 }
  }'
```

---

### 4. `POST /api/route/calculate-savings`
Quickly calculate potential savings across stores for a list of items.

**Body Parameters:**
- `items` (array, required): Array of strings or objects.
- `userLocation` (object, required): `{ lat: number, lng: number }`

---

### 5. `POST /api/ai/parse`
Use AI to parse raw text into structured shopping items.

**Body Parameters:**
- `query` (string, required): Raw text list.

---

## 🏥 Health & Monitoring

### `GET /api/health`
Basic system status check.

### `GET /api/health/ready`
Deep readiness check including external service status (Kassalapp, Anthropic, Cache).

---

## 🛡️ Rate Limiting & Caching

### Rate Limits
- **General Routes**: Up to 100 requests per 15 minutes.
- **Strict Routes (AI/Optimization)**: Up to 20 requests per 15 minutes.

### Caching behavior
- **Products**: Cached for 5-60 minutes depending on specificity.
- **Stores**: Cached for 24 hours.
- **AI/Route Results**: Cached for 1 hour to reduce API costs.

## 💡 Best Practices
1. **Always provide coordinates**: Results are highly location-dependent.
2. **Handle 429**: Implement exponential backoff if you hit rate limits.
3. **Check `/ready`**: Use the readiness endpoint for automated health monitoring.
