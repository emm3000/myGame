# Names the player reads

Status: accepted by the author on 2026-09-22, except the lines marked as a proposal: the build queue, the library, the arts, the chronicle, the map and the account. The Spanish labels below are the words a player sees; the English term stays the identifier in code and in `CONTEXT.md`.

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

The *biblioteca* row is a proposal for the author, not yet accepted (`arts.md`).

## The fief

- A **fief** is a *feudo*. The screen title is the name the player gave the fief when founding it, unchanged.
- The **build slot** is *la obra*: a busy slot has *una obra en marcha*; a free slot *no tiene obra*.
- The **build queue** is *las obras en espera*: the upgrades waiting behind *la obra en marcha*, listed in order. Proposal for the author, not yet accepted.
- A **level** is *nivel*; a building at level 3 reads *nivel 3*.

## The arts

Every line of this section is a proposal for the author, not yet accepted (`arts.md`).

| Term | Label | Note |
|---|---|---|
| smithing | herrería | the art of ore and fire; raises the iron rate |
| masonry | cantería | the art of cut stone; raises the stone rate. *Cantería* is the craft, *cantera* the quarry it is worked in |

- A **study** is *un estudio*. The button that starts one reads *Estudiar*, with the art after it where the card needs it: *Estudiar herrería*.
- The **study slot** is *el estudio*, in the register of *la obra*: a busy slot has *un estudio en marcha*; an idle slot reads *La biblioteca no tiene estudio en marcha.*
- Cancelling the study in progress reads *Cancelar el estudio*.
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

## Open questions

- The names of the second and third kingdoms, one per remaining house.
- Whether the sender name *myGame* and the mail lines change once the lore names the game.
- Whether *obra* survives once a fief can hold more than one slot.
- Whether the lectern, *el atril*, names the study slot on screen instead of *el estudio*.
- Whether *parcela* survives once a lord can choose a plot at founding, or a plainer *tierra* takes its place.
- Whether *vega*, *páramo* and *riscos* survive once each terrain has an image (`docs/art/art-bible.md`).
