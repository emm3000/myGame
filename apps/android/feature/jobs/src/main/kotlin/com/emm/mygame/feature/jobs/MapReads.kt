package com.emm.mygame.feature.jobs

import kotlinx.coroutines.Job

internal data class MapReads(val projection: Job?, val areaReading: Job?, val quoteReading: Job?) {

    companion object {
        val none: MapReads = MapReads(projection = null, areaReading = null, quoteReading = null)
    }
}
