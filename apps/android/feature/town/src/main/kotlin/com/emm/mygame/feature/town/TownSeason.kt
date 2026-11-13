package com.emm.mygame.feature.town

import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.UNSCALED_PERCENT
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Instant

internal fun TownSnapshot.seasonLineAt(now: Instant): TownUiState.SeasonLine? {
    val inForce: SeasonInForce = seasonInForce ?: return null
    val endsAt: Instant = seasonEndsAt ?: return null
    return TownUiState.SeasonLine(
        kind = inForce.kind,
        year = inForce.year,
        remaining = countdownTo(finishesAt = endsAt, now = now),
        productionMarks = inForce.productionMarks(),
    )
}

private fun SeasonInForce.productionMarks(): List<TownUiState.ProductionMark> =
    TownResourceKind.entries
        .map { resource: TownResourceKind ->
            TownUiState.ProductionMark(resource, percent = productionPercent.of(resource))
        }
        .filter { mark: TownUiState.ProductionMark -> mark.percent != UNSCALED_PERCENT }

internal fun SeasonInForce.buildMark(): TownUiState.DurationMark? =
    TownUiState.DurationMark(kind, durationPercent.build).takeUnless { mark: TownUiState.DurationMark ->
        mark.percent == UNSCALED_PERCENT
    }
