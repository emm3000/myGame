# Names the player reads

Status: accepted by the author on 2026-09-22, except the lines marked as a proposal: the build queue, the library, the arts, the chronicle, the map, the account, the seasons, the army, the marches and the bandit camps. The Spanish labels below are the words a player sees; the English term stays the identifier in code and in `CONTEXT.md`.

## Resources

| Term | Label | Note |
|---|---|---|
| wood | madera | timber from the pine and oak stands |
| stone | piedra | cut in the upland quarries |
| iron | hierro | smelted from the ridge ores |
| gold | oro | tolls, tithes and trade; never dug |
| food | comida | what the farms bring in and the peasants eat |
| peasants | campesinos | the hands of the fief; shown as free of supplied |

## Buildings

| Term | Label |
|---|---|
| sawmill | aserradero |
| quarry | cantera |
| iron mine | mina de hierro |
| farm | granja |
| warehouse | almacén |
| library | biblioteca |
| barracks | cuartel |

The *biblioteca* row (`arts.md`) and the *cuartel* row (The army, below) are proposals for the author, not yet accepted.

## The fief

- A **fief** is a *feudo*. The screen title is the name the player gave the fief when founding it, unchanged.
- The **build slot** is *la obra*: a busy slot has *una obra en marcha*; a free slot *no tiene obra*.
- The **build queue** is *las obras en espera*: the upgrades waiting behind *la obra en marcha*, listed in order. Proposal for the author, not yet accepted.
- A **level** is *nivel*; a building at level 3 reads *nivel 3*.
- The **buildings section** of the fief screen, the one that holds the building cards, is titled *Edificios*, as shipped. Proposal for the author, not yet accepted; the seasons section and the army section below rely on it.

## The arts

Every line of this section is a proposal for the author, not yet accepted (`arts.md`).

| Term | Label | Note |
|---|---|---|
| smithing | herrería | the art of ore and fire; raises the iron rate |
| masonry | cantería | the art of cut stone; raises the stone rate. *Cantería* is the craft, *cantera* the quarry it is worked in |

- A **study** is *un estudio*. The button that starts one reads *Estudiar*, with the art after it where the card needs it: *Estudiar herrería*.
- The **study slot** is *el estudio*, in the register of *la obra*: a busy slot has *un estudio en marcha*; an idle slot reads *La biblioteca no tiene estudio en marcha.*
- Cancelling the study in progress reads *Cancelar el estudio*.
- The **arts section** of the fief screen is titled *Biblioteca*: the library's label, capitalised as a title, since the section shows the library's work. It sits below *Edificios* and is shown from library level 1.
- An art's **level** is *nivel*, as for buildings: an art at level 2 reads *nivel 2*; an art no one has studied yet reads *sin estudiar*.

## The chronicle

Every line of this section is a proposal for the author, not yet accepted (`chronicle.md`).

- The **chronicle** is *la crónica*. The screen that shows it is titled *Crónica*.
- The **navigation** labels of the signed-in screens, *Crónica* among them, are listed under The map, below.
- An **event** is one line of the chronicle: a heading names what ended, then a colon, the building or art label and the level, in the register of *Cancelar la obra: aserradero, nivel 3*. The label follows the colon, so no sentence needs its article: *Obra terminada: aserradero, nivel 3* and *Obra terminada: cantera, nivel 2* read the same way, and a later label of either gender fits without a change.

| Event | Sentence | Slots |
|---|---|---|
| upgradeFinished | *Obra terminada: aserradero, nivel 3.* | the building label, the level reached |
| artLearned | *Estudio terminado: herrería, nivel 2.* | the art label, the level reached |
| upgradeCancelled | *Obra cancelada: aserradero, nivel 3. Recuperas 120 de madera y 80 de piedra.* | the building label, the level cancelled, the refunded amounts |
| studyCancelled | *Estudio cancelado: herrería, nivel 2. Recuperas 60 de hierro y 20 de oro.* | the art label, the level cancelled, the refunded amounts |
| recruitsDelivered | *Leva terminada: 12 infantes.* | the count delivered, the unit label agreeing with it |
| recruitsCancelled | *Leva cancelada: 4 infantes en filas, 8 infantes de vuelta al campo. Recuperas 160 de madera, 80 de hierro y 240 de comida.* | the units delivered, the units cancelled, the unit label agreeing with each count, the refunded amounts |
| marchReturned | *Marcha terminada: provincia 2, parcela 7, 12 infantes. Recibes 72 de madera y 72 de piedra.* | the province, the plot, the party that went, each unit label agreeing with its count (S16, below), the loot |
| marchReturned, recalled | *Marcha retirada: provincia 2, parcela 7, 12 infantes. Recibes 18 de madera y 18 de piedra.* | the same; the loot is what the hours foraged gave, and a march recalled on the way out has none, so its line ends at the count: *Marcha retirada: provincia 2, parcela 7, 12 infantes.* |
| battleFought, won | *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 3 infantes y los bandidos pierden 6 de fuerza.* | the province, the plot, the camp's tier, the units lost by kind, each unit label agreeing with its count (S16, below), the strength the camp lost |
| battleFought, lost | *Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 12 infantes y los bandidos pierden 10 de fuerza.* | the same |
| marchReturned, both kinds (S16) | *Marcha terminada: provincia 2, parcela 7, 12 infantes y 6 jinetes. Recibes 108 de madera y 108 de piedra.* | the same as marchReturned; a kind at 0 is left out |
| battleFought, won, both kinds lost (S16) | *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 2 infantes y 2 jinetes, y los bandidos pierden 6 de fuerza.* | the same as battleFought; a kind that lost no one is left out |
| battleFought, lost, riders alone (S16) | *Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 7 jinetes y los bandidos pierden 14 de fuerza.* | the same |

- The **recruits delivered** line (S10, #209) is a proposal for the author, not yet accepted, as the rows above are: the heading *Leva terminada:*, then the count delivered and the unit label agreeing with it, in the register of *Obra terminada: aserradero, nivel 3*. One unit reads *Leva terminada: 1 infante.*; no level, no refund. One line per order, dated by the last unit's arrival (`chronicle.md`). The unit labels are in The army, below.
- The **recruits cancelled** line (S11, #231) is a proposal for the author, not yet accepted: the heading *Leva cancelada:*, then the units delivered with *en filas*, a comma, the units cancelled with *de vuelta al campo*, and the refunded amounts as the *Recuperas* sentence of the two cancels above, in the register of *Estudio cancelado: herrería, nivel 2. Recuperas 60 de hierro y 20 de oro.* Each count carries the unit label agreeing with it, as The army says: 1 singular, every other count plural, 0 included. *En filas* and *de vuelta al campo* have one form for either gender and number, so the line needs only the unit's plural and singular. A cancel before the first delivery reads *Leva cancelada: 0 infantes en filas, 12 infantes de vuelta al campo. Recuperas 240 de madera, 120 de hierro y 360 de comida.*; one after the last but one reads *Leva cancelada: 11 infantes en filas, 1 infante de vuelta al campo. Recuperas 20 de madera, 10 de hierro y 30 de comida.* The units cancelled are never 0: a levy already complete is refused, never cancelled (The army, `RecruitOrderNotFound`). No level. One line per order, dated by the cancel (`chronicle.md`).

- The **march returned** line (S13, #255) is a proposal for the author, not yet accepted: the heading *Marcha terminada:*, in the register of *Obra terminada:* and *Leva terminada:*, since what ended is the march; then the plot as the map reads it, *provincia 2, parcela 7*, a comma, the infantry that went with the unit label agreeing with the count, as The army says, and a full stop; then the loot as a second sentence, *Recibes* and the amounts as the *Recuperas* sentence of the two cancels reads them, in the order of the Resources table. *Recibes* addresses the lord as *Recuperas* does, so the sentence needs neither the unit's gender nor its number: a march of one reads *Marcha terminada: provincia 2, parcela 7, 1 infante. Recibes 6 de madera y 6 de piedra.* The plot comes before the count because the roll answers *from where* first, as the foreman's tally does. With the content's rates a march never comes back empty unless it is recalled on the way out (S14, below); should content ever give a terrain nothing, or a recall bring nothing, the *Recibes* sentence is left out, as a resource the refund does not hold is. One line per march, dated by the return (`chronicle.md`).
- The **march recalled** line (S14, #277) is a proposal for the author, not yet accepted: the same event, `marchReturned` with `recalled`, under a heading of its own, *Marcha retirada:*, in the register of *Leva cancelada:* and *Obra cancelada:*, the participle of the button's verb, *Retirar la marcha*, as *Leva cancelada* follows *Cancelar la leva* (The marches, below); then the plot, the infantry with the unit label agreeing with the count, and the *Recibes* sentence, as the row above reads them. The heading is not *Marcha cancelada*: nothing was undone, the men went and came back, and a reader who sees *Leva cancelada* and *Marcha retirada* on one roll reads two different things. A march turned back on the road brings nothing, so its line leaves the *Recibes* sentence out, as the rule above already says, and ends at the count with a full stop: *Marcha retirada: provincia 2, parcela 7, 12 infantes.* The lord who reads it knows the men came home with their hands empty, since the line says where they were sent and lists nothing. A march of one recalled at the plot after half an hour reads *Marcha retirada: provincia 2, parcela 7, 1 infante. Recibes 1 de madera y 1 de piedra.* Dated by the return, never by the recall, where the levy's cancel is dated by the cancel (`chronicle.md`). The worked amounts are in The marches, below.
- The **battle line** (S15, #292) is a proposal for the author, not yet accepted: the event `battleFought`, under one of two headings by its `won`, *Batalla ganada:* or *Batalla perdida:*, in the register of *Marcha terminada:* and *Leva cancelada:*, the participle agreeing with *batalla*; then the plot as the map reads it, a comma, the camp by its tier, *campamento de nivel 1*, since the roll names the thing fought as *Obra terminada* names the building, and a full stop; then the losses as a second sentence: *Pierdes*, addressing the lord as *Recibes* and *Recuperas* do, the infantry lost (`infantryLost`) with the unit label agreeing with the count, *y los bandidos pierden*, the strength the camp lost (`campLost`) and *de fuerza*, in the shape of *120 de madera*: strength is counted in points and needs no label of its own. Both counts are written even at zero, *Pierdes 0 infantes y los bandidos pierden 0 de fuerza.*, since a battle with no loss on one side is still a battle and the lord reads the price, where a *Recibes* sentence with nothing to list is left out. One line per battle, dated by the arrival, the hour of the fight (`chronicle.md`). A won attack still writes its *Marcha terminada:* line at the return, with the survivors as its count and the loot with its gold, the first gold a march brings: *Marcha terminada: provincia 2, parcela 7, 9 infantes. Recibes 120 de madera, 120 de piedra y 120 de oro.* The roll reads the return first, its ink fresher, and the battle under it. A lost attack writes the battle line alone: no one returns to be counted. A camp beaten while at *fuerza 0* writes *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 0 infantes y los bandidos pierden 0 de fuerza.* and, at the return, *Marcha terminada: provincia 2, parcela 7, 12 infantes.* with no *Recibes* sentence, as the rule above reads a march that brings nothing. The worked battles are in The marches, below.
- The **party on the roll** (S16, #343) is a proposal for the author, not yet accepted: a march may take riders beside the infantry (The army, below), so the two march lines read the party that went (`units`) and the two battle lines the units that fell (`unitsLost`, in place of `infantryLost`), each a count per kind where the rows above hold one infantry count, written as the party phrase (The army): every kind with its count and its label agreeing, in the order of the unit table, joined as the amounts are, a kind at 0 left out. The headings, the plot, the camp and the *Recibes* sentence stay as the rows above read them, and a line of infantry alone reads as it did, letter for letter. A march of both kinds reads *Marcha terminada: provincia 2, parcela 7, 12 infantes y 6 jinetes. Recibes 108 de madera y 108 de piedra.*, one of riders alone *Marcha terminada: provincia 2, parcela 7, 6 jinetes. Recibes 36 de madera y 36 de piedra.*, and the first recalled on the road *Marcha retirada: provincia 2, parcela 7, 12 infantes y 6 jinetes.* A battle names the kinds that lost someone. Twelve infantry and six riders who lose ten infantry and no rider read *Batalla ganada: provincia 2, parcela 7, campamento de nivel 2. Pierdes 10 infantes y los bandidos pierden 15 de fuerza.*, and their return *Marcha terminada: provincia 2, parcela 7, 2 infantes y 6 jinetes. Recibes 272 de madera, 272 de piedra y 272 de oro.*, the survivors as its party. When both kinds fall the losses take a comma before the second *y*, which a Spanish list that already holds a *y* wants and a single kind does not: *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 2 infantes y 2 jinetes, y los bandidos pierden 6 de fuerza.* Seven riders who all fall read *Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 7 jinetes y los bandidos pierden 14 de fuerza.* When no one fell, which only a camp at *fuerza 0* gives, the sentence keeps its shape with the first kind of the table at zero, *Pierdes 0 infantes y los bandidos pierden 0 de fuerza.*, whatever the party was: the battle's event keeps the fallen, never the sent, and the return line above it on the roll names who went. The worked numbers are in The marches, below.
- The **refunded amounts** read as *Te faltan* does on the fief screen: each as its quantity, *de* and the resource label, in the order of the Resources table, joined as a Spanish list (*120 de madera, 80 de piedra y 20 de oro*). A resource the refund does not hold is left out.
- The **instant** each line carries is shown as the design decides (#133); it is not a lore name.
- An **empty chronicle** reads *La crónica está en blanco: aún no hay nada que contar.*

## The first kingdom

Kingdoms are named by their landmark; provinces and plots are numbered (`world.md`, The land). The first kingdom is **Vadoalto**, named for the high ford where the old crown road crossed the river. The House of the Ford holds its toll bridges.

A fief's address is shown as the kingdom's name followed by province and plot: `Vadoalto 3:12`. Stored coordinates stay `kingdom:province:plot` with the kingdom as a number; the name is a label for kingdom `1`, and every later kingdom adds one line here before it opens.

## The map

Every line of this section is a proposal for the author, not yet accepted (`world.md`, The land). The English identifiers `map`, `province`, `plot`, `lastProvince`, `lowlands`, `uplands`, `ridges`, `isOwn` and `ProvinceNotFound` are fixed by the S2 tickets (#142); only the Spanish is proposed here.

- The **kingdom map** is *el mapa*; when the kingdom must be named, *el mapa de Vadoalto*. The screen that shows it is titled *Mapa*.
- The **navigation** of the signed-in screens has three labels, as #128 and #142 name them: *Feudo* for the fief screen, *Mapa* for the kingdom map and *Crónica* for the chronicle.
- A **province** is *la provincia*; a numbered one reads *provincia 3*, as *nivel 3* does, so it needs no article. The **province heading** puts the kingdom's name first, as the address does, then a comma and the province: *Vadoalto, provincia 3*.
- A **plot** is *la parcela*; a numbered one reads *parcela 12*. A plot's line names the plot, then a colon, then what stands on it, in the register of *Obra terminada: aserradero, nivel 3*, so no line needs its article: a held plot reads *Parcela 12: Sotoverde*, with the fief's name as its lord gave it, unchanged.
- The **terrain** is *el terreno*, and a province's terrain reads after a colon in the same shape: *Terreno: vega*. One label per terrain:

| Term | Label | Article | Note |
|---|---|---|---|
| lowlands | vega | la vega | the river plain; food and wood |
| uplands | páramo | el páramo | the high plateau, bare on top, scrub oak in its gullies; stone from its quarries, wood and stone to a forager |
| ridges | riscos | los riscos | the iron crags; the only label in the plural |

- The *páramo* note (S13, #255) is a proposal for the author, not yet accepted: a *páramo* is bare by its name, and the terrain gives a fief stone alone, so the wood a forager brings back from it is the scrub of its gullies, never a stand a sawmill would cut (`world.md`, The land). The label stays *páramo*.

- A **free plot** (`fief` null on the wire) reads *Parcela 7: libre*; *libre* agrees with *parcela* and needs no article.
- The **bandits** (S15, #292) are *los bandidos*, and their **camp** *el campamento*; where a line must say whose, *un campamento de bandidos*. The English identifiers `camp`, `tier` and `strength` are fixed by the S15 tickets (#292); only the Spanish is proposed here, as every line of this section is. A camp's **tier** is *el nivel*, as a building's is, and reads *nivel 2*, since the map reads one register for the size of everything on it, though a camp's tier never rises. A camp's **strength** is *la fuerza*; a camp at 15 reads *fuerza 15*, as *nivel 3* does, so it needs no article; it is the strength at the hour of the read, grown back since the last fight (`world.md`, The land).
- The **plot line of a camp** names the plot, then a colon, then the camp, its tier and its strength, in the register of *Parcela 12: Sotoverde* and *Obra terminada: aserradero, nivel 3*: *Parcela 7: campamento de bandidos, nivel 2, fuerza 15*. Slots: the plot, the tier, the strength. The plot is not *libre* on its line, though no lord holds it: the line says what stands on the plot, and what stands there is the camp; the founding still takes it as a free plot, and a fief founded on it erases the camp (`world.md`, The land). A camp beaten to nothing reads *fuerza 0* until it grows back. Whether the design shortens the line to a mark and the two numbers is the design's call (#295); the spoken form is the line.
- The **player's own fief** (`isOwn`) is highlighted by the design, and its line carries the marker *Tu feudo* after the name, so the mark is read, not only seen: *Parcela 12: Sotoverde · Tu feudo*, with the separator the design chooses (#146).
- The **browsing controls** read *Provincia anterior*, *Provincia siguiente* and *Ir a la provincia*, the last one next to a field that takes the number, in the register of *Cancelar la obra*.
- The **last province** (`lastProvince`) needs no label: it is the province after which *Provincia siguiente* is not offered. A province beyond it, or below 1 (`ProvinceNotFound`), reads *Esa provincia no está en el mapa. Vuelve a la tuya.*, and a link under it reads *Ir a tu provincia*, in the register of *Ir a la provincia*, and opens the province of the player's own fief.

## The account

Every line of this section is a proposal for the author, not yet accepted, except the shipped lines of the first table. The English identifiers `verify`, `reset`, `emailVerified`, `TokenInvalid`, `MailNotSent`, `Mailer`, `Mail` and `accountTokens` are fixed by the S7 tickets (#157); only the Spanish is proposed here.

The **sign-in and sign-up** lines shipped before this section and are recorded here unchanged, so the lines below sit beside them in one register:

| Screen | Line | Note |
|---|---|---|
| both | *Correo*, *Contraseña* | the two field labels |
| both | *Escribe un correo válido, como nombre@ejemplo.com.* | a malformed email, refused before any request |
| sign-in | *Entra en tu feudo*, *Entrar* | the title and the submit |
| sign-in | *¿Aún no tienes feudo?* *Crea tu cuenta* | the switch to sign-up |
| sign-up | *Funda tu feudo*, *Nombre de tu feudo*, *Crear cuenta* | the title, the fief name field and the submit |
| sign-up | *Al menos 8 caracteres.* | the password hint |
| sign-up | *¿Ya tienes cuenta?* *Entra* | the switch to sign-in |

### The mails

- The **sender name** the mails carry (`MAIL_FROM`) is *myGame*, as the shell title reads until the lore names the game. The address after it is the deployment's, not a lore name.
- Mails are plain text, addressed as tú, and each one carries the link on a line of its own so it survives any mail reader. Each names its lifetime in words that agree with the number, so the copy holds *24 horas* and *una hora* as phrases, never a bare count.
- The **verification mail** (kind `verify`), sent at sign-up and again on each resend:

  Subject: *Confirma tu correo*

  ```
  Confirma que este correo es el de tu feudo abriendo este enlace:

  <enlace>

  El enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.

  Si no has fundado ningún feudo, ignora este correo.
  ```

  Slots: the link (`<WEB_URL>/verify-email?token=…`) and the lifetime (*24 horas*).

- The **reset mail** (kind `reset`), sent only to a verified email that has an account:

  Subject: *Cambia tu contraseña*

  ```
  Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:

  <enlace>

  El enlace vale una hora y una sola vez.

  Si no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.
  ```

  Slots: the link (`<WEB_URL>/reset-password?token=…`) and the lifetime (*una hora*). The last line is for a reader who asked for nothing.

### The banner

Shown in the signed-in shell while the email is unverified (`emailVerified` false), gone once it is.

- The **banner's line**: *Aún no has confirmado tu correo. Sin confirmarlo no podrás recuperar tu contraseña.*
- The **resend button**: *Enviar otro enlace*, in the register of *Cancelar la obra*.
- The **line after a resend**: *Te hemos enviado otro enlace. Búscalo en tu correo: vale 24 horas.*
- The **`MailNotSent` refusal**, a resend the server could not deliver, in the register of the *Unexpected* line: *No hemos podido enviar el correo. Vuelve a intentarlo en un momento.*

### The verify screen

The landing of the mailed link, outside the signed-in shell.

- The **verifying line**, in the register of *Estamos leyendo tu feudo…*: *Estamos confirmando tu correo…*
- The **verified line**: *Tu correo queda confirmado.* Under it, the link to the fief reads *Ir a tu feudo*, in the register of *Ir a la provincia*.
- The **`TokenInvalid` refusal**, one line for a link that expired, was used or was never sent, shared by the verify and the new password screens: *Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.*

### The reset

- The **sign-in link** to the reset request, under the form: *¿Has olvidado tu contraseña?*
- The **reset request screen**: title *Recupera tu contraseña*; the email field is the shipped *Correo*; submit *Enviar enlace*.
- Its **confirmation line**, the same whatever the email: *Si ese correo tiene un feudo y está confirmado, te llegará un enlace que vale una hora.* It reads true whether or not the email has an account, and promises no mail.
- The **new password screen**: title *Elige una contraseña nueva*; field *Contraseña nueva*; hint the shipped *Al menos 8 caracteres.*; submit *Cambiar la contraseña*.
- Its **success line**: *Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.* Under it, the link to sign in reads *Entra en tu feudo*, the sign-in title.
- Under its **`TokenInvalid` refusal**, the way to ask for a new link reads *Pedir otro enlace* and leads to the reset request.

## The seasons

Every line of this section is a proposal for the author, not yet accepted (`world.md`, Seasons). The English identifiers `spring`, `summer`, `autumn`, `winter`, `season`, `year`, `endsAt` and `multiplierPercent` are fixed by the S8 tickets (#182), `durationPercent`, `build` and `study` by the S9 tickets (#198), and `train` by the S12 tickets (#246); only the Spanish is proposed here.

- A **season** is *la estación*. The four turn together over the whole land, seven days each, spring first, and no screen names one by *estación*: the season's own label carries it.

| Term | Label | Article | Note |
|---|---|---|---|
| spring | primavera | la primavera | raises the harvest: food; shortens training |
| summer | verano | el verano | shortens building |
| autumn | otoño | el otoño | favours trade: gold |
| winter | invierno | el invierno | lowers the harvest: food; shortens study |

- A season's label is written in lower case, as *vega* and *herrería* are, and capitalised only as the first word of a line.
- The **year** is *el año*; a numbered one reads *año 1*, as *nivel 3* and *provincia 3* do, so it needs no article. Years are counted from the first spring; there is no named calendar and no era.
- The **header line** puts the season first, then a comma and the year, in the register of *Vadoalto, provincia 3*: *Otoño, año 1*. It sits in the fief header; where, and whether it shares a line with the countdown, is the design's call (#185).
- The **countdown line** to the next season reads the next season's label, *en* and the time left, in the register of *Sube a nivel 3*: *Invierno en 3 días*. Slots: the next season (the label of the season after the one in force; after winter, spring of the next year) and the time left until `endsAt`, formatted as the design decides (#185): days, or hours as `formatDuration` reads today, when seven days would read *168 h*. The unit is not a lore name.
- The **mark** on the resource bar, on the one resource the season changes, reads the season in force, a colon, the signed percent, *de* and the resource label, as the arts' rate line *+25 % de hierro / h* reads:

| Rate | Mark | Slots |
|---|---|---|
| lowered | *Invierno: -25 % de comida* | the resource label, the percent |
| raised | *Otoño: +25 % de oro* | the resource label, the percent |

- The **percent** in the mark is the change from the neutral rate, a whole number: a `multiplierPercent` of `75` reads *-25 %*, one of `125` reads *+25 %*. A resource at `100` is not marked. The sign is the ASCII hyphen-minus and plus, as `copy.ts` writes `+${percent} %` for the arts; no typographic minus. The mark carries no *por hora*: the rate line beside it already reads */ h*.
- Where the design keeps the mark to a sign and an icon (#185), its **spoken form**, the accessible name, says the same in words: a lowered rate *El invierno reduce la comida un 25 %.*, a raised rate *El otoño sube el oro un 25 %.* This sentence needs the resource's article, which the Resources table does not carry: *la madera*, *la piedra*, *el hierro*, *el oro*, *la comida*.
- **Before the calendar starts** (`season` null on the wire) the header shows no season line and no countdown, and the bar marks nothing; no line reads *sin estación*.
- **Summer** changes no rate, so the bar marks nothing in summer; the header still reads *Verano, año 1* and the countdown still runs to autumn.
- The **mark on a section header** (S9, #198), on the section whose work the season shortens, is a full sentence with no percent: the season in force with its article from the table, *acorta* and the work, in the register of the spoken form above:

| Section | Mark | Slots |
|---|---|---|
| the buildings, *Edificios* | *El verano acorta las obras* | the season with its article, the work: *las obras* |
| the arts, *Biblioteca* | *El invierno acorta los estudios* | the season with its article, the work: *los estudios* |
| the army, *Cuartel* (S12, #246) | *La primavera acorta la leva* | the season with its article, the work: *la leva* |

- The work of the two S9 rows is named in the plural of *la obra* and *el estudio*, so the sentence covers every card of the section; the shortened duration itself is read on each card's button, as it is today. The sentence needs the season's article, which the table carries, and no resource.
- The **army row** (S12, #246) is a proposal for the author, not yet accepted, as the two rows above are. Its work reads in the singular, *la leva*, where the S9 marks read *las obras* and *los estudios*: those sections hold one card per building or art, so their plural covers every card, while the army section holds one levy at a time, so a plural has nothing to cover and *las levas* would promise more than one call on the fields. The sentence speaks of the levy ordered now: a levy ordered in spring is shortened for every man of it, one ordered before spring keeps its own season's duration while it runs (`world.md`, Seasons).
- A section is marked only when the season's `durationPercent` for it, `build` for the buildings, `study` for the arts and `train` for the army, is not `100`: summer marks the buildings section, winter marks the arts section, spring marks the army section (S12, #246), autumn marks no section, and nothing is marked before the calendar starts (`season` null). The resource bar lines above stay as they are: winter marks *comida* on the bar and *los estudios* on its section, both at once, and spring marks *comida* on the bar and *la leva* on its section, both at once. Summer, autumn and winter mark no army section: their `train` is `100`.

## The army

Every line of this section is a proposal for the author, not yet accepted (`world.md`, Where resources come from), with one exception: the sentence of the barracks line that says what the barracks looks like, which carries its own mark. The English identifiers `barracks`, `infantry`, `units`, `recruitOrder`, `recruitTerms`, `recruitsDelivered`, `BarracksNotBuilt` and `RecruitSlotBusy` are fixed by the S10 tickets (#209), and `recruitsCancelled`, `RecruitOrderNotFound`, `delivered` and `cancelled` by the S11 tickets (#231), and `cavalry`, `carry`, `roadPercent`, `barracksLevel` and `BarracksTooLow` by the S16 tickets (#343); only the Spanish is proposed here.

- The **barracks** is *el cuartel*, the seventh building of the Buildings table, where the fief's hands learn to hold a line. It starts as a fenced drill ground with a spear shed and grows into the walled yard with a drill ground and a roof for the spears at art tiers 4-5, levels 7 to 10 (`docs/art/catalog.md`). Accepted by the author on 2026-09-30. Its level shortens every levy, as the library's shortens every study.
- A **unit** is one armed hand taken from the fields (`world.md`). The **count** of a kind reads the number first and then the label, in the register of *3 días*: *12 infantes*, *0 infantes*, *1 infante*. The copy agrees the label with the numeral before it: 1 singular, every other count plural, 0 included.

| Term | Singular | Plural | Note |
|---|---|---|---|
| infantry | infante | infantes | the foot soldier: a spear, a shield and boots; the first kind, of S10 |
| cavalry | jinete | jinetes | the rider: a horse, a lance and a horseshoe; the second kind, of S16 |

- The **rider** (S16, #343) is a proposal for the author, not yet accepted: `cavalry` reads *jinete*, *jinetes*, the plain word for whoever sits a horse, and its count agrees as the infantry's does: *1 jinete*, *0 jinetes*, *6 jinetes*. The label names the man, never the arm: one word per unit, as *infante* stands where *infantería* does not, so the collective noun of the mounted arm is left out, and so is any word of rank, since a rider is a peasant on a horse and no knight (`world.md`, The land). Every line of this section that carries a unit label takes the rider's unchanged: *Reclutar jinetes*, *Jinetes a reclutar*, *Leva en marcha: 2 de 6 jinetes*, *Siguiente jinete en 1:15*, *Cancelar la leva: 6 jinetes*, *Leva terminada: 6 jinetes.*, *4 jinetes en casa, 6 jinetes de marcha*. *Leva* holds for a levy of riders: an order is of one kind, and the yard calls both from the same fields. Spring shortens it under the mark of any levy, *La primavera acorta la leva*.
- The **order of the kinds** is the table's, infantry first and riders second, wherever a line or a screen names more than one: the cards of the section, the fields of a form, the party phrase.
- The **party phrase** (S16, #343) reads the men of more than one kind as one phrase, where a line counts a march's men or a battle's losses: each kind's count with its label agreeing, in the order of the table, joined as a Spanish list, as the amounts are (*120 de madera, 80 de piedra y 20 de oro*): *12 infantes y 6 jinetes*. A kind at 0 is left out, so one kind alone reads as the plain count, *12 infantes* or *6 jinetes*, and every line written for infantry alone reads as it did. The phrase never reads empty: when every count is 0 it keeps at 0 each kind the line knows was sent, *0 jinetes* or *0 infantes y 0 jinetes* (the attack form's *Bajas* and *Vuelven*, The marches), and the first kind of the table, *0 infantes*, where the line does not know who was sent (the roll's battle line, The chronicle).
- The **rider's terms**, with the content's: a rider costs *30 de madera, 40 de hierro, 20 de oro y 80 de comida* and 2 *campesinos*, where an infantry costs 20 of wood, 10 of iron and 30 of food and 1, read as the card reads any cost and its peasants. He trains in 300 s over one plus the barracks level, so in 75 s at barracks 3, *Siguiente jinete en 1:15*, and a levy of six reads *Leva completa en 7:30*; ordered in a spring that trains at 75 %, in 56,25 s rounded up to 57, *Siguiente jinete en 0:57*.
- The **card locked by the barracks level** (S16, #343): the rider's card stands beside the infantry's from barracks level 1, when the section first shows, and stays locked until the built barracks is of level 3, the level the kind needs (`barracksLevel`). Its requirement line reads *Requiere cuartel de nivel 3*, in the register of the art card's shipped *Requiere biblioteca a nivel 2*, and under its disabled button the reason reads *Necesitas un cuartel de nivel 3 y el tuyo es de nivel 1.*, in the register of the shipped *Necesitas la biblioteca a nivel 2 y está a nivel 1.* Slots: the level the kind needs; in the reason, also the built level. *Cuartel de nivel 3* reads as *campamento de nivel 1* does: the thing, *de* and its level. The level is the built one, so a barracks still rising to level 3 keeps the card locked until the work ends. The infantry's card needs level 1, which the section already asks, and never reads locked. Whether the card keeps its requirement line once the level is reached, and how the lock is drawn, is the design's call (#347).

- **Recruiting** is *reclutar*. The form's button reads *Reclutar*, with the unit after it where the card needs it: *Reclutar infantes*, in the register of *Estudiar herrería*; the plural, since no numeral precedes it.
- A **recruit order** is *una leva*: the lord's call on the fields, paid in full the moment it is given, that hands over its men one at a time as each is armed and drilled.
- The **army section** of the fief screen is titled *Cuartel*, as the arts section is titled *Biblioteca*: the building whose yard the section shows. It sits below *Edificios* and is shown from barracks level 1. *Ejército* is kept for the army on a march of W1 (`CONTEXT.md`, Army); the forage march of S13 and the attack of S15 are the yard's errands, not that army, and the section keeps its title while it shows one (The marches, below).
- The **recruit slot** is *la leva*, in the register of *la obra* and *el estudio*: a busy slot has *una leva en marcha*; an idle slot reads *El cuartel no tiene leva en marcha.*
- The **order line** puts the heading first, then a colon, the units delivered, *de*, the units ordered and the label, in the register of *Obra terminada: aserradero, nivel 3*: *Leva en marcha: 4 de 12 infantes*. Slots: the units delivered, the units ordered, the unit label agreeing with the units ordered, the numeral before it; an order of one reads *Leva en marcha: 0 de 1 infante*.
- The two **countdowns** of the order read as *Invierno en 3 días* does: *Siguiente infante en 2:30* to the next unit and *Leva completa en 27:30* to the last. Slots: the unit label in the singular, the time to the next unit and the time to the last, formatted as `formatDuration` reads today; the unit of time is not a lore name. *Siguiente* has one form for either gender and *completa* agrees with *leva*, so neither line needs the unit's gender. When one unit remains both lines name the same instant, and whether one is shown is the design's call (#213).
- The **form's field** reads *Infantes a reclutar*, in the register of *Nombre de tu feudo*: the unit label in the plural, since no numeral precedes it. Slot: the unit label. The cost and the peasants of the count typed read as the building cards read theirs, and a shortfall as *Te faltan* and *Necesitas 3 campesinos libres y tienes 2.* do; no new line.
- The **form's empty or invalid entry**, a field left blank or holding zero, a negative or a fraction, reads *Un número entero, al menos 1.*, in the register of *Al menos 8 caracteres.*: the rule the field wants, under it, with no slot (#213, mirrored by #219).
- The **form blocked by the busy slot** reads *Ya hay una leva en marcha.*, in the register of *Ya hay un estudio en marcha.*
- **Cancelling the levy** in progress (S11, #231) reads *Cancelar la leva*, in the register of *Cancelar el estudio*: the men already drilled stay, the rest go back to the fields, and the stores get back what their arms cost. Where the button needs its full name, *Cancelar la leva: 12 infantes*, in the register of *Cancelar el estudio: herrería, nivel 2*. Slots: the count ordered, the unit label agreeing with it, the numeral before it; an order of one reads *Cancelar la leva: 1 infante*.
- The four **refusals** the server answers, in the register of *Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.*, *La biblioteca ya tiene un estudio en marcha. Espera a que termine.* and *La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.*:

| Refusal | Line | Slots |
|---|---|---|
| BarracksNotBuilt | *Tu feudo aún no tiene cuartel. Levántalo primero.* | none |
| BarracksTooLow | *Tu cuartel aún no llega al nivel 3 que piden los jinetes. Mejóralo primero.* | the level the kind needs, the unit label in the plural |
| RecruitSlotBusy | *El cuartel ya tiene una leva en marcha. Espera a que termine.* | none |
| RecruitOrderNotFound | *El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.* | none |

- The **`RecruitOrderNotFound`** row (S11, #231) answers a cancel that names a levy the yard no longer holds: one already complete, whose men are all in the ranks, or one a newer levy has replaced since the screen last read the fief. It is a proposal for the author, not yet accepted, as the rows above are.
- The **`BarracksTooLow`** row (S16, #343) is a proposal for the author, not yet accepted, in the register of `BarracksNotBuilt` and of *Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.*: what the yard still lacks, then the remedy, with the shipped verb of an upgrade, *mejorar*. It answers a levy of a kind whose level the built barracks has not reached, right after `BarracksNotBuilt` and before `RecruitSlotBusy`; the card is locked on the same rule, and a built level never falls, so it answers a request built by hand, as `MarchToOwnPlot` does. *Los* agrees with the label, and both kinds are masculine. With the content's terms it is read for riders at level 3 alone: the infantry need level 1, and a fief with no barracks is answered `BarracksNotBuilt`.
- Short resources and too few peasants reuse the shipped lines of `InsufficientResources` and `NotEnoughPeasants`, unchanged in this slice.

## The marches

Every line of this section is a proposal for the author, not yet accepted (`world.md`, The land). The English identifiers `march`, `forage`, `loot`, `forageTerms`, `marchReturned`, `outbound`, `foraging`, `returning`, `PlotHeld`, `MarchToOwnPlot`, `NotEnoughInfantryAtHome`, `MarchSlotBusy`, `StayOutOfRange` and `MarchTargetOutOfBounds` are fixed by the S13 tickets (#255), `recall`, `recalledAt`, `recalled`, `MarchNotFound` and `MarchAlreadyReturning` by the S14 tickets (#277), and `attack`, `order`, `PlotHasCamp` and `PlotHasNoCamp` by the S15 tickets (#292), and `units`, `unitsLost` and `NotEnoughUnitsAtHome`, which replaces `NotEnoughInfantryAtHome`, by the S16 tickets (#343); only the Spanish is proposed here. A march is sent from a free plot of the map and shown in the army section, *Cuartel*, under the levy. A forage march meets no one and fights no one; an attack (S15, below) meets the bandits of a camp and no one else.

- A **march** is *una marcha*: the fief's men on the road to a free plot and back, one at a time per fief, infantry alone until S16 and a party of infantry and riders since (S16, below). **Sending** one is *enviar una marcha*; the verb is *enviar*, as *Enviar enlace* and *Enviar otro enlace* use it, since the lord sends the men and stays in the hall.
- The **forage** is *el forrajeo*, and to forage *forrajear*: the old word for what a company on the road does in the fields it crosses, cutting, gleaning and picking up what the ground gives. No sacking, no one to sack: the plot is free.
- The **loot** is *el botín*: what the men carry back. A march's loot is settled the moment it is sent, and only a recall lowers it (S14, below); it reads the same on the form, on the march card and on the chronicle line (`world.md`, The land). The **loot line** reads *Botín:* and the amounts as the *Recuperas* sentence reads them, each as its quantity, *de* and the resource label, in the order of the Resources table, joined as a Spanish list: *Botín: 72 de madera y 72 de piedra*. Slots: the amounts.
- The **march slot** is *la marcha*, in the register of *la obra*, *el estudio* and *la leva*, with one departure: *una marcha en marcha* would trip on its own word, so a busy slot has *una marcha en curso* and an idle slot reads *El cuartel no tiene marcha en curso.* *En curso* holds through the three phases, on the road out, at the plot and on the road back, where *en camino* would only hold on the road.
- The **three phases** each read as the order line does, a heading, a colon, the infantry with the unit label agreeing with the count, and the plot as the map reads it, *provincia 2, parcela 7*, with the preposition the phase wants:

| Phase | Line | Slots |
|---|---|---|
| outbound | *Marcha de ida: 12 infantes a provincia 2, parcela 7* | the infantry, the unit label agreeing with it, the province, the plot |
| foraging | *Forrajeo: 12 infantes en provincia 2, parcela 7* | the same |
| returning | *Marcha de vuelta: 12 infantes desde provincia 2, parcela 7* | the same |

- *Ida* and *vuelta* are the two halves of any journey in Spanish, and *forrajeo* names the stay between them, so a lord reads where the men are without a clock. A march of one reads *Marcha de ida: 1 infante a provincia 2, parcela 7*. The province's terrain is not repeated on the card: the plot line of the map already names it, and the loot line says what it gives.
- The **countdown** under every phase runs to the return, in the register of *Leva completa en 27:30*: *Vuelta en 2 h 30 min*. Slot: the time left until the men are back, formatted as `formatDuration` reads today; the unit of time is not a lore name. The same line reads under the three phases, since what the lord waits for is the loot at the gate, not the arrival at the plot; whether the card also counts to the arrival or to the end of the forage is the design's call (#259). The loot line, *Botín: 72 de madera y 72 de piedra*, reads under the countdown in every phase: the loot is settled when the march leaves, so nothing on the way changes it but a recall (S14, below).
- The **action on a free plot** of the map reads *Enviar una marcha*, in the register of *Enviar otro enlace*; it is offered on a free plot alone, never on a held one nor on the lord's own, and where the design needs its full name, *Enviar una marcha a parcela 7*, in the register of *Sube a nivel 3*: the numbered plot needs no article. Slot: the plot. The map stays otherwise as it reads today: nothing else is ordered from it (`world.md`, The land).
- The **form** the action opens is titled *Marcha a provincia 2, parcela 7*, in the register of the phase lines: the plot as the map reads it, so the lord reads where the men will go before typing how many. Slots: the province, the plot. Its fields read *Infantes a enviar*, in the register of *Infantes a reclutar* (slot: the unit label in the plural, since no numeral precedes it), and *Horas de forrajeo*, in the register of *Nombre de tu feudo*; the hours field takes a whole count from 1 to the longest stay the content allows. Since S16 (#343) the form holds one count field per unit kind, in the order of the unit table: *Infantes a enviar* and under it *Jinetes a enviar*, each a whole count from 0, the party at least one man in all; whether the field of a kind the fief holds none of is shown is the design's call (#347).
- The **form's empty or invalid entries**: a count field left blank or holding a negative or a fraction reads *Un número entero, 0 o más.*, in the register of the shipped *Un número entero, al menos 1.*, which the recruit form keeps, since from S16 (#343) a kind may stay at 0 while the other marches; every count at 0 reads *Envía al menos un infante o un jinete.*, the singular labels in the order of the unit table, joined by *o*; the hours field left blank or holding a count outside the range, a negative or a fraction reads *Un número entero, de 1 a 8.*, in the register of *Al menos 8 caracteres.* Slot: the longest stay (`forageTerms`).
- The **form's shortfall** in men reads *Necesitas 12 infantes en casa y tienes 8.*, in the register of *Necesitas 3 campesinos libres y tienes 2.* Slots: the count typed, the count at home, the unit label agreeing with the first count. *En casa* has one form for either gender and number. With two kinds (S16, #343) the line names the kind short, *Necesitas 6 jinetes en casa y tienes 2.*, and the first one short in the order of the unit table when both are.
- The **form's preview** reads three lines from the terms, as the recruit form reads the cost of the count typed, each a heading, a colon or *en*, and its figure:

| Preview | Line | Slots |
|---|---|---|
| the road one way | *Camino de ida: 15:00* | the one-way road time |
| the return | *Vuelta en 2 h 30 min* | the time until the men are back: the road out, the hours of stay and the road back |
| the loot | *Botín: 72 de madera y 72 de piedra* | the amounts the count typed and the hours typed would bring |

- The **worked numbers** above are a march of 12 infantry from a fief at *provincia 1, parcela 12* to *provincia 2, parcela 7*, a plot of the uplands (`terrainOf`, the code wins), staying two hours, with the content's terms: one province and five plots of road, 15 minutes each way; two hours at the plot, back in two hours and a half; 3 of wood and 3 of stone per infantry and hour, 6 of each per man, 12 against the 48 he can carry, 72 of each for the twelve. The road time is formatted as `formatDuration` reads today, so *15:00* is fifteen minutes and a longer road reads *2 h 30 min*.
- The **form blocked by the busy slot** reads *Ya hay una marcha en curso.*, in the register of *Ya hay una leva en marcha.*
- The **infantry at home and away** read as the recruits cancelled line reads its two counts: the count and the unit label agreeing with it, then *en casa* for the men in the yard and *de marcha* for the men away, in the register of *4 infantes en filas, 8 infantes de vuelta al campo*: *12 infantes en casa, 8 infantes de marcha*. Slots: the two counts, the unit label agreeing with each. *En casa* and *de marcha* have one form for either gender and number, so the line needs only the unit's plural and singular; no march away reads *20 infantes en casa* alone, without a second count of zero. The fief's total of the kind is the two counts added; the men away stay counted and keep their peasants (`world.md`, The land). Each kind reads its own two counts on its own card (S16, #343): *4 jinetes en casa, 6 jinetes de marcha* beside *8 infantes en casa, 12 infantes de marcha*.
- The **six refusals** the server answers, in the register of *El cuartel ya tiene una leva en marcha. Espera a que termine.* and *Esa provincia no está en el mapa. Vuelve a la tuya.*: the rule first, then what the lord can do about it.

| Refusal | Line | Slots |
|---|---|---|
| PlotHeld | *Esa parcela ya tiene feudo. Elige una libre.* | none |
| MarchToOwnPlot | *Esa parcela es tu feudo. Envía la marcha a otra.* | none |
| NotEnoughUnitsAtHome | *Necesitas 6 jinetes en casa y tienes 2. Ajusta la marcha.* | the count the march asks of the kind short, the unit label agreeing with that count, the count of the kind at home |
| MarchSlotBusy | *El cuartel ya tiene una marcha en curso. Espera a que vuelva.* | none |
| StayOutOfRange | *Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.* | the longest stay; *horas* agrees with it in the plural, and a longest stay of 1 would read *de 1 a 1 hora*, a range with no room, so the line assumes a longest stay above one, as the content gives |
| MarchTargetOutOfBounds | *Esa parcela no está en el mapa. Elige una que lo esté.* | none |

- `PlotHeld` answers a plot another lord founded on since the map was last read, so the map the lord sees may still call it *libre*; `MarchToOwnPlot` cannot be reached from the map, which never offers the action on the lord's own plot, and answers a request built by hand. `NotEnoughUnitsAtHome` (S16, #343) replaces `NotEnoughInfantryAtHome` and its infantry-only line, *No tienes infantes en casa suficientes para esa marcha.*, which could not say which kind was short: it reads the form's shortfall line, the kind short, the count the march asks of it and the count at home, and then the remedy, *Ajusta la marcha.*, in the register of *Ajusta las horas.* When both kinds are short it names the first in the order of the unit table, as the form does. A march of infantry alone reads *Necesitas 12 infantes en casa y tienes 8. Ajusta la marcha.* `StayOutOfRange` names the range so a lord who typed 12 learns the bound; *enteras* refuses the fraction in the same breath. `MarchTargetOutOfBounds` answers a province beyond the last one the map shows, or below 1, or a plot the province does not hold, in the words of `ProvinceNotFound`, with the remedy the form allows. A count below 0, a fraction or a party of no one never leaves the form (the entries above), and their refusal `InvalidUnitCount` carries no line, unchanged.
- **Recalling the march** (S14, #277) reads *Retirar la marcha*, in the register of *Cancelar la leva* and *Cancelar el estudio*: the verb in the infinitive, then the slot's noun. The verb is *retirar*, the old word for calling men back from the field, and never *cancelar*: a levy is cancelled in the yard, where its men never left, while a march is out on the road and its men are called home, so the two buttons, one under the levy and one under the march in *Cuartel*, never read alike. Where the button needs its full name, *Retirar la marcha: 12 infantes*, in the register of *Cancelar la leva: 12 infantes*. Slots: the infantry away, the unit label agreeing with it, the numeral before it; a march of one reads *Retirar la marcha: 1 infante*. The button shows under the card while it reads *Marcha de ida* or *Forrajeo*, and never under *Marcha de vuelta*: men already walking home have no order left to take. It asks no confirmation, as *Cancelar la leva* asks none.
- **After the recall** the card reads the returning phase at once, *Marcha de vuelta: 12 infantes desde provincia 2, parcela 7*, with *Vuelta en* counting to the new return and the loot line reading what the men now carry. A march turned back on the road carries nothing, so its card leaves the *Botín* line out, as the chronicle leaves its *Recibes* sentence out (The chronicle, above); whether the card says so in words is the design's call.
- **What the recall brings**, with the worked march above, 12 infantry from *provincia 1, parcela 12* to *provincia 2, parcela 7*, 900 s of road each way and two hours at the plot: turned back on the road, the way home is as long as the way walked; recalled at the plot, the way home is the whole road, and the loot is, for each resource the terrain yields, the infantry by the rate by the seconds foraged over the seconds of an hour, rounded down, and never above the even share of the carry that caps an unrecalled march (288 of each here, out of reach: two hours bring 72 at most). Never gold.

| Recalled | Home | Loot | Line |
|---|---|---|---|
| on the road, 600 s after leaving | 600 s later, 1 200 s after leaving; the card reads *Vuelta en 10:00* | nothing | *Marcha retirada: provincia 2, parcela 7, 12 infantes.* |
| at the plot, 1 800 s after arriving | 900 s later; the card reads *Vuelta en 15:00* | 12 × 3 × 1 800 / 3 600 = 18 of wood and of stone | *Marcha retirada: provincia 2, parcela 7, 12 infantes. Recibes 18 de madera y 18 de piedra.* |
| at the plot, 1 150 s after arriving | 900 s later; the card reads *Vuelta en 15:00* | 12 × 3 × 1 150 / 3 600 = 11,5, rounded down to 11 of each | *Marcha retirada: provincia 2, parcela 7, 12 infantes. Recibes 11 de madera y 11 de piedra.* |

- A recall in the very second the men reach the plot is a recall at the plot with nothing foraged: the line ends at the count, and the way home is the whole road, which is also the way walked, so the two rules meet without a seam. A recall in the very second the stay ends finds the men already turned, and is refused.
- The **two refusals** the server answers to a recall (S14, #277), in the register of *El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.* and *El cuartel ya tiene una marcha en curso. Espera a que vuelva.*: the rule first, then what the lord can do about it.

| Refusal | Line | Slots |
|---|---|---|
| MarchNotFound | *El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.* | none |
| MarchAlreadyReturning | *Esa marcha ya viene de vuelta. Espera a que llegue.* | none |

- `MarchNotFound` answers a recall that names a march the yard no longer holds: one already home, whose men are in the yard and whose line is on the roll, or one a newer march has replaced since the screen last read the fief, as `RecruitOrderNotFound` answers a stale cancel; its closing verb is *retirar*, the button's, so the line and the button agree as *cancelar* and *Cancelar la leva* do. `MarchAlreadyReturning` answers a recall that reaches a march already on its way home, whether it turned when its hours ended or at an earlier recall; *de vuelta* is the word of the phase line, *Marcha de vuelta*, so the lord reads the same state on the card and in the refusal, and *llegue* names what is left to wait for, the men at the gate.

- An **attack** (S15, #292) is *un ataque*: a march whose **order** is to fight the bandits of a camp, where the forage march's order is to forage. *Marcha* holds for both, since the yard sends the same men down the same road and shows them in the same slot, and the order names what they do at the plot; the march of war that would split *marcha* is a march that meets another lord, still W1's (Open questions, below). Every line below is a proposal for the author, not yet accepted.
- The **action on a camp's plot** of the map reads *Atacar el campamento*, in the register of *Enviar una marcha*, and is offered on a camp's plot alone, where *Enviar una marcha* is not offered; where the design needs its full name, *Atacar el campamento en parcela 7*, in the register of *Enviar una marcha a parcela 7*. Slot: the plot. The verb is *atacar*, the plain word, in the infinitive as *Enviar*, *Reclutar* and *Retirar* are.
- The **form** the action opens is titled *Ataque a provincia 2, parcela 7*, in the register of *Marcha a provincia 2, parcela 7*. Slots: the province, the plot. Its count fields are the forage form's, *Infantes a enviar* and since S16 *Jinetes a enviar*; there is no hours field, since an attack has no stay: the men fight at the hour they arrive and turn for home in the same hour.
- The **form's preview** reads the road and the return as the forage form does, *Camino de ida: 15:00* and *Vuelta en 30:00*, the road twice with no hours between, and then the battle, settled from the count typed and the camp as the map shows it, each line a heading, a colon and its figure:

| Preview | Won | Lost | Slots |
|---|---|---|---|
| the camp | *Campamento: nivel 1, fuerza 6* | *Campamento: nivel 2, fuerza 15* | the tier, the strength the men will find, fixed at dispatch |
| the outcome | *Batalla: ganada* | *Batalla: perdida* | none; the participle agrees with *batalla* |
| the losses | *Bajas: 3 infantes* | *Bajas: 12 infantes* | the infantry that fall, the unit label agreeing with the count |
| the bandits' losses | *Bajas de los bandidos: 6* | *Bajas de los bandidos: 10* | the strength the camp loses, a bare count, since strength is counted in points |
| the survivors | *Vuelven: 9 infantes* | *Vuelven: 0 infantes* | the survivors, the unit label agreeing with the count |
| the loot | *Botín: 120 de madera, 120 de piedra y 120 de oro* | left out | the amounts the survivors carry, in the order of the Resources table, gold among them |

- *Bajas* is the old word for the men a company counts missing after a fight, and it holds for the bandits too, whose strength is a count of men; *Vuelven* says who walks home, and a lost battle reads *Vuelven: 0 infantes* rather than leaving the line out, since the lord must read that no one comes back, where a *Botín* line with nothing to list is left out as the recalled march leaves it out. A camp at *fuerza 0* is attacked and won with nothing lost and nothing brought, and the preview says so: *Batalla: ganada*, *Bajas: 0 infantes*, *Bajas de los bandidos: 0*, *Vuelven: 12 infantes* and no *Botín* line.
- The **form's blocked states** are the forage form's, unchanged, since the yard, the men and the count are the same: the busy slot *Ya hay una marcha en curso.*, the shortfall *Necesitas 12 infantes en casa y tienes 8.* and the empty or invalid entries of the count fields. No line blocks a battle the preview reads as lost: the lord may send the men to it, and the server refuses nothing the form previews.
- The **two phases** of an attack on the march card, in the register of *Marcha de ida* and *Marcha de vuelta*, with the same slots:

| Phase | Line | Slots |
|---|---|---|
| outbound | *Marcha al ataque: 12 infantes a provincia 2, parcela 7* | the infantry sent, the unit label agreeing with it, the province, the plot |
| returning | *Vuelta del ataque: 9 infantes desde provincia 2, parcela 7* | the survivors, the unit label agreeing with them, the province, the plot |

- There is no middle phase and no *Forrajeo* line: the battle takes no hour the lord could watch. The returning line counts the survivors, since the dead left the count at the hour of the battle, and the *en casa* and *de marcha* line counts them the same: *8 infantes en casa, 9 infantes de marcha*. A lost attack has no returning line: no one turns for home, and the yard reads *El cuartel no tiene marcha en curso.* from the hour of the battle. *Vuelta en* counts to the return under both phases, as it does for a forage, and the *Botín* line reads under both with its gold, *Botín: 120 de madera, 120 de piedra y 120 de oro*, since the loot is settled when the men leave; an outbound attack the form read as lost carries no *Botín* line, and whether the card says in words that the men will not come back is the design's call (#295).
- **Recalling an attack** reads *Retirar la marcha*, the S14 button, under *Marcha al ataque* alone and never under *Vuelta del ataque*: the messenger reaches the men on the road before the battle and turns them back with nothing, and the roll writes the S14 line, *Marcha retirada: provincia 2, parcela 7, 12 infantes.*, with no battle line, since no one fought. A recall at or after the hour of the battle finds the survivors already turned for home, or no one at all, and is refused with the S14 lines: *Esa marcha ya viene de vuelta. Espera a que llegue.* for a won attack on its way back, *El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.* for a lost one, whose slot stands empty. *Retirar* holds beside an attack: the men are withdrawn before the fight, never from it, so *la retirada* is no rout (Open questions, below).
- The **two refusals** the server answers (S15, #292), in the register of *Esa parcela ya tiene feudo. Elige una libre.* and *Esa parcela no está en el mapa. Elige una que lo esté.*: the rule first, then what the lord can do about it.

| Refusal | Line | Slots |
|---|---|---|
| PlotHasCamp | *Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.* | none |
| PlotHasNoCamp | *Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.* | none |

- `PlotHasCamp` answers a forage march sent to a camp's plot and `PlotHasNoCamp` an attack sent to a plot with no camp. The map never offers the wrong order on either plot, and a camp is where the land put it, never moved, so each answers a request built by hand, as `MarchToOwnPlot` does; a camp erased by a fief founded on its plot since the map was last read is answered `PlotHeld` first. An attack on a held plot is refused `PlotHeld`, on the lord's own plot `MarchToOwnPlot`, on a plot off the map `MarchTargetOutOfBounds`, and a busy yard or too few men at home reuse their S13 lines, unchanged; the order the refusals are answered in is the tickets' (#296).
- The **worked battles**, with the march of the worked numbers above, 12 infantry from *provincia 1, parcela 12* to *provincia 2, parcela 7*, a plot of the uplands, 900 s of road each way and no stay, home 1 800 s after leaving, *Vuelta en 30:00*, and the content's terms: each infantry counts one; the winner loses the rival's strength squared over its own, rounded up, and keeps at least one; the hoard is 60 per point of the camp's strength, never more than 48 per survivor, in three shares rounded down, wood, stone and gold on the uplands. The camps are named by tier and strength, never by plot: where a camp stands is the land's (`world.md`, The land).

| Attack | Battle | Losses | Home | Loot |
|---|---|---|---|---|
| 12 against a tier 1 camp at 6 | won: 12 against 6 | 36 / 12 = 3 fall; the camp falls to 0, reads *fuerza 1* an hour later and *fuerza 6* six hours later | 9 | 360, the lesser of 60 × 6 and 48 × 9 = 432, in thirds: *Botín: 120 de madera, 120 de piedra y 120 de oro* |
| 12 against a tier 2 camp at 15 | lost: 12 against 15 | all 12 fall; the camp loses 144 / 15 = 9,6, rounded up to 10, and keeps 5 | no one | nothing |
| 20 against a tier 2 camp at 15 | won: 20 against 15 | 225 / 20 = 11,25, rounded up to 12 fall; the camp falls to 0 | 8 | 384, the lesser of 60 × 15 = 900 and 48 × 8, in thirds: *Botín: 128 de madera, 128 de piedra y 128 de oro* |
| 15 against a tier 2 camp at 15 | the camp's: a tie | all 15 fall; the camp loses 225 / 15 = 15, kept to leave one: 14, and keeps 1 | no one | nothing |

- The first battle writes *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 3 infantes y los bandidos pierden 6 de fuerza.* at the arrival and *Marcha terminada: provincia 2, parcela 7, 9 infantes. Recibes 120 de madera, 120 de piedra y 120 de oro.* at the return; the second writes *Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 12 infantes y los bandidos pierden 10 de fuerza.* and nothing more (The chronicle, above).

- A **party** (S16, #343): every line from here to the end of the section is a proposal for the author, not yet accepted. A march or an attack takes a count of each kind at home, each a whole number from 0, at least one man in all (`world.md`, The land). No Spanish noun names the party: the lord reads it as the party phrase (The army), *12 infantes y 6 jinetes*, a kind at 0 left out, and every line of this section that counts infantry reads the phrase in the same place, with the headings, the prepositions and the plot unchanged:

| Line | Both kinds | Riders alone |
|---|---|---|
| outbound | *Marcha de ida: 12 infantes y 6 jinetes a provincia 2, parcela 7* | *Marcha de ida: 6 jinetes a provincia 2, parcela 7* |
| foraging | *Forrajeo: 12 infantes y 6 jinetes en provincia 2, parcela 7* | *Forrajeo: 6 jinetes en provincia 2, parcela 7* |
| returning | *Marcha de vuelta: 12 infantes y 6 jinetes desde provincia 2, parcela 7* | *Marcha de vuelta: 6 jinetes desde provincia 2, parcela 7* |
| attack, outbound | *Marcha al ataque: 12 infantes y 6 jinetes a provincia 2, parcela 7* | *Marcha al ataque: 10 jinetes a provincia 2, parcela 7* |
| attack, returning | *Vuelta del ataque: 2 infantes y 6 jinetes desde provincia 2, parcela 7* | *Vuelta del ataque: 9 jinetes desde provincia 2, parcela 7* |
| the recall's full name | *Retirar la marcha: 12 infantes y 6 jinetes* | *Retirar la marcha: 6 jinetes* |

- The button still reads *Retirar la marcha* and recalls the whole party: no kind is recalled alone. A line of infantry alone reads as the tables above give it.
- The **previews with a party**: *Camino de ida:* reads the road of the party typed, the slowest kind's, so it changes as the counts do: six riders read *Camino de ida: 7:30*, and the same six beside one infantry or twelve read *Camino de ida: 15:00*; *Vuelta en* and *Botín:* follow the same counts. The attack form's *Bajas:* and *Vuelven:* read the party phrase: *Bajas: 10 infantes* and *Vuelven: 2 infantes y 6 jinetes* for a won battle that costs no rider, *Bajas: 2 infantes y 2 jinetes* and *Vuelven: 1 jinete* when both kinds fall. A lost battle counts every kind sent on both lines, since the lord must read that no one comes back: *Bajas: 7 jinetes* and *Vuelven: 0 jinetes* for riders alone, *Bajas: 12 infantes y 1 jinete* and *Vuelven: 0 infantes y 0 jinetes* for both kinds; a camp at *fuerza 0* reads *Bajas: 0 infantes y 0 jinetes* for both kinds the same way (The army, the party phrase).
- The **worked numbers with riders**, from a fief at *provincia 3, parcela 12*, the address `Vadoalto 3:12`, to *provincia 2, parcela 7*, a plot of the uplands: one province and five plots, the 900 s of the worked march above walked from the other side, and the content's terms: an infantry counts 1 in a fight, carries 48 and walks the whole road; a rider counts 2, carries 120 and rides the road in half the time; a party rides at the pace of its slowest kind, forages 3 of wood and 3 of stone per head and hour whatever the kind, and carries the sum of its men's loads.

| Party | Road one way | Two hours of forage | Back in |
|---|---|---|---|
| 6 riders | half of 900 s, 450 s: *Camino de ida: 7:30* | 6 × 3 × 2 = 36 of wood and of stone, against a carry of 6 × 120 = 720, 360 a share: *Botín: 36 de madera y 36 de piedra* | 450 + 7 200 + 450 s: *Vuelta en 2 h 15 min* |
| 12 infantry and 6 riders | the footmen's 900 s: *Camino de ida: 15:00* | 18 × 3 × 2 = 108 of each, against a carry of 12 × 48 + 6 × 120 = 1 296, 648 a share: *Botín: 108 de madera y 108 de piedra* | 900 + 7 200 + 900 s: *Vuelta en 2 h 30 min* |

- The **worked battles with riders**, on the same road with no stay, riders alone home 900 s after leaving, *Vuelta en 15:00*, and a party with infantry 1 800 s after, *Vuelta en 30:00*. The party's strength is the sum of its men's; the stronger side wins and a tie is the camp's; the loser falls whole. A winning party loses the camp's strength squared over its own, rounded up, in points of strength: the infantry pay first, one point a man, and the riders pay what is left, two points a man, rounded up, since a rider does not half fall; one man at least always comes home. The loot is the lesser of the hoard, 60 per point of the camp's strength, and the survivors' summed carry, in three shares rounded down.

| Attack | Battle | Losses | Home | Loot |
|---|---|---|---|---|
| 10 riders against a tier 1 camp at 6 | won: 20 against 6 | 36 / 20 = 1,8, rounded up to 2 points: 1 rider falls; the camp falls to 0 | 9 riders | 360, the lesser of 60 × 6 and 120 × 9 = 1 080, in thirds: *Botín: 120 de madera, 120 de piedra y 120 de oro* |
| 12 infantry and 6 riders against a tier 2 camp at 15 | won: 12 + 12 = 24 against 15 | 225 / 24 = 9,375, rounded up to 10 points: 10 infantry fall and no rider; the camp falls to 0 | 2 infantry and 6 riders | 816, the lesser of 60 × 15 = 900 and 48 × 2 + 120 × 6 = 816, in thirds: *Botín: 272 de madera, 272 de piedra y 272 de oro* |
| 2 infantry and 3 riders against a tier 1 camp at 6 | won: 2 + 6 = 8 against 6 | 36 / 8 = 4,5, rounded up to 5 points: both infantry pay 2, and the 3 left take 2 riders; the camp falls to 0 | 1 rider | 120, the lesser of 60 × 6 = 360 and 120 × 1, in thirds: *Botín: 40 de madera, 40 de piedra y 40 de oro* |
| 3 riders against a tier 1 camp at 6 | the camp's: a tie, 6 against 6 | all 3 fall; the camp loses 36 / 6 = 6, kept to leave one: 5, and keeps 1 | no one | nothing |
| 7 riders against a tier 2 camp at 15 | lost: 14 against 15 | all 7 fall; the camp loses 196 / 15 = 13,07, rounded up to 14, and keeps 1 | no one | nothing |

- The second battle writes *Batalla ganada: provincia 2, parcela 7, campamento de nivel 2. Pierdes 10 infantes y los bandidos pierden 15 de fuerza.* at the arrival and *Marcha terminada: provincia 2, parcela 7, 2 infantes y 6 jinetes. Recibes 272 de madera, 272 de piedra y 272 de oro.* at the return; the third, *Batalla ganada: provincia 2, parcela 7, campamento de nivel 1. Pierdes 2 infantes y 2 jinetes, y los bandidos pierden 6 de fuerza.* and *Marcha terminada: provincia 2, parcela 7, 1 jinete. Recibes 40 de madera, 40 de piedra y 40 de oro.*; the last, *Batalla perdida: provincia 2, parcela 7, campamento de nivel 2. Pierdes 7 jinetes y los bandidos pierden 14 de fuerza.* and nothing more (The chronicle, above). With infantry alone every figure is the S15 one: 12 against 6 still lose 3, and 20 against 15 still lose 12.

## Open questions

- The names of the second and third kingdoms, one per remaining house.
- Whether the sender name *myGame* and the mail lines change once the lore names the game.
- Whether *obra* survives once a fief can hold more than one slot.
- Whether the lectern, *el atril*, names the study slot on screen instead of *el estudio*.
- Whether *parcela* survives once a lord can choose a plot at founding, or a plainer *tierra* takes its place.
- Whether *vega*, *páramo* and *riscos* survive once each terrain has an image (`docs/art/art-bible.md`).
- Whether the seasons keep their plain names or the land gives each one a name of its own once summer speeds building (S9).
- Whether *cuartel* survives once the barracks has an image (`docs/art/art-bible.md`), or the land gives it a plainer name, *la casa de armas*.
- Whether *infante* and *jinete* hold beside the kinds of a later slice. S16 settles the first pair: *infante* holds beside *jinete*, and *leva* names an order of either kind (The army).
- Whether a battle with no one fallen reads *Pierdes 0 infantes* on the roll when riders alone fought it, or the event keeps who was sent so the line can name them (The army, the party phrase).
- Whether the shipped *para esa obra* of the resources and peasants refusals widens now that a study and a levy are refused for the same reasons.
- Whether *Ejército* is ever needed on screen once W1 brings marches that meet other lords, or whether *Cuartel* keeps every march. S15 settles the bandits' side: an attack on a camp is the yard's errand, *marcha* holds for it and *ataque* names its order (The marches), so *marcha* splits, if ever, only for a march that meets another lord.
- Whether *forrajear* survives the first player who reads it as fodder for horses, or the land gives the errand a plainer *recoger*. S16 puts horses on the march, so the misreading is nearer.
- Whether *retirar* survives beside a march that meets another lord, where a recall from the field is a rout. S15 settles it beside an attack on a camp: the men are withdrawn on the road before the fight, never from it (The marches).
- Whether *nivel* holds for a camp's tier, which never rises, or the land gives it a word of its own, *grado*.
- Whether the bandits stay nameless, or the land names their bands once a camp has an image (`docs/art/art-bible.md`).
