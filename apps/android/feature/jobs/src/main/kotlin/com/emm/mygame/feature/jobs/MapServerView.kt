package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.jobs.RegionMap
import kotlin.time.Duration

internal data class MapServerView(
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
        val site: Int = choices.chosen ?: return null
        val send: SiteSend = siteSendOf(readMap, site, choices.entries) ?: return null
        if (send.team.values.sum() == 0) return null
        return QuoteAsk(send, shownTown.seasonEndsAt)
    }

    companion object {
        val none: MapServerView = MapServerView(
            askedArea = null,
            area = AreaRead.Reading,
            town = null,
            isTownFailed = false,
            gap = Duration.ZERO,
        )
    }
}
