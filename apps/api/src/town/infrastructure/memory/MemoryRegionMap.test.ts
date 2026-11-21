import { MemoryRegionMap } from './MemoryRegionMap'
import { regionMapContract } from './regionMapContract.testSupport'

regionMapContract('MemoryRegionMap', async (heldTowns) => new MemoryRegionMap(heldTowns))
