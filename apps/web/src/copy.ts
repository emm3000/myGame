import type { ArtKind, BuildingKind, FiefEvent, ResourceKind, Terrain } from '@mygame/contracts'
import type { ApiRefusal } from './api/apiClient'
import { formatQuantity } from './design-system/formatQuantity'

interface ResourceQuantity {
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
}

const arts: Readonly<Record<ArtKind, string>> = {
  smithing: 'herrería',
  masonry: 'cantería',
}

const kingdoms: Readonly<Partial<Record<number, string>>> = {
  1: 'Vadoalto',
}

const terrains: Readonly<Record<Terrain, string>> = {
  lowlands: 'vega',
  uplands: 'páramo',
  ridges: 'riscos',
}

const listFormat = new Intl.ListFormat('es', { type: 'conjunction' })

const agreeing = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural

const names = {
  resources,
  peasants: 'campesinos',
  buildings,
  kingdoms,
  terrains,
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
} as const

const quantitiesOf = (quantities: ReadonlyArray<ResourceQuantity>): string =>
  listFormat.format(
    quantities.map(({ amount, resource }) => `${formatQuantity(amount)} de ${resources[resource]}`),
  )

const ratePercent = (percent: number, resource: ResourceKind): string =>
  `+${percent} % de ${resources[resource]} / h`

const atMaxLevel = 'Ya está en su nivel más alto.'

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
      title: 'Entra en tu feudo',
      submit: 'Entrar',
      switchPrompt: '¿Aún no tienes feudo?',
      switchLink: 'Crea tu cuenta',
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
    notEnoughPeasants: (needed: number, free: number): string =>
      `Necesitas ${needed} ${agreeing(needed, 'campesino libre', 'campesinos libres')} y tienes ${free}.`,
  },
  study: {
    section: 'Biblioteca',
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
    } satisfies Readonly<Record<FiefEvent['kind'], string>>,
    subject: (label: string, level: number): string => `${label}, ${names.level(level)}.`,
    recovered: 'Recuperas',
    refunded: (refund: ReadonlyArray<ResourceQuantity>): string =>
      `Recuperas ${quantitiesOf(refund)}.`,
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
  },
  refusals,
} as const
