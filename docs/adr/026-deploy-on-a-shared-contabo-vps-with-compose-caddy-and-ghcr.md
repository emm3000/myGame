---
status: accepted
date: 2026-10-05
---
# Deploy on a shared Contabo VPS with Compose, Caddy and GHCR

## Context

Until this slice nothing deployed. `.claude/rules/github-workflows.md`
ruled out any deploy, release or publishing from CI in this phase and
said that a release workflow is its own ADR; this is that ADR. No PRD row
covers hosting: the slice adds no requirement, binds N2 and N3, keeps
W7 and W8 as they are, and leaves the acceptance criterion as the
target the first deploy has to meet. The obvious designs pull in more
than one author with one game needs: a panel that owns the server, a
proxy in front of it, a build on the box, a job runner for the backups,
a mail service with an SDK. The owner grilled and confirmed ten
decisions on 2026-10-05 (#444) and answered three questions the same
day: the infra repo is private, the images are built for x86, and this
server is the reference host of N3. The owner then changed the host,
still on 2026-10-05: the tickets were written for Hetzner Cloud, whose
Cost-Optimized types (CX and CAX) were "Temporarily not available" in
every region of its console, while Regular Performance cost USD 13.49
a month for 2 GB and USD 22.99 for 4 GB. This ADR records what shipped,
which is the host as changed: PRs #457 to #461 in `emm3000/myGame`
(#445 to #448 and #451) and PRs #1 to #4 in `emm3000/infra` (#449,
#450, #452 and #453). Where the code stands over a ticket it records
the code. The server is not created yet: the owner's setup (#454) and
the first deploy with its smoke test (#456) are open, and what waits
for them is listed under Pending, never claimed here.

## Decision

- **The host is one Contabo Cloud VPS 4, shared by the owner's MVPs**
  (Decision 1 of #444 as changed by the owner). 4 vCPU, 8 GB of memory,
  100 GB of SSD, x86, an EU region, Ubuntu 24.04 LTS, at USD 6.60 a
  month on the monthly term, with no surcharge for the EU region; the
  24-month term is USD 5.28 a month and needs 24 months prepaid, and
  was not taken. It is twice the memory the
  Hetzner plan asked for at under a third of the price Hetzner had on
  offer for 4 GB. Nothing in either repo names the provider except
  comments and READMEs of `emm3000/infra`'s `server/`; `deploy.yml`
  names a host by secret alone.
- **The firewall is ufw on the host** (Decision 9 as changed). Contabo
  has no cloud firewall in front of the server, so
  `server/bootstrap.sh` denies incoming traffic except 22/tcp, 80/tcp,
  443/tcp and 443/udp, the last for HTTP/3, and allows outgoing. Ports
  that Docker publishes bypass ufw, since Docker writes its own
  iptables rules ahead of it; that is accepted because only Caddy
  publishes ports, 80 and 443, and no other container does, Postgres
  included. A new compose file must keep it that way.
- **The bootstrap is one idempotent script run once as root.**
  `server/bootstrap.sh` (infra PR #2) leaves a `deploy` user in the
  `docker` group with the owner's public key and no `sudo`; `/srv/infra`
  (0755), `/srv/env` (0700) and `/srv/backups` (0700), owned by
  `deploy`; `unattended-upgrades`; Docker Engine 29.8.2, containerd
  2.3.6 and the compose plugin 5.6.0 from Docker's apt repository,
  pinned and held; container logs capped in `/etc/docker/daemon.json`
  at 10 MB a file and 3 files a container; and an sshd drop-in that
  turns off root login, passwords and keyboard-interactive logins. The
  drop-in is written last and checked with `sshd -t` and `sshd -T -C`
  before any reload, so a bad config restores the previous one and
  never locks the owner out. After the run, root is the provider's
  console alone.
- **No panel: Docker Compose plus Caddy, kept in git** (Decision 2).
  Caddy 2.11.6 is its own compose project, `caddy`; it alone publishes
  ports, keeps its certificates in a named volume and obtains them on
  its own. myGame is the compose project `mygame`: `postgres` (18.6,
  its data in a named volume) on a private internal network alone,
  `api` and `web` on that network and on the external network `edge`
  under the aliases `mygame-api` and `mygame-web`, and a one-shot
  `migrate` under the profile `migrate`, so `up` never starts it. The
  api listens on `API_PORT=3000` and the web on `WEB_PORT=3001`, and
  neither publishes a host port.
- **One origin, with `/api` stripped at the edge.** The site block of
  `caddy/Caddyfile` sends `/api/*` to `mygame-api:3000` through
  `handle_path`, which strips the prefix, and everything else to
  `mygame-web:3001`. The session cookie stays same-origin, the way the
  dev proxy of `apps/web/vite.config.ts` already works, so the api
  needs no CORS and the web never proxies `/api` itself. Caddy
  compresses text types alone (HTML, JavaScript, CSS, JSON and SVG),
  with zstd or gzip, and never a PNG; the web image serves its static
  files uncompressed for that reason.
- **Three images, built by CI and pulled from GHCR.** `ci.yml`'s
  `images` job (#448, PR #460) builds the `api` and `migrate` targets
  of `apps/api/Dockerfile` and the image of `apps/web/Dockerfile` for
  `linux/amd64` on every pull request, and on a push to `trunk` pushes
  `ghcr.io/emm3000/mygame-api`, `mygame-migrate` and `mygame-web`, each
  tagged with the full commit SHA and nothing else. A tag never moves,
  so the server reuses an image it already holds. The three packages
  are public, as the repo is, so the server pulls them anonymously and
  holds no registry credential (an anonymous read of the three answered
  on 2026-10-05). The api and the web
  run as the `node` user, carry a `HEALTHCHECK` (`/health` every 10 s,
  `/sign-in` every 30 s) and end on `SIGTERM` without waiting out the
  grace period (#446 and #447, PRs #458 and #459). Nothing secret is
  baked into an image.
- **The server side lives in a separate private repo,
  `emm3000/infra`** (Decision 3). It holds the Caddyfile, one compose
  file per app, the bootstrap, each app's deploy script and the backup
  scripts, and it is checked out at `/srv/infra`. myGame keeps its own
  Dockerfiles and its deploy workflow. The whole contract between the
  two repos is one command, `ssh deploy@<host>
  /srv/infra/apps/mygame/deploy.sh <sha>`. ADR 001 rejected two
  repositories for the web and the api because they share a contract
  and one release; neither holds between the game and a server several
  MVPs share.
- **Infra work is tracked in myGame.** Every `Infra:` ticket is an
  issue of `emm3000/myGame` whose first line reads `Target repo:
  emm3000/infra`, so `gh issue list --label ready-for-agent` stays the
  one board, and the infra PR closes it with `Closes
  emm3000/myGame#<n>`. Its peer works in `../infra-<name>`, a worktree
  of the `../infra` clone that `scripts/mygame-session` creates (#445,
  PR #457; `docs/agents/multi-session.md`). The infra repo's own check
  runs `shellcheck`, `caddy validate` and `docker compose config` on
  every PR.
- **One domain at Cloudflare Registrar, one subdomain per MVP,
  DNS-only** (Decision 4). The records point straight at the server
  and the orange proxy stays off, so Caddy answers the ACME challenge
  and terminates TLS itself. The domain reaches the server as
  `MYGAME_DOMAIN` in `caddy/.env`, written once by the owner.
- **Mail leaves through Brevo's SMTP relay on port 587** (Decision 5).
  The one change is the value of `SMTP_URL`,
  `smtp://<login>:<key>@smtp-relay.brevo.com:587`; no code changes,
  since ADR 015's adapter speaks plain SMTP to whatever relay the
  variable names. SPF and DKIM for the domain go in Cloudflare DNS.
  Port 587 was chosen because Hetzner blocks 25 and 465; it stays on
  Contabo as the submission port Brevo documents, and no ticket checked
  which ports Contabo blocks. Brevo is a third party, and W8 does not
  forbid one: W8 is OAuth or magic-link sign-in. ADR 015 cited it
  for mail twice and is amended here.
- **Backups: a daily `pg_dump` to Cloudflare R2, keeping 7 daily and 4
  weekly** (Decision 6; #453, infra PR #4). The systemd timer
  `pg-backup@mygame.timer` runs `backup/pg-backup.sh mygame` as
  `deploy` at 03:30 UTC, with `Persistent=true` for a run missed while
  the server was down. The script dumps through `docker compose exec`
  on the `postgres` service, gzips, and uploads
  `mygame/daily/<UTC date>.sql.gz` with rclone 1.75.1, pinned by
  digest; on a Sunday, or when the newest weekly object is 7 or more
  days old, it uploads `mygame/weekly/<UTC date>.sql.gz` too. The
  script prunes, not an R2 lifecycle rule, which deletes by age and
  cannot keep "the newest 7" after a missed run. The newest dump stays
  on disk in `/srv/backups/mygame/daily/`. A failure exits non-zero and
  shows in `systemctl --failed`; nothing alerts on it.
  `pg-restore-drill.sh` restores the newest daily object into a
  throwaway container and compares its migration count with the running
  database.
- **The deploy runs on every green push to `trunk`, except a docs-only
  one** (Decision 7; #451, PR #461). `deploy.yml` is triggered by
  `workflow_run` of `ci` and runs only while the variable
  `DEPLOY_ENABLED` is `true`, the `ci` run succeeded, its event was a
  push to `trunk`, and its commit is still `trunk`'s tip
  (`head_sha == github.sha`). The tip guard keeps every `production`
  deployment record equal to the commit that ran; a superseded commit
  ships with the next green run. The workflow sits outside `ci.yml`'s
  concurrency group, in a group of its own that never cancels, so a
  newer push waits for a running deploy. The rule and its two failure
  scenarios are in `.claude/rules/github-workflows.md`.
- **Docs-only means every file changed since the last successful
  `production` deployment is under `docs/` or ends in `.md`**
  (`.github/scripts/needs-deploy.sh`). The diff is against that
  deployment, not the previous push, so a code push whose `ci` run was
  cancelled still ships with the docs-only push that follows it. No
  earlier deployment, an unknown base or an empty diff deploys.
- **The order on the server is pull, dump, migrate, up, record**
  (#452, infra PR #3). `apps/mygame/deploy.sh <sha>` refuses anything
  but 40 lowercase hex characters, takes a `flock` so one deploy or
  rollback runs at a time, and stops at the first failing step: it
  pulls the three images at the SHA; writes a `pg_dump` to
  `/srv/backups/mygame/predeploy-<UTC timestamp>-<sha>.sql.gz` and
  keeps the newest 5; runs the one-shot `migrate`, which applies every
  pending migration in one transaction; starts `api` and `web` and
  waits up to 180 s for their healthchecks; and last writes
  `MYGAME_TAG=<sha>` to `apps/mygame/.env`, so a reboot brings back the
  version that passed. Until the fourth step the previous version keeps
  serving.
- **No automatic rollback** (the owner's decision on #452). A
  migration that succeeds under an api that never turns healthy fails
  the job and is fixed by hand with the runbook in
  `apps/mygame/README.md`: under the same lock, restore the oldest
  pre-deploy dump of the failed SHA and deploy the previous SHA again.
  What players wrote in between is lost.
- **The CI key can run the deploy script and nothing else.** `deploy`
  is in the `docker` group, which is root-equivalent, so the line of
  the CI key in `authorized_keys` carries `restrict` and a forced
  command that passes one argument to `deploy.sh` and refuses any other
  command, an interactive login included. The owner's own key stays
  unrestricted, for the rollback. The workflow checks the host against
  pinned known hosts.
- **Secrets live in GitHub Actions secrets and under `/srv/env`,
  nowhere else.** GitHub holds `DEPLOY_HOST`, `DEPLOY_SSH_KEY` and
  `DEPLOY_KNOWN_HOSTS`, and the image push uses the run's
  `GITHUB_TOKEN`. The server holds `/srv/env/mygame.env`
  (`DATABASE_URL`, `POSTGRES_PASSWORD`, `SMTP_URL`, `MAIL_FROM`,
  `WEB_URL`, `MYGAME_DOMAIN`) and `/srv/env/backup.env` (the four R2
  keys), each 0600 and owned by `deploy`. The infra repo's `.gitignore`
  refuses `*.env` and carries `*.example` files with keys and no
  values. Postgres is reached inside the compose network alone.
- **The first deploy starts clean** (Decision 8). Migrations 0000 to
  0027, 28 in all, run on an empty database; nothing is imported from a
  development database. The owner signs up and verifies through the
  banner, as ADR 015 left every account to do.
- **This VPS is the reference host of N3** (the owner's answer on
  #444, carried to Contabo with the host). N3's 100 ms is measured on
  it, from the server through Caddy, excluding the network.
- **Neither the backup timer nor the deploy breaches N2 or W7.** N2
  forbids a process that advances state on a timer, and W7 a job runner
  or scheduler in the game. The backup is a systemd timer of the host
  that reads the database through `pg_dump` and writes nothing to it.
  The deploy is started by a push, never by a clock, and changes the
  schema and the running version, never a resource, a queue or an
  instant of the game. `unattended-upgrades` is the host's too. All
  three run outside the game's processes, the api holds no timer for
  any of them, and a fief is still derived on read from stored
  timestamps (ADR 005). No use case, port or table knows that a backup
  or a deploy exists.

## Pending

Recorded as open, to be written into this ADR when they close:

- The server, the domain, the DNS records, the Brevo account with SPF
  and DKIM, the R2 bucket, the GitHub secrets and `DEPLOY_ENABLED` do
  not exist yet. They are the owner's setup (#454), whose ticket still
  names Hetzner in its first two stages; the owner's comment on #444
  rules that the wizard covers the Contabo order and the first SSH.
- The first deploy has not run (#456). Until it does, nothing here is
  proven on the server: the certificate, the mail with `spf=pass` and
  `dkim=pass`, the ports that answer from outside and the skipped
  docs-only run are that ticket's checks.
- **N3 is not measured.** #456 times ten fief reads on the server
  through Caddy; the times go here as an amendment.
- The backup's production path was never exercised: the body of infra
  PR #4 says its harness ran under another compose project name, with
  MinIO standing in for R2. #456 waits for the first nightly object,
  `mygame/daily/<date>.sql.gz`, in R2, and a comment on #456 asks for
  one manual `systemctl start pg-backup@mygame` on the server before
  it.

## Considered options

- **Hetzner Cloud, 4 GB**, the grilled host. Overturned by the owner:
  the cheap types could not be ordered in any region, and the ones on
  offer cost from twice to more than three times the Contabo plan for
  half the memory or less. It would have brought a cloud firewall in
  front of the server; ufw on the host is what replaces it.
- **An Arm server.** Considered while Hetzner's CAX was the fallback:
  the images would have been built for `linux/arm64`. Dropped with the
  host; the Contabo plan is x86 and the images stay `linux/amd64`.
- **A panel such as Coolify or Dokku.** Rejected by Decision 2: a
  panel is a second system to learn, upgrade and back up, holding in
  its own database the routing and the secrets that here are a
  Caddyfile, a compose file and an env file a reviewer reads in a PR.
  One author with a handful of MVPs needs none of what it adds.
- **A Cloudflare proxy or a CDN in front.** Rejected by Decision 4:
  with the orange proxy on, TLS ends at Cloudflare, Caddy's
  certificates need a DNS challenge or an origin certificate, and a
  third party sits in every request to save bandwidth the game does not
  spend. DNS-only keeps one hop and one place where TLS ends.
- **Building on the server**, from a checkout of the game. Rejected:
  it puts the toolchain, the source and the build's memory peak on the
  box that serves players, and deploys whatever the box built rather
  than the image the gate's run produced. An image tagged by its commit
  is the same bytes in CI and in production.
- **The deploy as a job of `ci.yml`.** Rejected: `ci.yml` cancels a
  superseded run, and a deploy cancelled between migrate and up leaves
  a migrated database under the previous api.
- **Docs-only decided from the push's own diff.** Rejected: a code
  push whose run was cancelled by a docs push would never ship. The
  base is the last successful deployment.
- **An automatic rollback when the new api fails its healthcheck.**
  Rejected by the owner on #452: restoring a dump drops what players
  wrote since, and that is a person's call, not a script's.
- **Zero-downtime deploys, staging, a second server, Kubernetes, image
  signing, monitoring and alerting.** Out of scope of #444. `up`
  replaces the two containers and a request in that window fails.
- **A cron inside the api, or a job runner, for the backups.**
  Rejected by N2 and W7: the api would hold a timer. The host's systemd
  runs it with the api none the wiser.
- **R2 lifecycle rules for the retention.** Rejected: they delete by
  age and cannot guarantee the newest 7 and the newest 4 after a missed
  run.
- **Brevo's HTTP API, or another mail service's SDK.** Rejected by ADR
  015's choice of plain SMTP: the relay is a value of `SMTP_URL`, and
  changing provider is changing that value.
- **The infra inside the myGame repo.** Rejected by Decision 3: the
  server is shared by other MVPs, and its Caddyfile and bootstrap are
  not the game's to version or to gate.

## Consequences

- A push to `trunk` now reaches production. `trunk` is still never
  pushed without being asked (`CLAUDE.md`), and from the first deploy
  on a merged code PR is a release; a docs-only push, the dispatch log
  among them, deploys nothing.
- A schema change is a migration and never a reset (`CLAUDE.md`), and
  it now runs against the owner's real game before the api that needs
  it starts. All pending migrations apply in one transaction, and the
  pre-deploy dump is the way back.
- The api and the web deploy together at one SHA, as ADR 001 expected
  of coupled deploys. No path filter narrows a deploy; the docs-only
  rule is the only one.
- **A regression against N5 as ADR 008 reads it, pending the owner.**
  ADR 008 reads N5's "changeable without a code deploy" as "a file
  change and a process restart, no build and no migration".
  `apps/api/Dockerfile` copies `apps/api/content` into the api image,
  so in production a content change now takes a full CI build and a
  deploy. Two remedies stand, and this ADR chooses neither: amend N5
  and ADR 008 to mean "no code change", or mount the content read-only
  from the host over `/repo/apps/api/content` and restart the api.
  Neither N5 nor ADR 008 is amended here.
- **An accepted exception to the acceptance criterion's "zero
  requests".** The api's `HEALTHCHECK` is a `node -e` process Docker
  starts inside the api container every 10 s, which requests `/health`
  on the loopback; the web's does the same against `/sign-in` every 30
  s, and Postgres runs `pg_isready` every 10 s. These are requests the
  server makes to itself while the browser is closed. They are accepted
  as liveness probes that change no state: `/health` answers without
  the database, and no probe writes. N2 is not breached, since no
  process advances state on a timer and a fief read is still one round
  trip, so the PRD is not amended. #456 reads the api's CPU at idle.
- ADR 015 is amended: its two W8 citations for mail, the SMTP bullet
  and the rejected mail service, now point to its own choice of SMTP
  and to this ADR's relay. Its Context cited W8 correctly, for the only
  sign-in, and lost the citation only so that one line of ADR 015 names
  the row. W8 is untouched, and so are N2 and W7.
- ADR 006's "trivial backups" argument for SQLite is answered by the
  timer and the drill; Postgres stays one extra process on the box.
- The PRD's N3 names this ADR for the reference host. No Won't-have
  row changes.
- `CLAUDE.md`'s Stack line no longer calls ADR 006 "proposed and not
  yet grilled" and names the production stack.
- Every MVP on the server shares its memory, its disk and the `docker`
  group: a container another app publishes is open to the internet
  whatever ufw says, and `deploy` is root-equivalent. Each app is its
  own compose project behind `edge`.
- The CI key is as strong as GitHub's secret store and the forced
  command; the host key is pinned, so a rebuilt server needs
  `DEPLOY_KNOWN_HOSTS` written again.
- Known gap: nothing alerts when a backup or a deploy fails beyond the
  failed unit and the red workflow run, and nothing watches the disk,
  the certificate or the api from outside.
- Known gap: the pre-deploy dumps and the newest daily dump are on the
  server's one disk; the copies off the box are R2's, a day old at
  worst.
- Known gap: the two Dockerfiles pin different Node 24 patch versions
  and base distributions (24.21.0 on bookworm for the api, 24.15.0 on
  trixie for the web). `.node-version` pins the major alone.
- Known gap: #454 and the Out of scope of #444 were written for
  Hetzner; the tickets are history and are not rewritten, and this ADR
  is the record.

## Amendment (2026-10-07)

`deploy.sh` runs `migrate` before `up`, so between those two steps the
old api's inserts fail on a `NOT NULL` column it does not know, as with
migration 0028 (ADR 027). This is accepted while the author is the only
player. From the first third-party player's sign-up on, such a column
ships expand/contract: added nullable, with its backfill, in one deploy
whose api writes it, then `SET NOT NULL` in a later deploy.

## Amendment (2026-10-07): production runs itself

S24 (#516) records Decisions 1 to 4 of its parent issue, delegated to the
orchestrator by the owner: #517 and #518 in `emm3000/infra`, and #519
here. Until the owner's one-time `git -C /srv/infra pull --ff-only` and
the deploy of #519's merge, none of it has run on the server; that run's
evidence is #516's checklist.

- **Root on the host through the `docker` group, no wider than today.**
  `server/converge.sh`, run as `deploy`, starts a privileged helper
  container in the host's PID namespace (`docker run --privileged
  --pid=host`, Ubuntu pinned by tag and digest, like `r2.sh`'s rclone),
  whose `nsenter --target 1 --all` runs `converge.sh --on-host` as root
  in the host's namespaces. The Consequences already hold `deploy` as
  root-equivalent through that group, so this turns the one-time root
  steps into code and grants nothing new. Root login stays off, and
  `bootstrap.sh` stays the one run as root.
- **`converge.sh` converges three things and nothing else**, under a
  host lock, in `bootstrap.sh`'s `ok:`/`changed:` style, so a second run
  reports 0 changes: the 2 GB swap file and `vm.swappiness = 10`
  through `bootstrap.sh`'s own `setup_swap`, which it sources; the four
  units `pg-backup@.service`/`.timer` and
  `pg-restore-drill@.service`/`.timer`, written to
  `/etc/systemd/system/` only when they differ, then one
  `daemon-reload`; and `pg-backup@mygame.timer` and
  `pg-restore-drill@mygame.timer` enabled and started. The drill now
  runs every Sunday at 04:30 UTC, an hour after that day's backup, and
  writes its last `Result` to `/srv/backups/mygame/restore-drill.result`,
  which outlives a reboot.
- **The deploy syncs itself.** Before its steps, `apps/mygame/deploy.sh`
  fetches `/srv/infra` and fast-forwards it to `origin/main`, refusing
  a failed fetch, a modified tracked file or a non-fast-forward with
  HEAD unchanged; when HEAD moved it re-execs the new `deploy.sh` with
  the same argument, still holding the deploy lock, because bash reads
  a script while it runs. The order on the server is now sync,
  converge, `docker compose up -d` of `caddy/compose.yaml`, then pull,
  dump, migrate, up, record as before. vitrina's and perutops'
  `deploy.sh` share the sync alone, through `server/sync.sh`. A merged
  infra change reaches the server with the next deploy of any app, and
  the server's read-only key for `emm3000/infra`, set up by hand on
  2026-10-06, is still in neither repo.
- **A read-only `status`, and `health.yml` to run it.** The CI key's
  forced command is unchanged and accepts `status` as its one argument,
  so the contract between the repos is now two commands:
  `deploy.sh <sha>` and `deploy.sh status`. `status` takes no lock and
  changes nothing; it prints one `status: ok|warn|FAIL` line per check
  and exits non-zero when any fails: `postgres`, `api` and `web`
  healthy, `api` and `web` on the `MYGAME_TAG` of `apps/mygame/.env`,
  `/swapfile` active, the backup timer enabled with `Result=success`
  and the newest local daily dump under 26 h old, and the drill timer
  enabled with its last `Result=success` (a warning until its first
  run); then `free -m` and each container's memory limit.
  `.github/workflows/health.yml` runs it over SSH with `deploy.yml`'s
  secrets daily at 06:00 UTC and on `workflow_dispatch`, while
  `DEPLOY_ENABLED` is `true`, and fails when it fails, so GitHub's
  failed-run mail is the alert, with no new service, key or secret. It
  holds no `environment`, which would record a `production` deployment
  that the docs-only rule reads as the last deploy, and a concurrency
  group of its own, since one pending run per group would let it cancel
  a queued deploy (`.claude/rules/github-workflows.md`).

The Known gap on alerting now reads: a failed backup, a stale dump, a
failed drill, a missing swap, or an unhealthy or wrong-SHA container
reaches the owner by mail within a day, from the next 06:00 UTC run. A
failed deploy still alerts by its own red run. Nothing watches the disk,
the certificate, mail delivery or the api from outside the server: a
`status` that is green from inside says nothing of what a player
reaches. `status` fails on the dump age until the first 03:30 UTC backup
after the first converge, a run during a deploy may catch a container
being replaced, and GitHub turns a public repo's schedules off after 60
days without activity.

Neither the drill timer nor the health run breaches N2 or W7, for the
reason the backup timer does not. The drill is a systemd timer of the
host that downloads the newest R2 object, restores it into a throwaway
container with no network and only reads the running database's
migration count. The health run is started by GitHub's clock outside
the server and reads Docker, systemd and the backup directory. Neither
runs in the game's processes, the api holds no timer, and neither
writes a resource, a queue or an instant of the game. No PRD row
changes.

Considered and rejected: a root login or `sudo` for `deploy`, which
would widen access the `docker` group already gives; a one-time root
session per host change, which leaves the host's state outside git; and
an outside monitoring service, which brings a new account and secret
for what GitHub's mail already delivers.
