import type { Lesson } from '../learning/Lesson'

export const lessonOne: Lesson = {
  id: 'lesson-1',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  words: [
    {
      id: 'home',
      acceptedForms: ['home'],
      gloss: 'hogar',
      definition: 'the place where you live',
      frames: [
        {
          frame: 'We have a new home in this town.',
          gappedFrame: 'We have a new ____ in this town.',
        },
      ],
    },
    {
      id: 'school',
      acceptedForms: ['school'],
      gloss: 'escuela',
      definition: 'a place where children learn',
      frames: [{ frame: 'I walk to school every day.', gappedFrame: 'I walk to ____ every day.' }],
    },
    {
      id: 'work',
      acceptedForms: ['work'],
      gloss: 'trabajar',
      definition: 'to do a job for money',
      frames: [{ frame: 'They work in a big office.', gappedFrame: 'They ____ in a big office.' }],
    },
    {
      id: 'money',
      acceptedForms: ['money'],
      gloss: 'dinero',
      definition: 'what you pay with',
      frames: [{ frame: 'I do not have much money.', gappedFrame: 'I do not have much ____.' }],
    },
    {
      id: 'food',
      acceptedForms: ['food'],
      gloss: 'comida',
      definition: 'what you eat',
      frames: [{ frame: 'We buy food for the week.', gappedFrame: 'We buy ____ for the week.' }],
    },
  ],
  skill: { resource: 'food', ratePercent: 5 },
}
