import test from 'node:test'
import assert from 'node:assert/strict'

test('integration: plugin HTTP path sends reply chunks via client', async () => {
  // Mock fetch
  const realFetch = global.fetch
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: 'This is a response' }] } }]
    }),
    text: async () => ''
  })

  // Ensure env var is present and WS disabled
  const oldKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = 'testkey'
  delete process.env.GEMINI_USE_WS

  // Import plugin factory after env set
  const { default: createGeminiPlugin } = await import('../../index.js')

  const messages = []
  const fakeClient = {
    sendText: async msg => messages.push(msg),
    sendJson: async msg => messages.push(msg)
  }

  const plugin = createGeminiPlugin()
  await plugin.onMessage({
    event: { text: 'G, hello' },
    client: fakeClient,
    sendJsonMode: false
  })

  // restore
  process.env.GEMINI_API_KEY = oldKey
  global.fetch = realFetch

  assert(messages.length >= 1)
  const joined = messages.join(' ')
  assert(joined.includes('This is a response'))
})
