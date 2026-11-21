import type { StoredPlayer } from './ports/Accounts'

export type MailRecipient = Pick<StoredPlayer, 'email' | 'scaffold'>
