# Evidence-backed UI/UX for myGame: intuitive for new players, engaging over weeks

Research note, 2026-10-06, reviewed the same day by an independent second reader whose fixes are folded in. Every citation below was checked against Crossref, the publisher, the author's own copy, or the standard's own page; claims that rest on a secondary source are labeled **[secondary]**.

## How to read "hook"

The owner asked for designs "psychologically or scientifically proven" to hook players. The evidence splits cleanly in two:

- **Engagement that serves the player**: need satisfaction (competence, autonomy), usability, clear goals and feedback, respect for the player's time. Research links these to enjoyment *and* to well-being after play (Ryan, Rigby & Przybylski 2006; Przybylski et al. 2009).
- **Compulsion that serves the metric**: playing by appointment, punishing absence, streaks, variable-ratio paid rewards, fake scarcity. These can raise short-term return rates (streaks demonstrably do: Silverman & Barasch 2022), but they are defined as dark exactly because they work *against* the player's interest without consent (Zagal, Björk & Lewis 2013), and low need satisfaction plus compulsion is the profile associated with obsessive play, post-play tension and lower enjoyment (Przybylski et al. 2009).

This note recommends only the first kind, and names the second so it can be refused on purpose.

## Context read

- `docs/PRODUCT_REQUIREMENTS.md`: W5 no real-money purchases; W7 no background job runner or scheduler (ADR 005), N2 the api idles at zero CPU; W2 no houses, messaging or diplomacy; W1 no PvP; W6 no native client, the web is responsive; M8 client-side interpolation, no polling faster than once a minute; N1 server-authoritative; N6 Spanish copy addressed as tú.
- `CONTEXT.md`: fief, five resources with amount/rate/capacity, peasants, build slot + build queue, library study slot, barracks recruit slot, march slot (forage, attack, founding, transport), seasons, chronicle (latest 100 events), kingdom map by province, bandit camps.
- Screens today (`apps/web/src/routes`): sign-in, sign-up, forgot/reset password, verify email, fief overview (`feudo.$fiefId/index`, which also holds the buildings, arts and army sections), kingdom map (`mapa.index`, `mapa.$province`), chronicle (`cronica`).
- Identity: stylized 3D early-medieval art, one accent colour per resource (wood amber, stone pale grey, iron dark blue-grey, gold warm yellow, food wheat green), grounded low-magic voice, dry humour (`docs/art/art-bible.md`, `docs/lore/README.md`).

## Summary: principles ranked by strength of evidence

1. **Keep system status always visible: resources, rates, capacity, every slot's countdown.** [strong]
2. **Meet WCAG 2.2 AA: 4.5:1 text contrast, 3:1 for controls and icons, colour never the only signal, 24 px minimum targets, announced status.** [strong]
3. **Recognition over recall: show cost, affordability and the named refusal reason on the item itself, never in the player's head.** [strong]
4. **Give a specific, near-term goal with feedback on progress toward it.** [strong]
5. **Satisfy competence and autonomy: preview outcomes, keep them deterministic, offer real choices, never one forced path.** [strong]
6. **Make the primary action large and next to its information (Fitts).** [strong]
7. **Teach in context, at the moment of need; skip the up-front tutorial.** [moderate]
8. **Disclose progressively: show sections when they become usable, at most two levels deep.** [moderate]
9. **Show progress as a fraction of a goal already underway (goal-gradient, endowed progress), honestly.** [moderate]
10. **Design the return visit: a "since you were away" digest and the queue as cognitive offloading.** [moderate]
11. **Respect the player's time: absence costs opportunity, never what was already earned; forecast when stores fill.** [moderate]
12. **Prefer grouped density to minimalism, and do not build on Zeigarnik, Hick-for-menus or choice-overload folklore.** [weak/contested]

## Principles in detail

### 1. Keep system status always visible [strong]

**Evidence.** Nielsen derived nine heuristics from a factor analysis of 249 usability problems (Nielsen 1994, CHI, doi:10.1145/191666.191729); the published set of ten, which opens with "visibility of system status", came afterwards (current wording in Nielsen 1994/2024, NN/g). Heuristic evaluation itself was validated against real problem sets (Nielsen & Molich 1990, CHI, doi:10.1145/97243.97281). For games, Pinelle, Wong & Stach (2008, CHI, doi:10.1145/1357054.1357282) mined reviews of 108 PC games (18 per genre, 6 genres), found twelve classes of usability problem, and wrote ten game heuristics; one is game status information and another is "easy to interpret representations that minimize micromanagement" (heuristic list paraphrased from a course slide of the paper, **[secondary]** for the wording; the method is from the paper's abstract). GameFlow lists *feedback* as one of eight enjoyment elements (Sweetser & Wyeth 2005, Computers in Entertainment, doi:10.1145/1077246.1077253), and the RTS adaptation keeps it (Sweetser et al. 2012, doi:10.1145/2336727.2336728). Feedback helps on average but not always: across 607 effect sizes, feedback interventions improved performance by d = .41 on average, yet over a third of them *lowered* performance; the authors' Feedback Intervention Theory attributes the harm to feedback that moves attention from the task toward the self (Kluger & DeNisi 1996, Psychological Bulletin, doi:10.1037/0033-2909.119.2.254).

**Apply to myGame.**
- Resource bar on every signed-in screen (fief, map, chronicle): amount / capacity and rate per hour visible without hover (M3 already requires the three values; put all three on the bar, not in a tooltip, because hover does not exist on touch).
- One "slots" strip under the bar: build slot + queue length, study slot, recruit slot, march slot, incoming cargo, each with its countdown and what finishes ("Aserradero nivel 4, 12:31"). The domain already has exactly four slots plus cargo; showing all of them answers "what is my fief doing" in one glance.
- A per-resource "lleno en 3 h 20 min" forecast near capacity. It is pure display interpolation from server rate and capacity, so N1 and M8 allow it.
- With two fiefs (S18), the bar and the slots strip are per fief; the return visit also needs one cross-fief glance (each fief's busy slots and full stores) so the second fief is not forgotten.
- Decide one time format for every finish instant and use it everywhere: relative ("en 3 h") for countdowns under a day, absolute in the player's local time ("termina a las 14:32") for queue ends and longer waits, converted in the browser from the server's instant. This is the most-read element in the genre and is still undecided.
- Keep feedback task-focused (what changed in the fief), not self-focused (no "¡Eres increíble!" toasts), per Kluger & DeNisi.

**PRD limits.** M8: countdowns interpolate client-side and the fief is re-read no faster than once a minute; when a countdown hits zero the UI shows "terminando…" and re-reads once, it never invents the result (N1).

### 2. Meet WCAG 2.2 AA [strong]

**Evidence.** A W3C Recommendation, normative rather than empirical, but built on decades of accessibility research and legally referenced in many jurisdictions (W3C, WCAG 2.2, https://www.w3.org/TR/WCAG22/). Relevant success criteria: 1.4.3 text contrast 4.5:1 (AA); 1.4.11 non-text contrast 3:1 for UI components and meaningful graphics (AA); 1.4.1 colour not the only means of conveying information (A); 2.5.8 target size at least 24 × 24 CSS px or spaced so a 24 px circle does not overlap another target (AA), and 2.5.5 at 44 × 44 (AAA), which the Understanding document only suggests considering, so 44 px below is a design choice, not a WCAG recommendation; 2.2.2 Pause, Stop, Hide (A): content that auto-updates for more than five seconds alongside other content needs a way to pause, stop or hide it, unless the update is essential; 4.1.3 status messages exposed to assistive technology without moving focus (AA), whose own example is a progress bar for an upgrade; 1.4.10 reflow at 320 CSS px (AA). For touch, Parhi, Karlson & Bederson found 9.2 mm (discrete taps) and 9.6 mm (serial taps) sufficient for one-handed thumb use (2006, MobileHCI, doi:10.1145/1152215.1152260).

**Apply to myGame.**
- The art bible's per-resource accents (amber, pale grey, dark blue-grey, warm yellow, wheat green) are identity, not information: always pair them with the hand-drawn icon and the Spanish label, and check stone pale grey and gold warm yellow against parchment backgrounds, which are the two most likely to fail 3:1.
- "Mejorar", "Reclutar", "Enviar", "Retirar" buttons at least 44 px tall on mobile (a design choice above the 24 px AA floor); plot tiles on the kingdom map at least 24 px with spacing.
- Countdowns: an `aria-live="polite"` region that announces completion ("Aserradero nivel 4 terminado") only after the re-read confirms it (principle 1's PRD limits), never at zero and never every tick.
- 2.2.2 applies to every ticking countdown and resource counter. Pick one: visible updates once a minute (seconds only in the last minute of a slot), a pause control for the live counters, or a written argument that the countdown is essential. Decide before the redesign, because it shapes the resource bar.
- The fief screen must reflow to a single column at 320 px (W6: responsive web is the mobile client).

**PRD limits.** None; W6 makes the responsive web the only mobile surface, which raises the stakes.

### 3. Recognition over recall, inside working-memory limits [strong]

**Evidence.** Working memory holds about four chunks (Cowan 2001, Behavioral and Brain Sciences, doi:10.1017/S0140525X01003922), revising Miller's "seven plus or minus two" (1956, Psychological Review, doi:10.1037/h0043158). Extraneous cognitive load competes with the task (Sweller 1988, Cognitive Science, doi:10.1207/s15516709cog1202_4). Recognition beats recall because it supplies retrieval cues (Nielsen heuristic 6; Budiu 2024, NN/g, https://www.nngroup.com/articles/recognition-and-recall/). Error prevention and error messages that "precisely indicate the problem and constructively suggest a solution" are heuristics 5 and 9.

**Apply to myGame.**
- Every building card shows its next level's cost per resource with each line coloured/iconed as affordable or short, the duration with the season's percent already applied (S9's overview already answers the effective duration), and the peasants it needs vs free.
- The domain refuses an enqueue with a named reason (M5: queue full, resources short, peasants short). Surface that reason *before* the click as visible text beside the button ("Faltan 120 de piedra · lista en 1 h 05 min"), not as an error after it. Keep the button enabled: a disabled button is exempt from contrast (WCAG 1.4.3) and leaves the tab order, so keyboard and screen-reader users would never reach the reason, which breaks principle 2. If it is pressed anyway, the server's named refusal (M5) answers.
- The march form already previews outcome, losses and loot (attack outcome is deterministic and fixed at dispatch, ADR 020): keep the preview next to the send button so the player never has to remember the camp's strength from the map.
- A player tracks five resources, peasants, four slots and a season: well past four chunks, so the UI holds the state and the player only decides.

### 4. A specific, near-term goal with feedback [strong]

**Evidence.** Across hundreds of studies, specific and difficult goals beat "do your best", and goals work best with feedback on progress (Locke & Latham 2002, American Psychologist, doi:10.1037/0003-066X.57.9.705). GameFlow's "clear goals" element says the same for games (Sweetser & Wyeth 2005).

**Apply to myGame.**
- A small "Próximo objetivo" card on the fief: one concrete target derived from state ("Sube la granja a nivel 3: te faltan campesinos para el cuartel"), with what is missing. It is a value derived from game state, so under N1 the server computes it and the api's fief read answers it; the browser only displays it. Never a daily quest list.
- On the first session, the goal is the acceptance criterion itself: enqueue a sawmill upgrade. The card makes that one click obvious.

**PRD limits.** N1: the goal is computed by the server, not interpolated in the browser. N5: its thresholds live in content, not code, like every other number.

### 5. Satisfy competence and autonomy [strong]

**Evidence.** In four studies, perceived in-game autonomy and competence were associated with enjoyment, preference for future play and pre-to-post-play well-being changes, and competence and autonomy were related to how intuitive the game's controls were; in the online-game study relatedness also predicted enjoyment and future play (Ryan, Rigby & Przybylski 2006, Motivation and Emotion 30(4), doi:10.1007/s11031-006-9051-8). The link from intuitive controls to competence ties usability (principles 1 to 3) directly to motivation; the motivational model is laid out in Przybylski, Rigby & Ryan (2010, Review of General Psychology, doi:10.1037/a0019440). The PENS scale's structure was largely supported in an independent factor analysis (n = 571; Johnson, Gardner & Perry 2018, IJHCS, doi:10.1016/j.ijhcs.2018.05.003). Low need satisfaction goes with obsessive passion, post-play tension and less enjoyment; high need satisfaction with harmonious passion and energy after play, though the abstract reports that high need satisfaction did not predict hours played (Przybylski, Weinstein, Ryan & Rigby 2009, CyberPsychology & Behavior, doi:10.1089/cpb.2009.0083). Caveat: a review of 110 CHI/CHI PLAY papers found SDT is often applied superficially, and the evidence is mostly correlational at the level of whole games (Tyack & Mekler 2020, CHI, doi:10.1145/3313831.3376723). Strong for "need satisfaction goes with good engagement"; the specific UI levers below are inference.

**Apply to myGame.**
- *Competence*: deterministic, previewed outcomes are a gift here. Show the battle formula's result before dispatch, then in the chronicle confirm it matched. A player who predicted and was right feels competent; randomness would hide skill.
- *Autonomy*: several viable paths (more food first vs more iron first, forage vs attack, a second fief vs a stronger first). Never lock the UI into a single scripted path after onboarding; the "próximo objetivo" card is a suggestion with a dismiss.
- *Relatedness*, the third need, has no social outlet in this phase (W2, W1). The lore voice, named kingdoms, shared bandit camps and other lords' fief names on the map are the only carriers; do not fake social presence (see Impersonation under Hooks to avoid).

### 6. Primary action large and next to its information [strong]

**Evidence.** Movement time grows with distance and shrinks with target width (Fitts 1954, Journal of Experimental Psychology, doi:10.1037/h0055392), one of the most replicated results in HCI (MacKenzie 1992, Human–Computer Interaction, doi:10.1207/s15327051hci0701_3).

**Apply to myGame.** On each building card, the upgrade button sits under the cost it spends; on a map plot, "Forrajear / Atacar / Fundar / Transportar" open in a sheet anchored to the tapped plot, not in a distant panel. The cancel ("Cancelar", refund 100 %) is smaller and separated from the primary action to prevent slips, with the refund stated (heuristic 3, user control; heuristic 5, error prevention).

### 7. Teach in context; skip the up-front tutorial [moderate]

**Evidence.** In a multivariate experiment with over 45,000 players across three games, tutorials raised play time by up to 29 % and progress by up to 75 % only in the most complex, least conventional game (Foldit); in the two simpler games they had no significant effect. Giving instructions just before they were needed raised play time 16 % in Foldit and had no effect elsewhere; restricting player freedom during the tutorial showed no benefit; on-demand help helped in Foldit, did nothing in one game and hurt in another (Andersen et al. 2012, CHI, doi:10.1145/2207676.2207687, read from the authors' copy). One study, three games, browser players; moderate.

**Apply to myGame.** myGame sits between: the OGame loop is conventional, but peasants staffed by delta (M7), seasons on rates and durations, and march phases are unusual. So: no modal tutorial; one-line contextual hints the first time each concept becomes actionable (first time free peasants block an upgrade: explain peasants there; first season change: explain the season badge), each dismissible. Do not force a scripted click path.

### 8. Progressive disclosure, two levels at most [moderate]

**Evidence.** Show the few most important options first and the rest on request; designs beyond two disclosure levels usually get lost (Nielsen 2006, NN/g, https://www.nngroup.com/articles/progressive-disclosure/). First-party practitioner research, not peer-reviewed; consistent with cognitive load theory (principle 3).

**Apply to myGame.** A new fief has seven buildings, arts, four unit kinds and four march orders. Show the barracks' army section only once the barracks exists, show each unit card locked with its barracks level (S16/S20 already do this, which is a good form of disclosure: visible, explained, not hidden), and keep march orders on the plot sheet, not in the global nav. Nav stays at three or four top items (Feudo, Mapa, Crónica, plus the fief switcher once a second fief exists).

### 9. Progress as a fraction of a goal already underway [moderate]

**Evidence.** Customers on a café card bought faster as they neared the free coffee, and a 12-stamp card with 2 bonus stamps was completed faster than a plain 10-stamp card; acceleration predicted retention (Kivetz, Urminsky & Zheng 2006, Journal of Marketing Research, doi:10.1509/jmkr.43.1.39). Framing an 8-step task as 10 steps with 2 done increased completion (Nunes & Drèze 2006, Journal of Consumer Research 32, doi:10.1086/500480; the car-wash figures of 34 % vs 19 % redemption are reported **[secondary]**, Wharton Knowledge, as the author's PDF could not be fetched). The gradient is not always monotonic: motivation can sag in the middle (Bonezzi, Brendl & De Angelis 2011, Psychological Science, doi:10.1177/0956797611404899). No large preregistered replication of either effect was found; consumer-domain field studies, moderate.

**Apply to myGame.**
- Every countdown is also a filling bar (the slot's elapsed fraction), and every unaffordable cost shows how full each resource is toward it.
- Mid-goal sag: for long builds, show the remaining distance ("faltan 40 min") in the second half and the done distance in the first, per Bonezzi's account.
- Honest endowment only: the starting stocks (M2) can be framed as "ya tienes lo necesario para tu primera mejora". Never fabricate progress (see Hooks to avoid).

### 10. Design the return visit [moderate]

**Evidence.** A grounded-theory study of 66 idle games defines them by "temporal flexibility" with "minor or no penalty for not returning", notes that waiting is cognitively costly on return because players must "remember plans between sessions, assess the game state upon return", and recommends queuing mechanics to offload plans to the game (Alharthi et al. 2018, CHI, doi:10.1145/3173574.3174195, read from the NSF public-access copy). A 2025 meta-analysis (59 publications screened in) found people reliably tend to *resume* interrupted tasks (Ovsiankina effect) but found no memory advantage for unfinished tasks (Zeigarnik effect; the recall ratio of 0.99 pools 37 Zeigarnik studies, excluding Zeigarnik's own) (Ghibellini & Meier 2025, Humanities and Social Sciences Communications 12, doi:10.1057/s41599-025-05000-w). The taxonomy is qualitative and the resumption result comes from lab tasks: moderate.

**Apply to myGame.**
- On the first read after an absence, a "Mientras no estabas" digest: the chronicle events since the last visit (upgrades finished, recruits delivered, march returned with loot, cargo arrived) and resources gained. The events part is a filter over the chronicle by instant, but it is not free of new state: "resources gained" needs a stored per-player snapshot of each fief's stocks at the last visit, because events carry no resource snapshots, and both the last-visit instant and the snapshot are schema changes (a migration, per CLAUDE.md). The chronicle is per fief, so the digest must span every fief the player holds (S18). CONTEXT.md keeps the domain from reading the chronicle, so the digest belongs in a read adapter of the api, not in a use case.
- The build queue (S5) is exactly the offloading tool the paper names: make "añadir a la cola" as easy as "mejorar", and show the queue's finish time so the player knows when the plan runs dry.
- Use resumption, not memory: end each session with a visible open task (queue running, march out) rather than relying on players "remembering" unfinished work.

**PRD limits.** W7/N2: no server-side reminder email or push when something finishes. A client-side browser notification while the tab is open, scheduled from the known finish instant, is display-only and stays within N1, but it must be opt-in, and like the live region it says "terminado" only after the re-read confirms it.

### 11. Respect the player's time [moderate]

**Evidence.** Zagal, Björk & Lewis define *Playing by Appointment* as play "at specific times ... defined by the game, rather than the players", made dark by penalties such as crops that wither, and state that its darkness "is nullified if completing appointments is not required for progression" (2013, Foundations of Digital Games, author copy at https://gup.ub.gu.se/file/101018). Idle games are characterized by not putting existing successes at risk when the player is away (Alharthi et al. 2018). Obsessive engagement correlates with worse post-play outcomes (Przybylski et al. 2009).

**Apply to myGame.**
- myGame already does the right thing on earned value: nothing rots, refunds and loot are credited even above capacity, marches cannot be lost to absence (no PvP, W1).
- The one appointment pressure is the capacity cap: a full store silently stops accruing. Make it visible (principle 1's "lleno en…" forecast) and treat warehouse capacity as a content knob sized so a typical night's absence does not overflow early on. That is a balance decision for content, not UI.
- Season boundaries are global and fixed; never make a season-only reward that a player misses for being away (that would be Playing by Appointment by Zagal's test).

### 12. Grouped density over minimalism; avoid folklore [weak/contested]

**Evidence.** Tullis's review identifies overall density, local density, grouping and layout complexity as the measurable drivers of display usability (1983, Human Factors 25(6), doi:10.1177/001872088302500604); grouping is what makes dense displays searchable. Clutter can be measured and degrades search (Rosenholtz, Li & Nakano 2007, Journal of Vision, doi:10.1167/7.2.17). Evidence specific to game HUDs is mostly from first-person shooters and does not transfer to a management screen. Three popular "laws" are weaker than their reputation:
- *Hick's law* describes choice reaction time among equally likely stimuli (Hick 1952, QJEP, doi:10.1080/17470215208416600; Hyman 1953, J. Exp. Psych., doi:10.1037/h0056940). Applying it to menus is an extrapolation.
- *Choice overload*: the famous jam study (Iyengar & Lepper 2000, JPSP, doi:10.1037/0022-3514.79.6.995) did not hold up on average: a meta-analysis found a mean effect near zero (Scheibehenne, Greifeneder & Todd 2010, JCR, doi:10.1086/651235); a later one found it depends on moderators such as choice-set complexity and preference uncertainty (Chernev, Böckenholt & Goodman 2015, J. Consumer Psychology, doi:10.1016/j.jcps.2014.08.002).
- *Zeigarnik effect*: not supported by meta-analysis (Ghibellini & Meier 2025, above).

**Apply to myGame.** Do not strip the fief screen to a minimalist hero image; group it in stable regions (resource bar, slots strip, buildings, arts, army) with consistent positions across fiefs. Justify a design by these groups and by principles 1 and 3, not by "Hick's law says fewer buttons".

## What OGame's layout gets right and wrong, per the evidence

Structure only, as the brief describes the OGame-style layout: a top resource bar, a side navigation, a build list with costs and durations, a queue and an event list of movements. Copy no Gameforge asset, wording or art; myGame's art bible and lore already give it its own identity. Claims about OGame's specific screens are from general familiarity, not a verified audit, so each row says what to keep *if* the pattern is present.

| OGame-style element | Per the evidence | For myGame |
|---|---|---|
| Persistent resource bar on every page | Right: visibility of system status (Nielsen 1994; Pinelle et al. 2008 game status). | Keep, and add rate and capacity on the bar itself, not on hover (principles 1, 2). |
| Values hidden in hover tooltips | Wrong on touch: no hover; recall instead of recognition (Budiu 2024). | Visible text, or a tap-to-expand that also works with keyboard (WCAG 2.2). |
| Long side nav listing every feature from day one | Against progressive disclosure (Nielsen 2006) and the tutorial evidence that discoverable mechanics need no front-loading (Andersen et al. 2012). | Three or four top items; sections appear when usable; locked items shown with their unlock condition. |
| Build list with cost and duration per item | Right: recognition over recall. | Add the affordability state, the peasants needed and the named refusal reason on the card (principle 3). |
| Queue view | Right: cognitive offloading of plans (Alharthi et al. 2018). | Keep it on the fief screen, with the queue's end time. |
| Event list of movements with countdowns | Right: status visibility for long-running actions. | myGame's slots strip covers build, study, recruit, march and incoming cargo in one place. |
| Dense, small numeric tables | Mixed: density is fine when grouped (Tullis 1983); small targets fail WCAG 2.5.8 and touch research (Parhi et al. 2006). | Same information, grouped in stable regions, 44 px controls on mobile. |
| Messages inbox as the record of what happened | Weaker than a digest: the player must open and parse items to rebuild the state (recall burden). | The chronicle plus a "Mientras no estabas" digest on return (principle 10). |
| Monetized speed-ups and premium currency | Dark by Zagal et al.'s *Pay to Skip* and *Monetized Rivalries*. | Out by W5. |

## Hooks to avoid

Each pattern below is named in a primary source. The test from Zagal, Björk & Lewis (2013): a pattern is dark when it is used intentionally to cause negative experiences that are against the player's best interests and likely to happen without their consent.

| Hook | Why it "works" | Why to refuse it | Status in myGame |
|---|---|---|---|
| **Playing by Appointment**: rewards or losses tied to times the game sets; withering crops (Zagal et al. 2013) | Forces return visits on the game's schedule. | Dark once required for progression; obsessive engagement goes with post-play tension and lower enjoyment (Przybylski et al. 2009). | Nothing rots. Watch the capacity cap and any future season-only reward (principle 11). |
| **Grinding**: repetitive tasks to stretch play time (Zagal et al. 2013) | Inflates time played. | Players cannot judge the real time commitment. | Forage hours are chosen and run unattended; keep it that way: no "click to collect". |
| **Daily streaks and consecutive-day bonuses** | Intact logged streaks raise subsequent engagement in seven studies, independent of actual past behaviour (Silverman & Barasch 2022, JCR, doi:10.1093/jcr/ucac029); idle games use returning bonuses for consecutive days (Alharthi et al. 2018). | The effect comes from the streak becoming a goal of its own, i.e. the game's metric, not the player's; FOMO correlates with lower need satisfaction and mood (Przybylski et al. 2013, Computers in Human Behavior, doi:10.1016/j.chb.2013.02.014; social-media context, transfer to games is inference). | Do not add. A player away for a week should come back to more, not to a broken streak. |
| **Variable-ratio paid rewards (loot boxes)** | Gambling-like reinforcement. | Spending on loot boxes is linked to problem-gambling severity (n = 7,422, η² = 0.054; Zendle & Cairns 2018, PLOS ONE, doi:10.1371/journal.pone.0206767), replicated in a non-self-selected sample (n = 1,172, η² = 0.051; Zendle & Cairns 2019, doi:10.1371/journal.pone.0213194); structural likeness to gambling (Drummond & Sauer 2018, Nature Human Behaviour, doi:10.1038/s41562-018-0360-1); "predatory monetization" framing in King & Delfabbro (2018, Addiction, doi:10.1111/add.14286, a commentary). | Out by W5. Battles and loot are deterministic and fixed at dispatch (ADR 019, ADR 020): keep them so. Randomness without money has no comparable harm evidence, but determinism is what makes previews and competence possible. |
| **Pay to Skip, Pre-Delivered Content, Monetized Rivalries** (Zagal et al. 2013) | Revenue. | Money-based dark patterns by definition. | Out by W5. |
| **Impersonation / fake social presence** (Zagal et al. 2013) | Social pressure. | Misleads about other people's actions. | No houses or messaging (W2); never invent "another lord" messages or fake activity to fill the gap. |
| **Social Pyramid Schemes**: progress gated on recruiting friends (Zagal et al. 2013) | Viral growth. | Entraps the recruited. | Do not gate anything on invitations. |
| **Artificial scarcity, "one-time offers"** (Zagal et al. 2013, section 5.2) | Urgency. | Exploits biases against the player's interest. | No timed offers. Seasons are a world clock, not a sale. |
| **Fabricated progress** | Endowed progress works (Nunes & Drèze 2006). | Faking it is deception; it is the honest framing of real progress that is acceptable. | Only frame real stocks and real levels. |
| **Interface dark patterns in account flows** (confirmshaming, obstruction, forced action; Gray et al. 2018, CHI, doi:10.1145/3173574.3174108) | Retention and data capture. | Same consent test. | Sign-up, sign-out, verify-email banner (never a block, S7) and any future account deletion stay neutral and symmetric. |

Server-pushed reminders ("¡Tu aserradero te espera!") are absent by construction: W7 and N2 forbid the scheduler that would send them. That removes the most common re-engagement nag without a policy decision.

## Open questions / where evidence is thin

- **Persistent browser strategy specifically.** No peer-reviewed study found on OGame-like games' UI or retention. The closest primary work is the idle-games taxonomy (Alharthi et al. 2018, qualitative) and 'ville-game motivational patterns (Lewis, Wardrip-Fruin & Whitehead 2012, FDG, doi:10.1145/2282338.2282373, not read in full here). Everything in this note transfers from adjacent domains.
- **Early churn.** Churn-prediction work on five free-to-play games uses playtime, session length and session intervals (Hadiji et al. 2014, IEEE CIG, doi:10.1109/CIG.2014.6932876); the common claim that most players leave within the first days is reported in work citing it **[secondary]**. myGame has one player; it cannot measure retention yet, so the first-session principles (4, 7) rest on transfer.
- **HUD and glanceability for management games.** HUD studies are mostly first-person shooters; juiciness (visual embellishment) improved visual appeal in all games tested but affected competence only under specific circumstances (Hicks et al. 2019, CHI PLAY, doi:10.1145/3311350.3347171). Polish is not a proven motivator.
- **SDT design levers.** Need satisfaction predicts good engagement, but which UI features cause it is mostly inference (Tyack & Mekler 2020).
- **Goal-gradient and endowed progress in games.** The evidence is consumer loyalty programs; no game-specific replication found, and no large preregistered replication of either effect was found in this search.
- **Player motivation profiles.** Yee's motivation components (2006, CyberPsychology & Behavior, doi:10.1089/cpb.2006.9.772) and Quantic Foundry's 12-motivation model from 400,000+ respondents (Yee, GDC 2019, https://gdcvault.com/play/1025742/A-Deep-Dive-into-the) exist, but the latter's data is first-party industry survey data, not peer-reviewed; it was not used for any ranked principle.
- **Capacity sizing.** How long a store should take to fill relative to a typical absence is a content-balance question this note cannot answer; it decides how much Playing by Appointment pressure the warehouse creates.
- **Live counters and WCAG 2.2.2.** Whether per-minute updates satisfy Pause, Stop, Hide, or the countdowns count as essential, is a judgement call no study settles; record the decision in an ADR.
- **Relatedness without social features.** With W1 and W2 in force, whether lore, shared camps and visible neighbours on the map satisfy any relatedness is untested.

## Sources

Peer-reviewed papers and standards (DOIs checked against Crossref on 2026-10-06):

- Alharthi, S. A., Alsaedi, O., Toups Dugas, P. O., Tanenbaum, T. J., & Hammer, J. (2018). Playing to Wait: A Taxonomy of Idle Games. *CHI 2018*, 1–15. doi:10.1145/3173574.3174195. Public copy: https://par.nsf.gov/servlets/purl/10061230
- Andersen, E., O'Rourke, E., Liu, Y.-E., Snider, R., Lowdermilk, J., Truong, D., Cooper, S., & Popović, Z. (2012). The impact of tutorials on games of varying complexity. *CHI 2012*, 59–68. doi:10.1145/2207676.2207687. Author copy: https://grail.cs.washington.edu/wp-content/uploads/2015/08/andersen2012tio.pdf
- Bonezzi, A., Brendl, C. M., & De Angelis, M. (2011). Stuck in the Middle: The Psychophysics of Goal Pursuit. *Psychological Science*, 22, 607–612. doi:10.1177/0956797611404899
- Chernev, A., Böckenholt, U., & Goodman, J. (2015). Choice overload: A conceptual review and meta-analysis. *Journal of Consumer Psychology*, 25, 333–358. doi:10.1016/j.jcps.2014.08.002
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24, 87–114. doi:10.1017/S0140525X01003922
- Desurvire, H., Caplan, M., & Toth, J. A. (2004). Using heuristics to evaluate the playability of games. *CHI '04 Extended Abstracts*, 1509–1512. doi:10.1145/985921.986102 (HEP; context, not used for a ranked claim)
- Desurvire, H., & Wiberg, C. (2009). Game Usability Heuristics (PLAY) for Evaluating and Designing Better Games: The Next Iteration. *LNCS* 5621, 557–566. doi:10.1007/978-3-642-02774-1_60 (context, not used for a ranked claim)
- Drummond, A., & Sauer, J. D. (2018). Video game loot boxes are psychologically akin to gambling. *Nature Human Behaviour*, 2, 530–532. doi:10.1038/s41562-018-0360-1
- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47, 381–391. doi:10.1037/h0055392
- Ghibellini, R., & Meier, B. (2025). Interruption, recall and resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects. *Humanities and Social Sciences Communications*, 12. doi:10.1057/s41599-025-05000-w
- Gray, C. M., Kou, Y., Battles, B., Hoggatt, J., & Toombs, A. L. (2018). The Dark (Patterns) Side of UX Design. *CHI 2018*, 1–14. doi:10.1145/3173574.3174108
- Hadiji, F., Sifa, R., Drachen, A., Thurau, C., Kersting, K., & Bauckhage, C. (2014). Predicting player churn in the wild. *IEEE CIG 2014*. doi:10.1109/CIG.2014.6932876
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4, 11–26. doi:10.1080/17470215208416600
- Hicks, K., Gerling, K., Dickinson, P., & Vanden Abeele, V. (2019). Juicy Game Design: Understanding the Impact of Visual Embellishments on Player Experience. *CHI PLAY 2019*, 185–197. doi:10.1145/3311350.3347171
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45, 188–196. doi:10.1037/h0056940
- Iyengar, S. S., & Lepper, M. R. (2000). When choice is demotivating. *Journal of Personality and Social Psychology*, 79, 995–1006. doi:10.1037/0022-3514.79.6.995
- Johnson, D., Gardner, M. J., & Perry, R. (2018). Validation of two game experience scales: PENS and GEQ. *International Journal of Human-Computer Studies*, 118, 38–46. doi:10.1016/j.ijhcs.2018.05.003
- King, D. L., & Delfabbro, P. H. (2018). Predatory monetization schemes in video games (e.g. 'loot boxes') and internet gaming disorder. *Addiction*, 113, 1967–1969. doi:10.1111/add.14286
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The Goal-Gradient Hypothesis Resurrected. *Journal of Marketing Research*, 43, 39–58. doi:10.1509/jmkr.43.1.39
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance. *Psychological Bulletin*, 119, 254–284. doi:10.1037/0033-2909.119.2.254
- Lewis, C., Wardrip-Fruin, N., & Whitehead, J. (2012). Motivational game design patterns of 'ville games. *FDG 2012*, 172–179. doi:10.1145/2282338.2282373
- Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation. *American Psychologist*, 57, 705–717. doi:10.1037/0003-066X.57.9.705
- MacKenzie, I. S. (1992). Fitts' law as a research and design tool in HCI. *Human–Computer Interaction*, 7, 91–139. doi:10.1207/s15327051hci0701_3
- Miller, G. A. (1956). The magical number seven, plus or minus two. *Psychological Review*, 63, 81–97. doi:10.1037/h0043158
- Nielsen, J., & Molich, R. (1990). Heuristic evaluation of user interfaces. *CHI '90*, 249–256. doi:10.1145/97243.97281
- Nielsen, J. (1994). Enhancing the explanatory power of usability heuristics. *CHI '94*, 152–158. doi:10.1145/191666.191729
- Nunes, J. C., & Drèze, X. (2006). The Endowed Progress Effect: How Artificial Advancement Increases Effort. *Journal of Consumer Research*, 32, 504–512. doi:10.1086/500480
- Parhi, P., Karlson, A. K., & Bederson, B. B. (2006). Target size study for one-handed thumb use on small touchscreen devices. *MobileHCI '06*, 203–210. doi:10.1145/1152215.1152260
- Pinelle, D., Wong, N., & Stach, T. (2008). Heuristic evaluation for games: usability principles for video game design. *CHI '08*, 1453–1462. doi:10.1145/1357054.1357282
- Przybylski, A. K., Murayama, K., DeHaan, C. R., & Gladwell, V. (2013). Motivational, emotional, and behavioral correlates of fear of missing out. *Computers in Human Behavior*, 29, 1841–1848. doi:10.1016/j.chb.2013.02.014
- Przybylski, A. K., Rigby, C. S., & Ryan, R. M. (2010). A Motivational Model of Video Game Engagement. *Review of General Psychology*, 14, 154–166. doi:10.1037/a0019440
- Przybylski, A. K., Weinstein, N., Ryan, R. M., & Rigby, C. S. (2009). Having to versus Wanting to Play. *CyberPsychology & Behavior*, 12, 485–492. doi:10.1089/cpb.2009.0083
- Rosenholtz, R., Li, Y., & Nakano, L. (2007). Measuring visual clutter. *Journal of Vision*, 7(2), 17. doi:10.1167/7.2.17
- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The Motivational Pull of Video Games: A Self-Determination Theory Approach. *Motivation and Emotion*, 30(4), 344–360. doi:10.1007/s11031-006-9051-8
- Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload. *Journal of Consumer Research*, 37, 409–425. doi:10.1086/651235
- Silverman, J., & Barasch, A. (2022). On or Off Track: How (Broken) Streaks Affect Consumer Decisions. *Journal of Consumer Research*, 49, 1095–1117. doi:10.1093/jcr/ucac029
- Sweetser, P., & Wyeth, P. (2005). GameFlow: A model for evaluating player enjoyment in games. *Computers in Entertainment*, 3(3). doi:10.1145/1077246.1077253
- Sweetser, P., Johnson, D., Wyeth, P., & Ozdowska, A. (2012). GameFlow heuristics for designing and evaluating real-time strategy games. *IE 2012*. doi:10.1145/2336727.2336728
- Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning. *Cognitive Science*, 12, 257–285. doi:10.1207/s15516709cog1202_4
- Tullis, T. S. (1983). The Formatting of Alphanumeric Displays: A Review and Analysis. *Human Factors*, 25(6). doi:10.1177/001872088302500604
- Tyack, A., & Mekler, E. D. (2020). Self-Determination Theory in HCI Games Research: Current Uses and Open Questions. *CHI 2020*, 1–22. doi:10.1145/3313831.3376723
- Yee, N. (2006). Motivations for Play in Online Games. *CyberPsychology & Behavior*, 9, 772–775. doi:10.1089/cpb.2006.9.772
- Zagal, J. P., Björk, S., & Lewis, C. (2013). Dark Patterns in the Design of Games. *Foundations of Digital Games 2013*. Author copy: https://gup.ub.gu.se/file/101018 ; record: https://research.chalmers.se/en/publication/177148
- Zendle, D., & Cairns, P. (2018). Video game loot boxes are linked to problem gambling: Results of a large-scale survey. *PLOS ONE*, 13, e0206767. doi:10.1371/journal.pone.0206767
- Zendle, D., & Cairns, P. (2019). Loot boxes are again linked to problem gambling: Results of a replication study. *PLOS ONE*, 14, e0213194. doi:10.1371/journal.pone.0213194
- W3C (2023, updated 2024-12-12). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/ ; Understanding 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html ; Understanding 4.1.3: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html

First-party practitioner research (not peer-reviewed):

- Nielsen, J. (1994, updated 2024). 10 Usability Heuristics for User Interface Design. NN/g. https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, J. (2006). Progressive Disclosure. NN/g. https://www.nngroup.com/articles/progressive-disclosure/
- Budiu, R. (2024). Memory Recognition and Recall in User Interfaces. NN/g. https://www.nngroup.com/articles/recognition-and-recall/
- Yee, N. (2019). A Deep Dive into the 12 Motivations: Findings from 400,000+ Gamers. GDC. https://gdcvault.com/play/1025742/A-Deep-Dive-into-the

Secondary (labeled where used):

- Car-wash completion figures for Nunes & Drèze (2006): Knowledge at Wharton, https://knowledge.wharton.upenn.edu/?p=5630
- Wording of Pinelle et al.'s ten heuristics: University of Waterloo CS889 course slides, https://cs.uwaterloo.ca/~lank/CS889/s20/slides/03.Readings.pdf

Not verified and therefore not cited: Csikszentmihalyi's *Flow* (1990) is the origin of the flow construct GameFlow adapts, cited here only through Sweetser & Wyeth; the PENS white paper by Rigby & Ryan (Immersyve) was not retrieved.
