import type { StoredPlayer } from './Accounts'

export type MailRecipient = Pick<StoredPlayer, 'email' | 'scaffold'>
