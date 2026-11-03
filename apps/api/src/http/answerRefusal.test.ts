import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { answerRefusal } from './answerRefusal'
import type { Refusal } from './Refusal'

const answerOf = async (refusal: Refusal): Promise<Response> => {
  const app = new Hono().get('/', (c) => answerRefusal(c, refusal))
  return app.request('/')
}

describe('answerRefusal', () => {
  it('answers a corrupt stored march stay as an internal failure with an empty body', async () => {
    const response = await answerOf({ kind: 'InvalidMarchStay', stayHours: 1 })

    expect(response.status).toBe(500)
    expect(await response.text()).toBe('')
  })

  it('answers a stay the player typed outside the content range as a conflict naming the longest stay', async () => {
    const response = await answerOf({ kind: 'StayOutOfRange', stayHours: 9, maxStayHours: 8 })

    expect(response.status).toBe(409)
    expect(await response.json()).toStrictEqual({
      kind: 'StayOutOfRange',
      message: 'Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.',
    })
  })
})
