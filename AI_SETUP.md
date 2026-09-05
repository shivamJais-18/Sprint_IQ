# SprintIQ AI Setup

## 1. Backend environment
Create/edit `backEnd/.env` and set:

```env
MONGO_URI=your_mongodb_atlas_connection_string
MONGO_DATABASE=sprintiq
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_real_gemini_api_key
AI_MODEL=gemini-3.7-flash
AI_FALLBACK_MODELS=gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite
```

Do not put the Gemini key in the frontend.

## 2. Run

Backend:

```bash
cd backEnd
npm install
npm start
```

Frontend:

```bash
cd frontEnd
npm install
npm run dev
```

## 3. AI fallback behavior
SprintIQ tries the configured primary model first. For temporary provider capacity/rate errors (408/429/500/502/503/504), it retries once and then moves to the next configured model. If another model succeeds, the request completes normally without user intervention.

The fallback models are all current Gemini models documented by Google and support the structured-output approach used by SprintIQ.
