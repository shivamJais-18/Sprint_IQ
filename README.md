# SprintIQ - Full Stack VS Code Package

This package contains the SprintIQ frontend and backend developed so far.

## Project structure

```text
SprintIQ/
├── backEnd/
└── frontEnd/
```

## 1. Backend setup

Open Terminal 1:

```bash
cd backEnd
npm install
```

Create `.env` from `.env.example` and add your MongoDB Atlas credentials and JWT secret.

Then:

```bash
npm start
```

Expected:

```text
MongoDB Connected: <atlas-host>
Server running on port 8080
```

Useful commands:

```bash
node scripts/createDemoUser.js
node scripts/listUsers.js
node scripts/promoteTestUser.js
```

Demo account:

```text
Email: manager1@gmail.com
Password: test123456
Role: Project Manager
```

## 2. Frontend setup

Open Terminal 2:

```bash
cd frontEnd
npm install
```

Create `.env` from `.env.example`.

Then:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

## Architecture

```text
React Frontend
      |
      | Axios + JWT
      v
Express Backend :8080
      |
      v
MongoDB Atlas
```

## Current features

- JWT authentication
- Role-based access control
- Project management
- Sprint management
- Task management and Kanban flow
- Bug tracking
- Dashboard analytics
- Notifications
- Persistent MongoDB Atlas database

## AI features

The package now includes a server-side Gemini AI layer with: Requirement → Task Generator, Sprint Risk Prediction, Smart Task Assignment, AI Bug Prioritization, Project Health Analyzer, Meeting Intelligence, AI Release Notes, and a context-aware SprintIQ AI Assistant. AI routes are protected by JWT and keep the Gemini key on the backend.

### AI setup

Copy `backEnd/.env.example` to `backEnd/.env` and set `GEMINI_API_KEY`. The default model is `gemini-3.7-flash`; it can be overridden with `AI_MODEL`. The current Gemini API supports structured JSON output and configurable thinking levels for Gemini 3 models.

Run as usual:

```bash
cd backEnd
npm install
npm start

cd ../frontEnd
npm install
npm run dev
```

Then open the **AI Workspace** from the left sidebar.

