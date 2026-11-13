import { describe, expect, it } from 'vitest'
import type { FailureSink } from '../../failures/FailureSink'
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

type CollectingSink = FailureSink & {
  readonly lines: ReadonlyArray<string>
}

const collectingSink = (): CollectingSink => {
  const lines: Array<string> = []
  return { write: (line) => lines.push(line), lines }
}

const noLifetimeExtension = (): void => {}

const neverPassingDeadline = new Promise<void>(() => {})

describe('VercelAfterResponse', () => {
  it('hands each deferred work to the lifetime extension', async () => {
    const extended: Array<Promise<void>> = []
    const afterResponse = new VercelAfterResponse((work) => extended.push(work), collectingSink())
    const effects: Array<string> = []
    const reset = heldWork(effects, 'reset mail sent')

    afterResponse.defer(reset.work)
    reset.release()
    await Promise.all(extended)

    expect([extended.length, effects]).toEqual([1, ['reset mail sent']])
  })

  it('settles only after a deferred work still running has settled', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const effects: Array<string> = []
    const first = heldWork(effects, 'first mail sent')
    const second = heldWork(effects, 'second mail sent')
    afterResponse.defer(first.work)
    afterResponse.defer(second.work)

    const settling = afterResponse.settled()
    first.release()
    const sooner = await Promise.race([
      settling.then(() => 'settled'),
      first.work.then(() => 'first mail sent'),
    ])
    second.release()
    await settling

    expect(sooner).toBe('first mail sent')
  })

  it('reports a deferred work that threw by its error class alone', async () => {
    const sink = collectingSink()
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, sink)

    afterResponse.defer(Promise.reject(new TypeError('ana@example.com refused')))
    await afterResponse.settled()

    expect(sink.lines).toEqual(['deferred work TypeError'])
  })

  it('counts the deferred work still running when the deadline passes', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const reset = heldWork([], 'reset mail sent')
    afterResponse.defer(reset.work)

    const unsettled = await afterResponse.unsettledAfter(Promise.resolve())
    reset.release()
    await afterResponse.settled()

    expect(unsettled).toBe(1)
  })

  it('counts nothing once every deferred work settles before the deadline', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const reset = heldWork([], 'reset mail sent')
    afterResponse.defer(reset.work)

    reset.release()
    const unsettled = await afterResponse.unsettledAfter(neverPassingDeadline)

    expect(unsettled).toBe(0)
  })
})
