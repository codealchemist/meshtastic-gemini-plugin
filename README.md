# meshtastic-gemini-plugin

Gemini AI plugin for meshtastic-node-client — forwards short prompts to
Google's Gemini (Generative Language) API and broadcasts replies to the
channel.

See [meshtastic-node-client](https://github.com/codealchemist/meshtastic-node-client).

## Quick Start

First of all, clone [meshtastic-node-client](https://github.com/codealchemist/meshtastic-node-client).

You will be working on its directory.

- `git clone https://github.com/codealchemist/meshtastic-node-client.git`
- `cd meshtastic-node-client`
- Ensure you have Node.js (v18+ recommended).
- Set the required environment variable:
  - `GEMINI_API_KEY` — your Google Gemini API key

- Optional environment variables:
  - `GEMINI_TRIGGER_TEXT` (default: `G, `)
  - `GEMINI_MODEL` (default: `gemini-2.0-flash`)
  - `GEMINI_MAX_LENGTH` (default: `600`)
  - `GEMINI_CHUNK_SIZE` (default: `200`)
  - `GEMINI_USE_WS` (set to `1` to enable WebSocket Live API)

Install this plugin as part of `meshtastic-node-client`:

```bash
npm i @meshtastic-node-client/meshtastic-gemini-plugin
```

## This plugin structure

- [index.js](index.js) — plugin factory exported as default: `createGeminiPlugin()`.
- [src/gemini-live-client.js](src/gemini-live-client.js) — extracted `GeminiLiveClient` class
- `test/` — unit and integration tests (uses `node:test`).

## Usage

This package exports the plugin factory as the default export. Example:

```js
import createGeminiPlugin from './index.js'
const plugin = createGeminiPlugin()
// register plugin with meshtastic-node-client
```

If `GEMINI_USE_WS=1` the plugin will use the Live WebSocket client implemented
in `src/gemini-live-client.js`; otherwise it uses the HTTP API.

## Tests

Tests are in `test/unit` and `test/integration`. Run them with `npm test`.
