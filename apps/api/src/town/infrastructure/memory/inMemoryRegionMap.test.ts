import { MemoryRegionMapReader } from './MemoryRegionMapReader'
import { regionMapReaderContract } from './regionMapReaderContract.testSupport'

regionMapReaderContract(
  'MemoryRegionMapReader',
  async (heldTowns) => new MemoryRegionMapReader(heldTowns),
)
