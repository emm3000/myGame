import { MemoryRegionMap } from './MemoryRegionMapReader'
import { regionMapContract } from './regionMapReaderContract.testSupport'

regionMapContract('MemoryRegionMap', async (heldTowns) => new MemoryRegionMap(heldTowns))
