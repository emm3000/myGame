import type { PlayerId } from '#player/PlayerId'
import type { Accounts, PlayerCredentials, StoredPlayer } from '../domain/Accounts'

const storedPlayerOf = ({
  passwordHash: _passwordHash,
  ...player
}: PlayerCredentials): StoredPlayer => player

const isSameEmail = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase()

export const inMemoryAccounts = (seed: ReadonlyArray<PlayerCredentials> = []): Accounts => {
  const players = new Map(seed.map((player) => [player.id, player]))
  const update = (playerId: PlayerId, change: Partial<PlayerCredentials>): void => {
    const held = players.get(playerId)
    if (held !== undefined) {
      players.set(playerId, { ...held, ...change })
    }
  }
  const credentialsOf = (email: string): PlayerCredentials | undefined =>
    [...players.values()].find((player) => isSameEmail(player.email, email))
  return {
    addPlayer: async ({ id, email, passwordHash, scaffold }) => {
      if (credentialsOf(email) !== undefined) {
        return { kind: 'emailTaken' }
      }
      const player = { id, email, passwordHash, emailVerified: false, scaffold, scaffoldVersion: 0 }
      players.set(id, player)
      return { kind: 'added', player: storedPlayerOf(player) }
    },
    credentialsOf: async (email) => credentialsOf(email),
    playerOf: async (playerId) => {
      const held = players.get(playerId)
      return held === undefined ? undefined : storedPlayerOf(held)
    },
    lockPlayer: async () => {},
    markEmailVerified: async (playerId) => update(playerId, { emailVerified: true }),
    storePasswordHash: async (playerId, passwordHash) => update(playerId, { passwordHash }),
    storeScaffold: async (playerId, scaffold) => {
      const held = players.get(playerId)
      if (held === undefined) {
        throw new Error(`Player ${playerId} holds no account`)
      }
      const stored = { ...held, scaffold, scaffoldVersion: held.scaffoldVersion + 1 }
      players.set(playerId, stored)
      return storedPlayerOf(stored)
    },
  }
}
