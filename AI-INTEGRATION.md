# SprintIQ AI Integration

The project now includes a full server-side AI layer integrated with the existing MERN workflow.

## Included AI services

1. Requirement -> Task Generator
2. Sprint Risk Prediction
3. Smart Task Assignment
4. AI Bug Prioritization
5. Project Health Analyzer
6. Meeting Intelligence
7. AI Release Notes
8. Context-aware SprintIQ AI Assistant

## Backend AI architecture

```text
React
  -> Axios/JWT
Express /api/ai
  -> protect + role checks
AI Controller
  -> AI Service
  -> Gemini API
  -> structured JSON result
  -> business validation
  -> existing MongoDB models/APIs
```

The Gemini API key is backend-only. It is never exposed to React.

## API endpoints

```text
GET  /api/ai/status
POST /api/ai/generate-tasks
POST /api/ai/create-generated-tasks
POST /api/ai/sprint-risk
POST /api/ai/recommend-assignment
POST /api/ai/prioritize-bug
GET  /api/ai/project-health/:projectId
POST /api/ai/meeting-summary
POST /api/ai/release-notes
POST /api/ai/chat
```

## Setup

1. Open `backEnd/.env`.
2. Set your MongoDB Atlas connection string.
3. Set a JWT secret.
4. Add your Gemini API key as `GEMINI_API_KEY`.
5. Keep `AI_MODEL=gemini-3.8-flash` or replace it with another compatible Gemini model.
6. Run `npm install` in both `backEnd` and `frontEnd`.
7. Start backend with `npm start` and frontend with `npm run dev`.
8. Open **AI Workspace** from the SprintIQ sidebar.

## Important behavior

AI recommendations are review-first. The Requirement -> Task Generator creates suggestions and the manager/user explicitly chooses which tasks to persist. Bug prioritization also provides an explicit Apply Recommendation action.

No node_modules are bundled in this ZIP; install dependencies with the package-lock files.
