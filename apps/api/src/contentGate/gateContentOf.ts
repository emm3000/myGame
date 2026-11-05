import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GrammarContentSchema } from '@mygame/contracts'
import { lessonContentFilesOf } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'

const formsOfTeachingList = (text: string): ReadonlyMap<string, ReadonlySet<string>> => {
  const forms = new Map<string, Set<string>>()
  const rows = text
    .split(/\r?\n/)
    .filter((row) => row !== '' && !row.startsWith('##'))
    .map((row) => row.toLowerCase().split(','))
  for (const [headword = '', ...inflections] of rows) {
    for (const form of [headword, ...inflections]) {
      forms.set(form, new Set([...(forms.get(form) ?? []), headword]))
    }
  }
  return forms
}

export const gateContentOf = (directory: string): GateContent => {
  const lessons = join(directory, 'lessons')
  return {
    ...lessonContentFilesOf(directory),
    grammar: GrammarContentSchema.parse(
      JSON.parse(readFileSync(join(lessons, 'grammar.json'), 'utf8')),
    ),
    forms: formsOfTeachingList(
      readFileSync(join(lessons, 'ngsl-1.2-lemmatized-for-teaching.csv'), 'utf8'),
    ),
  }
}
