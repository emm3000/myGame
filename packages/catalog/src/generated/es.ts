export const armyAtHome = ({ count, plural, singular }: { readonly count: number; readonly plural: string | number; readonly singular: string | number }): string => `${count === 1 ? `${String(singular)} en casa` : `${String(plural)} en casa`}`
export const armyAtHomeBeforeAway = ({ count, plural, singular }: { readonly count: number; readonly plural: string | number; readonly singular: string | number }): string => `${count === 1 ? `${String(singular)} en casa,` : `${String(plural)} en casa,`}`
export const armyAway = ({ count, plural, singular }: { readonly count: number; readonly plural: string | number; readonly singular: string | number }): string => `${count === 1 ? `${String(singular)} de marcha` : `${String(plural)} de marcha`}`
export const armyBarracksTooLow = ({ built, required }: { readonly built: string | number; readonly required: string | number }): string => `Necesitas un cuartel de nivel ${String(required)} y el tuyo es de nivel ${String(built)}.`
export const armyBusySlot = (): string => `una leva en marcha`
export const armyCancel = (): string => `Cancelar la leva`
export const armyCancelOf = ({ units }: { readonly units: string | number }): string => `Cancelar la leva: ${String(units)}`
export const armyCancelRefund = ({ quantities, units }: { readonly quantities: string | number; readonly units: string | number }): string => `Si la cancelas, recuperas lo de ${String(units)} de vuelta al campo: ${String(quantities)}.`
export const armyCountField = ({ units }: { readonly units: string | number }): string => `${String(units)} a reclutar`
export const armyIdleSlot = (): string => `El cuartel no tiene leva en marcha.`
export const armyInvalidCount = (): string => `Un número entero, al menos 1.`
export const armyOrderCompleteIn = (): string => `Leva completa en`
export const armyOrderHeading = (): string => `Leva en marcha:`
export const armyOrderLine = ({ count, delivered, plural, singular }: { readonly count: number; readonly delivered: string | number; readonly plural: string | number; readonly singular: string | number }): string => `${String(delivered)} de ${count === 1 ? `${String(count)} ${String(singular)}` : `${String(count)} ${String(plural)}`}`
export const armyOrderRunning = (): string => `Ya hay una leva en marcha.`
export const armyRecruit = ({ plural }: { readonly plural: string | number }): string => `Reclutar ${String(plural)}`
export const armyRequires = ({ barracksLevel }: { readonly barracksLevel: string | number }): string => `Requiere cuartel de nivel ${String(barracksLevel)}`
export const armySeasonMark = ({ season }: { readonly season: string | number }): string => `${String(season)} acorta la leva`
export const armySection = (): string => `Cuartel`
export const armySlot = (): string => `la leva`
export const authEmail = (): string => `Correo`
export const authPassword = (): string => `Contraseña`
export const authSignInForgotPassword = (): string => `¿Has olvidado tu contraseña?`
export const authSignInSubmit = (): string => `Entrar`
export const authSignInSwitchLink = (): string => `Crea tu cuenta`
export const authSignInSwitchPrompt = (): string => `¿Aún no tienes feudo?`
export const authSignInTitle = (): string => `Entra en tu feudo`
export const authSignUpPasswordHint = (): string => `Al menos 8 caracteres.`
export const authSignUpSubmit = (): string => `Crear cuenta`
export const authSignUpSwitchLink = (): string => `Entra`
export const authSignUpSwitchPrompt = (): string => `¿Ya tienes cuenta?`
export const authSignUpTitle = (): string => `Funda tu feudo`
export const chronicleBattle = ({ campLost, losses, plot, province, tier }: { readonly campLost: string | number; readonly losses: string | number; readonly plot: string | number; readonly province: string | number; readonly tier: string | number }): string => `provincia ${String(province)}, parcela ${String(plot)}, campamento de nivel ${String(tier)}. ${String(losses)} y los bandidos pierden ${String(campLost)} de fuerza.`
export const chronicleBattleLost = (): string => `Batalla perdida:`
export const chronicleEmpty = (): string => `La crónica está en blanco: aún no hay nada que contar.`
export const chronicleFiefAtPlot = ({ name, plot, province }: { readonly name: string | number; readonly plot: string | number; readonly province: string | number }): string => `${String(name)}, provincia ${String(province)}, parcela ${String(plot)}.`
export const chronicleHeadingsArtLearned = (): string => `Estudio terminado:`
export const chronicleHeadingsBattleFought = (): string => `Batalla ganada:`
export const chronicleHeadingsFiefFounded = (): string => `Feudo fundado:`
export const chronicleHeadingsFoundingSent = (): string => `Fundación enviada:`
export const chronicleHeadingsLessonCancelled = (): string => `Estudio cancelado:`
export const chronicleHeadingsLessonLearned = (): string => `Estudio terminado:`
export const chronicleHeadingsMarchReturned = (): string => `Marcha terminada:`
export const chronicleHeadingsRecruitsCancelled = (): string => `Leva cancelada:`
export const chronicleHeadingsRecruitsDelivered = (): string => `Leva terminada:`
export const chronicleHeadingsStudyCancelled = (): string => `Estudio cancelado:`
export const chronicleHeadingsTransportArrived = (): string => `Transporte recibido:`
export const chronicleHeadingsTransportSent = (): string => `Transporte enviado:`
export const chronicleHeadingsUpgradeCancelled = (): string => `Obra cancelada:`
export const chronicleHeadingsUpgradeFinished = (): string => `Obra terminada:`
export const chronicleLesson = (): string => `lección 1.`
export const chronicleLoading = (): string => `Estamos leyendo la crónica…`
export const chronicleLosses = ({ kinds, party }: { readonly kinds: number; readonly party: string | number }): string => `${kinds === 0 ? `No pierdes a nadie` : kinds === 1 ? `Pierdes ${String(party)}` : `Pierdes ${String(party)},`}`
export const chronicleMarch = ({ party, plot, province }: { readonly party: string | number; readonly plot: string | number; readonly province: string | number }): string => `provincia ${String(province)}, parcela ${String(plot)}, ${String(party)}.`
export const chronicleMarchRecalled = (): string => `Marcha retirada:`
export const chronicleReceived = (): string => `Recibes`
export const chronicleReceivedAmounts = ({ quantities }: { readonly quantities: string | number }): string => `Recibes ${String(quantities)}.`
export const chronicleRecovered = (): string => `Recuperas`
export const chronicleRecruits = ({ units }: { readonly units: string | number }): string => `${String(units)}.`
export const chronicleRecruitsCancelled = ({ cancelled, delivered }: { readonly cancelled: string | number; readonly delivered: string | number }): string => `${String(delivered)} en filas, ${String(cancelled)} de vuelta al campo.`
export const chronicleRefunded = ({ quantities }: { readonly quantities: string | number }): string => `Recuperas ${String(quantities)}.`
export const chronicleSent = (): string => `Envías`
export const chronicleSentAmounts = ({ quantities }: { readonly quantities: string | number }): string => `Envías ${String(quantities)}.`
export const chronicleSubject = ({ label, level }: { readonly label: string | number; readonly level: string | number }): string => `${String(label)}, nivel ${String(level)}.`
export const chronicleTitle = (): string => `Crónica`
export const digestAcknowledge = (): string => `Entendido`
export const digestStoreFull = (): string => `Almacén lleno:`
export const digestStoreSubject = ({ resource }: { readonly resource: string | number }): string => `${String(resource)}.`
export const digestTitle = (): string => `Mientras no estabas`
export const fiefAtMaxLevel = (): string => `Ya está en su nivel más alto.`
export const fiefBuildings = (): string => `Edificios`
export const fiefBuildingsSeasonMark = ({ season }: { readonly season: string | number }): string => `${String(season)} acorta las obras`
export const fiefCancel = (): string => `Cancelar la obra`
export const fiefCancelOf = ({ building, level }: { readonly building: string | number; readonly level: string | number }): string => `Cancelar la obra: ${String(building)}, nivel ${String(level)}`
export const fiefCancelRefund = (): string => `Si la cancelas, recuperas todo lo que costó, y lo mismo por cada obra en espera que caiga con ella.`
export const fiefCargoArrivalHeading = (): string => `Llegada en`
export const fiefCargoOrigin = ({ name, plot, province }: { readonly name: string | number; readonly plot: string | number; readonly province: string | number }): string => `Desde ${String(name)}, provincia ${String(province)}, parcela ${String(plot)}`
export const fiefCostName = ({ resource }: { readonly resource: string | number }): string => `de ${String(resource)}`
export const fiefFillsAt = ({ clock }: { readonly clock: string | number }): string => `lleno ${String(clock)}`
export const fiefFinished = (): string => `Terminada`
export const fiefFree = ({ supplied }: { readonly supplied: number }): string => `${supplied === 1 ? `libre` : `libres`}`
export const fiefFull = (): string => `lleno`
export const fiefIncomingCargo = (): string => `Carga en camino`
export const fiefJustFinished = (): string => `La obra ha terminado. Estamos poniendo al día tu feudo.`
export const fiefLoading = (): string => `Estamos leyendo tu feudo…`
export const fiefMaxLevel = (): string => `Nivel máximo`
export const fiefNextLevel = ({ level }: { readonly level: string | number }): string => `Sube a nivel ${String(level)}.`
export const fiefNotEnoughPeasants = ({ free, needed }: { readonly free: string | number; readonly needed: number }): string => `Necesitas ${needed === 1 ? `${String(needed)} campesino libre` : `${String(needed)} campesinos libres`} y tienes ${String(free)}.`
export const fiefOccupied = ({ occupied }: { readonly occupied: number }): string => `${occupied === 1 ? `ocupado` : `ocupados`}`
export const fiefPeasantsCostName = ({ count }: { readonly count: number }): string => `${count === 1 ? `campesino` : `campesinos`}`
export const fiefSeasonCountdown = ({ season, timeLeft }: { readonly season: string | number; readonly timeLeft: string | number }): string => `${String(season)} en ${String(timeLeft)}`
export const fiefSeasonDays = ({ days }: { readonly days: number }): string => `${days === 1 ? `${String(days)} día` : `${String(days)} días`}`
export const fiefSeasonLine = ({ season, year }: { readonly season: string | number; readonly year: string | number }): string => `${String(season)}, año ${String(year)}`
export const fiefSeasonMark = ({ change, resource, season }: { readonly change: string | number; readonly resource: string | number; readonly season: string | number }): string => `${String(season)}: ${String(change)} % de ${String(resource)}`
export const fiefShortMark = (): string => `, falta`
export const fiefTooExpensive = ({ count, quantities }: { readonly count: number; readonly quantities: string | number }): string => `${count === 1 ? `Te falta ${String(quantities)}.` : `Te faltan ${String(quantities)}.`}`
export const fiefUpgrade = (): string => `Mejorar`
export const foundingArrivalHeading = (): string => `Llegada en`
export const foundingFound = (): string => `Fundar un feudo`
export const foundingFoundOn = ({ plot }: { readonly plot: string | number }): string => `Fundar un feudo en parcela ${String(plot)}`
export const foundingNameField = (): string => `Nombre del nuevo feudo`
export const foundingNewFiefHeading = (): string => `Nuevo feudo:`
export const foundingOutboundHeading = (): string => `Marcha de fundación:`
export const foundingTitle = ({ plot, province }: { readonly plot: string | number; readonly province: string | number }): string => `Fundación en provincia ${String(province)}, parcela ${String(plot)}`
export const goalDismiss = (): string => `Descartar`
export const goalMissingPeasants = ({ count }: { readonly count: number }): string => `${count === 1 ? `Te falta ${String(count)} campesino libre.` : `Te faltan ${String(count)} campesinos libres.`}`
export const goalPosition = ({ count, position }: { readonly count: string | number; readonly position: string | number }): string => `Meta ${String(position)} de ${String(count)}`
export const goalRaise = ({ building }: { readonly building: string | number }): string => `Levanta ${String(building)}.`
export const goalReady = (): string => `Tienes lo que hace falta.`
export const goalTitle = (): string => `Siguiente meta`
export const goalUnderway = (): string => `Ya está encargada.`
export const goalUpgrade = ({ building, level }: { readonly building: string | number; readonly level: string | number }): string => `Sube ${String(building)} a nivel ${String(level)}.`
export const hintsDismiss = (): string => `Entendido`
export const hintsLinesBarracks = (): string => `El cuartel recluta una leva cada vez. Cada hombre sale de los campos y sigue ocupando campesinos mientras sirve.`
export const hintsLinesFullStore = (): string => `Un almacén lleno no guarda más y lo que rinde de más se pierde. Gasta o amplía el almacén.`
export const hintsLinesLibrary = (): string => `La biblioteca estudia un arte cada vez. Cada nivel de un arte sube lo que rinde un recurso por hora.`
export const hintsLinesMarches = (): string => `Tus hombres salen desde el mapa: elige una parcela y verás qué puedes mandar allí. Una marcha cada vez.`
export const hintsLinesPeasants = (): string => `Cada nivel de un edificio y cada hombre de armas ocupa campesinos. Una granja trae más.`
export const hintsLinesQueue = (): string => `Mientras una obra avanza puedes encargar otras: esperan en orden y empiezan solas.`
export const hintsLinesSeasons = (): string => `Cada estación dura siete días y cambia alguna cosecha o algún trabajo. Las marcas dicen cuál.`
export const lessonTitle = (): string => `Lección 1`
export const lessonToReview = (): string => `Ir al repaso`
export const mailResetSubject = (): string => `Cambia tu contraseña`
export const mailResetText = ({ link }: { readonly link: string | number }): string => `Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:\n\n${String(link)}\n\nEl enlace vale una hora y una sola vez.\n\nSi no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.`
export const mailVerificationSubject = (): string => `Confirma tu correo`
export const mailVerificationText = ({ link }: { readonly link: string | number }): string => `Confirma que este correo es el de tu feudo abriendo este enlace:\n\n${String(link)}\n\nEl enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.\n\nSi no has fundado ningún feudo, ignora este correo.`
export const mapBackToOwnProvince = (): string => `Ir a tu provincia`
export const mapCamp = (): string => `Campamento de bandidos`
export const mapCampStrength = ({ strength, tier }: { readonly strength: string | number; readonly tier: string | number }): string => `nivel ${String(tier)}, fuerza ${String(strength)}`
export const mapFree = (): string => `libre`
export const mapHeading = ({ kingdom, province }: { readonly kingdom: string | number; readonly province: string | number }): string => `${String(kingdom)}, provincia ${String(province)}`
export const mapJump = (): string => `Ir a la provincia`
export const mapLoading = (): string => `Estamos leyendo el mapa…`
export const mapNext = (): string => `Provincia siguiente`
export const mapOwnFief = ({ name }: { readonly name: string | number }): string => `Tu feudo: ${String(name)}`
export const mapOwnFounding = (): string => `Tu fundación`
export const mapPlot = ({ plot }: { readonly plot: string | number }): string => `Parcela ${String(plot)}`
export const mapPrevious = (): string => `Provincia anterior`
export const mapReserved = (): string => `reservada`
export const mapTerrain = ({ terrain }: { readonly terrain: string | number }): string => `Terreno: ${String(terrain)}`
export const mapTitle = (): string => `Mapa`
export const marchAttack = (): string => `Atacar el campamento`
export const marchAttackHeading = (): string => `Marcha al ataque:`
export const marchAttackReturningHeading = (): string => `Vuelta del ataque:`
export const marchAttackTitle = ({ plot, province }: { readonly plot: string | number; readonly province: string | number }): string => `Ataque a provincia ${String(province)}, parcela ${String(plot)}`
export const marchAttackTo = ({ plot }: { readonly plot: string | number }): string => `Atacar el campamento en parcela ${String(plot)}`
export const marchBattleHeading = (): string => `Batalla:`
export const marchBattleLost = (): string => `perdida`
export const marchBattleWon = (): string => `ganada`
export const marchBusySlot = (): string => `una marcha en curso`
export const marchCampHeading = (): string => `Campamento:`
export const marchCampLossesHeading = (): string => `Bajas de los bandidos:`
export const marchCountField = ({ units }: { readonly units: string | number }): string => `${String(units)} a enviar`
export const marchEmptyParty = (): string => `Envía al menos un hombre.`
export const marchHoursField = (): string => `Horas de forrajeo`
export const marchIdleSlot = (): string => `El cuartel no tiene marcha en curso.`
export const marchInvalidCount = (): string => `Un número entero, 0 o más.`
export const marchInvalidHours = ({ maxStayHours }: { readonly maxStayHours: string | number }): string => `Un número entero, de 1 a ${String(maxStayHours)}.`
export const marchLootHeading = (): string => `Botín:`
export const marchLossesHeading = (): string => `Bajas:`
export const marchMarchAway = (): string => `Ya hay una marcha en curso.`
export const marchNotEnoughAtHome = ({ atHome, units }: { readonly atHome: string | number; readonly units: string | number }): string => `Necesitas ${String(units)} en casa y tienes ${String(atHome)}.`
export const marchPhaseHeadingsForaging = (): string => `Forrajeo:`
export const marchPhaseHeadingsOutbound = (): string => `Marcha de ida:`
export const marchPhaseHeadingsReturning = (): string => `Marcha de vuelta:`
export const marchPhaseLinesForaging = ({ party, plot, province }: { readonly party: string | number; readonly plot: string | number; readonly province: string | number }): string => `${String(party)} en provincia ${String(province)}, parcela ${String(plot)}`
export const marchPhaseLinesOutbound = ({ party, plot, province }: { readonly party: string | number; readonly plot: string | number; readonly province: string | number }): string => `${String(party)} a provincia ${String(province)}, parcela ${String(plot)}`
export const marchPhaseLinesReturning = ({ party, plot, province }: { readonly party: string | number; readonly plot: string | number; readonly province: string | number }): string => `${String(party)} desde provincia ${String(province)}, parcela ${String(plot)}`
export const marchRecall = (): string => `Retirar la marcha`
export const marchRecallOf = ({ party }: { readonly party: string | number }): string => `Retirar la marcha: ${String(party)}`
export const marchReturnHeading = (): string => `Vuelta en`
export const marchRoadHeading = (): string => `Camino de ida:`
export const marchRoadSeasonMark = ({ season }: { readonly season: string | number }): string => `${String(season)} acorta el camino`
export const marchSend = (): string => `Enviar una marcha`
export const marchSendTo = ({ plot }: { readonly plot: string | number }): string => `Enviar una marcha a parcela ${String(plot)}`
export const marchSlot = (): string => `la marcha`
export const marchSurvivorsHeading = (): string => `Vuelven:`
export const marchTitle = ({ plot, province }: { readonly plot: string | number; readonly province: string | number }): string => `Marcha a provincia ${String(province)}, parcela ${String(plot)}`
export const namesAddress = ({ kingdom, plot, province }: { readonly kingdom: string | number; readonly plot: string | number; readonly province: string | number }): string => `${String(kingdom)} ${String(province)}:${String(plot)}`
export const namesArtsMasonry = (): string => `cantería`
export const namesArtsSmithing = (): string => `herrería`
export const namesBuildQueue = (): string => `obras en espera`
export const namesBuildingsBarracks = (): string => `cuartel`
export const namesBuildingsFarm = (): string => `granja`
export const namesBuildingsIronMine = (): string => `mina de hierro`
export const namesBuildingsLibrary = (): string => `biblioteca`
export const namesBuildingsQuarry = (): string => `cantera`
export const namesBuildingsSawmill = (): string => `aserradero`
export const namesBuildingsWarehouse = (): string => `almacén`
export const namesBuildingsWithDefiniteArticleBarracks = (): string => `el cuartel`
export const namesBuildingsWithDefiniteArticleFarm = (): string => `la granja`
export const namesBuildingsWithDefiniteArticleIronMine = (): string => `la mina de hierro`
export const namesBuildingsWithDefiniteArticleLibrary = (): string => `la biblioteca`
export const namesBuildingsWithDefiniteArticleQuarry = (): string => `la cantera`
export const namesBuildingsWithDefiniteArticleSawmill = (): string => `el aserradero`
export const namesBuildingsWithDefiniteArticleWarehouse = (): string => `el almacén`
export const namesBuildingsWithIndefiniteArticleBarracks = (): string => `un cuartel`
export const namesBuildingsWithIndefiniteArticleFarm = (): string => `una granja`
export const namesBuildingsWithIndefiniteArticleIronMine = (): string => `una mina de hierro`
export const namesBuildingsWithIndefiniteArticleLibrary = (): string => `una biblioteca`
export const namesBuildingsWithIndefiniteArticleQuarry = (): string => `una cantera`
export const namesBuildingsWithIndefiniteArticleSawmill = (): string => `un aserradero`
export const namesBuildingsWithIndefiniteArticleWarehouse = (): string => `un almacén`
export const namesBusySlot = (): string => `una obra en marcha`
export const namesBusyStudy = (): string => `un estudio en marcha`
export const namesCountedUnits = ({ count, plural, singular }: { readonly count: number; readonly plural: string | number; readonly singular: string | number }): string => `${count === 1 ? `${String(count)} ${String(singular)}` : `${String(count)} ${String(plural)}`}`
export const namesIdleSlot = (): string => `Tu feudo no tiene obra.`
export const namesIdleStudy = (): string => `La biblioteca no tiene estudio en marcha.`
export const namesKingdomsVadoalto = (): string => `Vadoalto`
export const namesLevel = ({ level }: { readonly level: string | number }): string => `nivel ${String(level)}`
export const namesPeasants = (): string => `campesinos`
export const namesPlacesFactory = (): string => `Fábrica`
export const namesPlacesFarm = (): string => `Granja`
export const namesPlacesHomes = (): string => `Hogares`
export const namesPlacesOffice = (): string => `Oficina`
export const namesPlacesPowerStation = (): string => `Central eléctrica`
export const namesPlacesSchool = (): string => `Escuela`
export const namesPlacesStorage = (): string => `Almacén`
export const namesQuantity = ({ amount, resource }: { readonly amount: string | number; readonly resource: string | number }): string => `${String(amount)} de ${String(resource)}`
export const namesResourcesFood = (): string => `comida`
export const namesResourcesGold = (): string => `oro`
export const namesResourcesIron = (): string => `hierro`
export const namesResourcesStone = (): string => `piedra`
export const namesResourcesWood = (): string => `madera`
export const namesSeasonsFall = (): string => `otoño`
export const namesSeasonsSpring = (): string => `primavera`
export const namesSeasonsSummer = (): string => `verano`
export const namesSeasonsWinter = (): string => `invierno`
export const namesSeasonsWithArticleFall = (): string => `el otoño`
export const namesSeasonsWithArticleSpring = (): string => `la primavera`
export const namesSeasonsWithArticleSummer = (): string => `el verano`
export const namesSeasonsWithArticleWinter = (): string => `el invierno`
export const namesSlot = (): string => `la obra`
export const namesStudySlot = (): string => `el estudio`
export const namesTerrainsLowlands = (): string => `vega`
export const namesTerrainsRidges = (): string => `riscos`
export const namesTerrainsUplands = (): string => `páramo`
export const namesTownResourcesFood = (): string => `comida`
export const namesTownResourcesMaterial = (): string => `material`
export const namesTownResourcesMoney = (): string => `dinero`
export const namesTownResourcesPower = (): string => `energía`
export const namesUnitsArcherPlural = (): string => `arqueros`
export const namesUnitsArcherSingular = (): string => `arquero`
export const namesUnitsCavalryPlural = (): string => `jinetes`
export const namesUnitsCavalrySingular = (): string => `jinete`
export const namesUnitsInfantryPlural = (): string => `infantes`
export const namesUnitsInfantrySingular = (): string => `infante`
export const namesUnitsSettlerPlural = (): string => `colonos`
export const namesUnitsSettlerSingular = (): string => `colono`
export const namesUnstudied = (): string => `sin estudiar`
export const passwordResetNewPasswordChanged = (): string => `Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.`
export const passwordResetNewPasswordNewLink = (): string => `Pedir otro enlace`
export const passwordResetNewPasswordPassword = (): string => `Contraseña nueva`
export const passwordResetNewPasswordPasswordHint = (): string => `Al menos 8 caracteres.`
export const passwordResetNewPasswordSubmit = (): string => `Cambiar la contraseña`
export const passwordResetNewPasswordTitle = (): string => `Elige una contraseña nueva`
export const passwordResetRequestConfirmation = (): string => `Si ese correo tiene un feudo y está confirmado, te llegará un enlace que vale una hora.`
export const passwordResetRequestSubmit = (): string => `Enviar enlace`
export const passwordResetRequestTitle = (): string => `Recupera tu contraseña`
export const refusalArtMaxLevelReached = (): string => `Ese arte ya está en su nivel más alto.`
export const refusalBarracksNotBuilt = (): string => `Tu feudo aún no tiene cuartel. Levántalo primero.`
export const refusalBarracksTooLow = ({ plural, requiredBarracksLevel }: { readonly plural: string | number; readonly requiredBarracksLevel: string | number }): string => `Tu cuartel aún no llega al nivel ${String(requiredBarracksLevel)} que piden los ${String(plural)}. Mejóralo primero.`
export const refusalBlankFiefName = (): string => `Tu feudo necesita un nombre. Escribe uno que no esté en blanco.`
export const refusalBlankTownName = (): string => `Escribe un nombre para tu pueblo.`
export const refusalBuildingWorkNotFound = ({ level }: { readonly level: string | number }): string => `La obra del nivel ${String(level)} ya no está en la lista. Quizá ya terminó.`
export const refusalCargoAboveCarry = ({ cargo, carry }: { readonly cargo: string | number; readonly carry: string | number }): string => `La carga suma ${String(cargo)} y tus hombres llevan hasta ${String(carry)}. Quita carga o envía más hombres.`
export const refusalEmailTaken = (): string => `Ya hay una cuenta con ese correo. Entra con ella o usa otro correo.`
export const refusalEmptyCargo = (): string => `Un transporte no sale de vacío. Carga al menos un recurso.`
export const refusalFiefCapReached = ({ cap }: { readonly cap: string | number }): string => `Solo puedes tener ${String(cap)} feudos. Deja al colono en casa.`
export const refusalFiefNotFound = (): string => `No encontramos tus tierras.`
export const refusalHintOnRecognition = (): string => `Esta palabra se elige entre opciones y no lleva pista. La pista llega cuando toca escribirla.`
export const refusalInsufficientResources = (): string => `No tienes recursos suficientes.`
export const refusalInvalidCredentials = (): string => `El correo o la contraseña no son correctos.`
export const refusalLearningCapReached = ({ cardsInLearning, learningCap }: { readonly cardsInLearning: string | number; readonly learningCap: string | number }): string => `Palabras en aprendizaje: ${String(cardsInLearning)} de ${String(learningCap)}. Repásalas antes de empezar otra lección.`
export const refusalLessonAlreadyStudied = (): string => `Ya estudiaste esa lección: sus palabras están en tu repaso.`
export const refusalLessonSchoolTooLow = (): string => `Esa lección necesita una escuela de más nivel. Súbela primero.`
export const refusalLessonStudyNotFound = (): string => `La escuela ya no estudia esa lección. No queda nada que parar.`
export const refusalLessonUnderStudy = (): string => `La escuela ya está estudiando esa lección. Espera a que termine.`
export const refusalLibraryLevelTooLow = (): string => `Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.`
export const refusalMailNotSent = (): string => `No hemos podido enviar el correo. Vuelve a intentarlo en un momento.`
export const refusalMalformedEmail = (): string => `Escribe un correo válido, como nombre@ejemplo.com.`
export const refusalMarchAlreadyReturning = (): string => `Esa marcha ya viene de vuelta. Espera a que llegue.`
export const refusalMarchNotFound = (): string => `El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.`
export const refusalMarchSlotBusy = (): string => `El cuartel ya tiene una marcha en curso. Espera a que vuelva.`
export const refusalMarchTargetOutOfBounds = (): string => `Esa parcela no está en el mapa. Elige una que lo esté.`
export const refusalMarchToOwnPlot = (): string => `A un feudo tuyo solo puedes enviar un transporte, y nunca al mismo del que sale. Elige otro destino.`
export const refusalMaxLevelReached = (): string => `Ese edificio ya está en su nivel más alto.`
export const refusalNotEnoughPeasants = (): string => `No tienes campesinos libres suficientes.`
export const refusalNotEnoughPeople = ({ freePeople, requiredPeople }: { readonly freePeople: string | number; readonly requiredPeople: number }): string => `Esta obra necesita ${requiredPeople === 1 ? `1 persona libre` : `${String(requiredPeople)} personas libres`} y tienes ${String(freePeople)}. Sube el nivel de tus hogares.`
export const refusalNotEnoughResources = (): string => `No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas.`
export const refusalNotEnoughUnitsAtHome = ({ atHome, units }: { readonly atHome: string | number; readonly units: string | number }): string => `Necesitas ${String(units)} en casa y tienes ${String(atHome)}. Ajusta la marcha.`
export const refusalPlayerAlreadyHoldsTown = (): string => `Ya tienes un pueblo. Solo puedes tener uno.`
export const refusalPlotHasCamp = (): string => `Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.`
export const refusalPlotHasNoCamp = (): string => `Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.`
export const refusalPlotHeld = (): string => `Esa parcela ya tiene feudo. Elige una libre.`
export const refusalPlotReserved = (): string => `Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.`
export const refusalProvinceNotFound = (): string => `Esa provincia no está en el mapa. Vuelve a la tuya.`
export const refusalQueueFull = (): string => `Ya no caben más obras en espera. Espera a que avance alguna.`
export const refusalRecruitOrderNotFound = (): string => `El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.`
export const refusalRecruitSlotBusy = (): string => `El cuartel ya tiene una leva en marcha. Espera a que termine.`
export const refusalReviewNotDue = (): string => `Esa palabra aún no toca repasarla. Vuelve al repaso para ver las que sí.`
export const refusalStayOutOfRange = ({ maxStayHours }: { readonly maxStayHours: string | number }): string => `Una marcha forrajea de 1 a ${String(maxStayHours)} horas enteras. Ajusta las horas.`
export const refusalStudyNotFound = (): string => `La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.`
export const refusalStudySlotBusy = (): string => `La biblioteca ya tiene un estudio en marcha. Espera a que termine.`
export const refusalTokenInvalid = (): string => `Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.`
export const refusalTopLevelReached = ({ level }: { readonly level: string | number }): string => `Este edificio ya está en su nivel más alto, el ${String(level)}.`
export const refusalTownNotFound = (): string => `Aún no tienes pueblo. Ponle nombre para fundarlo.`
export const refusalUnexpected = (): string => `No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.`
export const refusalUnitUnfitForOrder = (): string => `Un colono no forrajea, no ataca ni lleva carga. Envíalo a fundar un feudo.`
export const refusalUnknownBuilding = (): string => `Ese edificio no existe.`
export const refusalUnknownChoice = (): string => `Esa opción ya no está en la tarjeta. Vuelve al repaso para verla de nuevo.`
export const refusalUnknownWord = (): string => `Esa palabra no está en tus lecciones. Vuelve al repaso.`
export const refusalUpgradeNotFound = (): string => `Esa obra ya no está en tu cola. No queda nada que cancelar.`
export const refusalWaitingListFull = ({ cap }: { readonly cap: number }): string => `${cap === 1 ? `La lista de espera ya tiene 1 obra.` : `La lista de espera ya tiene ${String(cap)} obras.`} Espera a que termine alguna.`
export const refusalWeakPassword = (): string => `Tu contraseña necesita al menos 8 caracteres.`
export const refusalWordNotHeld = (): string => `Esa palabra no está en tus lecciones. Vuelve al repaso.`
export const reportLoading = (): string => `Estamos leyendo tu informe…`
export const reportNewsBecameCity = (): string => `Tu pueblo ahora es una ciudad.`
export const reportNewsBuildingWorkFinished = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `${String(place)}: ahora en nivel ${String(level)}.`
export const reportNewsBuildingWorkStopped = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `Paraste la obra: ${String(place)}, nivel ${String(level)}.`
export const reportNewsCleanUpDone = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Tu equipo limpió los residuos de la región ${String(region)}, zona ${String(area)}, sitio ${String(site)}.`
export const reportNewsCleanUpFailed = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Tu equipo no pudo limpiar los residuos de la región ${String(region)}, zona ${String(area)}, sitio ${String(site)}.`
export const reportNewsClose = (): string => `Cerrar las noticias`
export const reportNewsClosed = (): string => `Cerraste las noticias.`
export const reportNewsHiringDeliveredTruck = ({ count }: { readonly count: number }): string => `${count === 1 ? `Contrataste 1 camión.` : `Contrataste ${String(count)} camiones.`}`
export const reportNewsHiringDeliveredWorker = ({ count }: { readonly count: number }): string => `${count === 1 ? `Contrataste 1 trabajador.` : `Contrataste ${String(count)} trabajadores.`}`
export const reportNewsHiringStoppedTruck = ({ count, delivered }: { readonly count: string | number; readonly delivered: number }): string => `Paraste la contratación de camiones: ${delivered === 1 ? `llegó 1` : `llegaron ${String(delivered)}`} de ${String(count)}.`
export const reportNewsHiringStoppedWorker = ({ count, delivered }: { readonly count: string | number; readonly delivered: number }): string => `Paraste la contratación de trabajadores: ${delivered === 1 ? `llegó 1` : `llegaron ${String(delivered)}`} de ${String(count)}.`
export const reportNewsJobBack = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Tu equipo volvió de la región ${String(region)}, zona ${String(area)}, sitio ${String(site)}.`
export const reportNewsJobCalledBack = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Llamaste de vuelta a tu equipo de la región ${String(region)}, zona ${String(area)}, sitio ${String(site)}.`
export const reportNewsLessonStopped = (): string => `Paraste el estudio de una lección.`
export const reportNewsLessonStudied = (): string => `Estudiaste una lección.`
export const reportNewsNone = (): string => `No hay noticias.`
export const reportNewsPay = ({ amounts }: { readonly amounts: string | number }): string => `Pago: ${String(amounts)}`
export const reportNewsSkillEarned = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `Ganaste una habilidad de ${String(resource)}: +${String(percent)} % de ${String(resource)}.`
export const reportNewsTitle = (): string => `Noticias del pueblo`
export const reportNoReviewsDue = (): string => `No tienes repasos pendientes ahora.`
export const reportReviewsDue = ({ count }: { readonly count: string | number }): string => `Repasos pendientes: ${String(count)}`
export const reportStartReviews = (): string => `Empezar los repasos`
export const reportTitle = (): string => `Informe`
export const reviewAnswerField = (): string => `Tu respuesta en inglés`
export const reviewAskHint = (): string => `Pedir una pista`
export const reviewBackToTown = (): string => `Volver a tu pueblo`
export const reviewCheck = (): string => `Comprobar`
export const reviewChecking = (): string => `Comprobando…`
export const reviewComesBack = (): string => `Esta palabra volverá en unos minutos.`
export const reviewCorrect = (): string => `Correcto.`
export const reviewDueCount = ({ count }: { readonly count: string | number }): string => `Por repasar: ${String(count)}`
export const reviewFailed = (): string => `No hemos podido leer tu repaso.`
export const reviewHint = ({ firstLetter, letterCount }: { readonly firstLetter: string | number; readonly letterCount: number }): string => `Empieza por «${String(firstLetter)}» y tiene ${letterCount === 1 ? `${String(letterCount)} letra` : `${String(letterCount)} letras`}.`
export const reviewLessonReady = ({ number }: { readonly number: string | number }): string => `La lección ${String(number)} está lista`
export const reviewLoading = (): string => `Estamos leyendo tu repaso…`
export const reviewNearMiss = (): string => `Casi. Revisa cómo se escribe y vuelve a comprobar.`
export const reviewNext = (): string => `Siguiente`
export const reviewNextReview = (): string => `Siguiente repaso:`
export const reviewNoCards = (): string => `Aún no tienes palabras que repasar.`
export const reviewNothingDue = (): string => `No tienes nada que repasar ahora.`
export const reviewRecallPrompt = (): string => `¿Cómo se dice en inglés?`
export const reviewRecognitionPrompt = (): string => `¿Qué significa?`
export const reviewRetry = (): string => `Volver a intentarlo`
export const reviewRightAnswer = (): string => `La correcta:`
export const reviewSkillEarned = ({ level, resource }: { readonly level: string | number; readonly resource: string | number }): string => `Habilidad ganada: ${String(resource)}, nivel ${String(level)}.`
export const reviewSkillRate = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % de ${String(resource)} / h.`
export const reviewSkillRates = ({ after, before, resource }: { readonly after: string | number; readonly before: string | number; readonly resource: string | number }): string => `${String(resource)}: +${String(before)} / h, ahora +${String(after)} / h`
export const reviewSkillWords = (): string => `Palabras:`
export const reviewTitle = (): string => `Repaso`
export const reviewWrong = (): string => `No es correcto.`
export const reviewYourAnswer = (): string => `Tu respuesta:`
export const schoolLearning = ({ cap, inLearning }: { readonly cap: string | number; readonly inLearning: string | number }): string => `Palabras en aprendizaje: ${String(inLearning)} de ${String(cap)}`
export const schoolLearningFull = ({ count }: { readonly count: number }): string => `${count === 1 ? `La siguiente lección trae 1 palabra.` : `La siguiente lección trae ${String(count)} palabras.`} Empieza los repasos.`
export const schoolLessonCapReached = ({ cap, count, inLearning }: { readonly cap: string | number; readonly count: string | number; readonly inLearning: string | number }): string => `Palabras en aprendizaje: ${String(inLearning)} de ${String(cap)}. Esta lección trae ${String(count)}.`
export const schoolLessonNeedsSchool = ({ level }: { readonly level: string | number }): string => `Necesita la escuela en nivel ${String(level)}`
export const schoolLessonNext = (): string => `Siguiente lección`
export const schoolLessonNothingToRead = (): string => `Ahora no hay palabras para leer.`
export const schoolLessonReadWords = (): string => `Leer las palabras`
export const schoolLessonReward = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `Habilidad: ${String(resource)} +${String(percent)} %`
export const schoolLessonSlotBusy = ({ number }: { readonly number: string | number }): string => `La escuela está estudiando la lección ${String(number)}.`
export const schoolLessonStudied = (): string => `Estudiada`
export const schoolLessonStudy = ({ number }: { readonly number: string | number }): string => `Estudiar la lección ${String(number)}`
export const schoolLessonStudying = (): string => `En estudio`
export const schoolLessonTitle = ({ number }: { readonly number: string | number }): string => `Lección ${String(number)}`
export const schoolLessonWordNext = (): string => `Siguiente palabra`
export const schoolLessonWordPosition = ({ count, number }: { readonly count: string | number; readonly number: string | number }): string => `Palabra ${String(number)} de ${String(count)}`
export const schoolLessonWordThen = (): string => `Cuando termine la lección, empiezan los repasos.`
export const schoolLessonWords = ({ count }: { readonly count: number }): string => `${count === 1 ? `1 palabra` : `${String(count)} palabras`}`
export const schoolLessons = (): string => `Lecciones`
export const schoolPathCount = ({ count, total }: { readonly count: string | number; readonly total: string | number }): string => `${String(count)} de ${String(total)}`
export const schoolPathLearned = (): string => `Aprendidas`
export const schoolPathRead = (): string => `Leídas`
export const schoolPathReviewed = (): string => `Repasadas`
export const schoolPathStudied = (): string => `Estudiadas`
export const schoolSkillName = ({ level, resource }: { readonly level: string | number; readonly resource: string | number }): string => `Habilidad de ${String(resource)}, nivel ${String(level)}`
export const schoolSkillRate = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % de ${String(resource)}`
export const schoolSkills = (): string => `Tus habilidades`
export const schoolSkillsNone = (): string => `Aún no tienes habilidades.`
export const schoolSlotDone = (): string => `La lección está lista. Estamos leyendo tu pueblo otra vez…`
export const schoolSlotIdle = (): string => `Ahora no hay ninguna lección en estudio.`
export const schoolSlotRefund = (): string => `Si lo paras, la lección queda por estudiar y puedes volver a empezarla.`
export const schoolSlotStop = (): string => `Parar el estudio`
export const schoolSlotStopOf = ({ number }: { readonly number: string | number }): string => `Parar el estudio de la lección ${String(number)}`
export const schoolSlotTitle = (): string => `En estudio`
export const shellFiefSwitcherFullStore = ({ resource }: { readonly resource: string | number }): string => `Almacén lleno: ${String(resource)}`
export const shellFiefSwitcherLabel = (): string => `Tus feudos`
export const shellFiefSwitcherSeparator = (): string => `,`
export const shellLessonFinishClose = (): string => `Cerrar`
export const shellLessonFinishLine = ({ number }: { readonly number: string | number }): string => `La lección ${String(number)} terminó.`
export const shellNavigationChronicle = (): string => `Crónica`
export const shellNavigationFief = (): string => `Feudo`
export const shellNavigationMap = (): string => `Mapa`
export const shellNavigationReport = (): string => `Informe`
export const shellNavigationTown = (): string => `Pueblo`
export const shellRetainedWords = ({ count, total }: { readonly count: string | number; readonly total: number }): string => `${String(count)} de ${total === 1 ? `1 palabra aprendida` : `${String(total)} palabras aprendidas`}`
export const shellSignOut = (): string => `Salir`
export const shellTitle = (): string => `Vadoalto`
export const statusBuildHeading = (): string => `Obra:`
export const statusCargoFrom = ({ name }: { readonly name: string | number }): string => `desde ${String(name)}`
export const statusCargoHeading = (): string => `Carga en camino:`
export const statusIdleBuild = (): string => `Sin obra`
export const statusIdleMarch = (): string => `Sin marcha`
export const statusIdleRecruit = (): string => `Sin leva`
export const statusIdleStudy = (): string => `Sin estudio`
export const statusLabel = (): string => `En curso`
export const statusNoticesDenied = (): string => `Tu navegador no permite los avisos. Permítelos en sus ajustes y vuelve a activarlo.`
export const statusNoticesLabel = (): string => `Avisarme`
export const statusNoticesOff = (): string => `desactivado`
export const statusNoticesOn = (): string => `activado`
export const statusNoticesPromise = (): string => `Solo mientras esta pestaña siga abierta.`
export const statusReadyAt = ({ clock }: { readonly clock: string | number }): string => `lista ${String(clock)}`
export const statusReadyIn = ({ timeLeft }: { readonly timeLeft: string | number }): string => `lista en ${String(timeLeft)}`
export const statusRecruitHeading = (): string => `Leva:`
export const statusStudyHeading = (): string => `Estudio:`
export const statusTomorrow = ({ time }: { readonly time: string | number }): string => `mañana ${String(time)}`
export const statusWaitingHeading = (): string => `Obras en espera:`
export const statusWork = ({ label, level }: { readonly label: string | number; readonly level: string | number }): string => `${String(label)}, nivel ${String(level)}`
export const studyCancel = (): string => `Cancelar el estudio`
export const studyCancelOf = ({ art, level }: { readonly art: string | number; readonly level: string | number }): string => `Cancelar el estudio: ${String(art)}, nivel ${String(level)}`
export const studyCancelRefund = ({ quantities }: { readonly quantities: string | number }): string => `Si lo cancelas, recuperas ${String(quantities)}.`
export const studyEffect = ({ nextLevel, nextPercent, percent, resource }: { readonly nextLevel: string | number; readonly nextPercent: string | number; readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % de ${String(resource)} / h · nivel ${String(nextLevel)}: +${String(nextPercent)} %`
export const studyEffectAtMaxLevel = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % de ${String(resource)} / h · Ya está en su nivel más alto.`
export const studyJustFinished = (): string => `El estudio ha terminado. Estamos poniendo al día tu feudo.`
export const studyLibraryTooLow = ({ current, required }: { readonly current: string | number; readonly required: string | number }): string => `Necesitas la biblioteca a nivel ${String(required)} y está a nivel ${String(current)}.`
export const studyRequires = ({ libraryLevel }: { readonly libraryLevel: string | number }): string => `Requiere biblioteca a nivel ${String(libraryLevel)}`
export const studySeasonMark = ({ season }: { readonly season: string | number }): string => `${String(season)} acorta los estudios`
export const studySection = (): string => `Biblioteca`
export const studyStart = (): string => `Estudiar`
export const studyStudyRunning = (): string => `Ya hay un estudio en marcha.`
export const timeToday = ({ time }: { readonly time: string | number }): string => `Hoy, ${String(time)}`
export const townAmount = ({ amount, resource }: { readonly amount: string | number; readonly resource: string | number }): string => `${String(amount)} de ${String(resource)}`
export const townAtTopLevel = (): string => `Ya está en su nivel más alto.`
export const townBuild = ({ level }: { readonly level: string | number }): string => `Construir nivel ${String(level)}`
export const townCostName = ({ resource }: { readonly resource: string | number }): string => `de ${String(resource)}`
export const townFull = ({ capacity }: { readonly capacity: string | number }): string => `Lleno: ${String(capacity)}`
export const townGoToSchool = (): string => `Ir a la escuela`
export const townInWork = (): string => `En construcción`
export const townLabelCity = (): string => `Ciudad`
export const townLabelTown = (): string => `Pueblo`
export const townLevel = ({ level }: { readonly level: string | number }): string => `Nivel ${String(level)}`
export const townLoading = (): string => `Estamos leyendo tu pueblo…`
export const townNamingField = (): string => `Nombre del pueblo`
export const townNamingGoToTown = (): string => `Ir a tu pueblo`
export const townNamingMayor = (): string => `Ahora diriges tu propio pueblo.`
export const townNamingSubmit = (): string => `Empezar`
export const townNamingTitle = (): string => `Ponle nombre a tu pueblo`
export const townNextBuildFactory = (): string => `Construye la fábrica`
export const townNextBuildFarm = (): string => `Construye la granja`
export const townNextBuildPowerStation = (): string => `Construye la central eléctrica`
export const townNextGoToReport = (): string => `Ir al informe`
export const townNextLessonReadyIn = ({ number }: { readonly number: string | number }): string => `Lección ${String(number)} lista en`
export const townNextTitle = (): string => `Tu siguiente paso`
export const townNotBuilt = (): string => `Sin construir`
export const townPeople = ({ atWork, free }: { readonly atWork: string | number; readonly free: number }): string => `Gente: ${free === 1 ? `1 libre` : `${String(free)} libres`}, ${String(atWork)} trabajando`
export const townPeopleAtWork = ({ people }: { readonly people: string | number }): string => `Gente trabajando: +${String(people)}`
export const townPeopleShort = ({ free, needed }: { readonly free: number; readonly needed: string | number }): string => `Gente necesaria: ${String(needed)}. ${free === 1 ? `Libre: 1` : `Libres: ${String(free)}`}.`
export const townPlacesTitleCity = (): string => `Tu ciudad`
export const townPlacesTitleTown = (): string => `Tu pueblo`
export const townRate = ({ rate }: { readonly rate: string | number }): string => `+${String(rate)} / h`
export const townSeasonDays = ({ days }: { readonly days: number }): string => `${days === 1 ? `${String(days)} día` : `${String(days)} días`}`
export const townSeasonEndsIn = ({ season, timeLeft }: { readonly season: string | number; readonly timeLeft: string | number }): string => `${String(season)} termina en ${String(timeLeft)}`
export const townSeasonLine = ({ season, year }: { readonly season: string | number; readonly year: string | number }): string => `${String(season)}, año ${String(year)}`
export const townShortMark = (): string => `, falta`
export const townShortfall = ({ missing }: { readonly missing: string | number }): string => `Necesitas ${String(missing)} más.`
export const townSkylineBuilt = ({ built, total }: { readonly built: string | number; readonly total: string | number }): string => `${String(built)} de ${String(total)} construidos`
export const townStockOf = ({ capacity }: { readonly capacity: string | number }): string => `de ${String(capacity)}`
export const townStocks = (): string => `En el almacén`
export const townTopLevel = (): string => `Nivel máximo`
export const townTryAgain = (): string => `Volver a intentarlo`
export const townWorkDone = (): string => `La obra está lista. Estamos leyendo tu pueblo otra vez…`
export const townWorkIdle = (): string => `Ahora no hay ninguna obra.`
export const townWorkReady = (): string => `Lista`
export const townWorkRefund = (): string => `Si la paras, recuperas todo lo que costó, y lo mismo por cada obra en espera que dependa de ella.`
export const townWorkStop = (): string => `Parar la obra`
export const townWorkStopOf = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `Parar la obra: ${String(place)}, nivel ${String(level)}`
export const townWorkTitle = (): string => `Obra`
export const townWorkWaitingList = (): string => `Lista de espera`
export const transportAmountField = ({ resource }: { readonly resource: string | number }): string => `${String(resource)} a enviar`
export const transportCargoAboveCarry = ({ cargo, carry }: { readonly cargo: string | number; readonly carry: string | number }): string => `La carga suma ${String(cargo)} y tus hombres llevan hasta ${String(carry)}.`
export const transportCargoHeading = (): string => `Carga:`
export const transportCarry = ({ cargo, carry }: { readonly cargo: string | number; readonly carry: string | number }): string => `${String(cargo)} de ${String(carry)}`
export const transportOutboundHeading = (): string => `Marcha de transporte:`
export const transportReturningHeading = (): string => `Vuelta del transporte:`
export const transportSend = (): string => `Enviar un transporte`
export const transportSendTo = ({ plot }: { readonly plot: string | number }): string => `Enviar un transporte a parcela ${String(plot)}`
export const transportTitle = ({ plot, province }: { readonly plot: string | number; readonly province: string | number }): string => `Transporte a provincia ${String(province)}, parcela ${String(plot)}`
export const verificationBannerLine = (): string => `Aún no has confirmado tu correo. Sin confirmarlo no podrás recuperar tu contraseña.`
export const verificationBannerResend = (): string => `Enviar otro enlace`
export const verificationBannerSent = (): string => `Te hemos enviado otro enlace. Búscalo en tu correo: vale 24 horas.`
export const verificationVerifyTitle = (): string => `Confirma tu correo`
export const verificationVerifyToFief = (): string => `Ir a tu feudo`
export const verificationVerifyVerified = (): string => `Tu correo queda confirmado.`
export const verificationVerifyVerifying = (): string => `Estamos confirmando tu correo…`
