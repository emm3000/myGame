import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkChrome } from './checkChrome'
import { contentOf } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const withEnglish = (englishMessages: Readonly<Record<string, string>>) =>
  contentOf({ englishMessages })

describe("content gate check 9, the chrome's words", () => {
  it('passes the shipped English chrome', () => {
    expect(checkChrome(gateContentOf(shippedContent))).toEqual([])
  })

  it('passes a chrome message of frame words and the inflected words a chrome lesson teaches', () => {
    expect(checkChrome(withEnglish({ 'town.homes': 'We have homes for you.' }))).toEqual([])
  })

  it('fails a chrome message holding a card word no chrome lesson teaches', () => {
    expect(checkChrome(withEnglish({ 'town.leave': 'Leave home' }))).toEqual([
      'town.leave: holds leave, a card word no chrome lesson teaches',
    ])
  })

  it('fails a card word no chrome lesson teaches inside a plural or a select branch', () => {
    const message =
      '{count, plural, =1 {# home} other {# new homes}} {kind, select, food {food} other {left}}'

    expect(checkChrome(withEnglish({ 'town.count': message }))).toEqual([
      'town.count: holds new, a card word no chrome lesson teaches',
      'town.count: holds left, a card word no chrome lesson teaches',
    ])
  })

  it('fails a word the NGSL teaching list does not know', () => {
    expect(checkChrome(withEnglish({ 'town.upgrade': 'Upgrade home' }))).toEqual([
      'town.upgrade: holds upgrade, a card word no chrome lesson teaches',
    ])
  })

  it('exempts fixed copy', () => {
    const fixedCopy = {
      'auth.password': 'Password',
      'passwordReset.request.title': 'Leave home',
      'verification.banner.line': 'Leave home',
      'refusal.WaitingListFull': 'Leave home',
      'review.recallPrompt': 'Leave home',
      'mail.reset.subject': 'Leave home',
      'shell.signOut': 'Leave',
      'android.signin.title': 'Leave home',
    }

    expect(checkChrome(withEnglish(fixedCopy))).toEqual([])
  })

  it('reads a key that only begins like a fixed-copy namespace as chrome', () => {
    expect(checkChrome(withEnglish({ 'reviews.title': 'Leave home' }))).toEqual([
      'reviews.title: holds leave, a card word no chrome lesson teaches',
    ])
  })

  it("exempts numbers, the unit symbols h, min, s and %, Townword and the town's name", () => {
    const message =
      'Townword: {townName}, 12 homes, 3 h 20 min 5 s, 40 %, {count, plural, other {# food}}'

    expect(checkChrome(withEnglish({ 'town.header': message }))).toEqual([])
  })
})
