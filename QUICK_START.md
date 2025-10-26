# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (2 minutes)

```bash
# Terminal 1 - From project root
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Verify Environment (30 seconds)

The backend is already configured with your API keys in `server/.env`. Just verify the file exists:

```bash
cat server/.env
```

You should see:
```
PORT=3001
GEMINI_API_KEY=AIzaSy...
ELEVEN_LABS_API_KEY=sk_5e5...
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start the Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Wait for:
```
🚀 Server running on port 3001
📡 CORS enabled for: http://localhost:5173
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

### Step 4: Test It (30 seconds)

1. Open http://localhost:5173 in your browser
2. Type: "how photosynthesis works"
3. Click submit or press Enter
4. Watch the magic happen! ✨

---

## 📖 Understanding the New Architecture

### What Changed?

**Old Way (Insecure):**
```
Browser → Gemini API (with exposed API key) ❌
Browser → ElevenLabs API (with exposed API key) ❌
```

**New Way (Secure):**
```
Browser → Your Backend → Gemini API ✅
Browser → Your Backend → ElevenLabs API ✅
```

### File Structure at a Glance

```
ditt_2/
├── src/                    # Your React frontend
│   ├── components/
│   │   └── player/        # 🆕 SVGPlayer broken into 6 components
│   ├── services/          # 🔄 Now calls backend API
│   └── utils/             # 🆕 Extracted utilities
│
└── server/                # 🆕 New Express backend
    └── src/
        ├── routes/        # API endpoints
        ├── services/      # Business logic
        └── index.ts       # Server entry
```

---

## 💡 Common Usage Patterns

### Making API Calls (Frontend)

**Old way:**
```typescript
// ❌ Direct API call with exposed key
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const response = await ai.models.generateContent({...});
```

**New way:**
```typescript
// ✅ Call your secure backend
const data = await apiClient.post<ProcessBreakdown>('/process/generate', {
  query: userQuery
});
```

### Creating Optimized Components

**Old way:**
```typescript
// ❌ Re-renders on every parent update
export const MyComponent = ({ data }) => {
  return <div>{data}</div>;
};
```

**New way:**
```typescript
// ✅ Only re-renders when props actually change
export const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### Memoizing Event Handlers

**Old way:**
```typescript
// ❌ Creates new function on every render
<button onClick={() => handleClick(id)}>
  Click me
</button>
```

**New way:**
```typescript
// ✅ Stable reference across renders
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);

<button onClick={handleButtonClick}>
  Click me
</button>
```

---

## 🐛 Troubleshooting

### Issue: Backend won't start

**Check 1:** Is port 3001 free?
```bash
lsof -i :3001
# If something is running, kill it:
kill -9 <PID>
```

**Check 2:** Are dependencies installed?
```bash
cd server
ls node_modules  # Should show many folders
```

**Check 3:** Is .env file present?
```bash
ls -la server/.env  # Should exist
```

### Issue: Frontend can't connect to backend

**Check 1:** Is backend running?
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

**Check 2:** Check browser console
Press F12 → Console tab → Look for errors

**Check 3:** Verify CORS settings
In `server/.env`:
```
CORS_ORIGIN=http://localhost:5173
```

### Issue: API errors

**Check 1:** Are API keys valid?
```bash
# Check they're not empty
cat server/.env | grep API_KEY
```

**Check 2:** Check server logs
Look in the terminal running the backend for error messages

### Issue: TypeScript errors

**Solution:** Rebuild
```bash
npm run build
cd server && npm run build
```

---

## 📱 Using the Application

### 1. Chat Interface

Type any process you want to learn about:
- "how photosynthesis works"
- "water cycle"
- "how a rocket launches"
- "how wifi works"
- "blockchain basics"

### 2. SVG Player

Once generated, you'll see:
- **Animated SVGs**: Watch elements morph between stages
- **Captions**: Real-time word highlighting synchronized with audio
- **Progress**: Visual progress bar and stage timeline
- **Controls**: Play/Stop button

### 3. Quiz Section

Scroll down (or it auto-appears after video):
- Multiple choice questions
- Visual questions (with SVG reference)
- Conceptual questions
- Results with explanations

---

## 🎨 Customization

### Changing Backend Port

Edit `server/.env`:
```env
PORT=3002
```

Then update frontend `.env.development`:
```env
VITE_API_URL=http://localhost:3002/api
```

### Changing Voice

Edit `server/src/services/elevenLabsService.ts`:
```typescript
// Line 10
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
// Change to another voice ID from ElevenLabs
```

### Adjusting Animation Speed

Edit `src/utils/svgMorpher.ts`:
```typescript
// Line 16
constructor(duration = 1500) {  // milliseconds
  // Try 1000 for faster, 2000 for slower
}
```

---

## 🔍 Understanding the Flow

### Process Generation Flow
```
User Input
    ↓
ChatInterface (React component)
    ↓
App.tsx calls generateProcessSVGs()
    ↓
Frontend geminiService.ts
    ↓
POST /api/process/generate
    ↓
Backend routes/process.ts
    ↓
Backend services/geminiService.ts
    ↓
Gemini AI API
    ↓
← ProcessBreakdown data
    ↓
SVGPlayer displays it
```

### Audio Generation Flow
```
SVGPlayer extracts scripts
    ↓
Calls generateCombinedVoiceover()
    ↓
Frontend elevenLabsService.ts
    ↓
POST /api/voiceover/generate
    ↓
Backend routes/voiceover.ts
    ↓
Backend services/elevenLabsService.ts
    ↓
ElevenLabs API
    ↓
← Audio + timing data
    ↓
SVGPlayer plays synchronized audio
```

---

## 📊 Performance Tips

### 1. Monitor Performance

Open React DevTools:
- Profiler tab
- Record a session
- Look for unnecessary re-renders

### 2. Check Bundle Size

```bash
npm run build
# Check dist/ folder size
ls -lh dist/assets/
```

### 3. Monitor API Calls

Open Browser DevTools:
- Network tab
- Filter by "Fetch/XHR"
- Check API call count

**Expected calls per session:**
1. Process generation: 1 call
2. Voiceover generation: 1 call
3. Quiz generation: 1 call
Total: **3 calls** (not 15+ like before!)

---

## 🎓 Learning Resources

### Understanding the Code

1. **Start with**: `src/App.tsx` - Main orchestrator
2. **Then read**: `src/services/apiClient.ts` - HTTP communication
3. **Explore**: `src/components/player/` - Component composition
4. **Backend**: `server/src/index.ts` - Server setup

### React Optimization

- [React.memo documentation](https://react.dev/reference/react/memo)
- [useCallback hook](https://react.dev/reference/react/useCallback)
- [useMemo hook](https://react.dev/reference/react/useMemo)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

### Express/Node.js

- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Success Checklist

Before considering setup complete, verify:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can submit a query in the UI
- [ ] Process visualization appears
- [ ] Audio plays correctly
- [ ] Quiz section works
- [ ] No errors in browser console
- [ ] No errors in server console

---

## 🎉 You're Ready!

If all checks pass, you're ready to:
- Use the application
- Modify components
- Add new features
- Deploy to production

For more details, see:
- [SETUP.md](./SETUP.md) - Detailed setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) - What changed

Happy coding! 🚀

