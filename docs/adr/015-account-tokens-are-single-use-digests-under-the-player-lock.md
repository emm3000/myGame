---
status: accepted
date: 2026-09-28
---
# Account tokens are single-use digests issued and redeemed under the player's lock

## Context

PRD S7 gives the player a password reset and an email verification, with
email and password as the only sign-in (W8) and nothing sent or pruned on a
timer (W7, ADR 005). Nothing shipped before S7 could send a mail, prove that
an address receives one, or let a player back in without the password. The
obvious designs pull in more than S7 asks: a mail service with an API key, a
job that sends and expires links, a plain token stored beside the player, a
sign-in gated on verification. The owner decided the shape at the grilling
of 2026-09-26 (#157, engram topic `mygame/grilling-s1-s2-s3-s7`), overturned
one decision on 2026-09-28 (the owner's comment on #157: the `Mailer` port
moves out of the domain) and accepted two amendments found in review (the
lock on issue, #162; the lock order on redeem, #173). This ADR records the
decisions after PRs #166 to #175 shipped.

## Decision

- Mail leaves the api through a **`Mailer` port in `apps/api/src/auth/`**,
  beside `Accounts` and `AccountTokens`, never in `packages/domain`. No use
  case of the domain sends a mail, and ADR 013 rejects a domain port without
  a domain caller; auth already keeps its ports beside the flows that use
  them. The port carries a `Mail` (`to`, `subject`, `text`) and answers a
  `MailDelivery`, `sent` or `failed`; it never throws.
- The adapter is **SMTP over `nodemailer` at an exact version**, no
  third-party service (W8), through a plain `SMTPTransport`, never the pool,
  so the api keeps no idle socket and no timer (N2). It times out at 3 s on
  the connection, 2 s on the greeting and 3 s on the socket, so a server
  that accepts and stays silent cannot hold a request for nodemailer's
  default minutes, and it answers `failed` where nodemailer would throw. An
  in-memory mailer serves the tests; one contract suite runs against both.
  Every peer runs its own Mailpit container beside its Postgres, and CI runs
  one as a service container.
- The composition root **requires `SMTP_URL`, `MAIL_FROM` and `WEB_URL`** as
  it requires `DATABASE_URL`, and refuses to compose without them. `WEB_URL`
  is the web origin every mailed link starts from: `/verify-email?token=…`
  and `/reset-password?token=…`, English paths beside `/sign-in`.
- An **account token is a single-use link token** of kind `verify`, alive
  24 hours, or `reset`, alive 1 hour. It is 256 random bits, like a session
  token, and `account_tokens` stores **only its SHA-256 digest**, as
  `sessions` does, so a leak of the table is disclosure, not a usable link.
  The row holds the player, the kind, `expires_at` and a nullable `used_at`;
  `players.email_verified_at` is null until the verify link is followed.
- **Issuing a token replaces and prunes in one transaction**: it deletes the
  player's live token of that kind and every used or expired token of the
  player, then inserts. A resend invalidates the previous link, one live link
  per kind exists at a time, and pruning happens on the next issue for the
  same player, never on a timer (W7, ADR 005). An expired or used row is
  refused on read until then.
- **`issue` and every redeem lock the player's row first**, with `FOR NO KEY
  UPDATE`, the row lock ADR 006 takes on a fief, and touch the tokens
  second. Two racing issues serialize on the
  lock and leave one live token; a redeem racing an issue takes the two locks
  in the same order and cannot deadlock. The lock is `NO KEY UPDATE`, not
  `UPDATE`, so it does not block the `FOR KEY SHARE` a session insert takes
  at sign-in. A redeem finds the player through the live row (digest, kind,
  `used_at` null, `expires_at` in the future), locks the player, then marks
  the row used in one `UPDATE … RETURNING`, so two redeems of one link answer
  one player.
- **Sign-up issues the verify token inside its transaction and sends the
  mail after commit**, in the same request, and ignores a failed send: the
  account exists either way, and the banner resends.
- **An unverified email blocks nothing.** Sign-in, the session cookie and
  play stay as they were; the signed-in shell shows a banner with a resend
  until the email is verified. A resend answers 204, 204 with no mail once
  verified, and 503 `MailNotSent` when the send fails.
- **A reset requires a verified email.** The request answers 202 the same
  for any well-formed email and sends only to an existing, verified one, so
  the answer reveals nothing. Consuming the link hashes the new password
  before the transaction, then redeems the token, stores the hash and closes
  every session of the player in one transaction; it opens no session and
  sets no cookie.
- The wire (ADR 010) carries **`emailVerified` on `Player`**, and two new
  kinds: **`TokenInvalid`** (400), one answer for a token unknown, expired,
  used or of the other kind, and **`MailNotSent`** (503), the resend only.
  The server decides every one of them (N1).
- **Mail copy lives in `apps/api/src/mail/mailCopy.ts`**, mirrored from the
  account section of `docs/lore/names.md` as `apps/web/src/copy.ts` is. The
  mails are plain text, addressed as tú, with the link on a line of its own.
- **No existing account was backfilled as verified**, the author's included:
  the server had never seen proof that any address receives mail, so every
  player stored before migration 0010 sees the banner and verifies through
  it. There is no rate limit on resend or reset requests: each request
  replaces the live link, so at most one is valid per kind.

## Considered options

- **The `Mailer` port in `packages/domain`**, the grilled placement.
  Overturned by the owner on 2026-09-28: no use case of the domain sends a
  mail, and a port with no domain caller is ceremony (ADR 004, ADR 013). The
  contract and the adapters are the same either side of the boundary.
- **A third-party mail service** with an API key. Rejected by W8: SMTP to
  the deployment's own relay needs no third party, and a Mailpit container
  proves the flow end to end on every peer and in CI.
- **nodemailer's pooled transport, or its default timeouts.** Rejected: the
  pool keeps a socket and a timer open between sends (N2), and the default
  timeouts let one silent server hold a request for minutes. The first
  review of the adapter (#166) found the defaults and asked for the three
  timeouts.
- **Store the token in clear**, or salt and slow-hash it. Rejected: a plain
  SHA-256 is enough for 256 random bits, as it is for sessions, and a clear
  token makes every table leak a working link.
- **A job that expires or prunes tokens.** Rejected by W7 and ADR 005: the
  next issue for the same player prunes what that player left behind, and an
  expired row is ignored on read until then.
- **Keep every earlier token of a kind alive** until it expires. Rejected:
  the reset mail must be the only link that works, so a resend retires the
  earlier one; for `verify` the same rule costs nothing.
- **Lock only the token rows**, or lock nothing under READ COMMITTED.
  Rejected: two racing requests each deleted and inserted, and both links
  worked (#162); with the player locked on issue and the token locked first
  on redeem, the two took the locks in opposite orders and Postgres aborted
  one with a deadlock (#173). Only one order for every writer prevents it,
  and the player's row is the one both share.
- **Send the verification mail inside the sign-up transaction**, or fail
  the sign-up when the send fails. Rejected: a send inside the transaction
  holds the player's row for the SMTP round trip, and a failed send would
  refuse an account the player can still verify from the banner.
- **Gate sign-in on a verified email.** Rejected as out of scope of #157 and
  hostile to the first minute of play: the banner nags, it never blocks.
- **Answer 404 when the reset email is unknown or unverified.** Rejected: the
  answer would confirm which emails hold an account; 202 for every
  well-formed email says nothing, and the confirmation line on screen reads
  true either way.
- **Keep the other sessions open after a reset.** Rejected: a player who
  resets because the password leaked wants every stranger signed out, and
  the reset opens no session of its own so the player signs in with the new
  password.
- **One wire kind per token failure** (expired, used, unknown, wrong kind).
  Rejected: a distinct answer tells a link holder which tokens exist, and
  the screen has one thing to say in every case: ask for another link.
- **Mail copy in `apps/web` or in `packages/contracts`.** Rejected: the api
  sends the mail and the web never sees it, and no Spanish enters the
  contracts (ADR 010).
- **Backfill the author's account as verified.** Rejected: the migration
  would assert a proof the server never held; verifying through the banner
  costs one click after deploy.
- **A rate limit on resend and reset requests.** Rejected as out of scope of
  #157: one live link per kind bounds what a flood can create, and a cooldown
  derived from the live token's `expires_at` would need no timer when a
  ticket asks for it.

## Consequences

- PRD S7 is amended by row: single-use mailed links, a reset only to a
  verified email, an unverified email a banner and never a block.
- `packages/domain` is untouched: no port, no error kind, no use case.
- `apps/api` has four ports of its own, `Accounts`, `AccountTokens` and
  `Mailer` in `src/auth/` and `ChronicleReader` in `src/fief/`, with the same
  rule for all: the domain has no caller for them. `TransactionStores` gains
  `accountTokens` beside `accounts`, and every issue and redeem runs through
  `inTransaction`.
- Postgres gains `account_tokens` and `players.email_verified_at` in
  migration 0010 (ADR 006), the last one; the token rows of a deleted
  player go with the player. The digest function is shared with `sessions`
  and still named for them; moving it is the follow-up #169.
- Every issue and redeem is a savepoint inside the request's transaction
  that holds the player's row until commit. A sign-in racing a reset or a
  verify of the same player waits on that lock for the length of one short
  transaction and never for a mail.
- A failed send at sign-up is silent: the account exists, the banner offers
  the resend, and the resend is the first place a mail failure is answered
  (503). A reset request never reveals a failed send either; the player asks
  again.
- The api holds three plain-text mail bodies in Spanish. N6's one copy layer
  is now three files in two apps: `apps/web/src/copy.ts`,
  `apps/api/src/http/answerRefusal.ts` and `apps/api/src/mail/mailCopy.ts`.
  Each mirrors `docs/lore/names.md` and none holds a string the others
  hold, so this ADR notes the count rather than amending N6; a fourth
  Spanish file, or a string in two files, reopens N6.
- Pruning on the next issue means a player who never asks for another link
  keeps one used or expired row per kind until the next issue or the
  account's deletion, bounded by two rows per player.
- Every request that mails costs one short transaction plus one SMTP round
  trip bounded by the three timeouts, never more (N2). The api idles with no
  timer and no open SMTP connection.
- The author's own account must verify through the banner after deploy
  before a reset is possible for it.
- Known gap: the strings shipped in #164 and #165 that are not in
  `docs/lore/names.md` (the verify title *Confirma tu correo* reused from the
  mail subject, *Entra en tu feudo* reused on two screens) wait for the
  author, as does the account section of the lore itself, a proposal until
  the author accepts it. The follow-ups #169 and #154 stay open.
- Changing the email, deleting an account, HTML mail, a sign-in gated on
  verification, OAuth or magic links (W8), a job that sends or prunes (W7)
  and rate limiting are out of scope of #157; each is a future ADR or a
  ticket of its own.
