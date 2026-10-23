const highestPort = 65535

export const listenPortOf = (environment: NodeJS.ProcessEnv): number => {
  const port = Number(environment.API_PORT)
  if (!Number.isInteger(port) || port <= 0 || port > highestPort) {
    throw new Error(
      `API_PORT must be an integer from 1 to ${highestPort}, got ${environment.API_PORT}`,
    )
  }
  return port
}
