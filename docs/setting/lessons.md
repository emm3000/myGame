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

Each frame follows the frame rule as lesson 1's does: its lemma once, in its own form, every other word a frame word or a card word of an earlier lesson (inflected forms included, *homes* in lesson 5, *works* in lesson 8). The order of the lessons is the order that rule allows: *people*, *need* and *go* come in lesson 2 so the later frames can say them. Every frame has no contraction, no number and no proper name. Every definition uses only frame words and band 1 words and never its own lemma (ADR 037, check 5). Every lesson lasts 300 content seconds and needs school level 1, as lesson 1 does, and its skill raises money by 5 %, as every lesson's does (ADR 045).

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

## Lessons 17 to 26

The first band 1 batch (ADR 037, #742), drafted by Claude Sonnet 5.5. Each lesson holds the lowest-ranked untaught card word of band 1 and four more from the 30 lowest-ranked untaught ones, under one theme, never a semantic set. The skill of each follows from its position (ADR 039). Each frame follows the frame rule; the content gate checks order, frames and glosses. The owner reviews the table of each lesson.

### Lesson 17

**Theme:** *A talk with the mayor*, es *Una charla con el alcalde o la alcaldesa*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| say | verb | 30 | What does the mayor say? | What does the mayor ____? | decir |
| know | verb | 41 | Do you know this word? | Do you ____ this word? | saber |
| good | adjective | 56 | The pay is good. | The pay is ____. | bueno |
| time | noun | 49 | I have no time today. | I have no ____ today. | tiempo |
| new | adjective | 79 | We have a new mayor. | We have a ____ mayor. | nuevo |

### Lesson 18

**Theme:** *My first day*, es *Mi primer día*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| one | adjective | 35 | I have one job. | I have ____ job. | uno |
| get | verb | 43 | You get food at the school. | You ____ food at the school. | recibir |
| take | verb | 59 | Take the truck to the farm. | ____ the truck to the farm. | llevar |
| first | adjective | 78 | This is my first job. | This is my ____ job. | primero |
| thing | noun | 87 | What is this thing? | What is this ____? | cosa |

### Lesson 19

**Theme:** *A day with children*, es *Un día con niños*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| there | adverb | 40 | The farm is over there. | The farm is over ____. | allí |
| child | noun | 102 | Is your child at school? | Is your ____ at school? | niño o niña |
| look | verb | 75 | Look at the map. | ____ at the map. | mirar |
| use | verb | 68 | We use power at the factory. | We ____ power at the factory. | usar |
| last | adjective | 101 | This is the last lesson. | This is the ____ lesson. | último |

### Lesson 20

**Theme:** *The town show*, es *La feria del pueblo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| like | verb | 45 | Do you like your job? | Do you ____ your job? | gustar |
| very | adverb | 63 | The school is very full. | The school is ____ full. | muy |
| make | verb | 48 | We make material at the factory. | We ____ material at the factory. | hacer |
| man | noun | 112 | That man is the mayor. | That ____ is the mayor. | hombre |
| show | verb | 110 | Show me the way. | ____ me the way. | mostrar |

### Lesson 21

**Theme:** *Life in a new place*, es *La vida en un lugar nuevo*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| think | verb | 47 | I think this is the way. | I ____ this is the way. | pensar |
| want | verb | 76 | I want to work at the office. | I ____ to work at the office. | querer |
| life | noun | 111 | Life in the city is good. | ____ in the city is good. | vida |
| place | noun | 114 | This is a good place for a farm. | This is a good ____ for a farm. | lugar |
| only | adverb | 74 | We have only one job. | We have ____ one job. | solo |

### Lesson 22

**Theme:** *Fixing a problem*, es *Resolver un problema*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| see | verb | 50 | Can you see the river? | Can you ____ the river? | ver |
| find | verb | 81 | Can you find the office? | Can you ____ the office? | encontrar |
| change | verb | 113 | Can you change this word? | Can you ____ this word? | cambiar |
| problem | noun | 120 | We have a problem at the factory. | We have a ____ at the factory. | problema |
| right | adjective | 92 | Is this the right way? | Is this the ____ way? | correcto |

### Lesson 23

**Theme:** *Write it well*, es *Escríbelo bien*. **Skill:** power, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| well | adverb | 61 | She works well. | She works ____. | bien |
| tell | verb | 103 | Tell me about your job. | ____ me about your job. | contar |
| mean | verb | 95 | What does this word mean? | What does this word ____? | significar |
| write | verb | 121 | Write your name on the list. | ____ your name on the list. | escribir |
| same | adjective | 122 | We have the same job. | We have the ____ job. | mismo |

### Lesson 24

**Theme:** *A lot of time*, es *Mucho tiempo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| just | adverb | 64 | I just got home from work. | I ____ got home from work. | acabar de |
| how | adverb | 93 | How do you get to the farm? | ____ do you get to the farm? | cómo |
| here | adverb | 98 | Is the mayor here today? | Is the mayor ____ today? | aquí |
| long | adjective | 115 | The day is long. | The day is ____. | largo |
| lot | noun | 123 | We have a lot of food. | We have a ____ of food. | montón |

### Lesson 25

**Theme:** *A company in town*, es *Una empresa en el pueblo*. **Skill:** food, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| then | adverb | 71 | Come to the office, then go home. | Come to the office, ____ go home. | luego |
| company | noun | 107 | I work for a company in the city. | I work for a ____ in the city. | empresa |
| give | verb | 77 | We give food to the people. | We ____ food to the people. | dar |
| really | adverb | 104 | Do you really need more food? | Do you ____ need more food? | de verdad |
| feel | verb | 117 | I feel good today. | I ____ good today. | sentir |

### Lesson 26

**Theme:** *Even more work*, es *Aún más trabajo*. **Skill:** material, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| also | adverb | 72 | I also work at the farm. | I ____ work at the farm. | también |
| even | adverb | 96 | Even the mayor works here. | ____ the mayor works here. | incluso |
| before | adverb | 106 | Have you been here before? | Have you been here ____? | antes |
| too | adverb | 118 | The school is too full. | The school is ____ full. | demasiado |
| still | adverb | 119 | Is the school still full? | Is the school ____ full? | todavía |

## Unit lessons

A **unit lesson** teaches 5 multi-word units under one theme, never a semantic set, and no single word (ADR 044). A unit is a phrasal verb of the PHaVE List (Garnier and Schmitt 2015, source `phave`) taught in that list's most frequent sense, or a phrase of the PHRASE List (Martinez and Schmitt 2012, source `phrase`) that is not a PHaVE phrasal verb. The lists are cited as the evidence that each unit is frequent; the lexicon copies no list text, rank, definition or example, and Townword writes every frame, gloss and definition. Every word of a unit is a frame word or a card word an earlier lesson teaches, no two phrasal verbs of a lesson share their verb, and a unit's definition holds none of its card words. A unit lesson belongs to no band and earns its skill by its position (ADR 039). The content gate checks readiness, size, the shared verb, the spacing of at least 4 band lessons between unit lessons, the frames and the definitions; the owner reviews the order against the lists.

### Lesson 27

**Theme:** *What is new in town*, es *Qué hay de nuevo en el pueblo*. **Skill:** power, 5 %. The first unit lesson, drafted by Claude Opus 5.5 and appended after lesson 26 (#1008). Its units are the most frequent ready ones of each list: the three most frequent ready PHaVE phrasal verbs that share no verb, and the two most frequent ready PHRASE phrases that are not structures of the grammar inventory.

| Unit | Source | Part of speech | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| go on | phave | verb | Things like this go on in many towns. | Things like this ____ ____ in many towns. | pasar | to happen |
| come back | phave | verb | When will the mayor come back from the city? | When will the mayor ____ ____ from the city? | volver | to return to a place |
| find out | phave | verb | Can you find out what time the office closes? | Can you ____ ____ what time the office closes? | averiguar | to learn something that you did not know |
| such as | phrase | adverb | The town needs workers for places such as the farm and the factory. | The town needs workers for places ____ ____ the farm and the factory. | como por ejemplo | for example |
| I mean | phrase | adverb | She is at the school, I mean, at the office. | She is at the school, ____ ____, at the office. | quiero decir | said when you change what you just said, or say it in a clearer way |

- **Readiness.** *go* is taught by lesson 2, *come* by lesson 4, *back* by lesson 11, *find* by lesson 22 and *mean* by lesson 23; *on*, *out* and *I* are frame words admitted at lesson 1, *such* and *as* at lesson 16.
- **Senses.** *go on* is taught as 'happen', *come back* as 'return to a place' and *find out* as 'learn a fact', each its list's most frequent sense. *I mean* is taught as the marker that corrects or restates what was just said, glossed *quiero decir*, which covers both.
- **Part of speech.** The lexicon's part of speech is one of noun, verb, adjective or adverb; *such as* and *I mean* are filed as adverbs, the nearest of the four, since neither is a noun, a verb or an adjective.

## Lessons 28 to 47

The first content batch (ADR 049, #1272), drafted by Claude Opus 5.5. It has 16 band 1 lessons and 4 unit lessons. Lessons 28 to 31, 33 to 36, 38 to 41 and 43 to 46 each hold the lowest-ranked untaught card word of band 1, plus four more from the 30 lowest-ranked untaught ones, under one theme. The first of them holds *through* (108). Lessons 32, 37, 42 and 47 are unit lessons, one after every 4 band lessons. Each teaches the most frequent ready units of the PHaVE List (Garnier and Schmitt 2015) and the PHRASE List (Martinez and Schmitt 2012): three phrasal verbs that share no verb, and two phrases. Every lesson asks for school level 1 and takes 300 s, since ADR 049 sizes nothing past lesson 27. Its skill follows from its position in `curriculum.json`.

The batch also gives each of the 55 entries of lessons 17 to 27 one later frame, written for one of the batch's band lessons (ADR 044).

- **Readiness.** *point out* is ready from lesson 32, because *point* is taught by lesson 31. *of course* is ready from lesson 32 (*course*, lesson 31), *a little* from lesson 37 (*little*, lesson 31), *a few* from lesson 42 (*few*, lesson 39) and *a number of* from lesson 42 (*number*, lesson 30). *set up* is ready from lesson 47 (*set*, lesson 43), *turn out* from lesson 47 (*turn*, lesson 44) and *in fact* from lesson 47 (*fact*, lesson 45). Every other word of a unit is a frame word or a card word taught by lesson 27 or earlier.
- **Senses.** Each phrasal verb is taught in its PHaVE sense of the highest share: *come up* as *come up with*, 'produce an idea'; *go back*, 'return'; *point out*, 'direct attention to'; *come out*, 'leave a place or appear from it'; *go out*, 'leave home for a social event'; *get out*, 'leave a vehicle or a room'; *come in*, 'enter'; *take on*, 'undertake a task'; *give up*, 'stop doing or having'; *set up*, 'establish'; *turn out*, 'prove to be'; *make up*, 'form the whole of'.
- **Part of speech.** The lexicon's part of speech is one of noun, verb, adjective or adverb. So the prepositions *through*, *between* and *around*, and the conjunction *while*, are filed as adverbs. The determiners *both*, *another*, *each*, *few* and *every* are filed as adjectives, and the modals *might* and *must* as verbs. The phrases are filed as adverbs, as in lesson 27.
- **Shared glosses.** *each* and *every* are both glossed *cada*, and *little* and *small* are both glossed *pequeño*. Each pair is taught in two different lessons, so no recognition offers both glosses side by side.

### Lesson 28

**Theme:** *Getting around town*, es *Moverse por el pueblo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| through | adverb | 108 | The truck goes through the city. | The truck goes ____ the city. | a través de | from one side of something to the other side |
| down | adverb | 109 | Go down the hill to the river. | Go ____ the hill to the river. | abajo | to a lower place |
| between | adverb | 116 | The school is between the farm and the river. | The school is ____ the farm and the river. | entre | with one thing on one side and another thing on the other side |
| leave | verb | 126 | When do you leave the office? | When do you ____ the office? | salir de | to go away from a place |
| off | adverb | 150 | The power is off at the factory. | The power is ____ at the factory. | apagado | not on, so it does not work |

### Lesson 29

**Theme:** *Meeting new people*, es *Conocer gente nueva*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| great | adjective | 124 | You did a great job today. | You did a ____ job today. | estupendo | very good |
| meet | verb | 135 | I want you to meet the mayor. | I want you to ____ the mayor. | conocer | to see and talk with someone for the first time |
| talk | verb | 137 | Can we talk after the lesson? | Can we ____ after the lesson? | hablar | to speak with someone |
| ask | verb | 134 | Ask the mayor about the job. | ____ the mayor about the job. | preguntar | to say something because you want to know the answer |
| help | verb | 133 | Can you help me with this? | Can you ____ me with this? | ayudar | to make it easier for someone to do something |

### Lesson 30

**Theme:** *A house of our own*, es *Una casa propia*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| number | noun | 127 | What is the number on the truck? | What is the ____ on the truck? | número | a sign such as 1, 2 or 3 that says how many |
| own | adjective | 129 | I want my own home. | I want my ____ home. | propio | that is yours and not other people's |
| house | noun | 165 | Their house is by the river. | Their ____ is by the river. | casa | a building where a family lives |
| live | verb | 153 | Where do you live? | Where do you ____? | vivir | to have your home in a place |
| old | adjective | 144 | This school is very old. | This school is very ____. | viejo | not new; made a long time ago |

### Lesson 31

**Theme:** *A new course*, es *Un curso nuevo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| both | adjective | 128 | Both of my children go to school. | ____ of my children go to school. | ambos | the 2 of them, one and the other |
| point | verb | 131 | Point to the river on the map. | ____ to the river on the map. | señalar | to show where something is with your hand |
| put | verb | 139 | Put your name on the list. | ____ your name on the list. | poner | to move something to a place |
| course | noun | 164 | The course starts in the fall. | The ____ starts in the fall. | curso | a set of classes about one subject |
| little | adjective | 132 | They live in a little house by the river. | They live in a ____ house by the river. | pequeño | small; not big |

### Lesson 32

**Theme:** *Ideas for the town*, es *Ideas para el pueblo*. **Skill:** money, 5 %. A unit lesson.

| Unit | Source | Part of speech | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| come up | phave | verb | Can you come up with a name for the team? | Can you ____ ____ with a name for the team? | idear | to think of something new, such as a plan |
| go back | phave | verb | I want to go back to my old job. | I want to ____ ____ to my old job. | regresar | to return to a place where you were before |
| point out | phave | verb | Can you point out the problem? | Can you ____ ____ the problem? | hacer notar | to tell someone about something they did not see |
| of course | phrase | adverb | Of course you can come with us. | ____ ____ you can come with us. | por supuesto | a way to say yes, or to say that something is clear |
| so that | phrase | adverb | Tell the mayor so that she can help. | Tell the mayor ____ ____ she can help. | para que | in order to make something possible |

### Lesson 33

**Theme:** *Part of the family*, es *Parte de la familia*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| part | noun | 130 | This is the best part of the job. | This is the best ____ of the job. | parte | some of something, but not all of it |
| family | noun | 172 | My family lives in the city. | My ____ lives in the city. | familia | parents and their children |
| woman | noun | 169 | That woman is the new mayor. | That ____ is the new mayor. | mujer | a person who is not a man or a child |
| another | adjective | 140 | We need another worker at the farm. | We need ____ worker at the farm. | otro | one more; a different one |
| world | noun | 156 | This is the best city in the world. | This is the best city in the ____. | mundo | all the countries and all the people |

### Lesson 34

**Theme:** *A question for you*, es *Una pregunta para ti*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| something | noun | 138 | I want to tell you something. | I want to tell you ____. | algo | a thing, when you do not say which one |
| week | noun | 157 | I start a new job next week. | I start a new job next ____. | semana | a time of 7 days |
| late | adjective | 147 | It is late, so I will go home. | It is ____, so I will go home. | tarde | near the end of the day or the night |
| why | adverb | 154 | Why do you want this job? | ____ do you want this job? | por qué | for what reason |
| question | noun | 181 | Can I ask you a question? | Can I ask you a ____? | pregunta | what you say when you want to know something |

### Lesson 35

**Theme:** *A different country*, es *Un país diferente*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| become | verb | 141 | He will become the next mayor. | He will ____ the next mayor. | llegar a ser | to start to be |
| country | noun | 143 | What country are you from? | What ____ are you from? | país | a land with its own people and government |
| different | adjective | 149 | This city is very different from my town. | This city is very ____ from my town. | diferente | not the same |
| never | adverb | 162 | I have never been to the city. | I have ____ been to the city. | nunca | not at any time |
| always | adverb | 183 | She is always at the office. | She is ____ at the office. | siempre | at all times; every time |

### Lesson 36

**Theme:** *Free time*, es *Tiempo libre*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| interest | noun | 142 | She has no interest in the job. | She has no ____ in the job. | interés | the feeling of wanting to know more about something |
| play | verb | 158 | The children play by the river. | The children ____ by the river. | jugar | to do something because you like it, not for work |
| book | noun | 171 | I want to read this book. | I want to read this ____. | libro | a set of pages with words that you read |
| hear | verb | 178 | Can you hear me? | Can you ____ me? | oír | to know that there is a sound |
| big | adjective | 184 | We need a big truck for this job. | We need a ____ truck for this job. | grande | large; not small |

### Lesson 37

**Theme:** *A night out*, es *Una salida de noche*. **Skill:** money, 5 %. A unit lesson.

| Unit | Source | Part of speech | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| come out | phave | verb | When will she come out of the office? | When will she ____ ____ of the office? | salir | to leave a place and be seen |
| go out | phave | verb | Do you want to go out after the lesson? | Do you want to ____ ____ after the lesson? | salir a divertirse | to leave home to meet people or have a good time |
| get out | phave | verb | Get out of the truck here. | ____ ____ of the truck here. | bajarse | to leave a car or a room |
| a little | phrase | adverb | Can you wait a little longer? | Can you wait ____ ____ longer? | un poco | not much, but some |
| as well as | phrase | adverb | She works at the farm as well as the factory. | She works at the farm ____ ____ ____ the factory. | además de | and also |

### Lesson 38

**Theme:** *Small groups*, es *Grupos pequeños*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| each | adjective | 145 | Each worker has a job. | ____ worker has a job. | cada | every one, seen one by one |
| early | adverb | 197 | I want to go home early today. | I want to go home ____ today. | temprano | before the normal time |
| small | adjective | 186 | We have a small team. | We have a ____ team. | pequeño | not large; little |
| group | noun | 167 | A group of workers is at the station. | A ____ of workers is at the station. | grupo | some people or things together |
| keep | verb | 177 | You can keep the map. | You can ____ the map. | quedarse con | to have something and not give it back |

### Lesson 39

**Theme:** *A friend in town*, es *Un amigo en el pueblo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| high | adjective | 148 | The hill is very high. | The hill is very ____. | alto | far up from the ground |
| friend | noun | 208 | She is my best friend. | She is my best ____. | amigo o amiga | a person you know well and like |
| few | adjective | 195 | Few people live here. | ____ people live here. | pocos | not many |
| every | adjective | 180 | I go to school every day. | I go to school ____ day. | cada | each one of all |
| let | verb | 174 | Let me help you. | ____ me help you. | dejar | to say that someone can do something |

### Lesson 40

**Theme:** *Moving house*, es *La mudanza*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| while | adverb | 155 | I read while I wait. | I read ____ I wait. | mientras | at the same time as |
| move | verb | 200 | We want to move to the city. | We want to ____ to the city. | mudarse | to go to live in a new place |
| bring | verb | 196 | Can you bring food to the farm? | Can you ____ food to the farm? | traer | to come to a place with something |
| around | adverb | 170 | We have farms all around the town. | We have farms all ____ the town. | alrededor de | on every side of something |
| month | noun | 209 | I will be in the city for a month. | I will be in the city for a ____. | mes | one of the 12 parts of a year |

### Lesson 41

**Theme:** *An important business*, es *Un negocio importante*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| might | verb | 159 | The mayor might come today. | The mayor ____ come today. | puede que | a word that says something is possible but not sure |
| must | verb | 160 | You must stop here. | You ____ stop here. | deber | to have to do something |
| important | adjective | 190 | This is an important job. | This is an ____ job. | importante | that matters a lot |
| open | adjective | 214 | The office is open today. | The office is ____ today. | abierto | ready for people to come in |
| business | noun | 211 | She has her own business in town. | She has her own ____ in town. | negocio | a company that makes or sells things |

### Lesson 42

**Theme:** *Taking on a new job*, es *Asumir un trabajo nuevo*. **Skill:** money, 5 %. A unit lesson.

| Unit | Source | Part of speech | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| come in | phave | verb | You can come in now. | You can ____ ____ now. | entrar | to go into a room or a building |
| take on | phave | verb | I want to take on a bigger job. | I want to ____ ____ a bigger job. | asumir | to agree to do a job or to deal with a problem |
| give up | phave | verb | She does not want to give up her job. | She does not want to ____ ____ her job. | abandonar | to stop doing or having something |
| a few | phrase | adverb | I have a few friends in town. | I have ____ ____ friends in town. | unos cuantos | a small number of; some |
| a number of | phrase | adverb | A number of workers came to the office. | ____ ____ ____ workers came to the office. | varios | some; more than 2 |

### Lesson 43

**Theme:** *A new goal*, es *Una meta nueva*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| include | verb | 163 | The pay does not include food. | The pay does not ____ food. | incluir | to have something as one part of the whole |
| begin | verb | 189 | When does the course begin? | When does the course ____? | comenzar | to start |
| follow | verb | 188 | Follow me to the office. | ____ me to the office. | seguir | to go after someone |
| hand | noun | 198 | I have a map in my hand. | I have a map in my ____. | mano | the part of the body at the end of your arm |
| set | verb | 185 | We set a new goal for the year. | We ____ a new goal for the year. | fijar | to decide what something will be |

### Lesson 44

**Theme:** *The town plan*, es *El plan del pueblo*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| case | noun | 168 | In that case, we will wait. | In that ____, we will wait. | caso | a time when something happens |
| run | verb | 192 | The children run to school. | The children ____ to school. | correr | to move fast on your feet |
| government | noun | 216 | The government will build a new station. | The ____ will build a new station. | gobierno | the people who control a country |
| plan | noun | 232 | What is the plan for today? | What is the ____ for today? | plan | an idea of what you will do |
| turn | verb | 194 | Turn here for the farm. | ____ here for the farm. | girar | to change the way you are going |

### Lesson 45

**Theme:** *Facts and news*, es *Hechos y noticias*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| seem | verb | 173 | It does not seem right. | It does not ____ right. | parecer | to look like something is true |
| fact | noun | 202 | The fact is, we need more workers. | The ____ is, we need more workers. | hecho | something that is true |
| information | noun | 213 | We need more information about the job. | We need more ____ about the job. | información | facts about something |
| happen | verb | 236 | What will happen to the farm? | What will ____ to the farm? | ocurrir | to take place |
| believe | verb | 225 | I believe you. | I ____ you. | creer | to think that something is true |

### Lesson 46

**Theme:** *At the market*, es *En el mercado*. **Skill:** money, 5 %.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| kind | noun | 176 | What kind of food do you like? | What ____ of food do you like? | tipo | a group of things that are the same in some way |
| market | noun | 219 | We go to the market every week. | We go to the ____ every week. | mercado | a place where people buy and sell things |
| buy | verb | 242 | I want to buy a house. | I want to ____ a house. | comprar | to get something by paying money for it |
| love | verb | 229 | I love this town. | I ____ this town. | encantar | to like something very much |
| away | adverb | 234 | She is away this week. | She is ____ this week. | fuera | not here; in another place |

### Lesson 47

**Theme:** *A new team*, es *Un equipo nuevo*. **Skill:** money, 5 %. A unit lesson.

| Unit | Source | Part of speech | Frame | Gapped form | es gloss | Definition |
|---|---|---|---|---|---|---|
| set up | phave | verb | We want to set up a business in town. | We want to ____ ____ a business in town. | crear | to start something new, such as a company |
| turn out | phave | verb | It might turn out to be a problem. | It might ____ ____ to be a problem. | resultar | to be shown in the end to be something |
| make up | phave | verb | Workers from the city make up most of the team. | Workers from the city ____ ____ most of the team. | formar | to be all the parts of a whole |
| in fact | phrase | adverb | It is not a small town; in fact, it is a city. | It is not a small town; ____ ____, it is a city. | de hecho | a way to say that something is true, often more than you think |
| at all | phrase | adverb | I do not like it at all. | I do not like it ____ ____. | para nada | in any way |

