# SprintIQ Final Audit

This package is the final pre-test build of SprintIQ with the AI layer integrated into the working MERN application.

## AI features included

1. Requirement → Task Generator
   - Structured task generation
   - Priority, estimated hours, story points, labels and dependencies
   - Review/select before database creation
   - Creates real SprintIQ tasks through the task model/API

2. Sprint Risk Prediction
   - Uses real sprint, task, effort, assignment and unresolved bug context
   - Returns risk level, 0–100 risk score, reasons and recommended actions

3. Smart Task Assignment
   - Uses project team membership and current active workload
   - Returns ranked developer recommendations
   - Includes an Apply Recommendation action that updates the real task

4. AI Bug Prioritization
   - Analyzes real bug context and related task/project context
   - Returns severity, priority, confidence, reasoning and actions
   - Includes Apply Recommendation

5. Project Health Analyzer
   - Uses project, sprint, task, bug and team context
   - Returns health score, status, strengths, risks and recommendations

6. Meeting Intelligence
   - Converts notes into summary, decisions, follow-ups and action items
   - Project-scoped action items can be converted into real SprintIQ tasks

7. AI Release Notes
   - Uses completed sprint tasks and resolved/closed bugs
   - Generates structured release notes

8. Context-aware SprintIQ AI Assistant
   - Answers questions from live accessible project, sprint, task and bug data
   - Does not rely on fabricated database facts

## AI infrastructure

- Server-side Gemini API integration
- Centralized `aiService.js`
- Dedicated AI controller and routes
- Prompt module
- Structured response schemas
- Retry and model fallback handling for temporary provider errors
- Backend-only API key handling

## Core project improvements included in this build

- Task edit modal with sprint, assignment, effort and status editing
- Project edit + team member management
- Sprint edit/delete
- Bug edit/delete
- Project Manager access to safe user list for project membership and assignment
- Project-member bug visibility fixed
- AI task/sprint context now includes estimated hours and story points

## Important configuration

Set these values in `backEnd/.env` before running:

```env
MONGO_URI=your_mongodb_atlas_connection_string
MONGO_DATABASE=sprintiq
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-3.7-flash
AI_FALLBACK_MODELS=gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite
```

Do not commit real credentials. `.env.example` is the safe template.


## Final audit fixes

- Added a complete Admin User Management route/page so the existing User Management navigation cannot lead to an unhandled route.
- Restricted sprint listing to accessible project data while retaining orphaned sprint records for cleanup.
- Project deletion now removes dependent sprints, tasks and bugs to prevent orphaned records.
- Task and bug assignments are validated against active project-team users.
- User deletion removes team/assignment references and prevents deleting users who still manage projects.
- Added task deletion UI for Admin/Project Manager.
- Added role-aware edit/delete controls across project, sprint, task and bug screens.
- Added input validation for AI route identifiers and AI request timeout/fallback handling.
- Prevented duplicate AI task creation by clearing the generated-task review state after successful creation.
- Added safe frontend API environment configuration through `VITE_API_URL`.
- Synchronized documentation with the actual default AI model.

## Verification performed

- All backend JavaScript files pass `node --check`.
- All relative backend/frontend source imports resolve to existing files.
- All eight AI service functions, AI routes, and frontend AI API methods are present and connected.
- Real Task Generator -> database task creation was previously verified during the project test.
- Gemini fallback to `gemini-3.7-flash` was previously observed during runtime testing.
- A full frontend production build could not be executed in this container because dependency installation timed out; run `npm install` and `npm run build` locally as part of the final smoke test.
