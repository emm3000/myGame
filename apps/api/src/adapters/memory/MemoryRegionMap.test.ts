import { regionMapContract } from '../regionMapContract'
import { MemoryRegionMap } from './MemoryRegionMap'

regionMapContract('MemoryRegionMap', async (heldTowns) => new MemoryRegionMap(heldTowns))
