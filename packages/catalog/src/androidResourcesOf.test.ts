import { describe, expect, it } from 'vitest'
import { androidResourcesOf } from './androidResourcesOf'

describe('androidResourcesOf', () => {
  it('writes nothing for a catalog without android keys', () => {
    const webOnly = { en: { 'mail.reset.subject': 'Change your password' }, es: {} }

    expect(androidResourcesOf(webOnly)).toEqual([])
  })

  it('writes one strings.xml per module holding keys, with its resources sorted', () => {
    const twoModules = {
      en: {
        'android.signin.sign_in_title': 'Sign in to your town',
        'android.app.app_name': 'Townword',
        'android.signin.sign_in_email': 'Email',
      },
      es: {},
    }

    expect(androidResourcesOf(twoModules)).toEqual([
      {
        path: 'apps/android/app/src/main/res/values/strings.xml',
        contents: [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<resources>',
          '    <string name="app_name">Townword</string>',
          '</resources>',
          '',
        ].join('\n'),
      },
      {
        path: 'apps/android/feature/signin/src/main/res/values/strings.xml',
        contents: [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<resources>',
          '    <string name="sign_in_email">Email</string>',
          '    <string name="sign_in_title">Sign in to your town</string>',
          '</resources>',
          '',
        ].join('\n'),
      },
    ])
  })

  it('writes English into values and Spanish into values-es', () => {
    const bothLanguages = {
      en: { 'android.app.app_name': 'Townword' },
      es: { 'android.app.app_name': 'Townword en español' },
    }

    expect(androidResourcesOf(bothLanguages).map(({ path }) => path)).toEqual([
      'apps/android/app/src/main/res/values/strings.xml',
      'apps/android/app/src/main/res/values-es/strings.xml',
    ])
    expect(androidResourcesOf(bothLanguages)[0]?.contents).toContain('>Townword<')
    expect(androidResourcesOf(bothLanguages)[1]?.contents).toContain('>Townword en español<')
  })

  it('escapes what XML and Android resources read as markup', () => {
    const marked = { en: { 'android.review.review_note': `@A & <b> l'"x"\\\nfin` }, es: {} }

    expect(androidResourcesOf(marked)[0]?.contents).toContain(
      `<string name="review_note">\\@A &amp; &lt;b> l\\'\\"x\\"\\\\\\nfin</string>`,
    )
  })

  it('escapes a leading question mark', () => {
    const question = { en: { 'android.town.map_question': '?Where' }, es: {} }

    expect(androidResourcesOf(question)[0]?.contents).toContain(
      '<string name="map_question">\\?Where</string>',
    )
  })

  it('marks a string holding a percent sign as not formatted', () => {
    const percent = { en: { 'android.review.review_rate': '{rate} %' }, es: {} }

    expect(androidResourcesOf(percent)[0]?.contents).toContain(
      '<string name="review_rate" formatted="false">{rate} %</string>',
    )
  })

  it('refuses an android key outside a known module', () => {
    const unknownModule = { en: { 'android.army.army_title': 'Army' }, es: {} }

    expect(() => androidResourcesOf(unknownModule)).toThrow(/android\.army\.army_title/)
  })
})
