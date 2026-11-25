# Android QA plan

A QA peer walks the short written cases below on its own emulator, with Google's Android CLI as its hands, and reports each run as one comment on the pinned issue *QA runs: Android*. This plan adds no test framework and no code. It comes from the recommendation on #1183 and from run 0, #1179, whose table seeded the cases and whose setup became the recipes.

## Scope

The gate already drives every screen on Robolectric (`apps/android/CLAUDE.md`). A case here covers only what the gate cannot see:

- **The real api and database, end to end**: the acceptance criterion (`docs/PRODUCT_REQUIREMENTS.md`) and every verdict the server gives.
- **System services**: the alarm, the notification, the permission dialog, a reboot, a time or time zone change (ADR 046, *How Android schedules it*).
- **The real lifecycle**: background and return, rotation, process death, the real keyboard.
- **Real rendering**: dark theme, font scale 2.0 and Spanish. These cases sit in *After Main Street*, since ADR 047 is rebuilding the screens they look at.
- **TalkBack**, which is checked on the owner's phone only, because the emulator could not drive it (#1112).

## Admission

- A case is admitted only if it cites a PRD row or an ADR section that exists on trunk, and only if it needs a device. A check a Robolectric test can make becomes a ticket for a gate test instead (`.claude/rules/android-testing.md`).
- The plan holds at most 30 cases, and 6 to 8 of them are the smoke suite. It holds 30 today, 7 of them smoke. A new case replaces one.
- Edge cases come from the numbers the ADRs already hold: the levels on each side of 3 and of 7 (ADR 045), the last minute of a countdown (PRD M8), and midnight for the reminder's time (ADR 046).
- **Main Street.** ADR 047 rebuilds the town home as a pager (#1172); ADR 057 draws the review's and the word reading's way on and verdict in flow at the foot of their content, with no dock (#2003, #2004). A case outside *After Main Street* checks only what the server answers and the catalog line drawn for it, never where a control sits, so it survives those tickets. A case about the layout they move waits in *After Main Street*.
- Every expected result below was checked against trunk's code, the catalog keys in `packages/catalog/en.json` and `es.json`, and the ADRs, never against a comment.

## The case format

A case is written as steps and `Verify` lines, in the player's terms, never as taps. The step names the action, and the peer finds the control. Each case has:

- an id, a priority from P0 to P2 and a suite, `smoke` or `full` (the full suite includes the smoke cases);
- its **Source**, a PRD row or an ADR section;
- its **Setup**, which names a recipe below or says *none*.

A `Verify` line names the catalog key it reads, with its full namespace (`android.town.town_words_needed`), and gives the text in the account's scaffold language. A line in braces, such as `{count}`, is an ICU argument the server's answer fills.

## Setup

### The environment

- **The api** runs from the peer's worktree on the dispatch's `API_PORT`, over the peer's own Postgres and Mailpit containers, as `apps/api/CLAUDE.md` (*Local database*, *Local mail*) and `docs/agents/multi-session.md` (*Isolation*) describe. Never on Neon. On a fresh container, run `pnpm --filter @mygame/api db:migrate` before `pnpm --filter @mygame/api dev`.
- **The app** is the debug APK pointed at that api: `taskpolicy -c utility ./gradlew assembleDebug -Pmygame.apiBaseUrl=http://10.0.2.2:<API_PORT>/` in `apps/android`, then `adb -s emulator-<port> install -r app/build/outputs/apk/debug/app-debug.apk`.
- **The emulator** is the peer's own AVD, `mygame-<name>`, on API 36 (`apps/android/CLAUDE.md`, *Commands*). Every `adb` command carries `-s emulator-<port>`.
- **Accounts.** Each case that changes state starts on a fresh account, `qa-<scaffold>-<case>@qa.test` with the password `qa-password-1`, signed up in the app, or by the shortcut in **Shortcuts that keep the box** when the case only needs the account in its Setup. `<scaffold>` is `es` or `none`, as the case's Setup says. `<town name>` is any name that is not blank, as `FoundTown` takes it.
- **A bearer for the api**, when a Verify line reads the api: `curl -s -X POST http://localhost:<API_PORT>/auth/sign-in/native -H 'content-type: application/json' -d '{"email":"…","password":"qa-password-1"}' | jq -r .token`. That opens a second session and leaves the phone's alone.
- **The database**: `docker exec -i mygame-<name>-pg psql -U postgres -d mygame_<name>`. Every SQL below runs there.

### Recipe: an account and a town by the api

The shortcut in **Shortcuts that keep the box**. `SignUpRequestSchema` requires `scaffold`, `es` or `none`, beside the email and the password. `POST /town` is signed in: native sign-up sets no cookie and answers the session token, which the second call sends as an `Authorization` bearer. The first call prints `201`, the second `200`:

```sh
answer=$(mktemp)
curl -s -o "$answer" -w '%{http_code}\n' -X POST http://localhost:<API_PORT>/auth/sign-up/native \
  -H 'content-type: application/json' \
  -d '{"email":"qa-<scaffold>-<case>@qa.test","password":"qa-password-1","scaffold":"<scaffold>"}'
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:<API_PORT>/town \
  -H "authorization: Bearer $(jq -r .token "$answer")" \
  -H 'content-type: application/json' -d '{"name":"<town name>"}'
```

A sign-up body without `scaffold` answers `400` with an empty body, and a taken email `409`. The token in `$answer` is a session of its own, so it also serves as the case's bearer for the api.

### Recipe: find the player and the town

```sql
SELECT p.id AS player_id, t.id AS town_id
FROM players p LEFT JOIN towns t ON t.player_id = p.id
WHERE lower(p.email) = lower('qa-none-wrd02@qa.test');
```

### Recipe: seed levels and stocks

Storage level 3 holds 3400 of each stock (`content/town/storage.json`), so the stocks never bind a word case. Replace `<homes_level>` with the level the case's Setup names: SMK-05 needs 1, WRD-01 needs 2, WRD-02 and WRD-03 need 6 and WRD-04 needs 7.

```sql
INSERT INTO town_buildings (town_id, building, level)
VALUES ('<town_id>', 'homes', <homes_level>), ('<town_id>', 'storage', 3)
ON CONFLICT (town_id, building) DO UPDATE SET level = excluded.level;
UPDATE towns SET money = 3000, food = 3000, power = 3000, material = 3000, stored_at = now()
WHERE id = '<town_id>';
```

### Recipe: seed cards

A word counts only as a card, and a lesson reads as studied once any of its words is a card (`presentTownSchool`). A **stable word** has a stability of 7 or more. A **retained word** also has a `retained_at`, which the schema holds equal to `last_review_at` (ADR 045, *The words a town holds*). Take the words in curriculum order:

```sh
words=$(jq -rn '[inputs.wordIds[]] | map(@sh) | join(",")' apps/api/content/lessons/lesson-{1..10}.json)
```

On trunk `34c8893c` it starts `'lesson-1-1','lesson-1-2','lesson-1-3','lesson-1-4','lesson-1-5','word-1','word-2',…`, ready for `ARRAY[$words]`.

The first `<n>` of them as retained words, stability 30, last reviewed 20 days ago, so none is due:

```sql
INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at, retained_at)
SELECT '<player_id>', word_id, 'review', NULL, 30, 5, now() - interval '20 days', 'good', now() - interval '40 days', now() - interval '20 days'
FROM unnest(ARRAY[<words>]) WITH ORDINALITY AS w(word_id, position)
WHERE position <= <n>;
```

Change the selected values for the other kinds, and the `position` range for the words they take:

| Kind | `stability` | `last_review_at` | `retained_at` | Due |
|---|---|---|---|---|
| Retained, not due | 30 | now − 20 days | `last_review_at` | no |
| Stable, not retained, not due | 10 | now − 1 day | NULL | no |
| Not yet stable, due for the day-2 recall | 2.3065 | now − 2 days 1 hour | NULL | yes |
| Stable, not retained, due for the recall that retains it | 8 | now − 9 days | NULL | yes |
| Retained, due | 8 | now − 9 days | `last_review_at` | yes |

The day-2 figures come from ADR 045's *Context*. A recall made 7 or more whole days after the last review retains the word (`retainedAtOf`). After seeding, open the Report. A card the table marks due must be counted in `android.report.report_reviews_due`, *Reviews due: {count}*. If it is not, move its `last_review_at` back by one more day and look again. The recall's answer is the word itself. Find it with `rg -n '"<word_id>"' apps/api/content/lessons/words.json`.

### Recipe: shift the server's time

The api reads `Date.now()` alone, so server time is made to pass by moving every stored instant back by the same interval. The state then matches a real wait. This shifts **every account in the database**, so seed before shifting, and shift only while the app is in the background with no request in flight. A shift past 30 days ends every session (`sessionLifetimeSeconds`), and the player signs in again. One statement per table keeps each row's instants in order under its checks:

```sql
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT table_name,
           string_agg(format('%1$I = %1$I - interval %2$L', column_name, '2 days 10 minutes'), ', ') AS assignments
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'timestamp with time zone'
    GROUP BY table_name
  LOOP
    EXECUTE format('UPDATE %I SET %s', t.table_name, t.assignments);
  END LOOP;
END $$;
```

Edit the interval to suit the case. The season calendar is content (`town.json`'s `seasons.epoch`), so the shift does not move it. The state is that of a wait that ends now: it began one interval ago, under the seasons that ran then.

**Risk: a shift can be silently incomplete.** #1179's shift listed its 14 tables by hand, so a migration that added a timestamp column would have left that column unshifted, with no error. This recipe reads the columns from `information_schema`, but it still misses any instant that is not stored as `timestamp with time zone`: a `date`, a timestamp without a zone, an epoch number or text. Before each run, `rg -n 'timestamp\(|date\(|bigint\(|integer\(' apps/api/src -g '*Tables.ts'` must show every instant column as `timestamp(…, { withTimezone: true })`. Today the only `bigint` columns are identity ids. A shift that misses a column still runs cleanly and gives a state no real wait can reach. So a case that fails right after a shift is first checked against this rule before it is filed.

### Recipe: the device clock and the alarm

- Read the reminder's alarm: `adb shell dumpsys alarm | rg -A4 'com.emm.mygame'`. The alarm is `RTC_WAKEUP`, and its pending intent carries `com.emm.mygame.STUDY_REMINDER_FIRED`.
- Read the posted notification: `adb shell dumpsys notification --noredact | rg -A12 'pkg=com.emm.mygame'`.
- Fire the alarm: set the clock to one or two minutes **before** it, `adb shell cmd alarm set-time <alarm epoch-ms minus 90000>`, then wait. Never set it past the alarm: that sends `TIME_SET`, and the app reschedules to the first chosen time after now, which is tomorrow, so no post can come that day (ADR 046, *When it fires*). Setting it before the alarm leaves the alarm where it was. The alarm is inexact (ADR 046): it fires within one hour of its time, the bound outside Doze and battery saver, and run 1 saw it fire at +1 minute. Wait up to that hour before marking the post missing in `dumpsys notification`.
- Change the time zone: `adb shell cmd alarm set-timezone <zone>`.
- Put the clock back when a case that moved it ends: `adb shell cmd alarm set-time $(($(date +%s) * 1000))`. A reboot returns the emulator to host time, so a clock left moved into a reboot makes the next case measure a different instant.

## Run rules

- **The hands are the Android CLI.** Read a screen with `android layout --device=emulator-<port>`, as every `adb` command carries `-s emulator-<port>`, and pass `--no-metrics` on every call, since the CLI sends usage data otherwise. While the CLI's device helper runs, `uiautomator dump` writes no file, so use one or the other. `android input`, a tap by text, needs 1.0.16625370 or later; with an older CLI, tap the `center` the layout gives. Read `~/.claude/skills/android-cli/references/interact.md` before the first `android layout`.
- **The journey rules** of the android-cli skill (`~/.claude/skills/android-cli/references/journeys.md`) apply to every case. Do each step exactly as written, and on its own. When the app disagrees with a `Verify` line, the app is wrong, and the case fails. Keep debugging to a minimum and report the failure. A crash, an exit or a freeze fails the case.
- **A count is read from the layout text**, never from a screenshot, since Google lists counting as inconsistent for agents.
- **A screenshot waits for the frame to settle.** After a rotation or a font-scale change, wait about 1 s, or read `android layout` first and shoot only once it shows the new orientation or scale: #1248's shot was likely a frame of the rotation, since trunk did not reproduce it. A fail that rests on one screenshot is backed by a second shot, or by a screenrecord (`adb -s emulator-<port> shell screenrecord --time-limit 10 /sdcard/<case>.mp4`, then `adb -s emulator-<port> pull /sdcard/<case>.mp4`), before it is filed.
- **The time box.** Smoke takes 50 minutes and full takes 90, the exploratory charter included. Smoke's own server waits (the farm, lesson 1 twice and homes 2) take about 16 minutes before any tapping, and run 1 took 32 minutes for the 7 cases, and the 15-minute charter comes on top (32 + 15 = 47); so the box holds them, rather than seeding them.
- **Shortcuts that keep the box.** A Setup-only account (one the case does not sign up itself) may be made with `POST /auth/sign-up/native` and `POST /town`, as **Recipe: an account and a town by the api** runs them; SMK-01, whose steps sign up, signs up in the app. SES-01 may use REM-09's sign-out, and LES-01 may run on SMK-03's lesson, the box staying 90 minutes.
- **Every run ends with one 15-minute exploratory charter** on what changed since the last run, which `git log --oneline <last run's SHA>..HEAD -- apps/android apps/api packages` lists. Repeated cases stop finding bugs. Record the charter in one line, and file what it finds as for any fail.

## Recording a run

One comment per run on the pinned issue *QA runs: Android*. If no such issue is open, the run's peer opens it with that title and pins it (`gh issue pin`). The comment follows this template:

```
Run <n> · <smoke|full> · trunk <sha> · android-36 · <es|none> · <minutes> min · <tokens in> in / <tokens out> out
| Case | Verdict | Note |
|---|---|---|
| SMK-01 | pass | |
| REM-02 | fail | #<bug> |
| REM-08 | not run | the time box ran out |
Explored: <the charter, one line>. <What it found, or "Nothing found.">
Screenshots: tag qa-run-<n>
```

- **Verdicts** are `pass`, `fail` and `not run`. A minor goes in the Note column only, with no issue, as #1179 does.
- **Entry:** CI's gate is green on that SHA (`gh run list --commit <sha>`). A local `pnpm gate` is not the entry check: its migration test drops `public` on the same database the run's api uses.
- **Exit:** every case has a verdict, or the time box ran out and the rest are marked `not run`.

### Screenshots

A screenshot is kept only for a fail. Never push one to a branch: `scripts/mygame-orphans` reports every remote branch but `trunk`, a live peer's and the single `assets` screenshot branch, which holds a PR's evidence. A tag, `qa-run-<n>`, holding only that run's failed cases' images, avoids that, since `scripts/mygame-orphans` and `scripts/mygame-wave-close` read only branches, never tags. Build it from the images in the scratchpad, against the peer's worktree, without touching a branch. The scratchpad is not a repository, so every command names the worktree:

```sh
blob=$(git -C <worktree> hash-object -w "$PWD/<file>.png")
tree=$(printf '100644 blob %s\t%s\n' "$blob" "<case>-<file>.png" | git -C <worktree> mktree)
commit=$(git -C <worktree> commit-tree "$tree" -m "qa: run <n> screenshots")
git -C <worktree> tag "qa-run-<n>" "$commit" && git -C <worktree> push origin "qa-run-<n>" && git -C <worktree> tag -d "qa-run-<n>"
```

For more than one image, write one `mktree` line per file. Link an image as `https://raw.githubusercontent.com/emm3000/myGame/qa-run-<n>/<case>-<file>.png`.

## Filing a bug

- One issue per bug, labelled `bug` and `needs-triage`.
- **Before filing**, repeat the case once on a fresh account, and search the open issues (`gh issue list --label bug --search "<words>"`). A fail that does not repeat is still filed as a bug, with *did not repeat* in the body.
- **The body** holds the case id, the run comment's link, the trunk SHA, the Setup, the steps, the expected result with its PRD or ADR source, the actual result and the screenshot's link.
- **The fix ticket writes the failing gate test first**, so a bug found by hand never needs finding by hand again.

## Cases

### Sessions

#### SMK-01 Sign up with Spanish help, then name the town · P0 · smoke

Source: PRD M1, M2; ADR 038, *The setting*
Setup: none; the app signed out, the phone in English

1. Create an account, choosing Spanish as the help language.
2. Verify the naming screen reads `android.town.town_naming_title`, *Ponle nombre a tu pueblo*.
3. Name the town `Qaville` and start it.
4. Verify the town home opens on `Qaville`, with money, food, power and material at or just above 400, 300, 200 and 500 (`town.json`'s `startingStocks`), read on the Storage place (`android.town.town_place_storage`), the only place that draws all four.
5. Verify `players.scaffold` is `es` for that email.

#### SES-01 Sign out, then sign in to the same town · P1 · full

Source: PRD M1; ADR 046, *What the reminder is*
Setup: SMK-01's account, the reminder on (REM-01)

1. Open the Report and sign out from its foot.
2. Verify the sign-in screen shows, with no `android.account.sign_in_session_ended` line.
3. Verify `dumpsys alarm` holds no alarm for `com.emm.mygame`.
4. Sign in with the same email and password.
5. Verify the town home opens on the same town, with its levels kept.
6. Open Settings from the Report. Verify the study reminder is off, so signing out cleared the switch.

#### SES-02 A scaffold change redraws the frame and keeps the words · P1 · full

Source: ADR 038, *The setting*; PRD N6
Setup: a `none` account with lesson 1 studied

1. Open Settings from the Report and choose Spanish as the help language.
2. Verify `android.account.settings_saved`, *Guardado.*, and `android.account.settings_cards_kept`, *Tus palabras y tu progreso no cambian.*, both in Spanish.
3. Go back to the town. Verify its frame is drawn in Spanish.
4. Verify `players.scaffold_version` went up by 1 and the player's card count did not change.
5. Choose None again. Verify `android.account.settings_saved`, *Saved.*, and the frame back in English.

#### SES-03 Process death returns to the same screen, signed in · P1 · full

Source: PRD M1
Setup: any account with a town

1. Open Settings from the Report.
2. Send the app to the background, then kill its process: `adb shell am kill com.emm.mygame`.
3. Reopen the app from Recents.
4. Verify Settings shows, with no sign-in screen in between.
5. Go back. Verify the Report shows, then the town.

### The acceptance criterion

#### SMK-02 Building work finishes while the app is closed · P0 · smoke

Source: PRD acceptance criterion; PRD M3, M6
Setup: a fresh `none` account with a named town, and a bearer for it

1. Start building work on the farm.
2. Note the countdown's finish, then close the app and swipe it out of Recents.
3. Wait until the finish has passed, plus one minute.
4. Open the app.
5. Verify the farm reads level 1, and the food rate is higher than it was before the work.
6. Verify each of the four stocks drawn matches `GET /town`'s `amount` for that resource, read with the bearer in the same minute, to within one minute's `ratePerHour`.
7. Open the Report. Verify its news holds `android.report.report_news_building_work_finished`, *Farm: now level 1.* (the place's name as the catalog writes it).

### Lessons

#### SMK-03 Lesson 1 runs and finishes, and its words can be read · P0 · smoke

Source: PRD S1; ADR 045, *Every lesson's skill raises money*; ADR 042, *A lesson's minutes teach its words*
Setup: a fresh `none` account with a named town

1. Open the school. Verify lesson 1 names `android.school.school_lesson_reward`, *money skill: +5 %*.
2. Study lesson 1.
3. Verify a countdown of at most 5 minutes runs: `android.town.town_next_lesson_ready_in`, *Lesson 1 ready in*, or the school's own.
4. Read its words. Verify they show one at a time, with `android.school.school_lesson_word_position`, *Word 1 of 5*.
5. Let the lesson finish, then open the Report. Verify `android.report.report_reviews_due`, *Reviews due: 5*.

#### LES-01 A rotation in the last minute keeps the countdown going · P1 · full

Source: PRD M8, S22
Setup: a fresh `none` account with a named town

1. Start lesson 1 and wait for the last minute of its countdown.
2. Rotate the phone with about 30 seconds left. Verify the countdown goes on from where it was and does not restart.

#### LES-02 A lesson that finishes in the background is settled on return · P1 · full

Source: PRD M8, S22; ADR 036, *The rules*, rule 5
Setup: a fresh `none` account with a named town

1. Start lesson 1, then send the app to the background.
2. Wait until the lesson's finish has passed.
3. Bring the app back.
4. Verify the lesson reads finished without a tap, and the Report reads `android.report.report_reviews_due`, *Reviews due: 5*.

### Reviews

#### SMK-04 The first recognitions are answered and the Report empties · P0 · smoke

Source: ADR 036, *The rules*, rules 2 and 5; PRD S22
Setup: SMK-03's account, with its 5 reviews due

1. Start the reviews and answer each recognition with its right meaning.
2. Verify each verdict reads `android.learning.review_correct`, *Correct.*
3. Go back to the Report. Verify `android.report.report_no_reviews_due`, *No reviews due now.*, with a next review within 10 minutes (the learning step).

#### REV-01 The recall's field takes the real keyboard as typed · P1 · full

Source: ADR 036, *The rules*, rule 9
Setup: a `none` account with one stable card due for its recall whose word has 4 letters or more (*Recipe: seed cards*)

1. Open the review on the recall and tap the answer field.
2. Verify the keyboard opens with its shift off, so the first letter would be lowercase.
3. Type the word with two adjacent letters swapped, a string that is not itself an English word, using the keyboard's own keys, and submit with its *Done* key.
4. Verify the field still holds exactly what was typed, and the verdict is `android.learning.review_near_miss`, *Almost. Check the spelling and try again.*

### Words open the town

The word cases run on `none` accounts, so that every line is in English whatever the chrome phase.

#### SMK-05 Level 2 needs no words, and level 3 is refused with none · P0 · smoke

Source: ADR 045, *Words open building levels from 3*; PRD M4, M5
Setup: a fresh `none` account; homes at level 1 and storage at 3, with 3000 of each stock (*Recipe: seed levels and stocks*)

1. On the town home, verify the homes' next level shows no `android.town.town_words_needed` line for level 2.
2. Start homes 2. Verify it is admitted, and let it finish.
3. Verify the homes' next level now reads `android.town.town_words_needed`, *Needs 10 words out of learning: 0 of 10*.
4. Verify the town reads `android.town.town_words_reviewed`, *Words out of learning: 0*, and `android.town.town_words_learned`, *Learned words: 0*.
5. Start homes 3. Verify the refusal `android.town.town_refusal_not_enough_words`, *This level needs 10 words out of learning and you have 0. Study new lessons and review the words that are due.*
6. Verify the money drawn is unchanged and the build slot is still empty.

#### WRD-01 The recall that holds the 10th stable word opens level 3 · P0 · full

Source: ADR 045, *What the player sees*
Setup: a fresh `none` account; homes at 2; 9 stable cards not due, and 1 card due for its day-2 recall (*Recipe: seed levels and stocks*, *Recipe: seed cards*)

1. Verify the homes' next level reads *Needs 10 words out of learning: 9 of 10*.
2. Start homes 3. Verify the refusal says *…needs 10 words out of learning and you have 9…*.
3. Answer the due recall with its word, unaided.
4. Verify `android.learning.review_correct`, *Correct.*, then `android.learning.review_level_open`, *You have the words for level 3 now.*
5. Go to the town. Verify *Words out of learning: 10*, and no `android.town.town_words_needed` line on the homes' next level.
6. Start homes 3. Verify it is admitted.

#### WRD-02 The standing switches at level 7, and the 50th retained word opens it · P0 · full

Source: ADR 045, *Words open building levels from 3*, *What the player sees*
Setup: a fresh `none` account; homes at 6; 49 retained cards not due, and 1 stable card due for the recall that retains it (*Recipe: seed levels and stocks*, *Recipe: seed cards*)

1. Verify the homes' next level reads `android.town.town_words_needed` with the retained standing, *Needs 50 learned words: 49 of 50*.
2. Verify the town reads *Words out of learning: 50* and *Learned words: 49*.
3. Start homes 7. Verify the refusal *This level needs 50 learned words and you have 49. Study new lessons and review the words that are due.*
4. Answer the due recall with its word, unaided.
5. Verify `android.learning.review_correct`, then `android.learning.review_level_open`, *You have the words for level 7 now.*
6. Go to the town. Verify *Learned words: 50*. Start homes 7. Verify it is admitted.

#### WRD-03 A hint keeps the 50th word from being retained · P1 · full

Source: ADR 045, *Considered options* (*The decision, together*); ADR 036, *The rules*, rule 5
Setup: WRD-02's setup, on a fresh account

1. On the due recall, ask for a hint. Verify `android.learning.review_hint_line`, *It starts with “{first}” and has {letters} letters.*
2. Answer with the word.
3. Verify `android.learning.review_correct` and no `android.learning.review_level_open` line.
4. Go to the town. Verify *Learned words: 49* and the homes' next level still reading *Needs 50 learned words: 49 of 50*.

#### WRD-04 A lapse takes a word out of the count and keeps the level · P1 · full

Source: ADR 045, *The words a town holds*, *Words open building levels from 3*
Setup: a fresh `none` account; homes at 7; 49 retained cards not due, and 1 retained card due (*Recipe: seed levels and stocks*, *Recipe: seed cards*)

1. Verify *Learned words: 50*.
2. Answer the due recall with a wrong word.
3. Verify `android.learning.review_wrong`, *That is not correct.*, the typed answer, the right answer and `android.learning.review_returns`, *This word will come back in a few minutes.*
4. Go to the town. Verify *Learned words: 49*, the homes still at level 7, and the card reading *Needs 60 learned words: 49 of 60*.

### The study reminder

#### SMK-06 The switch is off, and turning it on asks for the permission then · P0 · smoke

Source: ADR 046, *What the reminder is*
Setup: SMK-01's `es` account, notifications never asked

1. Open the Report while nothing is due. Verify the row `android.report.report_reminder_offer`, *Activa un recordatorio de estudio*.
2. Open Settings. Verify the study reminder, `android.account.settings_reminder_title`, *Recordatorio de estudio*, is off, and no permission dialog showed before this step.
3. Turn the reminder on. Verify the system dialog asks for permission to send notifications.
4. Allow it. Verify the switch is on and the time reads *19:00*. On a `none` account it reads *7:00 PM*.
5. Go back to the Report. Verify the offer row is gone.

#### REM-01 A denied permission leaves the switch off, with the way to the phone's settings · P0 · full

Source: ADR 046, *What the reminder is*
Setup: a fresh `es` account, notifications never asked

1. Open Settings from the Report and turn the reminder on.
2. Deny the permission.
3. Verify the switch is off, with `android.account.settings_reminder_denied`, *Las notificaciones de Townword están desactivadas en los ajustes del teléfono.*, and the link `android.account.settings_reminder_open_settings`, *Abrir los ajustes de notificaciones*.
4. Follow the link. Verify the phone's notification settings for Townword open.
5. Allow notifications there and come back. Verify the denied line is gone.
6. Turn the reminder on. Verify it turns on with no dialog.

#### SMK-07 It fires with words waiting, and the tap opens the Report · P0 · smoke

Source: ADR 046, *When it fires*, *How Android schedules it*, *What it says*
Setup: an `es` account with the reminder on and reviews due (SMK-03 and SMK-06's steps, in Spanish)

1. Read the alarm. Verify one `RTC_WAKEUP` alarm for `com.emm.mygame` at the chosen time today, or tomorrow if that has passed.
2. Send the app to the background, set the device clock 90 seconds before the alarm and wait for it to fire (*Recipe: the device clock and the alarm*).
3. Verify one notification is posted: `android.app.reminder_cards_title`, *Tus palabras están listas.*, over `android.app.reminder_cards_text`, *Abre el informe para estudiarlas.*, on the channel `android.app.reminder_channel`, *Recordatorios de estudio*.
4. Verify the next alarm is at the chosen time on the following day.
5. Tap the notification. Verify the Report opens with `android.report.report_reviews_due`, *Repasos pendientes: {count}*, and the notification is gone.
6. Go back. Verify the town shows.
7. Put the clock back (*Recipe: the device clock and the alarm*).

#### REM-02 A lesson ready, with nothing due, fires that day with the lesson line · P1 · full

Source: ADR 046, *When it fires*, *Worked examples* (*Reviews done, a lesson to start*)
Setup: a `none` account with the reminder on, lesson 1 studied, every review answered, and lesson 2 ready to start

1. Verify the alarm is at the chosen time today, not at the next review's day.
2. Set the device clock 90 seconds before it and wait for it to fire.
3. Verify the post `android.app.reminder_lesson_title`, *A lesson is ready.*, over `android.app.reminder_lesson_text`, *Start it from the town.*
4. Tap it. Verify the town shows alone, and back leaves the app.
5. Put the clock back (*Recipe: the device clock and the alarm*).

#### REM-03 A word check due fires with the check line · P1 · full

Source: ADR 046, *When it fires*; ADR 037, *The holdout*
Setup: a `none` account with the reminder on and no review due; a `band_starts` row for band 1 (insert one if the player has none), its `started_at` 8 weeks and 1 day back; then the town read once

1. Verify the town's next step names `android.town.town_next_holdout_check`, *Word check for band 1*.
2. Set the device clock 90 seconds before the alarm and wait for it to fire.
3. Verify the post `android.app.reminder_check_title`, *Your word check is ready.*, over `android.app.reminder_check_text`, *Open it from the town.*
4. Tap it. Verify the town shows.
5. Put the clock back (*Recipe: the device clock and the alarm*).

#### REM-04 Nothing to study by the chosen time posts nothing that day · P1 · full

Source: ADR 046, *When it fires*, *Worked examples* (*Reviews done, nothing waiting*)
Setup: a `none` account with the reminder on and every review answered; the learning cap full, so no lesson can start; the next review 2 days away

1. Verify the town's next step names no lesson and no check, and the alarm is at the chosen time on the day the next review falls due, not today.
2. Set the device clock 90 seconds before today's chosen time and wait past it.
3. Verify no notification is posted.
4. Put the clock back (*Recipe: the device clock and the alarm*).

#### REM-05 The alarm survives a reboot · P0 · full

Source: ADR 046, *How Android schedules it*
Setup: SMK-07's account, the reminder on, an alarm set; the device clock on host time (put the clock back after SMK-07, since a reboot returns it to host time and the alarm would be measured at a different instant)

1. Note the alarm's instant.
2. Reboot the emulator (`adb reboot`), and wait for `sys.boot_completed` to read 1. Do not open the app.
3. Verify the alarm for `com.emm.mygame` is back at the same instant.

#### REM-06 A time zone change keeps the chosen local time · P1 · full

Source: ADR 046, *How Android schedules it*
Setup: SMK-07's account, the reminder on, the zone America/Lima

1. Note the alarm's UTC instant.
2. Change the time zone to Europe/Madrid.
3. Verify the alarm moved to the chosen local time in Madrid's zone.

#### REM-07 A reminder at midnight is set for the coming midnight · P1 · full

Source: ADR 046, *What the reminder is*, *When it fires*
Setup: a `none` account with the reminder on and reviews due

1. In Settings, set the time to *12:00 AM*.
2. Verify the alarm is at the coming local midnight, the start of tomorrow's date.

#### REM-08 A revoked permission shows the switch off and posts nothing · P1 · full

Source: ADR 046, *How Android schedules it*, *What the reminder is*
Setup: SMK-07's account, the reminder on, reviews due

1. Revoke the permission: `adb shell pm revoke com.emm.mygame android.permission.POST_NOTIFICATIONS`.
2. Open the app, then Settings. Verify the switch is off, with `android.account.settings_reminder_denied` and its link.
3. Set the device clock 90 seconds before the alarm and wait for it to fire.
4. Verify no notification is posted.
5. Put the clock back (*Recipe: the device clock and the alarm*).

#### REM-09 Signing out cancels the alarm and removes the reminder · P1 · full

Source: ADR 046, *What the reminder is*
Setup: SMK-07's account, the reminder posted and still in the shade

1. Open the Report and sign out.
2. Verify the posted reminder is gone, `dumpsys alarm` holds no alarm for `com.emm.mygame`, and `adb shell pm dump com.emm.mygame` lists `com.emm.mygame.StudyReminderReceiver` among the disabled components.
3. Reboot. Verify no alarm comes back.

### The map

#### MAP-01 The dock hides while the keyboard is open · P2 · full

Source: ADR 047, *The dock* (*With the keyboard open*); PRD S13
Setup: a `none` account with a town

1. Open the Office place and follow *Go to the map* (`android.town.town_map_link`) at its foot. Choose a free site.
2. Tap the workers field. Verify the keyboard opens and the dock is not on screen.
3. Close the keyboard. Verify the dock is back.

## After Main Street

Run these only once #1170 and #1172 have merged. Each one owes its checks in light, in dark and at font scale 2.0 (`adb shell settings put system font_scale 2.0`, then 1.0 to restore it), with one run in Spanish.

#### RND-01 At font scale 2.0 the town home's art shrinks first, and the dock never cuts · P1 · full

Source: ADR 047, *The pager* (*At font scale 2.0*), *The dock* (*When the dock is too tall*)
Setup: a `none` account with a town; dark theme (`adb shell cmd uimode night yes`); font scale 2.0

1. Walk every place on the town home.
2. Verify no text is cut, and the place's art is smaller than at font scale 1.0, never the text.
3. Verify the dock takes at most half of the window's height, or folds to the go button alone with its whole label.
4. Turn the phone to landscape. Verify the same.

#### RND-02 Long Spanish labels drop the door under the go button · P2 · full

Source: ADR 047, *The dock* (*In long Spanish strings*)
Setup: an `es` account in the both phase, with a released lesson to study

1. Open the town home.
2. Verify the go button's label and the door's label each show whole, with the door under the go button when both do not fit on one row.

#### TB-01 TalkBack meets the next step first · P1 · full · owner's phone

Source: ADR 047, *The dock* (*With TalkBack*); #1112
Setup: the owner's phone with TalkBack on

1. Open the town home and swipe forward from the top.
2. Verify the order is the header, the dock's line, the go button, then the screen.
3. Verify the go button reads its label, a comma, then the line, and a place's tab reads its name, its level and, on the next step's place, that it is the next step.
4. Run a review. Verify the card comes before the dock, and the verdict is spoken once.

## Not covered

- **Android 12 and lower**, where no runtime permission is asked, so a phone with notifications off reads the denied line at once. Covering it needs a second AVD, on API 31.
- **Doze and battery saver.** ADR 046 sets no bound on how late the reminder comes there, so no `Verify` line could fail.
- **A 25-hour day**, when the clocks go back. Covering it needs a time zone with DST, crossing the fold.
- **Placement and the word check's own screens.** The gate drives them, and their server answers are covered by the api suite.
