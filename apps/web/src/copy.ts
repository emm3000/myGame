import type {
  ArtKind,
  BuildingKind,
  FiefEvent,
  ResourceKind,
  SeasonKind,
  Terrain,
  UnitKind,
} from '@mygame/contracts'
import type { ApiRefusal } from './api/apiClient'
import { capitalize } from './design-system/capitalize'
import { formatDuration } from './design-system/formatDuration'
import { formatQuantity } from './design-system/formatQuantity'

export interface ResourceQuantity {
  readonly amount: number
  readonly resource: ResourceKind
}

const refusals: Readonly<Record<ApiRefusal, string>> = {
  InvalidCredentials: 'El correo o la contraseña no son correctos.',
  EmailTaken: 'Ya hay una cuenta con ese correo. Entra con ella o usa otro correo.',
  WeakPassword: 'Tu contraseña necesita al menos 8 caracteres.',
  FiefNotFound: 'No encontramos tus tierras.',
  UnknownBuilding: 'Ese edificio no existe.',
  MaxLevelReached: 'Ese edificio ya está en su nivel más alto.',
  QueueFull: 'Ya no caben más obras en espera. Espera a que avance alguna.',
  UpgradeNotFound: 'Esa obra ya no está en tu cola. No queda nada que cancelar.',
  InsufficientResources: 'No tienes recursos suficientes para esa obra.',
  NotEnoughPeasants: 'No tienes campesinos libres suficientes para esa obra.',
  BlankFiefName: 'Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
  StudySlotBusy: 'La biblioteca ya tiene un estudio en marcha. Espera a que termine.',
  LibraryLevelTooLow: 'Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.',
  ArtMaxLevelReached: 'Ese arte ya está en su nivel más alto.',
  StudyNotFound: 'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
  BarracksNotBuilt: 'Tu feudo aún no tiene cuartel. Levántalo primero.',
  RecruitSlotBusy: 'El cuartel ya tiene una leva en marcha. Espera a que termine.',
  RecruitOrderNotFound: 'El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.',
  PlotHeld: 'Esa parcela ya tiene feudo. Elige una libre.',
  MarchToOwnPlot: 'Esa parcela es tu feudo. Envía la marcha a otra.',
  NotEnoughInfantryAtHome: 'No tienes infantes en casa suficientes para esa marcha.',
  MarchSlotBusy: 'El cuartel ya tiene una marcha en curso. Espera a que vuelva.',
  StayOutOfRange: 'Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.',
  MarchTargetOutOfBounds: 'Esa parcela no está en el mapa. Elige una que lo esté.',
  ProvinceNotFound: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
  TokenInvalid: 'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  MailNotSent: 'No hemos podido enviar el correo. Vuelve a intentarlo en un momento.',
  Unexpected: 'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
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
  units,
} as const

const seasonTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / secondsPerDay)
  return days >= 1 ? `${days} ${agreeing(days, 'día', 'días')}` : formatDuration(seconds)
}

const quantitiesOf = (quantities: ReadonlyArray<ResourceQuantity>): string =>
  listFormat.format(
    quantities.map(({ amount, resource }) => `${formatQuantity(amount)} de ${resources[resource]}`),
  )

const neutralPercent = 100

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

const signInTitle = 'Entra en tu feudo'

export const copy = {
  shell: {
    title: 'myGame',
    signOut: 'Salir',
    navigation: {
      fief: 'Feudo',
      map: 'Mapa',
      chronicle: 'Crónica',
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
    free: (supplied: number): string => agreeing(supplied, 'libre', 'libres'),
    occupied: (occupied: number): string => agreeing(occupied, 'ocupado', 'ocupados'),
    finished: 'Terminada',
    justFinished: 'La obra ha terminado. Estamos poniendo al día tu feudo.',
    upgrade: 'Mejorar',
    cancel: 'Cancelar la obra',
    cancelOf: (building: BuildingKind, level: number): string =>
      `Cancelar la obra: ${buildings[building]}, ${names.level(level)}`,
    maxLevel: 'Nivel máximo',
    nextLevel: (level: number): string => `Sube a ${names.level(level)}.`,
    atMaxLevel,
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
  },
  study: {
    section: 'Biblioteca',
    seasonMark: (season: SeasonKind): string =>
      `${capitalize(seasonsWithArticle[season])} acorta los estudios`,
    start: 'Estudiar',
    cancel: 'Cancelar el estudio',
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
    nextUnitIn: (unit: UnitKind): string => `Siguiente ${units[unit].singular} en`,
    orderCompleteIn: 'Leva completa en',
    unitTitle: (unit: UnitKind): string => capitalize(units[unit].plural),
    unitCount: (unit: UnitKind, count: number): string =>
      agreeing(count, units[unit].singular, units[unit].plural),
    countField: (unit: UnitKind): string => `${capitalize(units[unit].plural)} a reclutar`,
    recruit: (unit: UnitKind): string => `Reclutar ${units[unit].plural}`,
    cancel: 'Cancelar la leva',
    cancelOf: (unit: UnitKind, count: number): string =>
      `Cancelar la leva: ${countedUnits(unit, count)}`,
    orderRunning: 'Ya hay una leva en marcha.',
    invalidCount: 'Un número entero, al menos 1.',
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
    } satisfies Readonly<Record<FiefEvent['kind'], string>>,
    subject: (label: string, level: number): string => `${label}, ${names.level(level)}.`,
    recruits: (unit: UnitKind, count: number): string => `${countedUnits(unit, count)}.`,
    recruitsCancelled: (unit: UnitKind, delivered: number, cancelled: number): string =>
      `${countedUnits(unit, delivered)} en filas, ${countedUnits(unit, cancelled)} de vuelta al campo.`,
    march: (province: number, plot: number, infantry: number): string =>
      `provincia ${province}, parcela ${plot}, ${countedUnits('infantry', infantry)}.`,
    recovered: 'Recuperas',
    refunded: (refund: ReadonlyArray<ResourceQuantity>): string =>
      `Recuperas ${quantitiesOf(refund)}.`,
    received: 'Recibes',
    looted: (loot: ReadonlyArray<ResourceQuantity>): string => `Recibes ${quantitiesOf(loot)}.`,
  },
  map: {
    title: 'Mapa',
    loading: 'Estamos leyendo el mapa…',
    heading: (kingdom: number, province: number): string =>
      `${kingdoms[kingdom] ?? String(kingdom)}, provincia ${province}`,
    terrain: (terrain: Terrain): string => `Terreno: ${terrains[terrain]}`,
    plot: (plot: number): string => `Parcela ${plot}`,
    free: 'libre',
    ownFief: 'Tu feudo',
    previous: 'Provincia anterior',
    next: 'Provincia siguiente',
    jump: 'Ir a la provincia',
    backToOwnProvince: 'Ir a tu provincia',
  },
  refusals,
} as const
