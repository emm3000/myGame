# Licence of the learning content

Everything in `apps/api/content/lessons/` is shared under the Creative Commons Attribution-ShareAlike 4.0 International licence (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/. The rest of the repository is not covered by this licence.

## The source

The curriculum is built on the New General Service List 1.2 (NGSL 1.2) by Charles Browne, Brent Culligan and Joseph Phillips, https://www.newgeneralservicelist.com/new-general-service-list, licensed CC BY-SA 4.0. Two of its files ship here unchanged, each with its source, download date and SHA-256 in `ngsl-1.2-attribution.txt`:

- `ngsl-1.2.csv`, the statistics file `NGSL_12_stats.csv`.
- `ngsl-1.2-lemmatized-for-teaching.csv`, the list lemmatized for teaching.

## What Townword changed

The lexicon, the lessons, the curriculum and the grammar inventory hold a substantial part of the NGSL's headwords, so they are Adapted Material of the NGSL under §4(b) of the licence. Townword:

- splits the headwords into frame words (`grammar.json`, closed-class words among the first 100 ranks, each in the one grammar structure that admits it) and card words (`words.json`), and adds a few words outside the list;
- orders the frame words and their inflections into grammar structures (`grammar.json`), each with its CEFR-J level and the lesson that admits it;
- orders the card words into lessons of five (`lesson-<n>.json`, `curriculum.json`);
- adds to each card word its part of speech, an example frame and its gapped form, a gloss per scaffold language and an English definition, all written by Townword.

These additions are shared under the same licence: anyone may reuse them with attribution to the NGSL's authors and to Townword.

## The grammar levels

The level of each structure in `grammar.json` follows the CEFR-J Grammar Profile, version 20180315, by Tono Laboratory, Tokyo University of Foreign Studies (TUFS), which holds its copyright: https://github.com/openlanguageprofiles/olp-en-cefrj, the file `cefrj-grammar-profile-20180315.csv`, read on 2026-11-05. Its authors allow its use for research and commercial purposes with no charge, provided the dataset is cited, which this section does. Each structure's `cefrjItem` names the item, by the Profile's ID, whose CEFR-J level it takes. The structures' names, groupings and order are Townword's; no text of the Profile, of the British Council and EAQUALS Core Inventory or of the English Grammar Profile is copied.
