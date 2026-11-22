import { inMemoryRegionMap } from '@mygame/domain/testing'
import { regionMapReaderContract } from './regionMapReaderContract.testSupport'

regionMapReaderContract('inMemoryRegionMap', async (heldTowns) => inMemoryRegionMap(heldTowns))
