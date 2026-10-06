import { digestAcknowledgementsContract } from '../digestAcknowledgementsContract'
import { MemoryDigestAcknowledgements } from './MemoryDigestAcknowledgements'

digestAcknowledgementsContract('MemoryDigestAcknowledgements', async () => {
  const acknowledgements = new MemoryDigestAcknowledgements()
  return {
    acknowledgements,
    signUp: (playerId, at) => acknowledgements.acknowledge(playerId, at),
  }
})
