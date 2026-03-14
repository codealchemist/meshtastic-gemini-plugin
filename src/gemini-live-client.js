/**
 * GeminiLiveClient: persistent WebSocket client for the Gemini Live API.
 */
const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export class GeminiLiveClient {
  constructor({ apiKey, setup, maxLen }) {
    this.apiKey = apiKey
    this.setup = setup
    this.maxLen = maxLen
    this.ws = null
    this._resolve = null
    this._reject = null
    this._buffer = ''
    this._connecting = null

    // Connect eagerly so the first query has no cold-start delay.
    this.connect().catch(err => {
      // `log` isn't available here; callers should handle logging.
      console.error('WebSocket connection failed:', err.message)
    })
  }

  async connect() {
    if (this._connecting) return this._connecting
    this._connecting = this._doConnect().finally(() => {
      this._connecting = null
    })
    return this._connecting
  }

  async _doConnect() {
    const url = `${WS_BASE}?key=${this.apiKey}`
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      // Server sends binary WebSocket frames containing UTF-8 JSON
      ws.binaryType = 'arraybuffer'
      this.ws = ws

      const timer = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket setup timed out'))
      }, 15000)

      const done = (fn, arg) => {
        clearTimeout(timer)
        fn(arg)
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ setup: this.setup }))
      }

      ws.onmessage = ev => {
        let msg
        try {
          const text =
            typeof ev.data === 'string'
              ? ev.data
              : Buffer.from(ev.data).toString('utf8')
          msg = JSON.parse(text)
        } catch {
          return
        }
        if (msg.setupComplete) {
          ws.onmessage = ev => this._onMessage(ev)
          ws.onerror = () => {
            this.ws = null
            this._fail(new Error('WebSocket error'))
          }
          ws.onclose = () => {
            this.ws = null
            this._fail(new Error('WebSocket closed'))
          }
          done(resolve, undefined)
        } else if (msg.error) {
          done(
            reject,
            new Error(
              `Gemini setup error ${msg.error.code}: ${msg.error.message}`
            )
          )
        }
      }

      ws.onerror = err => done(reject, err)
      ws.onclose = ev =>
        done(
          reject,
          new Error(
            `WebSocket closed during setup (code=${ev.code}${ev.reason ? ` reason=${ev.reason}` : ''})`
          )
        )
    })
  }

  _onMessage(ev) {
    let msg
    try {
      const text =
        typeof ev.data === 'string'
          ? ev.data
          : Buffer.from(ev.data).toString('utf8')
      msg = JSON.parse(text)
    } catch {
      return
    }
    const sc = msg.serverContent
    if (!sc) return
    for (const part of sc.modelTurn?.parts ?? []) {
      if (part.text) this._buffer += part.text
    }
    if (sc.turnComplete && this._resolve) {
      const text = this._buffer.trim()
      this._buffer = ''
      const resolve = this._resolve
      this._resolve = null
      this._reject = null
      resolve(text)
    }
  }

  _fail(err) {
    if (this._reject) {
      const reject = this._reject
      this._resolve = null
      this._reject = null
      reject(err)
    }
  }

  isOpen() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  async generate(text) {
    if (!this.isOpen()) await this.connect()
    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
      this._buffer = ''
      this.ws.send(
        JSON.stringify({
          // Live API uses proto3 JSON (camelCase field names)
          clientContent: {
            turns: [{ role: 'user', parts: [{ text }] }],
            turnComplete: true
          }
        })
      )
    })
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }
}
