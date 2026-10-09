import type {
  ArtKind,
  BuildingKind,
  FiefEvent,
  FiefOverview,
  HintKind,
  ResourceKind,
  SeasonKind,
  Terrain,
  UnitKind,
} from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import type { ApiRefusal } from './api/apiClient'
import { capitalize } from './design-system/capitalize'
import { formatQuantity } from './design-system/formatQuantity'
import { neutralPercent } from './seasons/neutralPercent'
import { formatTimeLeft } from './time/formatTimeLeft'
import type { UnitCounts } from './units/UnitCounts'

export interface ResourceQuantity {
  readonly amount: number
  readonly resource: ResourceKind
}

const unexpectedRefusal =
  'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.'

const refusals: Readonly<Record<ApiRefusal, string>> = {
  InvalidCredentials: 'El correo o la contraseña no son correctos.',
  EmailTaken: 'Ya hay una cuenta con ese correo. Entra con ella o usa otro correo.',
  WeakPassword: 'Tu contraseña necesita al menos 8 caracteres.',
  FiefNotFound: 'No encontramos tus tierras.',
  UnknownBuilding: 'Ese edificio no existe.',
  MaxLevelReached: 'Ese edificio ya está en su nivel más alto.',
  QueueFull: 'Ya no caben más obras en espera. Espera a que avance alguna.',
  UpgradeNotFound: 'Esa obra ya no está en tu cola. No queda nada que cancelar.',
  InsufficientResources: 'No tienes recursos suficientes.',
  NotEnoughPeasants: 'No tienes campesinos libres suficientes.',
  BlankFiefName: 'Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
  StudySlotBusy: 'La biblioteca ya tiene un estudio en marcha. Espera a que termine.',
  LibraryLevelTooLow: 'Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.',
  ArtMaxLevelReached: 'Ese arte ya está en su nivel más alto.',
  StudyNotFound: 'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
  BarracksNotBuilt: 'Tu feudo aún no tiene cuartel. Levántalo primero.',
  BarracksTooLow: 'Tu cuartel aún no llega al nivel que pide esa leva. Mejóralo primero.',
  RecruitSlotBusy: 'El cuartel ya tiene una leva en marcha. Espera a que termine.',
  RecruitOrderNotFound: 'El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.',
  PlotHeld: 'Esa parcela ya tiene feudo. Elige una libre.',
  PlotHasCamp: 'Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.',
  PlotHasNoCamp: 'Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.',
  MarchToOwnPlot:
    'A un feudo tuyo solo puedes enviar un transporte, y nunca al mismo del que sale. Elige otro destino.',
  NotEnoughUnitsAtHome: 'No tienes en casa los hombres que pide esa marcha. Ajusta la marcha.',
  MarchSlotBusy: 'El cuartel ya tiene una marcha en curso. Espera a que vuelva.',
  StayOutOfRange: 'Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.',
  MarchTargetOutOfBounds: 'Esa parcela no está en el mapa. Elige una que lo esté.',
  MarchNotFound: 'El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.',
  MarchAlreadyReturning: 'Esa marcha ya viene de vuelta. Espera a que llegue.',
  UnitUnfitForOrder: 'Un colono no forrajea, no ataca ni lleva carga. Envíalo a fundar un feudo.',
  FiefCapReached: 'Solo puedes tener 2 feudos. Deja al colono en casa.',
  PlotReserved: 'Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.',
  EmptyCargo: 'Un transporte no sale de vacío. Carga al menos un recurso.',
  CargoAboveCarry: unexpectedRefusal,
  ProvinceNotFound: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
  TokenInvalid: 'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  MailNotSent: 'No hemos podido enviar el correo. Vuelve a intentarlo en un momento.',
  Unexpected: unexpectedRefusal,
}

const resources: Readonly<Record<ResourceKind, string>> = {
  wood: 'madera',
  stone: 'piedra',
  iron: 'hierro',
  gold: 'oro',
  food: 'comida',
}

const buildings: Readonly<Record<BuildingKind, string>> = {
  sawmill: 'aserradero',
  quarry: 'cantera',
  ironMine: 'mina de hierro',
  farm: 'granja',
  warehouse: 'almacén',
  library: 'biblioteca',
  barracks: 'cuartel',
}

const arts: Readonly<Record<ArtKind, string>> = {
  smithing: 'herrería',
  masonry: 'cantería',
}

interface UnitLabel {
  readonly singular: string
  readonly plural: string
}

const units: Readonly<Record<UnitKind, UnitLabel>> = {
  infantry: { singular: 'infante', plural: 'infantes' },
  cavalry: { singular: 'jinete', plural: 'jinetes' },
  archer: { singular: 'arquero', plural: 'arqueros' },
  settler: { singular: 'colono', plural: 'colonos' },
}

const kingdoms: Readonly<Partial<Record<number, string>>> = {
  1: 'Vadoalto',
}

const terrains: Readonly<Record<Terrain, string>> = {
  lowlands: 'vega',
  uplands: 'páramo',
  ridges: 'riscos',
}

const seasons: Readonly<Record<SeasonKind, string>> = {
  spring: 'primavera',
  summer: 'verano',
  autumn: 'otoño',
  winter: 'invierno',
}

const seasonsWithArticle: Readonly<Record<SeasonKind, string>> = {
  spring: 'la primavera',
  summer: 'el verano',
  autumn: 'el otoño',
  winter: 'el invierno',
}

const seasonAfter: Readonly<Record<SeasonKind, SeasonKind>> = {
  spring: 'summer',
  summer: 'autumn',
  autumn: 'winter',
  winter: 'spring',
}

const secondsPerDay = 86_400

const listFormat = new Intl.ListFormat('es', { type: 'conjunction' })

const agreeing = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural

const countedUnits = (unit: UnitKind, count: number): string =>
  `${count} ${agreeing(count, units[unit].singular, units[unit].plural)}`

const listedUnitsOf = (counts: UnitCounts): ReadonlyArray<string> =>
  UnitKindSchema.options
    .filter((unit) => counts[unit] > 0)
    .map((unit) => countedUnits(unit, counts[unit]))

const noOneOfTheFirstKind = UnitKindSchema.options
  .slice(0, 1)
  .map((unit) => countedUnits(unit, 0))
  .join('')

const partyPhrase = (counts: UnitCounts): string => {
  const listed = listedUnitsOf(counts)
  return listed.length === 0 ? noOneOfTheFirstKind : listFormat.format(listed)
}

const sentPartyPhrase = (counts: UnitCounts, sent: UnitCounts): string => {
  const listed = listedUnitsOf(counts)
  return listed.length > 0
    ? listFormat.format(listed)
    : listFormat.format(
        UnitKindSchema.options
          .filter((unit) => sent[unit] > 0)
          .map((unit) => countedUnits(unit, 0)),
      )
}

const emptyParty = 'Envía al menos un hombre.'

const lordLossesClause = (unitsLost: UnitCounts): string => {
  const listedCount = listedUnitsOf(unitsLost).length
  if (listedCount === 0) {
    return 'No pierdes a nadie'
  }
  const phrase = partyPhrase(unitsLost)
  return listedCount > 1 ? `Pierdes ${phrase},` : `Pierdes ${phrase}`
}

const names = {
  resources,
  peasants: 'campesinos',
  buildings,
  kingdoms,
  terrains,
  seasons,
  level: (level: number): string => `nivel ${level}`,
  slot: 'la obra',
  busySlot: 'una obra en marcha',
  idleSlot: 'Tu feudo no tiene obra.',
  buildQueue: 'obras en espera',
  arts,
  unstudied: 'sin estudiar',
  studySlot: 'el estudio',
  busyStudy: 'un estudio en marcha',
  idleStudy: 'La biblioteca no tiene estudio en marcha.',
  address: ({ kingdom, province, plot }: FiefOverview['coordinates']): string =>
    `${kingdoms[kingdom] ?? String(kingdom)} ${province}:${plot}`,
  units,
} as const

const seasonTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / secondsPerDay)
  return days >= 1 ? `${days} ${agreeing(days, 'día', 'días')}` : formatTimeLeft(seconds)
}

const quantitiesOf = (quantities: ReadonlyArray<ResourceQuantity>): string =>
  listFormat.format(
    quantities.map(({ amount, resource }) => `${formatQuantity(amount)} de ${resources[resource]}`),
  )

const signedChange = (multiplierPercent: number): string => {
  const change = multiplierPercent - neutralPercent
  if (change === 0) {
    return '0'
  }
  return change > 0 ? `+${change}` : `-${-change}`
}

const ratePercent = (percent: number, resource: ResourceKind): string =>
  `+${percent} % de ${resources[resource]} / h`

const atMaxLevel = 'Ya está en su nivel más alto.'

const buildingsWithIndefiniteArticle: Readonly<Record<BuildingKind, string>> = {
  sawmill: 'un aserradero',
  quarry: 'una cantera',
  ironMine: 'una mina de hierro',
  farm: 'una granja',
  warehouse: 'un almacén',
  library: 'una biblioteca',
  barracks: 'un cuartel',
}

const buildingsWithDefiniteArticle: Readonly<Record<BuildingKind, string>> = {
  sawmill: 'el aserradero',
  quarry: 'la cantera',
  ironMine: 'la mina de hierro',
  farm: 'la granja',
  warehouse: 'el almacén',
  library: 'la biblioteca',
  barracks: 'el cuartel',
}

const signInTitle = 'Entra en tu feudo'

const invalidCount = 'Un número entero, al menos 1.'

const storeFull = 'Almacén lleno:'

export const copy = {
  shell: {
    title: 'Vadoalto',
    signOut: 'Salir',
    navigation: {
      fief: 'Feudo',
      map: 'Mapa',
      chronicle: 'Crónica',
    },
    fiefSwitcher: {
      label: 'Tus feudos',
      separator: ',',
      fullStore: (resource: ResourceKind): string => `${storeFull} ${resources[resource]}`,
    },
  },
  auth: {
    email: 'Correo',
    password: 'Contraseña',
    invalidEmail: 'Escribe un correo válido, como nombre@ejemplo.com.',
    signIn: {
      title: signInTitle,
      submit: 'Entrar',
      switchPrompt: '¿Aún no tienes feudo?',
      switchLink: 'Crea tu cuenta',
      forgotPassword: '¿Has olvidado tu contraseña?',
    },
    signUp: {
      title: 'Funda tu feudo',
      fiefName: 'Nombre de tu feudo',
      passwordHint: 'Al menos 8 caracteres.',
      submit: 'Crear cuenta',
      switchPrompt: '¿Ya tienes cuenta?',
      switchLink: 'Entra',
    },
  },
  passwordReset: {
    request: {
      title: 'Recupera tu contraseña',
      submit: 'Enviar enlace',
      confirmation:
        'Si ese correo tiene un feudo y está confirmado, te llegará un enlace que vale una hora.',
      toSignIn: signInTitle,
    },
    newPassword: {
      title: 'Elige una contraseña nueva',
      password: 'Contraseña nueva',
      passwordHint: 'Al menos 8 caracteres.',
      submit: 'Cambiar la contraseña',
      changed: 'Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.',
      toSignIn: signInTitle,
      newLink: 'Pedir otro enlace',
    },
  },
  verification: {
    banner: {
      line: 'Aún no has confirmado tu correo. Sin confirmarlo no podrás recuperar tu contraseña.',
      resend: 'Enviar otro enlace',
      sent: 'Te hemos enviado otro enlace. Búscalo en tu correo: vale 24 horas.',
    },
    verify: {
      title: 'Confirma tu correo',
      verifying: 'Estamos confirmando tu correo…',
      verified: 'Tu correo queda confirmado.',
      toFief: 'Ir a tu feudo',
      toSignIn: signInTitle,
    },
  },
  names,
  fief: {
    loading: 'Estamos leyendo tu feudo…',
    buildings: 'Edificios',
    full: 'lleno',
    fillsAt: (clock: string): string => `lleno ${clock}`,
    free: (supplied: number): string => agreeing(supplied, 'libre', 'libres'),
    occupied: (occupied: number): string => agreeing(occupied, 'ocupado', 'ocupados'),
    finished: 'Terminada',
    justFinished: 'La obra ha terminado. Estamos poniendo al día tu feudo.',
    upgrade: 'Mejorar',
    cancel: 'Cancelar la obra',
    cancelRefund:
      'Si la cancelas, recuperas todo lo que costó, y lo mismo por cada obra en espera que caiga con ella.',
    cancelOf: (building: BuildingKind, level: number): string =>
      `Cancelar la obra: ${buildings[building]}, ${names.level(level)}`,
    maxLevel: 'Nivel máximo',
    nextLevel: (level: number): string => `Sube a ${names.level(level)}.`,
    atMaxLevel,
    costName: (resource: ResourceKind): string => `de ${resources[resource]}`,
    peasantsCostName: (count: number): string => agreeing(count, 'campesino', 'campesinos'),
    shortMark: ', falta',
    tooExpensive: (shortfalls: ReadonlyArray<ResourceQuantity>): string => {
      const isSingleOne = shortfalls.length === 1 && shortfalls[0]?.amount === 1
      const verb = isSingleOne ? 'falta' : 'faltan'
      return `Te ${verb} ${quantitiesOf(shortfalls)}.`
    },
    seasonLine: (season: SeasonKind, year: number): string =>
      `${capitalize(seasons[season])}, año ${year}`,
    seasonCountdown: (season: SeasonKind, remainingSeconds: number): string =>
      `${capitalize(seasons[seasonAfter[season]])} en ${seasonTimeLeft(remainingSeconds)}`,
    seasonMark: (season: SeasonKind, resource: ResourceKind, multiplierPercent: number): string =>
      `${capitalize(seasons[season])}: ${signedChange(multiplierPercent)} % de ${resources[resource]}`,
    buildingsSeasonMark: (season: SeasonKind): string =>
      `${capitalize(seasonsWithArticle[season])} acorta las obras`,
    notEnoughPeasants: (needed: number, free: number): string =>
      `Necesitas ${needed} ${agreeing(needed, 'campesino libre', 'campesinos libres')} y tienes ${free}.`,
    incomingCargo: 'Carga en camino',
    cargoOrigin: (name: string, province: number, plot: number): string =>
      `Desde ${name}, provincia ${province}, parcela ${plot}`,
    cargoAmounts: (cargo: ReadonlyArray<ResourceQuantity>): string => quantitiesOf(cargo),
    cargoArrivalHeading: 'Llegada en',
  },
  status: {
    label: 'En curso',
    idleBuild: 'Sin obra',
    idleStudy: 'Sin estudio',
    idleRecruit: 'Sin leva',
    idleMarch: 'Sin marcha',
    buildHeading: 'Obra:',
    waitingHeading: 'Obras en espera:',
    studyHeading: 'Estudio:',
    recruitHeading: 'Leva:',
    cargoHeading: 'Carga en camino:',
    work: (label: string, level: number): string => `${label}, ${names.level(level)}`,
    cargoFrom: (name: string): string => `desde ${name}`,
    tomorrow: (time: string): string => `mañana ${time}`,
    readyAt: (clock: string): string => `lista ${clock}`,
    readyIn: (timeLeft: string): string => `lista en ${timeLeft}`,
    notices: {
      label: 'Avisarme',
      on: 'activado',
      off: 'desactivado',
      promise: 'Solo mientras esta pestaña siga abierta.',
      denied: 'Tu navegador no permite los avisos. Permítelos en sus ajustes y vuelve a activarlo.',
    },
  },
  study: {
    section: 'Biblioteca',
    seasonMark: (season: SeasonKind): string =>
      `${capitalize(seasonsWithArticle[season])} acorta los estudios`,
    start: 'Estudiar',
    cancel: 'Cancelar el estudio',
    cancelRefund: (refund: ReadonlyArray<ResourceQuantity>): string =>
      `Si lo cancelas, recuperas ${quantitiesOf(refund)}.`,
    cancelOf: (art: ArtKind, level: number): string =>
      `Cancelar el estudio: ${arts[art]}, ${names.level(level)}`,
    justFinished: 'El estudio ha terminado. Estamos poniendo al día tu feudo.',
    effect: (
      percent: number,
      resource: ResourceKind,
      next: { readonly level: number; readonly percent: number },
    ): string =>
      `${ratePercent(percent, resource)} · ${names.level(next.level)}: +${next.percent} %`,
    effectAtMaxLevel: (percent: number, resource: ResourceKind): string =>
      `${ratePercent(percent, resource)} · ${atMaxLevel}`,
    requires: (libraryLevel: number): string =>
      `Requiere biblioteca a ${names.level(libraryLevel)}`,
    studyRunning: 'Ya hay un estudio en marcha.',
    libraryTooLow: (required: number, current: number): string =>
      `Necesitas la biblioteca a ${names.level(required)} y está a ${names.level(current)}.`,
  },
  army: {
    section: 'Cuartel',
    seasonMark: (season: SeasonKind): string =>
      `${capitalize(seasonsWithArticle[season])} acorta la leva`,
    slot: 'la leva',
    busySlot: 'una leva en marcha',
    idleSlot: 'El cuartel no tiene leva en marcha.',
    orderHeading: 'Leva en marcha:',
    orderLine: (unit: UnitKind, delivered: number, count: number): string =>
      `${delivered} de ${count} ${agreeing(count, units[unit].singular, units[unit].plural)}`,
    orderCompleteIn: 'Leva completa en',
    unitTitle: (unit: UnitKind): string => capitalize(units[unit].plural),
    atHome: (unit: UnitKind, count: number): string =>
      `${agreeing(count, units[unit].singular, units[unit].plural)} en casa`,
    atHomeBeforeAway: (unit: UnitKind, count: number): string =>
      `${agreeing(count, units[unit].singular, units[unit].plural)} en casa,`,
    away: (unit: UnitKind, count: number): string =>
      `${agreeing(count, units[unit].singular, units[unit].plural)} de marcha`,
    countField: (unit: UnitKind): string => `${capitalize(units[unit].plural)} a reclutar`,
    recruit: (unit: UnitKind): string => `Reclutar ${units[unit].plural}`,
    cancel: 'Cancelar la leva',
    cancelRefund: (
      unit: UnitKind,
      undelivered: number,
      refund: ReadonlyArray<ResourceQuantity>,
    ): string =>
      `Si la cancelas, recuperas lo de ${countedUnits(unit, undelivered)} de vuelta al campo: ${quantitiesOf(refund)}.`,
    cancelOf: (unit: UnitKind, count: number): string =>
      `Cancelar la leva: ${countedUnits(unit, count)}`,
    orderRunning: 'Ya hay una leva en marcha.',
    invalidCount,
    requires: (barracksLevel: number): string => `Requiere cuartel de nivel ${barracksLevel}`,
    barracksTooLow: (required: number, built: number): string =>
      `Necesitas un cuartel de nivel ${required} y el tuyo es de nivel ${built}.`,
    barracksTooLowRefusal: (unit: UnitKind, required: number): string =>
      `Tu cuartel aún no llega al nivel ${required} que piden los ${units[unit].plural}. Mejóralo primero.`,
  },
  march: {
    send: 'Enviar una marcha',
    sendTo: (plot: number): string => `Enviar una marcha a parcela ${plot}`,
    attack: 'Atacar el campamento',
    attackTo: (plot: number): string => `Atacar el campamento en parcela ${plot}`,
    attackTitle: (province: number, plot: number): string =>
      `Ataque a provincia ${province}, parcela ${plot}`,
    attackHeading: 'Marcha al ataque:',
    attackReturningHeading: 'Vuelta del ataque:',
    campHeading: 'Campamento:',
    battleHeading: 'Batalla:',
    battleOutcome: (isWon: boolean): string => (isWon ? 'ganada' : 'perdida'),
    lossesHeading: 'Bajas:',
    campLossesHeading: 'Bajas de los bandidos:',
    survivorsHeading: 'Vuelven:',
    party: (counts: UnitCounts, sent: UnitCounts): string => sentPartyPhrase(counts, sent),
    title: (province: number, plot: number): string =>
      `Marcha a provincia ${province}, parcela ${plot}`,
    countField: (unit: UnitKind): string => `${capitalize(units[unit].plural)} a enviar`,
    hoursField: 'Horas de forrajeo',
    roadHeading: 'Camino de ida:',
    roadSeasonMark: (season: SeasonKind): string =>
      `${capitalize(seasonsWithArticle[season])} acorta el camino`,
    returnHeading: 'Vuelta en',
    lootHeading: 'Botín:',
    recall: 'Retirar la marcha',
    recallOf: (party: UnitCounts): string => `Retirar la marcha: ${partyPhrase(party)}`,
    loot: (loot: ReadonlyArray<ResourceQuantity>): string => quantitiesOf(loot),
    slot: 'la marcha',
    busySlot: 'una marcha en curso',
    idleSlot: 'El cuartel no tiene marcha en curso.',
    phaseHeadings: {
      outbound: 'Marcha de ida:',
      foraging: 'Forrajeo:',
      returning: 'Marcha de vuelta:',
    },
    phaseLines: {
      outbound: (party: UnitCounts, province: number, plot: number): string =>
        `${partyPhrase(party)} a provincia ${province}, parcela ${plot}`,
      foraging: (party: UnitCounts, province: number, plot: number): string =>
        `${partyPhrase(party)} en provincia ${province}, parcela ${plot}`,
      returning: (party: UnitCounts, province: number, plot: number): string =>
        `${partyPhrase(party)} desde provincia ${province}, parcela ${plot}`,
    },
    marchAway: 'Ya hay una marcha en curso.',
    invalidCount: 'Un número entero, 0 o más.',
    emptyParty,
    invalidHours: (maxStayHours: number): string => `Un número entero, de 1 a ${maxStayHours}.`,
    notEnoughAtHome: (unit: UnitKind, needed: number, atHome: number): string =>
      `Necesitas ${countedUnits(unit, needed)} en casa y tienes ${atHome}.`,
  },
  founding: {
    found: 'Fundar un feudo',
    foundOn: (plot: number): string => `Fundar un feudo en parcela ${plot}`,
    title: (province: number, plot: number): string =>
      `Fundación en provincia ${province}, parcela ${plot}`,
    nameField: 'Nombre del nuevo feudo',
    proposedName: (terrain: Terrain): string => capitalize(terrains[terrain]),
    arrivalHeading: 'Llegada en',
    outboundHeading: 'Marcha de fundación:',
    newFiefHeading: 'Nuevo feudo:',
    blankName: refusals.BlankFiefName,
  },
  transport: {
    send: 'Enviar un transporte',
    sendTo: (plot: number): string => `Enviar un transporte a parcela ${plot}`,
    title: (province: number, plot: number): string =>
      `Transporte a provincia ${province}, parcela ${plot}`,
    amountField: (resource: ResourceKind): string => `${capitalize(resources[resource])} a enviar`,
    cargoHeading: 'Carga:',
    carry: (cargo: number, carry: number): string =>
      `${formatQuantity(cargo)} de ${formatQuantity(carry)}`,
    cargo: (cargo: ReadonlyArray<ResourceQuantity>): string => quantitiesOf(cargo),
    outboundHeading: 'Marcha de transporte:',
    returningHeading: 'Vuelta del transporte:',
    emptyCargo: refusals.EmptyCargo,
    cargoAboveCarry: (cargo: number, carry: number): string =>
      `La carga suma ${formatQuantity(cargo)} y tus hombres llevan hasta ${formatQuantity(carry)}.`,
  },
  chronicle: {
    title: 'Crónica',
    loading: 'Estamos leyendo la crónica…',
    empty: 'La crónica está en blanco: aún no hay nada que contar.',
    today: (time: string): string => `Hoy, ${time}`,
    headings: {
      upgradeFinished: 'Obra terminada:',
      artLearned: 'Estudio terminado:',
      upgradeCancelled: 'Obra cancelada:',
      studyCancelled: 'Estudio cancelado:',
      recruitsDelivered: 'Leva terminada:',
      recruitsCancelled: 'Leva cancelada:',
      marchReturned: 'Marcha terminada:',
      battleFought: 'Batalla ganada:',
      foundingSent: 'Fundación enviada:',
      fiefFounded: 'Feudo fundado:',
      transportSent: 'Transporte enviado:',
      transportArrived: 'Transporte recibido:',
    } satisfies Readonly<Record<FiefEvent['kind'], string>>,
    marchRecalled: 'Marcha retirada:',
    battleLost: 'Batalla perdida:',
    subject: (label: string, level: number): string => `${label}, ${names.level(level)}.`,
    recruits: (unit: UnitKind, count: number): string => `${countedUnits(unit, count)}.`,
    recruitsCancelled: (unit: UnitKind, delivered: number, cancelled: number): string =>
      `${countedUnits(unit, delivered)} en filas, ${countedUnits(unit, cancelled)} de vuelta al campo.`,
    march: (province: number, plot: number, units: UnitCounts): string =>
      `provincia ${province}, parcela ${plot}, ${partyPhrase(units)}.`,
    battle: (
      province: number,
      plot: number,
      tier: number,
      unitsLost: UnitCounts,
      campLost: number,
    ): string =>
      `provincia ${province}, parcela ${plot}, campamento de nivel ${tier}. ${lordLossesClause(unitsLost)} y los bandidos pierden ${campLost} de fuerza.`,
    fiefAtPlot: (name: string, province: number, plot: number): string =>
      `${name}, provincia ${province}, parcela ${plot}.`,
    recovered: 'Recuperas',
    refunded: (refund: ReadonlyArray<ResourceQuantity>): string =>
      `Recuperas ${quantitiesOf(refund)}.`,
    received: 'Recibes',
    receivedAmounts: (received: ReadonlyArray<ResourceQuantity>): string =>
      `Recibes ${quantitiesOf(received)}.`,
    sent: 'Envías',
    sentAmounts: (sent: ReadonlyArray<ResourceQuantity>): string => `Envías ${quantitiesOf(sent)}.`,
  },
  digest: {
    title: 'Mientras no estabas',
    acknowledge: 'Entendido',
    storeFull,
    storeSubject: (resource: ResourceKind): string => `${resources[resource]}.`,
  },
  goal: {
    title: 'Siguiente meta',
    dismiss: 'Descartar',
    position: (position: number, count: number): string => `Meta ${position} de ${count}`,
    line: (building: BuildingKind, level: number): string =>
      level === 1
        ? `Levanta ${buildingsWithIndefiniteArticle[building]}.`
        : `Sube ${buildingsWithDefiniteArticle[building]} a ${names.level(level)}.`,
    underway: 'Ya está encargada.',
    ready: 'Tienes lo que hace falta.',
    missingPeasants: (count: number): string =>
      `Te ${agreeing(count, 'falta', 'faltan')} ${count} ${agreeing(count, 'campesino libre', 'campesinos libres')}.`,
  },
  hints: {
    dismiss: 'Entendido',
    lines: {
      peasants:
        'Cada nivel de un edificio y cada hombre de armas ocupa campesinos. Una granja trae más.',
      seasons:
        'Cada estación dura siete días y cambia alguna cosecha o algún trabajo. Las marcas dicen cuál.',
      queue: 'Mientras una obra avanza puedes encargar otras: esperan en orden y empiezan solas.',
      library:
        'La biblioteca estudia un arte cada vez. Cada nivel de un arte sube lo que rinde un recurso por hora.',
      barracks:
        'El cuartel recluta una leva cada vez. Cada hombre sale de los campos y sigue ocupando campesinos mientras sirve.',
      marches:
        'Tus hombres salen desde el mapa: elige una parcela y verás qué puedes mandar allí. Una marcha cada vez.',
      fullStore:
        'Un almacén lleno no guarda más y lo que rinde de más se pierde. Gasta o amplía el almacén.',
    } satisfies Record<HintKind, string>,
  },
  map: {
    title: 'Mapa',
    loading: 'Estamos leyendo el mapa…',
    heading: (kingdom: number, province: number): string =>
      `${kingdoms[kingdom] ?? String(kingdom)}, provincia ${province}`,
    terrain: (terrain: Terrain): string => `Terreno: ${terrains[terrain]}`,
    plot: (plot: number): string => `Parcela ${plot}`,
    free: 'libre',
    camp: 'Campamento de bandidos',
    campStrength: (tier: number, strength: number): string => `nivel ${tier}, fuerza ${strength}`,
    ownFief: (name: string): string => `Tu feudo: ${name}`,
    reserved: 'reservada',
    ownFounding: 'Tu fundación',
    previous: 'Provincia anterior',
    next: 'Provincia siguiente',
    jump: 'Ir a la provincia',
    backToOwnProvince: 'Ir a tu provincia',
  },
  refusals,
} as const
