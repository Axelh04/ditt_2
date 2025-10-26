# Diagramma - Interactive Process Learning Platform

An interactive web application that uses AI to break down complex processes into animated SVG visualizations with voiceover explanations and interactive quizzes.

## IMPORTANT WE HAVE DEMO RIGHT HERE

https://youtu.be/QDXfnKTdXps


https://github.com/user-attachments/assets/57dd1595-a1d5-43bd-a00a-83c773e6f802




## ✨ Features

- **AI-Powered Process Breakdown**: Converts any process query into 5 educational stages
- **Animated SVG Visualizations**: Smooth morphing transitions between process stages
- **Synchronized Voiceovers**: ElevenLabs text-to-speech narration synchronized with animations
- **Interactive Quizzes**: AI-generated questions to test understanding
- **Real-time Caption Highlighting**: Word-by-word highlighting during narration
- **Modern, Responsive UI**: Beautiful gradient backgrounds and smooth animations

## 🏗️ Architecture

This application follows modern software engineering best practices:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript
- **AI Services**: Google Gemini AI + ElevenLabs
- **Architecture**: Clean separation of concerns, optimized React components, secure API key handling

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- API keys for:
  - [Google Gemini AI](https://ai.google.dev/)
  - [ElevenLabs](https://elevenlabs.io/)

### Installation

1. **Clone and install dependencies**:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

2. **Configure environment variables**:

The backend `.env` file is already configured with your API keys:
```bash
# server/.env is already set up
```

For the frontend, create `.env.development`:
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env.development
```

3. **Start the application**:

Open two terminal windows:

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

4. **Open in browser**: Navigate to `http://localhost:5173`

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 📁 Project Structure

```
ditt_2/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── player/              # SVGPlayer sub-components
│   │   ├── ChatInterface.tsx    # User input interface
│   │   ├── QuizSection.tsx      # Quiz functionality
│   │   └── ...
│   ├── services/                # API communication
│   │   ├── apiClient.ts         # HTTP client
│   │   ├── geminiService.ts     # Process generation
│   │   └── elevenLabsService.ts # Voiceover generation
│   ├── utils/                   # Utility functions
│   │   ├── svgMorpher.ts       # SVG animation engine
│   │   └── textProcessing.ts   # Text parsing utilities
│   └── App.tsx                  # Main application
│
├── server/                       # Backend source
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   └── index.ts             # Server entry point
│   └── .env                     # Backend configuration
│
├── ARCHITECTURE.md              # Architecture documentation
├── SETUP.md                     # Detailed setup guide
└── README.md                    # This file
```

## 🎯 Key Improvements

### Security
- ✅ API keys moved to backend (no longer exposed in browser)
- ✅ Input validation on all endpoints
- ✅ Environment-based configuration

### Performance
- ✅ React.memo for component optimization
- ✅ useCallback for memoized event handlers
- ✅ useMemo for expensive computations
- ✅ Component splitting (527-line component → 6 focused components)
- ✅ Utility extraction for reusability

### Code Quality
- ✅ TypeScript throughout
- ✅ Clean architecture with separation of concerns
- ✅ Comprehensive error handling
- ✅ Structured logging

## 🔧 Development

### Available Scripts

**Frontend**:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

**Backend**:
```bash
cd server
npm run dev      # Start with auto-reload
npm run build    # Build TypeScript
npm run start    # Run production build
```

## 🚢 Deployment

This application is configured for easy deployment on **Render**:

### One-Click Deployment

1. Push your code to GitHub
2. Create a new Blueprint on Render
3. Connect your repository
4. Render will automatically detect `render.yaml` and deploy both services
5. Add your API keys as environment variables

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

### What Gets Deployed

- **Frontend**: Static React site (FREE tier)
- **Backend**: Express API server (FREE tier with limitations)
- **Cost**: $0/month for development, $7/month recommended for production

### Quick Deploy Checklist

✅ `render.yaml` configuration included  
✅ Environment variables documented  
✅ Health check endpoint configured  
✅ CORS properly configured  
✅ Production build scripts ready  

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture and design decisions
- [SETUP.md](./SETUP.md) - Comprehensive setup and troubleshooting guide
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Complete deployment guide for Render

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Add React.memo to presentational components
4. Use useCallback for event handlers
5. Validate inputs on backend endpoints
6. Write descriptive commit messages

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- Google Gemini AI for process generation
- ElevenLabs for high-quality text-to-speech
- React team for the amazing framework
- Vite for the fast build tool
