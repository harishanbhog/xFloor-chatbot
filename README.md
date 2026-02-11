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
2. Server forwards message to xFloor `POST /event`.
3. Server then calls xFloor `POST /query`.
4. Server returns the query reply to browser.

## Notes

- Keep API key on server side only.
- Chat routing now uses a small SDK-style wrapper in `xfloor-sdk.js` and still calls only `/event` + `/query`.
- I could not install an official xFloor npm SDK from this environment due registry access restrictions (403), so this local wrapper is used as the SDK layer.
- The exact Event/Query payload shape can vary by workspace config; update payload fields in `xfloor-sdk.js` if needed.
