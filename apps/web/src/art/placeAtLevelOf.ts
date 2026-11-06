import { windowCount } from './placeShapesOf'

const shapeElement = /<(?:rect|circle|polygon)\b[^>]*>/g

export function placeAtLevelOf(svg: string, level: number): string {
  const shapes = [...svg.matchAll(shapeElement)]
  const firstCut = shapes[shapes.length - windowCount + level]
  return firstCut === undefined ? svg : `${svg.slice(0, firstCut.index).trimEnd()}\n</svg>\n`
}
