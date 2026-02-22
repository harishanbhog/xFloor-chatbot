# xFloor Production MVP (React + Tailwind UI + BFF)

A complete runnable MVP with a modern patient profile experience inspired by PostVisit-style UI.

## Included flows

- `POST /api/content` (Create Event)
- `POST /api/query` (Query)
- `GET /api/recent` (Recent Events)

## UI/UX

- React-powered interactive dashboard (via browser-delivered React)
- Tailwind CSS styling for modern, clean layout and interactions
- Patient profile hero card
- Visit history cards with active selection states
- Embedded AI assistant panel and chat composer
- Interactive "Add Visit Note" + "Refresh" actions wired to backend APIs

## Run

```bash
npm run dev
```

Open: `http://localhost:8787`

## Notes

- Frontend uses React + Tailwind from CDN for portability in restricted environments.
- Backend (`server/index.js`) is SDK-ready: replace stub handlers with xFloor SDK calls:
  - `/api/content` -> `EventApi`
  - `/api/query` -> `QueryApi`
  - `/api/recent` -> `GetRecentEventsApi`
