# xFloor Production MVP Feasibility (UI/UX + Query/Event/Recent)

## Verdict
Yes — the Query, Event, and Recent APIs are enough to build a production-grade MVP when paired with a disciplined frontend architecture and a thin backend-for-frontend (BFF).

## Why this API set is enough
- **Query API** covers the primary assistant experience (multi-turn, memory-aware question answering).
- **Create Event API** covers content ingestion (posting notes, docs, visit summaries, updates).
- **Recent Events API** covers ingestion verification and activity/feed UX.

This aligns with xFloor's "start small" guidance: add content, ask questions, and only add advanced API groups later.

## Product scope mapping (UI/UX -> API)

### 1) Content publishing flow
- UI: composer form with title/description/block type, submit CTA, pending/success/error states.
- API: `EventApi` (Create Event)
- Notes:
  - Treat `200 OK` as **accepted/queued** (asynchronous ingestion), not searchable completion.
  - Show an ingestion status chip and poll feed until the event is visible.

### 2) Assistant chat flow
- UI: chat panel, message list, streaming/loading state, source/metadata panel.
- API: `QueryApi`
- Notes:
  - Keep `user_id` stable per signed-in user for memory continuity.
  - Pass `app_id` per request (not global).

### 3) Activity and reliability flow
- UI: recent activity list, refresh button, auto-refresh toggle.
- API: `GetRecentEventsApi`
- Notes:
  - Use this for deterministic confirmation after posting content.
  - Display timestamps and ingestion state to reduce user confusion.

## Recommended production architecture

### Frontend (React/Next.js)
- Route groups:
  - `/compose` for posting content
  - `/chat` for query experience
  - `/activity` for recent events
- State:
  - React Query/SWR for query + mutation + polling
  - Centralized typed client for xFloor operations
- UX patterns:
  - Optimistic submission for compose
  - Polling backoff (e.g., 1s, 2s, 5s, 10s)
  - Error toasts + retry actions

### BFF (Node/Fastify or Next API routes)
- Responsibilities:
  - Hold Bearer token server-side (never browser)
  - Validate input and normalize payloads
  - Add observability and idempotency keys
  - Rate-limit and protect endpoints
- Endpoints exposed to UI:
  - `POST /api/content` -> maps to Create Event
  - `POST /api/query` -> maps to Query
  - `GET /api/recent` -> maps to Recent Events

## MVP implementation phases
1. **Phase 1 (2-4 days):** Compose + Chat + Activity with mocked responses and static auth.
2. **Phase 2 (3-5 days):** Wire real xFloor SDK in BFF; production error handling and retries.
3. **Phase 3 (2-4 days):** Analytics, RBAC polishing, accessibility, and release hardening.

## Key engineering guardrails
- Configure auth once on shared SDK client and reuse API classes.
- Use named imports only from the JS SDK.
- Never place secrets in browser code.
- Keep `app_id` explicit per call.
- Expect async ingestion after Create Event acceptance.

## Risks and mitigations
- **Perceived "missing content" right after post** -> mitigate with polling + "indexing" states.
- **Conversation context drift** -> enforce stable `user_id` and bounded history window.
- **Operational instability** -> add retries with jitter, circuit-breakers, and request tracing.

## Bottom line
You can absolutely tie the existing UI/UX to Query + Event + Recent and ship a production MVP. Keep floor-management and registration APIs out of v1 unless your product needs them immediately.
