import type { PlayerId } from '#player/PlayerId'
import type { Accounts, PlayerCredentials, StoredPlayer } from '../domain/Accounts'

const storedPlayerOf = ({
  passwordHash: _passwordHash,
  ...player
}: PlayerCredentials): StoredPlayer => player

export const inMemoryAccounts = (): Accounts => {
  const players = new Map<PlayerId, PlayerCredentials>()
  const update = (playerId: PlayerId, change: Partial<PlayerCredentials>): void => {
    const held = players.get(playerId)
    if (held !== undefined) {
      players.set(playerId, { ...held, ...change })
    }
  }
  return {
    addPlayer: async ({ id, email, passwordHash, scaffold }) => {
      if ([...players.values()].some((player) => player.email === email)) {
        return { kind: 'emailTaken' }
      }
      const player = { id, email, passwordHash, emailVerified: false, scaffold, scaffoldVersion: 1 }
      players.set(id, player)
      return { kind: 'added', player: storedPlayerOf(player) }
    },
    credentialsOf: async (email) => [...players.values()].find((player) => player.email === email),
    playerOf: async (playerId) => {
      const held = players.get(playerId)
      return held === undefined ? undefined : storedPlayerOf(held)
    },
    lockPlayer: async () => {},
    markEmailVerified: async (playerId) => update(playerId, { emailVerified: true }),
    storePasswordHash: async (playerId, passwordHash) => update(playerId, { passwordHash }),
    storeScaffold: async (playerId, scaffold) => {
      const held = players.get(playerId)
      const scaffoldVersion = (held?.scaffoldVersion ?? 0) + 1
      update(playerId, { scaffold, scaffoldVersion })
      return storedPlayerOf({
        id: playerId,
        email: held?.email ?? '',
        passwordHash: held?.passwordHash ?? '',
        emailVerified: held?.emailVerified ?? false,
        scaffold,
        scaffoldVersion,
      })
    },
  }
}
