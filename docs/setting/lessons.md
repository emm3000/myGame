# Lessons

Status: proposal. Every fact below is a proposal until the author accepts it; the frames and the es glosses wait on the owner's review (`docs/research/english-pivot/decisions.md` §3.6). The rules each line relies on are ADR 036's; the Spanish lines a player reads around a lesson are in `packages/catalog/es.json`.

A **lesson** brings a set of new words in through the library's study slot (ADR 036, rule 6), grouped by a theme, never by a semantic set (§3.2). Each **item** is one word: its lemma, its part of speech, its NGSL 1.2 rank, one US-English example frame, the frame's gapped form for recall, and one gloss per scaffold language (§3.4). The target is American English (ADR 035); S39 serves the `es` gloss only, addressed as tú where a gloss addresses anyone (ADR 036, Consequences).

## The word list

Every rank on this page is the `SFI Rank` of `NGSL_12_stats.csv`, the NGSL 1.2 (Browne, Culligan and Phillips, CC BY-SA 4.0), 2 809 lemmas, downloaded on 2026-11-04 from `https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv` (SHA-256 `2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44`). The api ships the same list beside the lessons (ADR 036, rule 4; #713).

## Lesson 1

**Theme:** *A day in town*, es *Un día en el pueblo*. The five words name the places and things of an ordinary day, where the player lives, studies, works, pays and eats, not five members of one category (§3.2, `decisions.md` §14.1). Lesson 1 is the first of the 16 chrome lessons (ADR 037): its five words name the town's homes, school, work, money and food.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| home | noun | 161 | This is my home. | This is my ____. | hogar |
| school | noun | 146 | We are at school. | We are at ____. | escuela |
| work | verb | 67 | They work for us. | They ____ for us. | trabajar |
| money | noun | 201 | I do not have much money. | I do not have much ____. | dinero |
| food | noun | 367 | We have food for you. | We have ____ for you. | comida |

All five lemmas lie within the first 1 000; the highest rank is *food*'s, 367.

- **The frame** writes its lemma in the lemma's own form, never inflected, so the gapped form's answer is the lemma itself and the typed answer is compared against it alone (ADR 036, rule 4). No frame holds another word of the lesson, so neither a recognition nor a gapped frame gives a second answer away. Every other word of a frame is a frame word (`grammar.json`), since no lesson comes before lesson 1: this is ADR 037's frame rule, which the content gate checks. *I do not have much money.* is the one frame kept from the first draft; the other four held words no earlier lesson teaches (*new*, *town*, *walk*, *every*, *day*, *big*, *office*, *buy*, *week*) and were rewritten. The cards keep their word ids.
- **The gloss** of *home* is *hogar*, not *casa*: *casa* is the first gloss of *house* (NGSL 1.2 rank 165), and a recall cued by *casa* would ask for either. *Work* is glossed as the verb, *trabajar*, as its frame uses it.
- **Recognition** shows the lemma and its frame, and offers the five glosses as its choices, ordered as rule 3 orders them. **Recall** shows the gloss and the gapped form, and the player types the lemma (ADR 036, rule 2).
- Every frame has no contraction, no number and no proper name, so every token is a form of a headword as the NGSL teaching list lemmatizes it (*is* and *are* of *be*, *my* of *I*, *us* of *we*).

### Every word of every frame

Each word of the five frames, with its NGSL 1.2 rank, the headword its form belongs to, and the lemma whose frame holds it. Every word but the lemmas is a frame word admitted from lesson 1.

| Word | Headword | Rank | Read in |
|---|---|---|---|
| is, are | be | 2 | home, school |
| have | have | 8 | money, food |
| you | you | 10 | food |
| for | for | 12 | work, food |
| they | they | 13 | work |
| not | not | 14 | money |
| we, us | we | 16 | school, work, food |
| this | this | 19 | home |
| I, my | I | 20 | home, money |
| do | do | 21 | money |
| at | at | 23 | school |
| work | work | 67 | work |
| much | much | 91 | money |
| school | school | 146 | school |
| home | home | 161 | home |
| money | money | 201 | money |
| food | food | 367 | food |

### The near-miss against this lesson

Worked against ADR 036, rule 4, each with the NGSL 1.2 list above. *Wok* for *work* (a letter dropped) and *scool* for *school* are near-misses: neither is a headword, and both words have 4 letters or more. *Foot* for *food* (rank 576) and *house* for *home* (rank 165) are headwords, so each is Again with the correct form shown. All five lemmas have 4 letters or more, so every one of them admits a near-miss.

## Lessons 2 to 16

The other fifteen chrome lessons (ADR 037, #741) teach the rest of the closed list of `chrome.md`, 75 words, so the 16 chrome lessons teach its 80 words, lesson 1's five among them. Every lesson teaches 5 card words under one theme, and every theme, which the client shows, uses only frame words and words of the list, and no lesson is a semantic set: the four seasons go to lessons 3, 4, 6 and 8, *material* and *power* to lessons 5 and 7, and the three terrains (*field*, *river*, *hill*) to lessons 11, 9 and 14; the buildings, the three map units (*region*, *area*, *site*) and *start*, *stop* and *end* are spread the same way.

Each frame follows the frame rule as lesson 1's does: its lemma once, in its own form, every other word a frame word or a card word of an earlier lesson (inflected forms included, *homes* in lesson 5, *works* in lesson 8). The order of the lessons is the order that rule allows: *people*, *need* and *go* come in lesson 2 so the later frames can say them. Every frame has no contraction, no number and no proper name. Every definition uses only frame words and band 1 words and never its own lemma (ADR 037, check 5). Every lesson lasts 300 content seconds and needs school level 1, as lesson 1 does, and its skill is the cycle's resource at its position (ADR 039): food at positions 1, 5, 9 and 13, material at 2, 6, 10 and 14, power at 3, 7, 11 and 15, money at 4, 8, 12 and 16.

### Lesson 2

**Theme:** *A town for people*, es *Un pueblo para la gente*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| town | noun | 364 | We have a school in our town. | We have a school in our ____. | pueblo |
| people | noun | 57 | Many people work at the school. | Many ____ work at the school. | gente |
| need | verb | 90 | We need more food. | We ____ more food. | necesitar |
| go | verb | 31 | Do you go to school? | Do you ____ to school? | ir |
| name | noun | 206 | What is your name? | What is your ____? | nombre |

### Lesson 3

**Theme:** *A job in spring*, es *Un trabajo en primavera*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| job | noun | 231 | I have a job at the school. | I have a ____ at the school. | trabajo |
| pay | noun | 220 | The pay for this work is food. | The ____ for this work is food. | pago |
| day | noun | 85 | We work all day. | We work all ____. | día |
| spring | noun | 1332 | People need work in the spring. | People need work in the ____. | primavera |
| full | adjective | 410 | The school is full. | The school is ____. | lleno |

### Lesson 4

**Theme:** *Summer on the farm*, es *Verano en la granja*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| farm | noun | 1083 | We have food from the farm. | We have food from the ____. | granja |
| summer | noun | 654 | We have no school in the summer. | We have no school in the ____. | verano |
| come | verb | 65 | Come to my home. | ____ to my home. | venir |
| worker | noun | 673 | She is a worker at the school. | She is a ____ at the school. | trabajador |
| now | adverb | 70 | I need food now. | I need food ____. | ahora |

### Lesson 5

**Theme:** *Building a home*, es *Construir un hogar*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| build | verb | 221 | They will build homes for the people. | They will ____ homes for the people. | construir |
| material | noun | 571 | We need material for our homes. | We need ____ for our homes. | material |
| cost | noun | 252 | What is the cost of a home? | What is the ____ of a home? | costo |
| wait | verb | 403 | Wait for me at the farm. | ____ for me at the farm. | esperar |
| year | noun | 58 | I go to school all year. | I go to school all ____. | año |

### Lesson 6

**Theme:** *News from the city*, es *Noticias de la ciudad*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| city | noun | 269 | Many people go to the city for work. | Many people go to the ____ for work. | ciudad |
| news | noun | 546 | Do you have any news from town? | Do you have any ____ from town? | noticias |
| read | verb | 207 | Do you read at home? | Do you ____ at home? | leer |
| fall | noun | 320 | We have more food in the fall. | We have more food in the ____. | otoño |
| hour | noun | 247 | I work for an hour a day. | I work for an ____ a day. | hora |

### Lesson 7

**Theme:** *A team for the town*, es *Un equipo para el pueblo*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| power | noun | 331 | We have no power at home. | We have no ____ at home. | energía |
| start | verb | 136 | When do you start work? | When do you ____ work? | empezar |
| team | noun | 407 | We are a team. | We are a ____. | equipo |
| map | noun | 1212 | Do you have a map of the city? | Do you have a ____ of the city? | mapa |
| today | adverb | 246 | We have no school today. | We have no school ____. | hoy |

### Lesson 8

**Theme:** *At the office*, es *En la oficina*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| office | noun | 343 | She works at an office in the city. | She works at an ____ in the city. | oficina |
| hire | verb | 1514 | The farm will hire more people. | The farm will ____ more people. | contratar |
| list | noun | 523 | Is my name on the list? | Is my name on the ____? | lista |
| mayor | noun | 2779 | She is the mayor of our city. | She is the ____ of our city. | alcalde o alcaldesa |
| winter | noun | 1328 | The farm has no work in winter. | The farm has no work in ____. | invierno |

### Lesson 9

**Theme:** *Work by the river*, es *Trabajo junto al río*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| lesson | noun | 1234 | This lesson is about money. | This ____ is about money. | lección |
| earn | verb | 926 | I earn money at the farm. | I ____ money at the farm. | ganar |
| river | noun | 1176 | Our town is on a river. | Our town is on a ____. | río |
| ready | adjective | 774 | Is the food ready? | Is the food ____? | listo |
| station | noun | 709 | She works at the power station. | She works at the power ____. | estación |

### Lesson 10

**Theme:** *Clean-up day*, es *Día de limpieza*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| clean | verb | 842 | We clean the school after work. | We ____ the school after work. | limpiar |
| waste | noun | 1246 | What do you do with your food waste? | What do you do with your food ____? | residuos |
| truck | noun | 2113 | We go to work in a truck. | We go to work in a ____. | camión |
| level | noun | 262 | What level is your team? | What ____ is your team? | nivel |
| tomorrow | adverb | 726 | The mayor will come tomorrow. | The mayor will come ____. | mañana |

### Lesson 11

**Theme:** *Out in the region*, es *Por la región*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| region | noun | 677 | This region has many farms. | This ____ has many farms. | región |
| field | noun | 540 | People work in the field all day. | People work in the ____ all day. | campo |
| way | noun | 80 | Is this the way to the river? | Is this the ____ to the river? | camino |
| back | adverb | 94 | She is back from the city. | She is ____ from the city. | de vuelta |
| stop | verb | 347 | When do you stop work? | When do you ____ work? | parar |

### Lesson 12

**Theme:** *Words to study*, es *Palabras para estudiar*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| study | verb | 187 | I study at home after school. | I ____ at home after school. | estudiar |
| word | noun | 217 | What is this word? | What is this ____? | palabra |
| top | adjective | 375 | This is the top level. | This is the ____ level. | máximo |
| send | verb | 323 | Send the truck to the farm. | ____ the truck to the farm. | enviar |
| size | noun | 705 | What size is your home? | What ____ is your home? | tamaño |

### Lesson 13

**Theme:** *Goals for the year*, es *Metas para el año*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| goal | noun | 856 | My goal is to work at the office. | My ____ is to work at the office. | meta |
| factory | noun | 1530 | Many people work at the factory. | Many people work at the ____. | fábrica |
| learn | verb | 261 | We learn many words at school. | We ____ many words at school. | aprender |
| call | verb | 105 | Call your team to the farm. | ____ your team to the farm. | llamar |
| end | verb | 152 | When does the lesson end? | When does the lesson ____? | terminar |

### Lesson 14

**Theme:** *Ready for winter*, es *Listos para el invierno*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| skill | noun | 685 | She has the skill for this job. | She has the ____ for this job. | habilidad |
| hill | noun | 1670 | Our home is on a hill. | Our home is on a ____. | colina |
| storage | noun | 2707 | Our storage is full of food. | Our ____ is full of food. | almacén |
| due | adjective | 574 | The pay is due today. | The pay is ____ today. | pendiente |
| try | verb | 125 | I will try to read the map. | I will ____ to read the map. | intentar |

### Lesson 15

**Theme:** *The next area*, es *La siguiente zona*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| area | noun | 204 | We have no farms in this area. | We have no farms in this ____. | zona |
| review | noun | 730 | We do a review of the lesson after school. | We do a ____ of the lesson after school. | repaso |
| next | adjective | 151 | What is the next lesson? | What is the ____ lesson? | siguiente |
| tip | noun | 1659 | Do you have a tip for me? | Do you have a ____ for me? | consejo |
| free | adjective | 395 | Are you free today? | Are you ____ today? | libre |

### Lesson 16

**Theme:** *The report*, es *El informe*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| report | noun | 166 | I will read the report at home. | I will read the ____ at home. | informe |
| site | noun | 494 | We will build a factory on this site. | We will build a factory on this ____. | sitio |
| previous | adjective | 922 | My previous home was on a hill. | My ____ home was on a hill. | anterior |
| close | verb | 239 | We close the office at the end of the day. | We ____ the office at the end of the day. | cerrar |
| again | adverb | 175 | Try it again. | Try it ____. | otra vez |

### The glosses that leave `chrome.md`'s Spanish column

`chrome.md`'s Spanish column is the chrome's label; a gloss names the word in the sense its frame and definition use, so five differ, for the owner's review:

- *come* is glossed *venir*; the chrome's *volver* labels *come back*.
- *station* is glossed *estación*; the chrome's *central* labels *power station*.
- *field* and *hill* are glossed in the singular, *campo* and *colina*, as their frames use them; the terrain labels stay *Campos* and *Colinas*.
- *mayor* is glossed *alcalde o alcaldesa*: the gloss is content, never the chrome, which never names the player with a gendered noun (ADR 040).
- *job* is glossed *trabajo*, which is also the first gloss of the noun *work*; lesson 1 glosses *work* as the verb, *trabajar*, so no card asks for both. The owner decides it on the pull request.
