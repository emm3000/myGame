package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.HoldoutChecks
import com.emm.mygame.core.network.generated.models.HoldoutCheckState as WireHoldoutCheck
import com.emm.mygame.core.network.generated.models.HoldoutCheckWeek as WireHoldoutCheckWeek
import com.emm.mygame.core.network.generated.models.PlacementBand as WirePlacementBand

internal fun HoldoutChecks.toChecks(): List<HoldoutCheck>? {
    val known: List<HoldoutCheck> = checks.mapNotNull(::checkOf)
    return if (known.size == checks.size) known else null
}

private fun checkOf(check: WireHoldoutCheck): HoldoutCheck? = when (check) {
    is WireHoldoutCheck.DueWrapper -> knownCheckOf(check.value.band, check.value.week) { band, week ->
        HoldoutCheck.Due(band, week)
    }
    is WireHoldoutCheck.AskingWrapper -> knownCheckOf(check.value.band, check.value.week) { band, week ->
        HoldoutCheck.Asking(band, week, check.value.items.map(::itemOf))
    }
}

private fun knownCheckOf(
    wireBand: WirePlacementBand,
    wireWeek: WireHoldoutCheckWeek,
    checkAt: (PlacementBand, HoldoutCheckWeek) -> HoldoutCheck,
): HoldoutCheck? {
    val band: PlacementBand = wireBand.toBand() ?: return null
    val week: HoldoutCheckWeek = wireWeek.toWeek() ?: return null
    return checkAt(band, week)
}

internal fun WireHoldoutCheckWeek.toWeek(): HoldoutCheckWeek? = when (this) {
    WireHoldoutCheckWeek._8 -> HoldoutCheckWeek.Eighth
    WireHoldoutCheckWeek._24 -> HoldoutCheckWeek.TwentyFourth
    WireHoldoutCheckWeek.unknown_default_open_api -> null
}
