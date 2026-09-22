import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './index'

describe('ApiErrorSchema', () => {
  it('parses an error with a known kind', () => {
    const slotBusyError = { kind: 'SlotBusy', message: 'La obra ya está en marcha.' }

    expect(ApiErrorSchema.parse(slotBusyError)).toEqual(slotBusyError)
  })

  it('rejects a fief overview with an unknown error kind', () => {
    const queueBusyError = { kind: 'QueueBusy', message: 'La obra ya está en marcha.' }

    expect(ApiErrorSchema.safeParse(queueBusyError).success).toBe(false)
  })
})
