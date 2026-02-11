# xFloor Event + Query Chatbot

This is a minimal chatbot demo that only uses two xFloor APIs:

1. `POST /event` - logs a user message event.
2. `POST /query` - requests an AI reply for that message.

## Setup

```bash
npm install
export XFLOOR_BASE_URL="https://api.xfloor.ai"
export XFLOOR_API_KEY="your_api_key"
export XFLOOR_AGENT_ID="your_agent_id"
npm start
```

Open `http://localhost:3000`.

## Request flow

For each user message:

1. Browser sends message to local endpoint `POST /api/chat`.
2. Server forwards message using `@xfloor/floor-memory-sdk-js` Event method.
3. Server asks for reply using `@xfloor/floor-memory-sdk-js` Query method.
4. Server returns the query reply to browser.

## Notes

- Keep API key on server side only.
- `appsdk.js` is the single integration layer for `@xfloor/floor-memory-sdk-js`.
- Chat flow still uses only Event + Query semantics.
- If your environment cannot access npm registry (403), install the SDK on a machine/network with npm access and copy `node_modules` or use an internal npm proxy.
