package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.UNSCALED_PERCENT
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.ui.DurationMark
import kotlin.time.Instant

internal fun TownSnapshot.seasonLineAt(now: Instant): SeasonLine? {
    val inForce: SeasonInForce = seasonInForce ?: return null
    val endsAt: Instant = seasonEndsAt ?: return null
    return SeasonLine(
        kind = inForce.kind,
        year = inForce.year,
        remaining = countdownTo(finishesAt = endsAt, now = now),
        productionMarks = inForce.productionMarks(),
    )
}

private fun SeasonInForce.productionMarks(): List<ProductionMark> =
    TownResourceKind.entries
        .map { resource: TownResourceKind ->
            ProductionMark(resource, percent = productionPercent.of(resource))
        }
        .filter { mark: ProductionMark -> mark.percent != UNSCALED_PERCENT }

internal fun SeasonInForce.buildMark(): DurationMark? = markAt(durationPercent.build)

internal fun SeasonInForce.hireMark(): DurationMark? = markAt(durationPercent.hire)

private fun SeasonInForce.markAt(percent: Int): DurationMark? =
    if (percent == UNSCALED_PERCENT) null else DurationMark(kind, percent)
