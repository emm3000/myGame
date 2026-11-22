import { inMemoryAccounts } from '@mygame/domain/testing'
import { accountsContract } from './accountsContract.testSupport'

accountsContract('inMemoryAccounts', async () => inMemoryAccounts())
