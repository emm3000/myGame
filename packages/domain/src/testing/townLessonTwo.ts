import type { Lesson } from '../learning/Lesson'

export const townLessonTwo: Lesson = {
  id: 'lesson-2',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  words: [
    {
      id: 'town',
      acceptedForms: ['town'],
      gloss: 'pueblo',
      definition: 'a small city',
      frames: [{ frame: 'Our town is small.', gappedFrame: 'Our ____ is small.' }],
    },
    {
      id: 'map',
      acceptedForms: ['map'],
      gloss: 'mapa',
      definition: 'a picture that helps you Find a place',
      frames: [{ frame: 'This is a map.', gappedFrame: 'This is a ____.' }],
    },
  ],
  skill: { resource: 'power', ratePercent: 5 },
}
