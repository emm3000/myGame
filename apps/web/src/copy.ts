import type { ApiRefusal } from './api/apiClient'

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

export const copy = {
  shell: {
    title: 'myGame',
    welcome: 'Tu feudo te espera. Pronto podrás levantarlo piedra a piedra.',
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
  refusals,
} as const
