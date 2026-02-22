# xFloor Production MVP (UI + BFF)

A complete runnable MVP that ties UI/UX flows to three core APIs:

- `POST /api/content` (Create Event)
- `POST /api/query` (Query)
- `GET /api/recent` (Recent Events)

## Features

- **Compose tab**: post content with queued/indexed ingestion status.
- **Chat tab**: memory-aware query experience with stable `user_id` and explicit `app_id`.
- **Activity tab**: recent events feed with manual and auto refresh.
- **BFF layer**: server-side API contract ready to swap in xFloor SDK calls.

## Run

```bash
npm run dev
```

Open: `http://localhost:8787`

## Production wiring plan

Replace stub logic in `server/index.js` with xFloor SDK calls while preserving endpoint contracts:

- `/api/content` -> `EventApi`
- `/api/query` -> `QueryApi`
- `/api/recent` -> `GetRecentEventsApi`

This keeps frontend code stable while backend implementation evolves.
