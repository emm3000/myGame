import { mailerContract } from '../mailerContract'
import { MemoryMailer } from './MemoryMailer'

mailerContract('MemoryMailer', async () => {
  const mailer = new MemoryMailer()
  return {
    mailer,
    unreachableMailer: MemoryMailer.failing(),
    deliveredTo: async (recipient) => mailer.sentTo(recipient),
  }
})
