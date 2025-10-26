# Architecture Documentation

## Overview

This application has been refactored to follow modern software engineering best practices, with a clear separation between frontend and backend concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ React Components (Optimized)                           │ │
│  │  - App (Main orchestrator with useCallback)           │ │
│  │  - ChatInterface (React.memo + useCallback)           │ │
│  │  - SVGPlayer (Broken into smaller components)         │ │
│  │    ├─ SVGDisplay (Canvas rendering)                   │ │
│  │    ├─ CaptionPanel (Text display with memo)           │ │
│  │    ├─ PlayerControls (Memoized controls)              │ │
│  │    ├─ StageTimeline (Progress indicator)              │ │
│  │    ├─ PlayerInfo (Stage information)                  │ │
│  │    └─ ProgressBar (Visual feedback)                   │ │
│  │  - QuizSection (Interactive quiz)                     │ │
│  │  - GridBackground (Visual enhancement)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Services Layer                                         │ │
│  │  - apiClient (HTTP communication)                     │ │
│  │  - geminiService (Process generation API calls)       │ │
│  │  - elevenLabsService (Voiceover API calls)            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Utilities                                              │ │
│  │  - svgMorpher (SVG animation engine)                  │ │
│  │  - textProcessing (Text parsing utilities)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Express Server                                         │ │
│  │  - CORS enabled                                        │ │
│  │  - JSON body parsing                                   │ │
│  │  - Error handling middleware                           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Routes                                             │ │
│  │  - /api/process/generate (Process SVG generation)     │ │
│  │  - /api/voiceover/generate (Audio generation)         │ │
│  │  - /api/quiz/generate (Quiz generation)               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Services (Business Logic)                              │ │
│  │  - geminiService (Gemini AI API integration)          │ │
│  │  - elevenLabsService (ElevenLabs API integration)     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Security                                               │ │
│  │  - API keys stored in environment variables           │ │
│  │  - Input validation on all endpoints                  │ │
│  │  - Rate limiting ready                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  - Google Gemini AI (Process breakdown & quiz generation)   │
│  - ElevenLabs (Text-to-speech voiceover generation)         │
└─────────────────────────────────────────────────────────────┘
```

## Key Improvements

### 1. Security
- **API keys moved to backend**: No longer exposed in the browser
- **Environment variables**: Secure configuration management
- **Input validation**: All endpoints validate inputs before processing

### 2. Performance Optimizations

#### Frontend
- **React.memo**: Applied to all presentational components to prevent unnecessary re-renders
- **useCallback**: Memoized event handlers to maintain referential equality
- **useMemo**: Memoized expensive computations (text parsing, sentence mapping)
- **Component splitting**: Large SVGPlayer (527 lines) broken into 6 focused components
- **Utility extraction**: SVGMorpher and text processing moved to separate files

#### Backend
- **Centralized processing**: Complex operations run on the server
- **Efficient data transfer**: Audio sent as base64, minimizing payload size
- **Single API calls**: Combined voiceover generation reduces API costs

### 3. Code Organization

#### Frontend Structure
```
src/
├── components/
│   ├── player/           # SVGPlayer sub-components
│   │   ├── SVGDisplay.tsx
│   │   ├── CaptionPanel.tsx
│   │   ├── PlayerControls.tsx
│   │   ├── StageTimeline.tsx
│   │   ├── PlayerInfo.tsx
│   │   └── ProgressBar.tsx
│   ├── ChatInterface.tsx
│   ├── QuizSection.tsx
│   └── GridBackground.tsx
├── services/
│   ├── apiClient.ts      # HTTP client
│   ├── geminiService.ts  # Process generation
│   └── elevenLabsService.ts # Voiceover generation
├── utils/
│   ├── svgMorpher.ts     # SVG animation engine
│   └── textProcessing.ts # Text utilities
└── App.tsx               # Main orchestrator
```

#### Backend Structure
```
server/
├── src/
│   ├── routes/           # API endpoint handlers
│   │   ├── process.ts
│   │   ├── voiceover.ts
│   │   └── quiz.ts
│   ├── services/         # Business logic
│   │   ├── geminiService.ts
│   │   └── elevenLabsService.ts
│   ├── middleware/       # Express middleware
│   │   └── errorHandler.ts
│   └── index.ts          # Server entry point
└── .env                  # Environment configuration
```

### 4. Error Handling
- **Typed errors**: Custom `ApiError` class for structured error responses
- **Error middleware**: Centralized error handling in Express
- **User-friendly messages**: Contextual error messages based on error type
- **Logging**: Comprehensive logging for debugging

### 5. Type Safety
- **TypeScript throughout**: Both frontend and backend use TypeScript
- **Shared types**: Type definitions for data structures
- **Strict mode**: TypeScript strict mode enabled

## Data Flow

### Process Generation Flow
1. User submits query in `ChatInterface`
2. `App.tsx` calls `generateProcessSVGs()` from `geminiService`
3. Frontend `geminiService` sends POST to `/api/process/generate`
4. Backend validates input and calls Gemini AI API
5. Backend returns structured `ProcessBreakdown` data
6. Frontend displays SVG stages in `SVGPlayer`

### Voiceover Generation Flow
1. `SVGPlayer` extracts scripts from stages
2. Calls `generateCombinedVoiceover()` from `elevenLabsService`
3. Frontend service sends POST to `/api/voiceover/generate`
4. Backend calls ElevenLabs API with combined text
5. Backend returns base64-encoded audio with timing segments
6. Frontend converts to Blob and plays audio synchronized with SVG morphing

### Quiz Generation Flow
1. User scrolls to quiz section
2. `QuizSection` calls `generateQuiz()` from `geminiService`
3. Frontend service sends POST to `/api/quiz/generate` with process data
4. Backend calls Gemini AI API for quiz generation
5. Backend validates quiz structure and returns questions
6. Frontend displays interactive quiz with SVG references

## React Component Optimization Techniques

### 1. React.memo
Used on components that receive stable props:
- `ChatInterface`: Only re-renders when props change
- `CaptionPanel`: Memoizes sentence parsing
- `PlayerControls`: Prevents re-render on parent state changes
- `StageTimeline`: Only updates when stage changes
- `PlayerInfo`: Only updates when stage changes
- `ProgressBar`: Only updates when progress changes

### 2. useCallback
Memoizes functions to prevent new function instances:
- Event handlers in `App.tsx`
- Form submission handlers
- Example button click handlers

### 3. useMemo
Memoizes expensive computations:
- Sentence parsing in `CaptionPanel`
- Sentence-to-clause mapping
- Active sentence index calculation

### 4. Component Splitting
Breaking down large components provides:
- Better code organization
- Easier testing
- Improved maintainability
- Smaller bundles (with code splitting)
- Clearer responsibilities

## API Endpoints

### POST /api/process/generate
Generates a process breakdown with SVG stages.

**Request:**
```json
{
  "query": "how photosynthesis works"
}
```

**Response:**
```json
{
  "processName": "Photosynthesis",
  "stages": [
    {
      "stageNumber": 1,
      "stageTitle": "Light Absorption",
      "svg": "<svg>...</svg>",
      "script": "Plants absorb light energy..."
    }
  ]
}
```

### POST /api/voiceover/generate
Generates combined voiceover for multiple scripts.

**Request:**
```json
{
  "scripts": [
    "First stage explanation...",
    "Second stage explanation..."
  ]
}
```

**Response:**
```json
{
  "audioBase64": "//uQxAAA...",
  "totalDuration": 45.2,
  "segments": [
    {
      "startTime": 0,
      "endTime": 8.5,
      "duration": 8.5
    }
  ]
}
```

### POST /api/quiz/generate
Generates quiz questions for a process.

**Request:**
```json
{
  "processData": {
    "processName": "Photosynthesis",
    "stages": [...]
  }
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is the first stage of photosynthesis?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation...",
      "svgReference": 0
    }
  ]
}
```

## Future Improvements

1. **Caching**: Implement Redis for caching API responses
2. **Rate Limiting**: Add rate limiting to prevent API abuse
3. **Authentication**: Add user authentication for personalized experiences
4. **Database**: Store generated processes for reuse
5. **Websockets**: Real-time progress updates for long operations
6. **Testing**: Add comprehensive unit and integration tests
7. **Monitoring**: Add application performance monitoring
8. **CDN**: Serve static assets via CDN for better performance

