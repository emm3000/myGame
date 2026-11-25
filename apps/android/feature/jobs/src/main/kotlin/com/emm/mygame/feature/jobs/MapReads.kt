package com.emm.mygame.feature.jobs

import kotlinx.coroutines.Job

internal data class MapReads(val projection: Job?, val areaRead: Job?, val quoteRead: Job?) {

    companion object {
        val none: MapReads = MapReads(projection = null, areaRead = null, quoteRead = null)
    }
}
