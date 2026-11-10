import type { TownNewsItem } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { reportNewsRowOf } from './reportNewsRowOf'

const now = new Date('2026-11-10T09:00:00.000Z')
const occurredAt = '2026-11-10T08:50:00.000Z'
const site = { region: 1, area: 3, site: 12 }
const noAmounts = { money: 0, food: 0, power: 0, material: 0 }
const pay = { money: 0, food: 40, power: 0, material: 1200 }

const lineOf = (item: TownNewsItem): string => reportNewsRowOf(item, now).line

it('writes a finished building work with its place and level', () => {
  expect(
    lineOf({
      kind: 'buildingWorkFinished',
      params: { building: 'powerStation', level: 2 },
      occurredAt,
    }),
  ).toBe('Central eléctrica: ahora en nivel 2.')
})

it('writes a stopped building work with its place and level', () => {
  expect(
    lineOf({
      kind: 'buildingWorkStopped',
      params: { building: 'homes', level: 3, refund: pay },
      occurredAt,
    }),
  ).toBe('Paraste la obra: Hogares, nivel 3.')
})

it('writes a studied lesson', () => {
  expect(lineOf({ kind: 'lessonStudied', params: { lessonId: 'lesson-1' }, occurredAt })).toBe(
    'Estudiaste una lección.',
  )
})

it('writes a stopped lesson', () => {
  expect(lineOf({ kind: 'lessonStopped', params: { lessonId: 'lesson-2' }, occurredAt })).toBe(
    'Paraste el estudio de una lección.',
  )
})

it('writes an earned skill with its resource and percent', () => {
  expect(
    lineOf({
      kind: 'skillEarned',
      params: { lessonId: 'lesson-1', resource: 'food', ratePercent: 5 },
      occurredAt,
    }),
  ).toBe('Ganaste una habilidad de comida: +5 % de comida.')
})

it('writes delivered workers agreeing with the count', () => {
  expect(
    lineOf({ kind: 'hiringDelivered', params: { hire: 'worker', count: 1 }, occurredAt }),
  ).toBe('Contrataste 1 trabajador.')
})

it('writes delivered trucks agreeing with the count', () => {
  expect(lineOf({ kind: 'hiringDelivered', params: { hire: 'truck', count: 3 }, occurredAt })).toBe(
    'Contrataste 3 camiones.',
  )
})

it('writes a stopped hiring with the hires delivered of the hires ordered', () => {
  expect(
    lineOf({
      kind: 'hiringStopped',
      params: { hire: 'worker', delivered: 2, stopped: 3, refund: pay },
      occurredAt,
    }),
  ).toBe('Paraste la contratación de trabajadores: llegaron 2 de 5.')
})

it('writes a stopped hiring with one hire delivered in the singular', () => {
  expect(
    lineOf({
      kind: 'hiringStopped',
      params: { hire: 'truck', delivered: 1, stopped: 4, refund: pay },
      occurredAt,
    }),
  ).toBe('Paraste la contratación de camiones: llegó 1 de 5.')
})

it('writes a job back with its site', () => {
  expect(lineOf({ kind: 'jobBack', params: { site, pay }, occurredAt })).toBe(
    'Tu equipo volvió de la región 1, zona 3, sitio 12.',
  )
})

it('writes a job called back with its site', () => {
  expect(lineOf({ kind: 'jobCalledBack', params: { site, pay }, occurredAt })).toBe(
    'Llamaste de vuelta a tu equipo de la región 1, zona 3, sitio 12.',
  )
})

it('writes a clean-up done with its site', () => {
  expect(lineOf({ kind: 'cleanUpDone', params: { site, reward: pay }, occurredAt })).toBe(
    'Tu equipo limpió los residuos de la región 1, zona 3, sitio 12.',
  )
})

it('writes a failed clean-up with its site', () => {
  expect(lineOf({ kind: 'cleanUpFailed', params: { site }, occurredAt })).toBe(
    'Tu equipo no pudo limpiar los residuos de la región 1, zona 3, sitio 12.',
  )
})

it('writes the town becoming a city', () => {
  expect(lineOf({ kind: 'becameCity', occurredAt })).toBe('Tu pueblo ahora es una ciudad.')
})

it("names a job's pay above zero in the resources' order", () => {
  expect(reportNewsRowOf({ kind: 'jobBack', params: { site, pay }, occurredAt }, now).pay).toBe(
    'Pago: 40 de comida y 1 200 de material',
  )
})

it("names a clean-up's reward as its pay", () => {
  expect(
    reportNewsRowOf({ kind: 'cleanUpDone', params: { site, reward: pay }, occurredAt }, now).pay,
  ).toBe('Pago: 40 de comida y 1 200 de material')
})

it('names no pay when every amount is zero', () => {
  expect(
    reportNewsRowOf({ kind: 'jobCalledBack', params: { site, pay: noAmounts }, occurredAt }, now)
      .pay,
  ).toBeUndefined()
})

it('reads the instant of the news', () => {
  expect(reportNewsRowOf({ kind: 'becameCity', occurredAt }, now).instant).toBe('Hoy, 09:50')
})
