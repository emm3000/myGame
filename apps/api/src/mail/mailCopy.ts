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
} as const
