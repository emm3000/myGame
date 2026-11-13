package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.HoldoutChecks
import com.emm.mygame.core.network.generated.models.HoldoutCheckState as WireHoldoutCheck
import com.emm.mygame.core.network.generated.models.HoldoutCheckWeek as WireHoldoutCheckWeek

internal fun HoldoutChecks.toChecks(): List<HoldoutCheck>? {
    val known: List<HoldoutCheck> = checks.mapNotNull(::checkOf)
    return if (known.size == checks.size) known else null
}

private fun checkOf(check: WireHoldoutCheck): HoldoutCheck? = when (check) {
    is WireHoldoutCheck.DueWrapper -> {
        val band: PlacementBand? = check.value.band.toBand()
        val week: HoldoutCheckWeek? = check.value.week.toWeek()
        if (band == null || week == null) null else HoldoutCheck.Due(band, week)
    }
    is WireHoldoutCheck.AskingWrapper -> {
        val band: PlacementBand? = check.value.band.toBand()
        val week: HoldoutCheckWeek? = check.value.week.toWeek()
        if (band == null || week == null) null else HoldoutCheck.Asking(band, week, check.value.items.map(::itemOf))
    }
}

private fun WireHoldoutCheckWeek.toWeek(): HoldoutCheckWeek? = when (this) {
    WireHoldoutCheckWeek._8 -> HoldoutCheckWeek.Eighth
    WireHoldoutCheckWeek._24 -> HoldoutCheckWeek.TwentyFourth
    WireHoldoutCheckWeek.unknown_default_open_api -> null
}
