export const mailCopy = {
  verification: {
    subject: 'Confirma tu correo',
    textWith: (link: string): string =>
      [
        'Confirma que este correo es el de tu feudo abriendo este enlace:',
        '',
        link,
        '',
        'El enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.',
        '',
        'Si no has fundado ningún feudo, ignora este correo.',
      ].join('\n'),
  },
  reset: {
    subject: 'Cambia tu contraseña',
    textWith: (link: string): string =>
      [
        'Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:',
        '',
        link,
        '',
        'El enlace vale una hora y una sola vez.',
        '',
        'Si no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.',
      ].join('\n'),
  },
} as const
