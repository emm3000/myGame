import { describe, expect, it } from 'vitest'
import { VercelAfterResponse } from './VercelAfterResponse'

type HeldWork = {
  readonly work: Promise<void>
  readonly release: () => void
}

const heldWork = (effects: Array<string>, effect: string): HeldWork => {
  let release = (): void => {}
  const work = new Promise<void>((resolve) => {
    release = resolve
  }).then(() => {
    effects.push(effect)
  })
  return { work, release: () => release() }
}

describe('VercelAfterResponse', () => {
  it('hands each deferred work to the lifetime extension', async () => {
    const extended: Array<Promise<void>> = []
    const afterResponse = new VercelAfterResponse((work) => extended.push(work))
    const effects: Array<string> = []
    const reset = heldWork(effects, 'reset mail sent')

    afterResponse.defer(reset.work)
    reset.release()
    await Promise.all(extended)

    expect([extended.length, effects]).toEqual([1, ['reset mail sent']])
  })

  it('settles once every work deferred before it has settled', async () => {
    const afterResponse = new VercelAfterResponse(() => {})
    const effects: Array<string> = []
    const first = heldWork(effects, 'first mail sent')
    const second = heldWork(effects, 'second mail sent')
    afterResponse.defer(first.work)
    afterResponse.defer(second.work)

    const settling = afterResponse.settled()
    second.release()
    first.release()
    await settling

    expect(effects).toEqual(['second mail sent', 'first mail sent'])
  })
})
