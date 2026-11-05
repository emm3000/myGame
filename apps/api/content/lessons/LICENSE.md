# Licence of the learning content

Everything in `apps/api/content/lessons/` is shared under the Creative Commons Attribution-ShareAlike 4.0 International licence (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/. The rest of the repository is not covered by this licence.

## The source

The curriculum is built on the New General Service List 1.2 (NGSL 1.2) by Charles Browne, Brent Culligan and Joseph Phillips, https://www.newgeneralservicelist.com/new-general-service-list, licensed CC BY-SA 4.0. Two of its files ship here unchanged, each with its source, download date and SHA-256 in `ngsl-1.2-attribution.txt`:

- `ngsl-1.2.csv`, the statistics file `NGSL_12_stats.csv`.
- `ngsl-1.2-lemmatized-for-teaching.csv`, the list lemmatized for teaching.

## What Townword changed

The lexicon, the lessons, the curriculum and the grammar inventory hold a substantial part of the NGSL's headwords, so they are Adapted Material of the NGSL under §4(b) of the licence. Townword:

- splits the headwords into frame words (`grammar.json`, closed-class words among the first 100 ranks, each with the lesson that admits it) and card words (`words.json`), and adds a few words outside the list;
- orders the card words into lessons of five (`lesson-<n>.json`, `curriculum.json`);
- adds to each card word its part of speech, an example frame and its gapped form, a gloss per scaffold language and an English definition, all written by Townword.

These additions are shared under the same licence: anyone may reuse them with attribution to the NGSL's authors and to Townword.
