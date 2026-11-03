package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours

internal fun FiefSnapshot.forageFormOf(choice: MarchChoice, terrain: Terrain): MapUiState.ForageForm {
    val party: List<UnitCount>? = partyOf(choice.entries)
    val hours: Int? = hoursOf(choice.hoursEntry)?.takeIf { whole: Int -> whole <= forageTerms.maxStayHours }
    val atHome: List<UnitCount> = unitsAtHome()
    return MapUiState.ForageForm(
        target = choice.target,
        atHome = atHome,
        entries = atHome.map { home: UnitCount ->
            MapUiState.PartyEntry(home.unit, choice.entries[home.unit].orEmpty())
        },
        hoursEntry = choice.hoursEntry,
        maxStayHours = forageTerms.maxStayHours,
        isFieldLocked = march != null,
        preview = if (party == null || hours == null || party.isEmpty()) {
            null
        } else {
            foragePreviewOf(choice.target, party, hours, terrain)
        },
        block = forageBlockOf(party = party, hours = hours),
        send = choice.send,
    )
}

internal fun forageRequestOf(choice: MarchChoice): ForageRequest? {
    val party: List<UnitCount> = partyOf(choice.entries)?.takeIf { sent: List<UnitCount> -> sent.isNotEmpty() }
        ?: return null
    val stayHours: Int = hoursOf(choice.hoursEntry) ?: return null
    return ForageRequest(party = party.everyPartyKind(), stayHours = stayHours)
}

private fun FiefSnapshot.forageBlockOf(party: List<UnitCount>?, hours: Int?): MapUiState.MarchBlock? = when {
    march != null -> MapUiState.MarchBlock.MarchAway
    party == null -> MapUiState.MarchBlock.InvalidCount
    hours == null -> MapUiState.MarchBlock.InvalidHours(forageTerms.maxStayHours)
    else -> partyBlockOf(party)
}

private fun FiefSnapshot.foragePreviewOf(
    target: PlotAddress,
    party: List<UnitCount>,
    hours: Int,
    terrain: Terrain,
): MapUiState.ForagePreview {
    val road: Duration = oneWayTo(target, party)
    return MapUiState.ForagePreview(
        road = road,
        returnIn = road * 2 + hours.hours,
        loot = forageLootOf(terrain, party, hours),
    )
}

private fun FiefSnapshot.forageLootOf(terrain: Terrain, party: List<UnitCount>, hours: Int): List<ResourceQuantity> {
    val rates: List<ResourceQuantity> = forageTerms.yieldPerHour[terrain].orEmpty()
        .map { rate: ResourceQuantity -> if (rate.kind == ResourceKind.Gold) rate.copy(amount = 0) else rate }
    val yielded: Int = rates.count { rate: ResourceQuantity -> rate.amount > 0 }
    if (yielded == 0) return emptyList()
    val heads: Long = party.sumOf { sent: UnitCount -> sent.count.toLong() }
    val carryShare: Long = carryOf(party) / yielded
    return rates
        .filter { rate: ResourceQuantity -> rate.amount > 0 }
        .map { rate: ResourceQuantity ->
            val percent: Int = season?.loot?.get(rate.kind) ?: NEUTRAL_PERCENT
            val foraged: Long = heads * rate.amount * hours * percent / NEUTRAL_PERCENT
            ResourceQuantity(rate.kind, minOf(foraged, carryShare))
        }
        .filter { loot: ResourceQuantity -> loot.amount > 0 }
}

private fun hoursOf(entry: String): Int? =
    if (wholeCount.matches(entry)) entry.toIntOrNull()?.takeIf { hours: Int -> hours >= 1 } else null
