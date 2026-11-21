import { assert, describe, expect, it } from 'vitest'
import type { FailureSink } from '../../application/ports/FailureSink'
import { pendingWorkCap, VercelAfterResponse } from './VercelAfterResponse'

type HeldWork = {
  readonly start: () => Promise<void>
  readonly work: Promise<void>
  readonly release: () => void
  readonly hasStarted: () => boolean
}

const heldWork = (effects: Array<string>, effect: string): HeldWork => {
  let release = (): void => {}
  let isStarted = false
  const work = new Promise<void>((resolve) => {
    release = resolve
  }).then(() => {
    effects.push(effect)
  })
  return {
    start: () => {
      isStarted = true
      return work
    },
    work,
    release: () => release(),
    hasStarted: () => isStarted,
  }
}

const heldWorks = (count: number): ReadonlyArray<HeldWork> =>
  Array.from({ length: count }, (_, index) => heldWork([], `reset mail ${index} sent`))

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

    afterResponse.defer(reset.start)
    reset.release()
    await Promise.all(extended)

    expect([extended.length, effects]).toEqual([1, ['reset mail sent']])
  })

  it('settles only after a deferred work still running has settled', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const effects: Array<string> = []
    const first = heldWork(effects, 'first mail sent')
    const second = heldWork(effects, 'second mail sent')
    afterResponse.defer(first.start)
    afterResponse.defer(second.start)

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

    afterResponse.defer(() => Promise.reject(new TypeError('ana@example.com refused')))
    await afterResponse.settled()

    expect(sink.lines).toEqual(['deferred work TypeError'])
  })

  it('counts the deferred work still running when the deadline passes', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const reset = heldWork([], 'reset mail sent')
    afterResponse.defer(reset.start)

    const unsettled = await afterResponse.unsettledAfter(Promise.resolve())
    reset.release()
    await afterResponse.settled()

    expect(unsettled).toBe(1)
  })

  it('counts nothing once every deferred work settles before the deadline', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const reset = heldWork([], 'reset mail sent')
    afterResponse.defer(reset.start)

    reset.release()
    const unsettled = await afterResponse.unsettledAfter(neverPassingDeadline)

    expect(unsettled).toBe(0)
  })

  it('starts no work past the pending cap', async () => {
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, collectingSink())
    const pending = heldWorks(pendingWorkCap)
    for (const held of pending) {
      afterResponse.defer(held.start)
    }
    const dropped = heldWork([], 'dropped reset mail sent')

    afterResponse.defer(dropped.start)
    for (const held of pending) {
      held.release()
    }
    await afterResponse.settled()

    expect(dropped.hasStarted()).toBe(false)
  })

  it('writes one dropped line for work past the pending cap', async () => {
    const sink = collectingSink()
    const afterResponse = new VercelAfterResponse(noLifetimeExtension, sink)
    const pending = heldWorks(pendingWorkCap)
    for (const held of pending) {
      afterResponse.defer(held.start)
    }

    afterResponse.defer(heldWork([], 'dropped reset mail sent').start)
    for (const held of pending) {
      held.release()
    }
    await afterResponse.settled()

    expect(sink.lines).toEqual(['deferred work dropped'])
  })

  it('admits the next work once one pending work settles', async () => {
    const extended: Array<Promise<void>> = []
    const afterResponse = new VercelAfterResponse((work) => extended.push(work), collectingSink())
    const [first, ...rest] = heldWorks(pendingWorkCap)
    assert(first !== undefined)
    for (const held of [first, ...rest]) {
      afterResponse.defer(held.start)
    }
    first.release()
    await extended[0]
    const admitted = heldWork([], 'admitted reset mail sent')

    afterResponse.defer(admitted.start)
    for (const held of [...rest, admitted]) {
      held.release()
    }
    await afterResponse.settled()

    expect(admitted.hasStarted()).toBe(true)
  })

  it('admits the next work once one pending work rejects', async () => {
    const extended: Array<Promise<void>> = []
    const afterResponse = new VercelAfterResponse((work) => extended.push(work), collectingSink())
    const rest = heldWorks(pendingWorkCap - 1)
    afterResponse.defer(() => Promise.reject(new TypeError('the mail relay refused')))
    for (const held of rest) {
      afterResponse.defer(held.start)
    }
    await extended[0]
    const admitted = heldWork([], 'admitted reset mail sent')

    afterResponse.defer(admitted.start)
    for (const held of [...rest, admitted]) {
      held.release()
    }
    await afterResponse.settled()

    expect(admitted.hasStarted()).toBe(true)
  })
})
