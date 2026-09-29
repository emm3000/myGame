# Names the player reads

Status: accepted by the author on 2026-09-22, except the lines marked as a proposal: the build queue, the library, the arts, the chronicle, the map, the account, the seasons and the army. The Spanish labels below are the words a player sees; the English term stays the identifier in code and in `CONTEXT.md`.

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

- The **recruits delivered** line (S10, #209) is a proposal for the author, not yet accepted, as the rows above are: the heading *Leva terminada:*, then the count delivered and the unit label agreeing with it, in the register of *Obra terminada: aserradero, nivel 3*. One unit reads *Leva terminada: 1 infante.*; no level, no refund. One line per order, dated by the last unit's arrival (`chronicle.md`). The unit labels are in The army, below.
- The **recruits cancelled** line (S11, #231) is a proposal for the author, not yet accepted: the heading *Leva cancelada:*, then the units delivered with *en filas*, a comma, the units cancelled with *de vuelta al campo*, and the refunded amounts as the *Recuperas* sentence of the two cancels above, in the register of *Estudio cancelado: herrería, nivel 2. Recuperas 60 de hierro y 20 de oro.* Each count carries the unit label agreeing with it, as The army says: 1 singular, every other count plural, 0 included. *En filas* and *de vuelta al campo* have one form for either gender and number, so the line needs only the unit's plural and singular. A cancel before the first delivery reads *Leva cancelada: 0 infantes en filas, 12 infantes de vuelta al campo. Recuperas 240 de madera, 120 de hierro y 360 de comida.*; one after the last but one reads *Leva cancelada: 11 infantes en filas, 1 infante de vuelta al campo. Recuperas 20 de madera, 10 de hierro y 30 de comida.* The units cancelled are never 0: a levy already complete is refused, never cancelled (The army, `RecruitOrderNotFound`). No level. One line per order, dated by the cancel (`chronicle.md`).

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
| uplands | páramo | el páramo | the high bare plateau; stone from its quarries |
| ridges | riscos | los riscos | the iron crags; the only label in the plural |

- A **free plot** (`fief` null on the wire) reads *Parcela 7: libre*; *libre* agrees with *parcela* and needs no article.
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

Every line of this section is a proposal for the author, not yet accepted (`world.md`, Where resources come from). The English identifiers `barracks`, `infantry`, `units`, `recruitOrder`, `recruitTerms`, `recruitsDelivered`, `BarracksNotBuilt` and `RecruitSlotBusy` are fixed by the S10 tickets (#209), and `recruitsCancelled`, `RecruitOrderNotFound`, `delivered` and `cancelled` by the S11 tickets (#231); only the Spanish is proposed here.

- The **barracks** is *el cuartel*, the seventh building of the Buildings table: a walled yard with a drill ground and a roof for the spears, where the fief's hands learn to hold a line. Its level shortens every levy, as the library's shortens every study.
- A **unit** is one armed hand taken from the fields (`world.md`). The **count** of a kind reads the number first and then the label, in the register of *3 días*: *12 infantes*, *0 infantes*, *1 infante*. The copy agrees the label with the numeral before it: 1 singular, every other count plural, 0 included.

| Term | Singular | Plural | Note |
|---|---|---|---|
| infantry | infante | infantes | the foot soldier: a spear, a shield and boots; the only kind of S10 |

- **Recruiting** is *reclutar*. The form's button reads *Reclutar*, with the unit after it where the card needs it: *Reclutar infantes*, in the register of *Estudiar herrería*; the plural, since no numeral precedes it.
- A **recruit order** is *una leva*: the lord's call on the fields, paid in full the moment it is given, that hands over its men one at a time as each is armed and drilled.
- The **army section** of the fief screen is titled *Cuartel*, as the arts section is titled *Biblioteca*: the building whose yard the section shows. It sits below *Edificios* and is shown from barracks level 1. *Ejército* is kept for the army on a march of W1 (`CONTEXT.md`, Army).
- The **recruit slot** is *la leva*, in the register of *la obra* and *el estudio*: a busy slot has *una leva en marcha*; an idle slot reads *El cuartel no tiene leva en marcha.*
- The **order line** puts the heading first, then a colon, the units delivered, *de*, the units ordered and the label, in the register of *Obra terminada: aserradero, nivel 3*: *Leva en marcha: 4 de 12 infantes*. Slots: the units delivered, the units ordered, the unit label agreeing with the units ordered, the numeral before it; an order of one reads *Leva en marcha: 0 de 1 infante*.
- The two **countdowns** of the order read as *Invierno en 3 días* does: *Siguiente infante en 2:30* to the next unit and *Leva completa en 27:30* to the last. Slots: the unit label in the singular, the time to the next unit and the time to the last, formatted as `formatDuration` reads today; the unit of time is not a lore name. *Siguiente* has one form for either gender and *completa* agrees with *leva*, so neither line needs the unit's gender. When one unit remains both lines name the same instant, and whether one is shown is the design's call (#213).
- The **form's field** reads *Infantes a reclutar*, in the register of *Nombre de tu feudo*: the unit label in the plural, since no numeral precedes it. Slot: the unit label. The cost and the peasants of the count typed read as the building cards read theirs, and a shortfall as *Te faltan* and *Necesitas 3 campesinos libres y tienes 2.* do; no new line.
- The **form's empty or invalid entry**, a field left blank or holding zero, a negative or a fraction, reads *Un número entero, al menos 1.*, in the register of *Al menos 8 caracteres.*: the rule the field wants, under it, with no slot (#213, mirrored by #219).
- The **form blocked by the busy slot** reads *Ya hay una leva en marcha.*, in the register of *Ya hay un estudio en marcha.*
- **Cancelling the levy** in progress (S11, #231) reads *Cancelar la leva*, in the register of *Cancelar el estudio*: the men already drilled stay, the rest go back to the fields, and the stores get back what their arms cost. Where the button needs its full name, *Cancelar la leva: 12 infantes*, in the register of *Cancelar el estudio: herrería, nivel 2*. Slots: the count ordered, the unit label agreeing with it, the numeral before it; an order of one reads *Cancelar la leva: 1 infante*.
- The three **refusals** the server answers, in the register of *Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.*, *La biblioteca ya tiene un estudio en marcha. Espera a que termine.* and *La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.*:

| Refusal | Line | Slots |
|---|---|---|
| BarracksNotBuilt | *Tu feudo aún no tiene cuartel. Levántalo primero.* | none |
| RecruitSlotBusy | *El cuartel ya tiene una leva en marcha. Espera a que termine.* | none |
| RecruitOrderNotFound | *El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.* | none |

- The **`RecruitOrderNotFound`** row (S11, #231) answers a cancel that names a levy the yard no longer holds: one already complete, whose men are all in the ranks, or one a newer levy has replaced since the screen last read the fief. It is a proposal for the author, not yet accepted, as the rows above are.
- Short resources and too few peasants reuse the shipped lines of `InsufficientResources` and `NotEnoughPeasants`, unchanged in this slice.

## Open questions

- The names of the second and third kingdoms, one per remaining house.
- Whether the sender name *myGame* and the mail lines change once the lore names the game.
- Whether *obra* survives once a fief can hold more than one slot.
- Whether the lectern, *el atril*, names the study slot on screen instead of *el estudio*.
- Whether *parcela* survives once a lord can choose a plot at founding, or a plainer *tierra* takes its place.
- Whether *vega*, *páramo* and *riscos* survive once each terrain has an image (`docs/art/art-bible.md`).
- Whether the seasons keep their plain names or the land gives each one a name of its own once summer speeds building (S9).
- Whether *cuartel* survives once the barracks has an image (`docs/art/art-bible.md`), or the land gives it a plainer name, *la casa de armas*.
- Whether *infante* holds beside the kinds of a later slice, and whether *leva* names an order of them all or only of foot soldiers.
- Whether the shipped *para esa obra* of the resources and peasants refusals widens now that a study and a levy are refused for the same reasons.
