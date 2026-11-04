# The chrome's words

Status: proposal, decided under the owner's delegation by ADR 040 and signed off with its pull request. The Spanish column is a proposal for `es.json` until the owner reviews it: neutral Latin American, and a card word's label is its gloss where the gloss names the thing, as *Homes* is *Hogares* for *home*, *hogar* (ADR 040).

The **chrome** is the copy of the game's screens (ADR 038). Its English uses only the card words below and frame words (ADR 037). The list is closed: the chrome lessons teach exactly these 80 words, lesson 1's five among them, so there are 16 chrome lessons of 5 (#741). A screen that needs a word not on this list rewrites its line with words that are, or waits for an ADR that appends a chrome lesson (ADR 040, The chrome and its words).

Every rank is the `SFI Rank` of `apps/api/content/lessons/ngsl-1.2.csv`. Every word is an NGSL 1.2 headword; none is off the list. Three are in band 3, ADR 035's game nouns *mayor*, *storage* and *truck*; eleven are in band 2; the other 66 are in band 1.

## Exempt from check 9

Fixed copy (the account screens, sign-out, every refusal, the whole review card with its prompts and verdicts, every mail), frame words, numbers, the unit symbols `h`, `min`, `s` and `%`, the game's name *Townword*, and the name the player gives the town.

## The words

ADR 037's rule that a lesson is never a semantic set applies when #741 groups them: the four seasons, the two resources lesson 1 does not hold (*power*, *material*) or the three terrains go to different lessons.

### The town and the navigation

| Word | Rank | Where | es |
|---|---|---|---|
| town | 364 | header, *Name your town* | pueblo |
| city | 269 | the header past the content's people count | ciudad |
| mayor | 2779 | *You are the mayor.* on the naming screen | none: the Spanish chrome never names the player with a gendered noun (ADR 040); the word's gloss is content |
| name | 206 | *Name your town*, *Town name* | nombre |
| map | 1212 | navigation | mapa |
| news | 546 | navigation, *Town News* | noticias |
| report | 166 | navigation, the Report | informe |

### Resources and people

| Word | Rank | Where | es |
|---|---|---|---|
| money | 201 | resource | dinero |
| food | 367 | resource | comida |
| power | 331 | resource; *power station* | energía |
| material | 571 | resource | material |
| people | 57 | *People: 24 free, 96 at work* | gente |
| free | 395 | free people; a free site | libre |
| work | 67 | people at work; building work | trabajar |
| full | 410 | *Full*, *Full at 18:40* | lleno |

### Buildings and building work

| Word | Rank | Where | es |
|---|---|---|---|
| home | 161 | *Homes* | hogares |
| farm | 1083 | building | granja |
| factory | 1530 | building | fábrica |
| station | 709 | *Power station* | central |
| storage | 2707 | building | almacén |
| school | 146 | building, screen | escuela |
| office | 343 | building | oficina |
| level | 262 | *Level 2*, *Build level 3*, *Top level* | nivel |
| build | 221 | *Build level 3*, *Building work* | construir |
| cost | 252 | *Cost:* | costo |
| need | 90 | *Needs 3 people*, *Needs school level 2* | necesitar |
| top | 375 | *Top level* | máximo |
| ready | 774 | *Ready at 18:40*, *Ready in 12 min* | listo |
| wait | 403 | *Waiting list* | esperar |
| list | 523 | *Waiting list* | lista |
| stop | 347 | *Stop the work*, *Stop studying*, *Stop hiring* | parar |

### Time and seasons

| Word | Rank | Where | es |
|---|---|---|---|
| spring | 1332 | season | primavera |
| summer | 654 | season | verano |
| fall | 320 | season | otoño |
| winter | 1328 | season | invierno |
| year | 58 | *Fall, year 2* | año |
| end | 152 | *Fall ends in 3 days* | terminar |
| day | 85 | *3 days* | día |
| today | 246 | *Today, 09:10* in Town News | hoy |
| tomorrow | 726 | *Ready tomorrow at 09:10* | mañana |
| now | 70 | *Homes is now level 2.* in Town News | ahora |
| hour | 247 | *Work for 4 hours* on a job | hora |

### The school and the Report

| Word | Rank | Where | es |
|---|---|---|---|
| lesson | 1234 | *Lesson 2* | lección |
| study | 187 | *Study lesson 2*, *Studying* | estudiar |
| word | 217 | *5 words*, *Words in learning: 8 of 10* | palabra |
| learn | 261 | *Words in learning* | aprender |
| skill | 685 | *Food skill, level 1* | habilidad |
| earn | 926 | *You earned the food skill, level 1.* | ganar |
| review | 730 | *Reviews due: 3*, *Next review in 9 min* | repaso |
| due | 574 | *Reviews due* | pendiente |
| next | 151 | *Next review*, *Next goal*, *Next area* | siguiente |
| go | 31 | *Go to the Report*, *Go to area 4* | ir |
| start | 136 | *Start the reviews* | empezar |

### The office

| Word | Rank | Where | es |
|---|---|---|---|
| hire | 1514 | *Hire 5 workers*, *Hiring* | contratar |
| worker | 673 | hire kind | trabajador |
| truck | 2113 | hire kind | camión |
| team | 407 | *Your team*, *Send a team* | equipo |

### The map, jobs and clean-ups

| Word | Rank | Where | es |
|---|---|---|---|
| region | 677 | *Region 1* | región |
| area | 204 | *Area 3* | zona |
| site | 494 | *Site 12* | sitio |
| field | 540 | terrain *Fields* | campos |
| river | 1176 | terrain | río |
| hill | 1670 | terrain *Hills* | colinas |
| job | 231 | *Send a team on a job* | trabajo |
| pay | 220 | *Pay: 40 food, 20 material* | pago |
| send | 323 | *Send a team* | enviar |
| call | 105 | *Call the team back* | llamar |
| back | 94 | *Call back*, *Coming back*, *Back to your area* | de vuelta |
| way | 80 | *On the way* | camino |
| come | 65 | *Coming back*, *Your team came back with 40 food.* | volver |
| clean | 842 | *Clean the waste* | limpiar |
| waste | 1246 | *Waste site*, *Waste: 12* | residuos |
| size | 705 | *Size 2* | tamaño |
| previous | 922 | *Previous area* | anterior |

### Goals, tips and the screens' states

| Word | Rank | Where | es |
|---|---|---|---|
| goal | 856 | *Next goal* | meta |
| tip | 1659 | a tip's heading | consejo |
| close | 239 | dismisses a tip, a goal or the Report's news | cerrar |
| read | 207 | *Reading your town…*, *We could not read your town.* | leer |
| try | 125 | *Try again* | intentar |
| again | 175 | *Try again* | otra vez |

## Words the list avoids

- *cancel* (2390): *stop* says it at rank 347.
- *upgrade*: no NGSL word; *Build level 3* says it.
- *queue* and *warehouse*: no NGSL words; *waiting list* and *storage* say them (`docs/research/english-pivot/decisions.md` §9).
- *hint* (2689): *tip* says it at 1659.
- *autumn* (2792): *fall* is the season's name in American English (ADR 035).
- *strength*: a team's strength is shown as a number beside the waste's (*Waste: 12*, *Your team: 8*).
