import test from 'node:test'
import assert from 'node:assert/strict'
import { splitMessage } from '../../index.js'

test('splitMessage: short text stays single chunk', () => {
  const chunks = splitMessage('hello world', 50)
  assert.equal(chunks.length, 1)
  assert.equal(chunks[0], 'hello world')
})

test('splitMessage: splits long text on word boundaries and adds ellipses', () => {
  const text = 'one two three four five six seven eight nine ten'
  const chunks = splitMessage(text, 10)
  // expect multiple chunks
  assert(chunks.length > 1)
  for (let i = 0; i < chunks.length - 1; i++) {
    assert(chunks[i].endsWith('…'))
  }
  // rejoin (remove ellipses) should start with original
  const rejoined = chunks.map(c => c.replace(/…$/, '')).join(' ')
  assert(rejoined.startsWith('one two three'))
})
