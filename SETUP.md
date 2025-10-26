# Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- API Keys:
  - Google Gemini API key
  - ElevenLabs API key

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project root
cd ditt_2

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

#### Backend Configuration

Create or edit `server/.env`:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your API keys:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**⚠️ IMPORTANT**: The `.env` file is already populated with your existing API keys. Make sure it's listed in `.gitignore` to keep them secure.

#### Frontend Configuration

Create `.env.development` in the project root:

```env
VITE_API_URL=http://localhost:3001/api
```

For production, create `.env.production`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 3. Run the Application

You'll need two terminal windows:

#### Terminal 1 - Backend Server

```bash
cd server
npm run dev
```

The backend will start on `http://localhost:3001`

#### Terminal 2 - Frontend

```bash
# From project root
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Verify Setup

1. Open `http://localhost:5173` in your browser
2. Check the browser console for any errors
3. Check backend terminal for connection logs
4. Try submitting a query like "how photosynthesis works"

## Troubleshooting

### Backend Not Starting

**Problem**: Error about missing dependencies

**Solution**:
```bash
cd server
rm -rf node_modules
npm install
```

**Problem**: Port 3001 already in use

**Solution**: Either kill the process using port 3001 or change the port in `server/.env`

```bash
# Find and kill process on port 3001 (macOS/Linux)
lsof -ti:3001 | xargs kill -9

# Or change PORT in server/.env
PORT=3002
```

### Frontend Not Connecting to Backend

**Problem**: CORS errors in browser console

**Solution**: Verify `CORS_ORIGIN` in `server/.env` matches your frontend URL

```env
CORS_ORIGIN=http://localhost:5173
```

**Problem**: Network errors when submitting queries

**Solution**: 
1. Check backend is running
2. Verify `VITE_API_URL` in `.env.development` is correct
3. Check browser console for specific error messages

### API Key Issues

**Problem**: 401 Unauthorized errors

**Solution**: 
1. Verify API keys are correct in `server/.env`
2. Check keys have proper permissions
3. Verify keys haven't expired

### Build Errors

**Problem**: TypeScript errors during build

**Solution**:
```bash
# Frontend
npm run build

# Backend
cd server
npm run build
```

Check the error messages and ensure all TypeScript types are correct.

## Development Workflow

### Making Changes

1. **Frontend changes**: Edit files in `src/`, hot reload will update automatically
2. **Backend changes**: Edit files in `server/src/`, the server will restart automatically (using tsx watch)
3. **Shared types**: Update type definitions in both frontend and backend service files

### Testing Changes

1. Test in development mode first
2. Check both browser and server console for errors
3. Test error scenarios (invalid input, network issues)
4. Verify API calls in Network tab

### Adding New Features

1. **New API endpoint**:
   - Create route handler in `server/src/routes/`
   - Add business logic in `server/src/services/`
   - Update frontend service to call new endpoint
   - Update TypeScript types

2. **New React component**:
   - Create component in `src/components/`
   - Add React.memo if it's a presentational component
   - Use useCallback for event handlers
   - Use useMemo for expensive computations

## Production Deployment

### Building for Production

#### Frontend
```bash
npm run build
# Output will be in dist/
```

#### Backend
```bash
cd server
npm run build
# Output will be in server/dist/
```

### Environment Variables for Production

1. Update `VITE_API_URL` to your production backend URL
2. Update `CORS_ORIGIN` in backend to your production frontend URL
3. Set `NODE_ENV=production` in backend

### Deployment Options

#### Option 1: Traditional Hosting

**Frontend** (Netlify, Vercel, etc.):
1. Build the frontend
2. Deploy `dist/` folder
3. Set environment variable `VITE_API_URL`

**Backend** (Heroku, Railway, DigitalOcean, etc.):
1. Deploy `server/` folder
2. Set all environment variables
3. Ensure Node.js version matches

#### Option 2: Docker

Create `Dockerfile` for frontend and backend, then use docker-compose.

#### Option 3: Serverless

- Frontend: Deploy to Vercel/Netlify
- Backend: Convert to serverless functions (AWS Lambda, Vercel Functions)

## Security Checklist

- [ ] API keys are in environment variables, not in code
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is configured properly
- [ ] Input validation is in place
- [ ] Rate limiting is configured (for production)
- [ ] HTTPS is enabled (for production)

## Performance Optimization Checklist

- [x] React components use React.memo where appropriate
- [x] Event handlers use useCallback
- [x] Expensive computations use useMemo
- [x] Components are properly split
- [x] API calls are minimized (combined voiceover)
- [ ] Images are optimized
- [ ] Bundle size is monitored
- [ ] Lazy loading for routes (can be added)

## Monitoring

### Development Monitoring

- Browser console for frontend errors
- Server console for backend errors
- Network tab for API call inspection
- React DevTools for component inspection

### Production Monitoring (Recommended)

- Error tracking: Sentry
- Performance monitoring: Lighthouse, Web Vitals
- API monitoring: Datadog, New Relic
- Uptime monitoring: Pingdom, UptimeRobot

## Getting Help

If you encounter issues:

1. Check this guide thoroughly
2. Review `ARCHITECTURE.md` for system understanding
3. Check browser and server console logs
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed
6. Try clearing node_modules and reinstalling

## Common Commands Reference

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter

# Backend
cd server
npm run dev          # Start development server with auto-reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Run production build

# Clean install
rm -rf node_modules package-lock.json
npm install
```

