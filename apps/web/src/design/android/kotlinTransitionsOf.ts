import { durations, easings, transitions } from '../tokens'
import type { DesignSystemFile } from './DesignSystemFile'
import { kotlinPackage } from './kotlinPackage'
import { numberBefore } from './numberBefore'

const transitionShape = /^\S+ (\S+) (cubic-bezier\(.+\))$/

function nameHolding(values: Readonly<Record<string, string>>, value: string): string {
  const found = Object.entries(values).find(([, candidate]) => candidate === value)
  if (found === undefined) {
    throw new Error(`no token holds ${value}`)
  }
  return found[0]
}

function millisNameOf(duration: string): string {
  return `${duration.toUpperCase()}_MILLIS`
}

function bezierOf(easing: string): string {
  const points = easing.replace('cubic-bezier(', '').replace(')', '').split(', ')
  return `CubicBezierEasing(${points.map((point) => `${point}f`).join(', ')})`
}

function transitionLineOf(name: string, transition: string): string {
  const shape = transitionShape.exec(transition)
  if (shape === null) {
    throw new Error(`${transition} is not a property, a duration and an easing`)
  }
  const [, duration = '', easing = ''] = shape
  const millis = millisNameOf(nameHolding(durations, duration))
  return `    val ${name}: MyGameTransition = MyGameTransition(durationMillis = ${millis}, easing = ${nameHolding(easings, easing)})`
}

export function kotlinTransitionsOf(): DesignSystemFile {
  const millisLines = Object.entries(durations).map(
    ([name, value]) => `    const val ${millisNameOf(name)}: Int = ${numberBefore('ms', value)}`,
  )
  const easingLines = Object.entries(easings).map(
    ([name, value]) => `    val ${name}: Easing = ${bezierOf(value)}`,
  )
  const transitionLines = Object.entries(transitions).map(([name, value]) =>
    transitionLineOf(name, value),
  )
  return {
    fileName: 'MyGameTransitions.kt',
    contents: `${kotlinPackage}

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing

object MyGameTransitions {
${[...millisLines, ...easingLines, ...transitionLines].join('\n')}
}
`,
  }
}
