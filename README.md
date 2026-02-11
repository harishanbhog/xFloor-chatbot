# xFloor Memory SDK Demo (Event + Query)

This project now follows the xFloor JavaScript SDK pattern where:

1. **Event API** is used to ingest content into memory.
2. **Query API** is used later to ask questions and get summary/answers from ingested content.

## Install

```bash
npm install
```

## Run

```bash
export XFLOOR_APP_ID="student_portal" # optional, also can be provided in event metadata / query payload
npm start
```

Open `http://localhost:3000`.

## What changed from chatbot-only flow

- This is not just a plain chat endpoint anymore.
- `POST /api/event`: accepts content fields (`floor_id`, `block_id`, etc.) and ingests via SDK `EventApi.event(...)`.
- `POST /api/query`: asks questions via SDK `QueryApi.query(...)`.
- Frontend has two explicit workflows:
  - Ingest content
  - Query ingested content

## API payloads used by backend

### Event ingestion (`POST /api/event`)
Required body fields:
- `floorId`, `blockId`, `blockType`, `userId`, `title`, `description`

Optional:
- `metadata` (object passed as second arg to `eventApi.event`)
- `extraJson` (merged into `inputInfo` JSON)

### Query (`POST /api/query`)
Required body fields:
- `userId`, `query`

Optional:
- `floorIds` (comma-separated string)
- `k`
- `includeMetadata` (boolean -> `include_metadata`)
- `summaryNeeded` (boolean -> `summary_needed`)
- `extraJson` (merged into query payload)

## SDK usage

- `appsdk.js` directly uses `EventApi` and `QueryApi` from `@xfloor/floor-memory-sdk-js`.
- Calls are wrapped into Promises but preserve SDK callback behavior under the hood.

## Notes

- If npm install fails due network policy on your environment, run locally on your machine with npm registry access.
- You can still pass `app_id` explicitly in metadata/payload per request if needed.
