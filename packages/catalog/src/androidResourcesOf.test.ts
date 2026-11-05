import { describe, expect, it } from 'vitest'
import { androidResourcesOf } from './androidResourcesOf'

describe('androidResourcesOf', () => {
  it('writes nothing for a catalog without android keys', () => {
    const webOnly = { 'mail.reset.subject': 'Cambia tu contraseña' }

    expect(androidResourcesOf(webOnly)).toEqual([])
  })

  it('writes one strings.xml per module holding keys, with its resources sorted', () => {
    const twoModules = {
      'android.signin.sign_in_title': 'Entra en tu feudo',
      'android.app.app_name': 'Vadoalto',
      'android.signin.sign_in_email': 'Correo',
    }

    expect(androidResourcesOf(twoModules)).toEqual([
      {
        path: 'apps/android/app/src/main/res/values/strings.xml',
        contents: [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<resources>',
          '    <string name="app_name">Vadoalto</string>',
          '</resources>',
          '',
        ].join('\n'),
      },
      {
        path: 'apps/android/feature/signin/src/main/res/values/strings.xml',
        contents: [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<resources>',
          '    <string name="sign_in_email">Correo</string>',
          '    <string name="sign_in_title">Entra en tu feudo</string>',
          '</resources>',
          '',
        ].join('\n'),
      },
    ])
  })

  it('escapes what XML and Android resources read as markup', () => {
    const marked = { 'android.fief.fief_note': `@A & <b> l'"x"\\\nfin` }

    expect(androidResourcesOf(marked)[0]?.contents).toContain(
      `<string name="fief_note">\\@A &amp; &lt;b> l\\'\\"x\\"\\\\\\nfin</string>`,
    )
  })

  it('escapes a leading question mark', () => {
    const question = { 'android.map.map_question': '?Dónde' }

    expect(androidResourcesOf(question)[0]?.contents).toContain(
      '<string name="map_question">\\?Dónde</string>',
    )
  })

  it('marks a string holding a percent sign as not formatted', () => {
    const percent = { 'android.fief.fief_rate': '{rate} %' }

    expect(androidResourcesOf(percent)[0]?.contents).toContain(
      '<string name="fief_rate" formatted="false">{rate} %</string>',
    )
  })

  it('refuses an android key outside a known module', () => {
    const unknownModule = { 'android.army.army_title': 'Ejército' }

    expect(() => androidResourcesOf(unknownModule)).toThrow(/android\.army\.army_title/)
  })
})
