import type { Lesson } from '../learning/Lesson'

export const lessonOne: Lesson = {
  id: 'lesson-1',
  durationSeconds: 300,
  requiredLibraryLevel: 1,
  words: [
    {
      id: 'home',
      acceptedForms: ['home'],
      gloss: 'hogar',
      frame: 'We have a new home in this town.',
      gappedFrame: 'We have a new ____ in this town.',
    },
    {
      id: 'school',
      acceptedForms: ['school'],
      gloss: 'escuela',
      frame: 'I walk to school every day.',
      gappedFrame: 'I walk to ____ every day.',
    },
    {
      id: 'work',
      acceptedForms: ['work'],
      gloss: 'trabajar',
      frame: 'They work in a big office.',
      gappedFrame: 'They ____ in a big office.',
    },
    {
      id: 'money',
      acceptedForms: ['money'],
      gloss: 'dinero',
      frame: 'I do not have much money.',
      gappedFrame: 'I do not have much ____.',
    },
    {
      id: 'food',
      acceptedForms: ['food'],
      gloss: 'comida',
      frame: 'We buy food for the week.',
      gappedFrame: 'We buy ____ for the week.',
    },
  ],
  skill: { resource: 'food', ratePercent: 5 },
}
