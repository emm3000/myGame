import { MemoryMailer } from './MemoryMailer'
import { mailerContract } from './mailerContract.testSupport'

mailerContract('MemoryMailer', async () => {
  const mailer = new MemoryMailer()
  return {
    mailer,
    unreachableMailer: MemoryMailer.failing(),
    deliveredTo: async (recipient) => mailer.sentTo(recipient),
  }
})
