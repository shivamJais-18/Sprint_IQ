# SprintIQ Backend

Node.js + Express + MongoDB/Mongoose backend for SprintIQ, an AI-powered software management system.

## Structure

- `config/` - database connection
- `models/` - Mongoose schemas
- `controllers/` - business logic
- `routes/` - API routes
- `middleware/` - JWT authentication, RBAC, error handling
- `scripts/` - development helpers
- `tests/` - API tests

## Setup

1. Copy `.env.example` to `.env`.
2. Put your MongoDB Atlas connection in `MONGO_URI`.
3. Set `MONGO_DATABASE=sprintiq`.
4. Set a strong `JWT_SECRET`.
5. Run:

```bash
npm install
npm run dev
```

`npm run dev` uses nodemon to auto-restart on file changes (recommended while developing). `npm start` runs the server directly with plain Node, for production.

## Test

```bash
npm test
```

## Development helper

```bash
node scripts/createDemoUser.js
node scripts/listUsers.js
```

The demo account created by `createDemoUser.js` is:

- Email: `manager1@gmail.com`
- Password: `test123456`
- Role: `Project Manager`
