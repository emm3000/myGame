---
status: proposed
date: 2026-11-16
---
# Study reminders on Android

## Context

The owner asked on 2026-11-16 for a notification "every so often, at a
set frequency" so they remember to study (#1141). ADR 034 lists push
notifications as out for now, and PRD W6 repeats it. This ADR decides
what reminder the Android client may send, and amends both by line and
by row id.

The constraints are already in place. The server is the only source of
truth (N1), and no process on it advances state on a timer (N2, W7,
ADR 005). Absence never costs: a week away leaves the reviews waiting,
overdue but never lost, and no streak or appointment reward exists
(W10, `docs/research/english-pivot/decisions.md` §1.6). Only a due card
is reviewed, and there is no extra practice (ADR 036). ADR 027 already
weighed browser notifications. It kept them display-only and opt-in,
stored on the device, and rejected server push for W7 and N2.

The wire already carries every instant a reminder needs. `GET /town`
answers `TownOverview` with `readAt`, `nextStep` (`reviews` with its
`count` when cards are due at the read, `lessonToStudy` and
`releasedLesson` when a lesson can start), `nextDueAt` (the earliest due
instant of any held card strictly after the read, null when none) and
`lessonSlot.finishesAt` (`packages/contracts/src/TownOverview.ts`,
`NextStep.ts`). `GET /reviews` answers `due`, `nextDueAt` and `readAt`
(`Reviews.ts`), and `GET /report` answers `dueCount`, `due` and
`nextDueAt` (`Report.ts`). Both run in `mutateTown`, which settles a
finished lesson first, so a lesson finished by their read is in their
`due` or `nextDueAt` (`apps/api/CLAUDE.md`). Every lesson lasts 300
content seconds before the school and the season shorten it
(`apps/api/content/lessons/`), so a lesson finishes within minutes of
its start.

`apps/android` declares only `INTERNET` today. It has no WorkManager,
AlarmManager, notification or DataStore code. Its settings screen, in
`feature:signin`, holds the scaffold choice (`apps/android/CLAUDE.md`).
It targets and compiles against SDK 37, with a minimum of 26
(`build-logic/convention/.../ProjectDefaults.kt`).

## Decision

### What the reminder is

- **One study reminder, a local notification on the Android phone, at
  most once a day, at a local time the player picks.** It fires only
  when the last read the phone holds shows something to study by that
  time. No server job sends it, no FCM, and the api does not change.
- **Off by default.** The player turns it on in Settings, which is
  where the time is set too. On Android 13 and higher, turning it on
  asks for `POST_NOTIFICATIONS` at that moment, in context. A denial
  leaves the switch off, with a line that points to the phone's
  settings. The time picker opens at 7:00 PM.
- **One offer, on the Report.** While the reminder is off on this phone,
  the Report's nothing-due state shows a *Get a daily reminder* link to
  the same switch. It disappears once the reminder is on. Nothing else
  asks.
- **The on/off choice and the time live on the phone, not on the
  server.** The notification permission is per device, and so is the
  choice, as ADR 027 decided for the browser. Signing out cancels the
  alarm and clears everything the reminder stored.

### When it fires

The phone stores what it last read, and nothing it derived:

- **Cards waiting from**: the `readAt` of the last `TownOverview`,
  `Reviews` or `Report` read that held a due card. That is `nextStep`
  `reviews` on the town, or a non-empty `due` on the other two.
  Otherwise it is that read's `nextDueAt`, or nothing when that is null.
- **Lesson finishing at**: `lessonSlot.finishesAt` of the last
  `TownOverview`. A later `Reviews` or `Report` read at or after that
  instant drops it, because that read settled the lesson and its cards
  are in `due` or `nextDueAt`.
- **Lesson ready**: whether the last `TownOverview`'s `nextStep` was
  `lessonToStudy` or `releasedLesson`.

The reminder's instant is the first occurrence of the chosen local time
at or after both now and the earlier of *cards waiting from* and
*lesson finishing at*. When neither is set, the reminder's instant is
the next occurrence of the chosen time while *lesson ready* holds, and
the phone schedules no reminder otherwise. Each read that changes these
facts replaces the one scheduled alarm, and a read that shows nothing
to study also removes a reminder already posted.

When the alarm fires, the phone posts the notification. It then
schedules the next day's alarm from the same stored facts, since
nothing it knows has changed. A player who does not open the app is
reminded once a day while words wait, never more often.

This is a schedule drawn from server instants and the phone's clock,
like a countdown (M8). It decides no game value and sends nothing to
the api. N1 is amended to name it.

### How Android schedules it

- **`AlarmManager.setAndAllowWhileIdle` with `RTC_WAKEUP`: an inexact
  alarm.** Android's guidance for a "user-specified action that should
  happen after a specific time (even if system in idle state)" is this
  call. On Android 12 and higher the system invokes an inexact alarm
  "within one hour of the supplied trigger time, unless any
  battery-saving restrictions are in effect". It fires in Doze, at most
  once per nine minutes per app, which one alarm a day never reaches.
  `RTC` is the alarm type the docs give for a time of day.
- **No exact alarm.** The manifest declares neither
  `SCHEDULE_EXACT_ALARM` nor `USE_EXACT_ALARM` (see Considered options).
- **Rescheduled after a reboot and after a clock change.** All alarms
  are cancelled when the device shuts down. A receiver for
  `ACTION_BOOT_COMPLETED` (with `RECEIVE_BOOT_COMPLETED`), `TIME_SET`
  and `ACTION_TIMEZONE_CHANGED` reschedules from the stored facts. These
  three broadcasts are exempt from the manifest limits on implicit
  broadcasts. The boot broadcast arrives only once the player has
  launched the app at least once. The receiver is enabled while the
  reminder is on and disabled while it is off, as the alarm guide
  shows.
- **One channel, *Study reminders***, created on first use (the minimum
  SDK 26 always has channels). `areNotificationsEnabled()` is checked
  before each post, and a disabled app posts nothing.
- **A tap opens the Report** when cards wait, where the reviews start
  (ADR 040), and the town home when a lesson is ready, where the next
  step names it (ADR 042). It removes the notification. The
  notification never stacks: each post replaces the last.

### What it says

- **Fixed copy, in the scaffold language**, as mail is (ADR 038, N6).
  It is read outside the game, by a learner who may be at A1, so it does
  not fade by the chrome phase. Its keys join
  `apps/api/src/contentGate/fixedCopyKeys.ts`. The phone renders it from
  the scaffold the last read named, and under `none` it is English.
- **It names the action and nothing else.** It shows no count of words,
  because a count would be the last read's, stale by the time it fires
  and wrong after a review on another client. It never counts days
  away, names a streak, or says "missed", "don't lose" or anything that
  blames the player (W10, ADR 042's *A return visit shows the same
  card*). The ticket's copy reviewer settles the final wording; the
  intended lines are:

  | Case | en | es |
  |---|---|---|
  | Cards waiting | *Your words are ready.* / *Review them in the Report.* | *Tus palabras están listas.* / *Repásalas en el Informe.* |
  | Lesson ready, no card waiting | *A new lesson is ready.* / *Start it at the school.* | *Tienes una lección nueva.* / *Empiézala en la escuela.* |
  | Settings switch | *Study reminder* / *Once a day, at the time you pick, when there is something to study.* | *Recordatorio de estudio* / *Una vez al día, a la hora que elijas, cuando tengas algo que estudiar.* |
  | Permission denied | *Notifications for Townword are off in your phone's settings.* | *Las notificaciones de Townword están desactivadas en los ajustes del teléfono.* |

### Why a daily time and not the due instant

A review answered on the day the reminder brings it, at any hour, gives
the FSRS outcome a review at the due instant gives. ADR 036 counts days
as whole days, floored, and a card in `review` falls due at
`lastReviewAt` plus a whole number of days. So any review in the 24
hours after the due instant reads the same elapsed days, the same
retrievability and the same next card. The reminder fires at the first
chosen time after the due instant, inside those 24 hours.

## Worked examples

All instants UTC. The figures come from the domain's own FSRS
(`reviewMemoryCard`, `dueInstantOf`, `retrievabilityOf` at
`defaultMemoryTerms`, run on trunk at f10753e1), and match ADR 036's
worked example.

- **The same review, any hour of its day.** *School*, recalled Good on
  2026-11-12 09:10, holds S 10.9710 and falls due 2026-11-23 09:10.
  Recalled Good at the due instant, 10 hours later or 23 h 59 min later,
  it reads R 0.8998 each time and becomes S 46.3169, D 2.0975, with a
  `retainedAt`. Recalled 24 hours late it reads R 0.8937 and becomes
  S 48.5596; 48 hours late, R 0.8879 and S 50.7036. A day's delay lowers
  the chance of recall by 0.6 points, and a success then holds longer
  (§1.6).
- **A reminder at 7:00 PM.** The player picked 7:00 PM in UTC−5
  (00:00 UTC). After the 2026-11-12 review, the last read holds
  `nextDueAt` 2026-11-23 09:10. The alarm is set for 2026-11-24 00:00
  UTC, 7:00 PM local on the 23rd, 14 h 50 min after the due instant.
  Answered then, the card gets the outcome above.
- **A first lesson, then away.** A new player starts lesson 1 in the
  morning and closes the app. The town read holds a
  `lessonSlot.finishesAt` minutes later, no card, and `nextStep`
  `lessonRunning`. The reminder fires at 7:00 PM that day with *Your
  words are ready*. Opening the app re-reads, and the Report holds the
  lesson's five words.
- **Reviews done, nothing waiting.** The player answers the last due
  review. The re-read of `GET /reviews` holds an empty `due` and
  `nextDueAt` two days later, so the alarm moves to 7:00 PM on that day
  and any posted reminder is removed.

## Considered options

- **A notification at each due instant and at a lesson's finish** (the
  dispatch's starting recommendation). Rejected. It buys no retention
  over the daily time (above), and it ties the phone to the hours of
  past reviews: a card answered at 11:40 PM falls due at 11:40 PM, so a
  few cards make several pings a day, some at night. That is Playing by
  Appointment, which W10 refuses. The learning steps of 1 and 10
  minutes, and a lesson finishing within minutes, are shorter than an
  inexact alarm's delivery, which is up to an hour on Android 12 and
  higher. A player still in the app meets them anyway (ADR 036 rule 5).
  The lesson's finish still counts: it moves *lesson finishing at*.
- **A fixed daily reminder whether or not anything is waiting.**
  Rejected. Only a due card is reviewed and there is no extra practice
  (ADR 036). A reminder that opens onto nothing to do trains the player
  to ignore it.
- **Server push through FCM.** Rejected. A server-sent reminder at a due
  instant needs a process that wakes on a timer for every player: a
  scheduler W7 admits only with a measurement, and N2 and ADR 005 forbid
  it. It would also store device tokens on the server and add a
  Firebase project and Google Play services to a client that needs
  neither. Android recommends FCM for messages that originate on a
  server. This reminder originates on the phone, from instants the
  phone already holds.
- **WorkManager.** Not taken. Its work persists across reboots with no
  receiver, but the system "doesn't let `JobScheduler` run" in Doze, so
  "WorkManager tasks don't run" until a maintenance window, and those
  windows grow rarer the longer a phone lies idle. The WorkManager guide
  itself places AlarmManager for "precise alarms or notifications such
  as calendar events", and it would be a new dependency. The boot
  receiver is the price of the alarm.
- **Exact alarms.** Rejected. `SCHEDULE_EXACT_ALARM` is denied by default
  on Android 14 for new installs of apps targeting 13 or higher, and
  needs a trip to system settings. `USE_EXACT_ALARM` is for calendar and
  alarm-clock apps under Play policy. The floored days make the exact
  minute worthless here.
- **A count in the notification** ("3 words to review", the dispatch's
  copy). Rejected for the reasons in *What it says*. A true count at the
  firing instant would need every card's future due instant on the wire,
  and it would still go stale after a review on the web.
- **The choice and the time stored on the server.** Rejected, as ADR 027
  rejected it for the browser: the permission is per device, a second
  phone may want another time or none, and a server field would be read
  by nothing on the server.
- **Chrome copy, fading by the chrome phase.** Not taken. A notification
  is read outside the game, where the player cannot tap for support, so
  it follows mail, which is fixed copy.

## Consequences

- ADR 034's *Out for now* line is amended inline: push notifications
  stay out, and the local study reminder is admitted. PRD W6 and N1 are
  amended by row id. `CONTEXT.md` gains **Study reminder**.
- `apps/android` gains `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED`
  in the manifest, one alarm, one boot and clock receiver, one
  notification channel, and a small store on the device for the switch,
  the time and the last read's facts (not the token's secure store,
  since none of it is secret). The rule that picks the reminder's instant
  is client logic beside the projection. It is a pure function with
  tests, so `.claude/rules/android-architecture.md` (*a use case exists
  only where there is client-side logic, which here means the
  projection*) is amended by the ticket that adds it.
- The reads that feed it are the ones the client already makes: the
  town, the reviews and the Report. No contract or api change, and no
  new request.
- Copy: the reminder's and the settings' keys go in `packages/catalog`
  under the posting module's `android.<module>` prefix. A new module
  joins `packages/catalog/src/androidKeyOf.ts`, and every key joins
  `fixedCopyKeys.ts`.
- Known gap: a review answered on the web after the phone's last read
  is unknown to the phone, so a reminder can fire with nothing left due.
  Opening the app re-reads and clears it. The web is parked, and the
  owner plays on the phone (ADR 036 rule 9).
- Known gap: a phone in battery saver, or in Doze with a vendor's
  stricter limits, may deliver the reminder late. The docs promise no
  bound under battery-saving restrictions. No exemption is requested,
  since Play policy allows one only when Doze breaks an app's core
  function.
- The verification row is Android's, plus the flow on an emulator: turn
  on, deny and grant the permission, force Doze (`adb shell dumpsys
  deviceidle force-idle`), reboot, and change the time zone, with a
  screenshot of the notification and the settings in the PR.
- The web and the Apple clients are out of this ADR. Each takes its own
  decision when it is worked on.
- No ticket is written until the owner signs off on this ADR (#1141).

## References

- Issue #1141; ADR 003, ADR 005, ADR 027 (*Avisarme*), ADR 034, ADR 036
  (the due instant, whole days floored, rule 5, rule 9), ADR 038, ADR
  040, ADR 042; PRD W6, W7, W10, N1, N2, N6.
- `docs/research/english-pivot/decisions.md` §1.6;
  `docs/research/engaging-strategy-ui.md` (Playing by Appointment,
  streaks).
- Android Developers, read 2026-11-16:
  - *Schedule alarms*:
    https://developer.android.com/develop/background-work/services/alarms/schedule
  - *Behavior changes: Schedule exact alarms are denied by default*
    (Android 14):
    https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
  - *Notification runtime permission*:
    https://developer.android.com/develop/ui/views/notifications/notification-permission
  - *Optimize for Doze and App Standby*:
    https://developer.android.com/training/monitoring-device-state/doze-standby
  - *Persistent work* (WorkManager):
    https://developer.android.com/develop/background-work/background-tasks/persistent
  - *Background tasks overview*:
    https://developer.android.com/develop/background-work/background-tasks
  - *Implicit broadcast exceptions*:
    https://developer.android.com/develop/background-work/background-tasks/broadcasts/broadcast-exceptions
