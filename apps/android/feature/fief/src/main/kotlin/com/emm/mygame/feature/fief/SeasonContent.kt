package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

internal fun FiefSnapshot.seasonLineAt(now: Instant): FiefUiState.SeasonLine? {
    val inForce: SeasonInForce = seasonInForce ?: return null
    val endsAt: Instant = seasonEndsAt ?: return null
    return FiefUiState.SeasonLine(
        kind = inForce.kind,
        year = inForce.year,
        next = inForce.kind.next(),
        countdown = countdownTo(finishesAt = endsAt, now = now).toSeasonCountdown(),
    )
}

private fun SeasonKind.next(): SeasonKind = when (this) {
    SeasonKind.Spring -> SeasonKind.Summer
    SeasonKind.Summer -> SeasonKind.Autumn
    SeasonKind.Autumn -> SeasonKind.Winter
    SeasonKind.Winter -> SeasonKind.Spring
}

private fun Duration.toSeasonCountdown(): FiefUiState.SeasonCountdown = when {
    this >= 1.days -> FiefUiState.SeasonCountdown.InDays(days = inWholeDays.toInt())
    this >= 1.minutes -> FiefUiState.SeasonCountdown.UnderADay(remaining = this)
    else -> FiefUiState.SeasonCountdown.InSeconds(seconds = inWholeSeconds.toInt())
}
