import type { BuildingKind, ResourceKind } from '@mygame/contracts'
import type { ApiRefusal } from './api/apiClient'
import { formatQuantity } from './design-system/formatQuantity'

interface Shortfall {
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
  SlotBusy: 'Ya tienes una obra en marcha. Espera a que termine.',
  InsufficientResources: 'No tienes recursos suficientes para esa obra.',
  NotEnoughPeasants: 'No tienes campesinos libres suficientes para esa obra.',
  BlankFiefName: 'Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
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
}

const kingdoms: Readonly<Partial<Record<number, string>>> = {
  1: 'Vadoalto',
}

const listFormat = new Intl.ListFormat('es', { type: 'conjunction' })

const agreeing = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural

const names = {
  resources,
  peasants: 'campesinos',
  buildings,
  kingdoms,
  level: (level: number): string => `nivel ${level}`,
  slot: 'la obra',
  busySlot: 'una obra en marcha',
  idleSlot: 'Tu feudo no tiene obra.',
} as const

export const copy = {
  shell: {
    title: 'myGame',
    signOut: 'Salir',
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
    maxLevel: 'Nivel máximo',
    nextLevel: (level: number): string => `Sube a ${names.level(level)}.`,
    atMaxLevel: 'Ya está en su nivel más alto.',
    tooExpensive: (shortfalls: ReadonlyArray<Shortfall>): string => {
      const isSingleOne = shortfalls.length === 1 && shortfalls[0]?.amount === 1
      const verb = isSingleOne ? 'falta' : 'faltan'
      const missing = shortfalls.map(
        ({ amount, resource }) => `${formatQuantity(amount)} de ${resources[resource]}`,
      )
      return `Te ${verb} ${listFormat.format(missing)}.`
    },
    notEnoughPeasants: (needed: number, free: number): string =>
      `Necesitas ${needed} ${agreeing(needed, 'campesino libre', 'campesinos libres')} y tienes ${free}.`,
  },
  refusals,
} as const
