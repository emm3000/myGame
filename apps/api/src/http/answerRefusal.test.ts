import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { answerRefusal } from './answerRefusal'
import type { Refusal } from './Refusal'

const answerOf = async (refusal: Refusal): Promise<Response> => {
  const app = new Hono().get('/', (c) => answerRefusal(c, refusal))
  return app.request('/')
}

describe('answerRefusal', () => {
  it('answers a corrupt stored duration as an internal failure with an empty body', async () => {
    const response = await answerOf({ kind: 'NegativeDuration', seconds: -1 })

    expect(response.status).toBe(500)
    expect(await response.text()).toBe('')
  })

  it('answers a full waiting list as a conflict naming its cap', async () => {
    const response = await answerOf({ kind: 'WaitingListFull', cap: 2 })

    expect(response.status).toBe(409)
    expect(await response.json()).toStrictEqual({
      kind: 'WaitingListFull',
      params: { cap: 2 },
    })
  })

  it('answers a kind without fields with the kind alone', async () => {
    const response = await answerOf({ kind: 'EmailTaken' })

    expect(response.status).toBe(409)
    expect(await response.json()).toStrictEqual({ kind: 'EmailTaken' })
  })

  it('answers a refusal the wire does not name with its status and an empty body', async () => {
    const response = await answerOf({ kind: 'SignedOut' })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('')
  })
})
