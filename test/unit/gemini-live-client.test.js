import test from 'node:test'
import assert from 'node:assert/strict'
import { GeminiLiveClient } from '../../src/gemini-live-client.js'

test('GeminiLiveClient: generate aggregates parts and returns text', async () => {
  // Fake WebSocket implementation to simulate server behavior
  class FakeWS {
    constructor(url) {
      this.url = url
      this.binaryType = null
      this.readyState = FakeWS.OPEN
      // allow handlers to be attached before onopen; call on next tick
      setTimeout(() => this.onopen && this.onopen(), 0)
    }
    send(data) {
      const obj = JSON.parse(data)
      if (obj.setup) {
        // reply with setupComplete
        setTimeout(
          () =>
            this.onmessage &&
            this.onmessage({ data: JSON.stringify({ setupComplete: true }) }),
          0
        )
      } else if (obj.clientContent) {
        // simulate two parts then turnComplete
        setTimeout(() => {
          const payload = {
            serverContent: {
              modelTurn: { parts: [{ text: 'Hello ' }, { text: 'Test' }] },
              turnComplete: true
            }
          }
          this.onmessage && this.onmessage({ data: JSON.stringify(payload) })
        }, 0)
      }
    }
    close() {
      this.readyState = FakeWS.CLOSED
      this.onclose && this.onclose({ code: 1000 })
    }
  }
  FakeWS.OPEN = 1
  FakeWS.CLOSED = 3

  const RealWS = global.WebSocket
  global.WebSocket = FakeWS

  try {
    const client = new GeminiLiveClient({
      apiKey: 'k',
      setup: { model: 'm' },
      maxLen: 1000
    })
    await client.connect()
    const reply = await client.generate('ignored')
    assert.equal(reply, 'Hello Test')
    client.disconnect()
  } finally {
    global.WebSocket = RealWS
  }
})
