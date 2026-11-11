export const authEmail = (): string => `Correo`
export const authPassword = (): string => `Contraseña`
export const authSignInForgotPassword = (): string => `¿Has olvidado tu contraseña?`
export const authSignInSubmit = (): string => `Entrar`
export const authSignInSwitchLink = (): string => `Crea tu cuenta`
export const authSignInSwitchPrompt = (): string => `¿Aún no tienes cuenta?`
export const authSignInTitle = (): string => `Entra en tu pueblo`
export const authSignUpPasswordHint = (): string => `Al menos 8 caracteres.`
export const authSignUpSubmit = (): string => `Crear cuenta`
export const authSignUpSwitchLink = (): string => `Entra`
export const authSignUpSwitchPrompt = (): string => `¿Ya tienes cuenta?`
export const authSignUpTitle = (): string => `Crea tu cuenta`
export const authTagline = (): string => `Aprende inglés mientras tu pueblo crece.`
export const mailResetSubject = (): string => `Cambia tu contraseña`
export const mailResetText = ({ link }: { readonly link: string | number }): string => `Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:\n\n${String(link)}\n\nEl enlace vale una hora y una sola vez.\n\nSi no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.`
export const mailVerificationSubject = (): string => `Confirma tu correo`
export const mailVerificationText = ({ link }: { readonly link: string | number }): string => `Confirma que este correo es el de tu feudo abriendo este enlace:\n\n${String(link)}\n\nEl enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.\n\nSi no has fundado ningún feudo, ignora este correo.`
export const namesHiresTruck = (): string => `Camiones`
export const namesHiresWorker = (): string => `Trabajadores`
export const namesPlacesFactory = (): string => `Fábrica`
export const namesPlacesFarm = (): string => `Granja`
export const namesPlacesHomes = (): string => `Hogares`
export const namesPlacesOffice = (): string => `Oficina`
export const namesPlacesPowerStation = (): string => `Central eléctrica`
export const namesPlacesSchool = (): string => `Escuela`
export const namesPlacesStorage = (): string => `Almacén`
export const namesSeasonsFall = (): string => `otoño`
export const namesSeasonsSpring = (): string => `primavera`
export const namesSeasonsSummer = (): string => `verano`
export const namesSeasonsWinter = (): string => `invierno`
export const namesTownResourcesFood = (): string => `comida`
export const namesTownResourcesMaterial = (): string => `material`
export const namesTownResourcesMoney = (): string => `dinero`
export const namesTownResourcesPower = (): string => `energía`
export const passwordResetNewPasswordChanged = (): string => `Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.`
export const passwordResetNewPasswordNewLink = (): string => `Pedir otro enlace`
export const passwordResetNewPasswordPassword = (): string => `Contraseña nueva`
export const passwordResetNewPasswordPasswordHint = (): string => `Al menos 8 caracteres.`
export const passwordResetNewPasswordSubmit = (): string => `Cambiar la contraseña`
export const passwordResetNewPasswordTitle = (): string => `Elige una contraseña nueva`
export const passwordResetRequestConfirmation = (): string => `Si ese correo tiene una cuenta y está confirmado, te llegará un enlace que vale una hora.`
export const passwordResetRequestSubmit = (): string => `Enviar enlace`
export const passwordResetRequestTitle = (): string => `Recupera tu contraseña`
export const refusalAreaNotFound = (): string => `Esa zona está más allá del final del mapa.`
export const refusalBlankTownName = (): string => `Escribe un nombre para tu pueblo.`
export const refusalBuildingWorkNotFound = ({ level }: { readonly level: string | number }): string => `La obra del nivel ${String(level)} ya no está en la lista. Quizá ya terminó.`
export const refusalEmailTaken = (): string => `Ya hay una cuenta con ese correo. Entra con ella o usa otro correo.`
export const refusalHintOnRecognition = (): string => `Esta palabra se elige entre opciones y no lleva pista. La pista llega cuando toca escribirla.`
export const refusalHiringOrderNotFound = (): string => `Esta contratación ya terminó.`
export const refusalHiringSlotBusy = (): string => `Ya tienes una contratación en curso. Espera a que termine.`
export const refusalInvalidCredentials = (): string => `El correo o la contraseña no son correctos.`
export const refusalInvalidTeam = (): string => `Elige al menos un trabajador o un camión para el equipo.`
export const refusalJobAlreadyReturning = (): string => `Tu equipo ya está volviendo.`
export const refusalJobHoursOutOfRange = ({ maxHours }: { readonly maxHours: string | number }): string => `Un trabajo dura de 1 a ${String(maxHours)} horas.`
export const refusalJobNotFound = (): string => `Este trabajo ya terminó.`
export const refusalJobSiteOutOfBounds = (): string => `Ese sitio no está en el mapa.`
export const refusalJobToOwnSite = (): string => `Ese sitio es tu pueblo. Elige otro sitio.`
export const refusalLearningCapReached = ({ cardsInLearning, learningCap }: { readonly cardsInLearning: string | number; readonly learningCap: string | number }): string => `Palabras en aprendizaje: ${String(cardsInLearning)} de ${String(learningCap)}. Repásalas antes de empezar otra lección.`
export const refusalLessonAlreadyStudied = (): string => `Ya estudiaste esa lección: sus palabras están en tu repaso.`
export const refusalLessonSchoolTooLow = (): string => `Esa lección necesita una escuela de más nivel. Súbela primero.`
export const refusalLessonStudyNotFound = (): string => `La escuela ya no estudia esa lección. No queda nada que parar.`
export const refusalLessonUnderStudy = (): string => `La escuela ya está estudiando esa lección. Espera a que termine.`
export const refusalMailNotSent = (): string => `No hemos podido enviarlo.`
export const refusalMalformedEmail = (): string => `Escribe un correo válido, como nombre@ejemplo.com.`
export const refusalNotEnoughHiresAtHome = ({ atHome, count, hire }: { readonly atHome: string | number; readonly count: number; readonly hire: 'worker' | 'truck' }): string => `${hire === 'worker' ? `${count === 1 ? `El equipo necesita 1 trabajador` : `El equipo necesita ${String(count)} trabajadores`} y tienes ${String(atHome)} en casa.` : hire === 'truck' ? `${count === 1 ? `El equipo necesita 1 camión` : `El equipo necesita ${String(count)} camiones`} y tienes ${String(atHome)} en casa.` : `${count === 1 ? `El equipo necesita 1 camión` : `El equipo necesita ${String(count)} camiones`} y tienes ${String(atHome)} en casa.`}`
export const refusalNotEnoughPeople = ({ freePeople, requiredPeople }: { readonly freePeople: string | number; readonly requiredPeople: number }): string => `Esta obra necesita ${requiredPeople === 1 ? `1 persona libre` : `${String(requiredPeople)} personas libres`} y tienes ${String(freePeople)}. Sube el nivel de tus hogares.`
export const refusalNotEnoughResources = (): string => `No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas.`
export const refusalOfficeTooLow = ({ officeLevel, requiredOfficeLevel }: { readonly officeLevel: string | number; readonly requiredOfficeLevel: string | number }): string => `Tu oficina está en nivel ${String(officeLevel)} y esta contratación necesita el nivel ${String(requiredOfficeLevel)}.`
export const refusalPlayerAlreadyHoldsTown = (): string => `Ya tienes un pueblo. Solo puedes tener uno.`
export const refusalReviewNotDue = (): string => `Esa palabra aún no toca repasarla. Vuelve al repaso para ver las que sí.`
export const refusalSiteHeld = (): string => `En ese sitio hay otro pueblo. Elige un sitio libre.`
export const refusalStudySlotBusy = (): string => `La biblioteca ya tiene un estudio en marcha. Espera a que termine.`
export const refusalTeamAlreadyOut = (): string => `Tu equipo ya está fuera. Espera a que vuelva.`
export const refusalTokenInvalid = (): string => `Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.`
export const refusalTopLevelReached = ({ level }: { readonly level: string | number }): string => `Este edificio ya está en su nivel más alto, el ${String(level)}.`
export const refusalTownNotFound = (): string => `Aún no tienes pueblo. Ponle nombre para fundarlo.`
export const refusalUnexpected = (): string => `No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.`
export const refusalUnknownChoice = (): string => `Esa opción ya no está en la tarjeta. Vuelve al repaso para verla de nuevo.`
export const refusalUnknownWord = (): string => `Esa palabra no está en tus lecciones. Vuelve al repaso.`
export const refusalWaitingListFull = ({ cap }: { readonly cap: number }): string => `${cap === 1 ? `La lista de espera ya tiene 1 obra.` : `La lista de espera ya tiene ${String(cap)} obras.`} Espera a que termine alguna.`
export const refusalWeakPassword = (): string => `Tu contraseña necesita al menos 8 caracteres.`
export const refusalWordNotHeld = (): string => `Esa palabra no está en tus lecciones. Vuelve al repaso.`
export const refusalHiringNotEnoughPeople = ({ freePeople, requiredPeople }: { readonly freePeople: string | number; readonly requiredPeople: number }): string => `Esta contratación necesita ${requiredPeople === 1 ? `1 persona libre` : `${String(requiredPeople)} personas libres`} y tienes ${String(freePeople)}. Sube el nivel de tus hogares.`
export const refusalHiringNotEnoughResources = (): string => `No tienes recursos suficientes para esta contratación. Espera a que crezcan tus reservas.`
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
export const shellLessonFinishClose = (): string => `Cerrar`
export const shellLessonFinishLine = ({ number }: { readonly number: string | number }): string => `La lección ${String(number)} terminó.`
export const shellNavigationReport = (): string => `Informe`
export const shellNavigationTown = (): string => `Pueblo`
export const shellRetainedWords = ({ count, total }: { readonly count: string | number; readonly total: number }): string => `${String(count)} de ${total === 1 ? `1 palabra aprendida` : `${String(total)} palabras aprendidas`}`
export const shellSignOut = (): string => `Salir`
export const shellTitle = (): string => `Townword`
export const statusTomorrow = ({ time }: { readonly time: string | number }): string => `mañana ${String(time)}`
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
export const townOfficeBusy = (): string => `Espera a que termine esta contratación.`
export const townOfficeCountTruck = (): string => `Camiones a contratar`
export const townOfficeCountWorker = (): string => `Trabajadores a contratar`
export const townOfficeCountNeeded = (): string => `Contrata 1 o más.`
export const townOfficeDelivered = ({ count, delivered }: { readonly count: string | number; readonly delivered: string | number }): string => `${String(delivered)} de ${String(count)} contratados`
export const townOfficeDone = (): string => `La contratación terminó. Estamos leyendo tu pueblo otra vez…`
export const townOfficeHireTruck = ({ count }: { readonly count: number }): string => `${count === 1 ? `Contratar 1 camión` : `Contratar ${String(count)} camiones`}`
export const townOfficeHireWorker = ({ count }: { readonly count: number }): string => `${count === 1 ? `Contratar 1 trabajador` : `Contratar ${String(count)} trabajadores`}`
export const townOfficeHireAnyTruck = (): string => `Contratar camiones`
export const townOfficeHireAnyWorker = (): string => `Contratar trabajadores`
export const townOfficeHiring = (): string => `Contratación`
export const townOfficeIdle = (): string => `Ahora no hay ninguna contratación.`
export const townOfficeNeedsLevel = ({ level }: { readonly level: string | number }): string => `Necesita la oficina en nivel ${String(level)}`
export const townOfficePeopleName = ({ count }: { readonly count: number }): string => `${count === 1 ? `persona` : `personas`}`
export const townOfficeRefund = (): string => `Si la paras, recuperas el costo de las contrataciones que no llegaron.`
export const townOfficeStop = (): string => `Parar la contratación`
export const townOfficeStopOfTruck = (): string => `Parar la contratación de camiones`
export const townOfficeStopOfWorker = (): string => `Parar la contratación de trabajadores`
export const townOfficeTeamTruck = ({ count }: { readonly count: number }): string => `Tu equipo: ${count === 1 ? `1 camión` : `${String(count)} camiones`}`
export const townOfficeTeamWorker = ({ count }: { readonly count: number }): string => `Tu equipo: ${count === 1 ? `1 trabajador` : `${String(count)} trabajadores`}`
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
export const verificationBannerLine = (): string => `Confirma tu correo`
export const verificationBannerResend = (): string => `Reenviar`
export const verificationBannerSent = (): string => `Enviado. Revisa tu correo.`
export const verificationVerifyTitle = (): string => `Confirma tu correo`
export const verificationVerifyToTown = (): string => `Ir a tu pueblo`
export const verificationVerifyVerified = (): string => `Tu correo queda confirmado.`
export const verificationVerifyVerifying = (): string => `Estamos confirmando tu correo…`
