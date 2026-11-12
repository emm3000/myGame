import type { Lesson } from '../learning/Lesson'

export const unitLessonOne: Lesson = {
  id: 'unit-lesson-1',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  words: [
    {
      id: 'give-up',
      acceptedForms: ['give up'],
      gloss: 'rendirse',
      frames: [{ frame: 'She will not give up.', gappedFrame: 'She will not ____ ____.' }],
    },
    {
      id: 'find-out',
      acceptedForms: ['find out'],
      gloss: 'averiguar',
      frames: [{ frame: 'We will find out today.', gappedFrame: 'We will ____ ____ today.' }],
    },
    {
      id: 'go-on',
      acceptedForms: ['go on'],
      gloss: 'continuar',
      frames: [{ frame: 'You can go on now.', gappedFrame: 'You can ____ ____ now.' }],
    },
    {
      id: 'come-back',
      acceptedForms: ['come back'],
      gloss: 'volver',
      frames: [{ frame: 'They come back at night.', gappedFrame: 'They ____ ____ at night.' }],
    },
    {
      id: 'of-course',
      acceptedForms: ['of course'],
      gloss: 'por supuesto',
      frames: [{ frame: 'Of course we can.', gappedFrame: '____ ____ we can.' }],
    },
  ],
  skill: { resource: 'power', ratePercent: 5 },
}
