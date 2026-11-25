package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.jobs.RegionMap
import kotlin.time.Duration

internal data class MapAnswers(
    val askedArea: Int?,
    val area: AreaRead,
    val town: TownSnapshot?,
    val isTownFailed: Boolean,
    val gap: Duration,
) {

    val map: RegionMap? get() = (area as? AreaRead.Read)?.map

    fun quoteAsk(choices: MapChoices): QuoteAsk? {
        val readMap: RegionMap = map ?: return null
        val shownTown: TownSnapshot = town ?: return null
        return quoteAskOf(readMap, shownTown, choices)
    }

    companion object {
        val none: MapAnswers = MapAnswers(
            askedArea = null,
            area = AreaRead.Reading,
            town = null,
            isTownFailed = false,
            gap = Duration.ZERO,
        )
    }
}
