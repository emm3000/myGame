export const mailResetSubject = (): string => `Cambia tu contraseña`
export const mailResetText = ({ link }: { readonly link: string | number }): string => `Alguien ha pedido cambiar la contraseña de tu feudo. Si fuiste tú, abre este enlace y elige una nueva:\n\n${String(link)}\n\nEl enlace vale una hora y una sola vez.\n\nSi no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.`
export const mailVerificationSubject = (): string => `Confirma tu correo`
export const mailVerificationText = ({ link }: { readonly link: string | number }): string => `Confirma que este correo es el de tu feudo abriendo este enlace:\n\n${String(link)}\n\nEl enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu feudo.\n\nSi no has fundado ningún feudo, ignora este correo.`
