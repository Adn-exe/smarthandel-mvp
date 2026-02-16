# SmartHandel MVP Backend

Professional Node.js backend built with TypeScript, Express, and Claude AI.

## Tech Stack
- **Node.js**: ES6 Modules
- **TypeScript**: Typed development
- **Express**: Fast, unopinionated web framework
- **Claude AI**: Intelligent processing via @anthropic-ai/sdk
- **In-memory cache**: node-cache
- **Monitoring**: Health check endpoint included

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository
2. Navigate to the backend folder: `cd backend`
3. Install dependencies: `npm install`
4. Set up environment variables: `cp .env.example .env` (then update values)

### Available Scripts
- `npm run dev`: Start development server with hot-reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run compiled production build

## Folder Structure
- `src/config`: Configuration files
- `src/services`: Business logic and AI integrations
- `src/routes`: API endpoint definitions
- `src/middleware`: Custom middleware
- `src/types`: TypeScript interfaces and types
- `src/utils`: Helper functions and utilities
- `src/server.ts`: Main entry point
