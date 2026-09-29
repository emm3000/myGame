import { campRegistryContract } from '../campRegistryContract'
import { MemoryCampRegistry } from './MemoryCampRegistry'

campRegistryContract('MemoryCampRegistry', async () => ({ camps: new MemoryCampRegistry() }))
