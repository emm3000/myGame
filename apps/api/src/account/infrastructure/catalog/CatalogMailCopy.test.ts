import { describe, expect, it } from 'vitest'
import { CatalogMailCopy } from './CatalogMailCopy'

const link = 'https://townword.example/verify-email?token=opaque-token'

describe('CatalogMailCopy', () => {
  it('writes the verification mail in English for a player without a scaffold', () => {
    expect(new CatalogMailCopy().verificationMail('none', link)).toEqual({
      subject: 'Confirm your email',
      text: `Open this link to confirm this email for your town:\n\n${link}\n\nThe link works for 24 hours and only once. If it expires, ask for another one from your town.\n\nIf you have not started a town, ignore this email.`,
    })
  })

  it('writes the verification mail in Spanish for a player on the Spanish scaffold', () => {
    expect(new CatalogMailCopy().verificationMail('es', link)).toEqual({
      subject: 'Confirma tu correo',
      text: `Confirma que este correo es el de tu pueblo abriendo este enlace:\n\n${link}\n\nEl enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu pueblo.\n\nSi no has fundado ningún pueblo, ignora este correo.`,
    })
  })

  it('writes the reset mail in English for a player without a scaffold', () => {
    expect(new CatalogMailCopy().resetMail('none', link)).toEqual({
      subject: 'Change your password',
      text: `Someone asked to change your Townword password. If it was you, open this link and choose a new one:\n\n${link}\n\nThe link works for one hour and only once.\n\nIf you did not ask for this, ignore this email: your password stays the same.`,
    })
  })

  it('writes the reset mail in Spanish for a player on the Spanish scaffold', () => {
    expect(new CatalogMailCopy().resetMail('es', link)).toEqual({
      subject: 'Cambia tu contraseña',
      text: `Alguien ha pedido cambiar tu contraseña de Townword. Si fuiste tú, abre este enlace y elige una nueva:\n\n${link}\n\nEl enlace vale una hora y una sola vez.\n\nSi no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.`,
    })
  })
})
