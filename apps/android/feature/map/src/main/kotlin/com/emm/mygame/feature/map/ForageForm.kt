package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UnitState
import kotlin.math.abs
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds

internal fun FiefSnapshot.firstChoiceOn(target: PlotAddress): ForageChoice {
    val atHome: List<UnitCount> = unitsAtHome()
    val firstSent: UnitKind = atHome.firstOrNull { home: UnitCount -> home.count > 0 }?.unit ?: atHome.first().unit
    return ForageChoice(
        target = target,
        entries = atHome.associate { home: UnitCount -> home.unit to if (home.unit == firstSent) "1" else "0" },
        hoursEntry = FIRST_HOURS,
        send = MapUiState.SendStatus.Idle,
    )
}

internal fun FiefSnapshot.formOf(choice: ForageChoice, terrain: Terrain): MapUiState.ForageForm {
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
            previewOf(choice.target, party, hours, terrain)
        },
        block = blockOf(party = party, hours = hours, atHome = atHome),
        send = choice.send,
    )
}

internal fun requestOf(choice: ForageChoice): ForageRequest? {
    val party: List<UnitCount> = partyOf(choice.entries)?.takeIf { sent: List<UnitCount> -> sent.isNotEmpty() }
        ?: return null
    val stayHours: Int = hoursOf(choice.hoursEntry) ?: return null
    return ForageRequest(
        party = partyKinds.map { kind: UnitKind -> UnitCount(kind, party.countOf(kind)) },
        stayHours = stayHours,
    )
}

internal fun FiefSnapshot.sentForage(): MapUiState.SentForage? = march?.let { away: AwayMarch ->
    MapUiState.SentForage(
        target = away.target,
        units = away.units.filter { count: UnitCount -> count.count > 0 },
        returnIn = away.returnsAt - readAt,
        loot = away.loot,
    )
}

private fun FiefSnapshot.unitsAtHome(): List<UnitCount> = units
    .filter { state: UnitState -> state.kind in partyKinds }
    .map { state: UnitState -> UnitCount(state.kind, state.count - state.away) }

private fun FiefSnapshot.blockOf(
    party: List<UnitCount>?,
    hours: Int?,
    atHome: List<UnitCount>,
): MapUiState.ForageBlock? {
    val short: UnitCount? = atHome.firstOrNull { home: UnitCount -> (party?.countOf(home.unit) ?: 0) > home.count }
    return when {
        march != null -> MapUiState.ForageBlock.MarchAway
        party == null -> MapUiState.ForageBlock.InvalidCount
        hours == null -> MapUiState.ForageBlock.InvalidHours(forageTerms.maxStayHours)
        party.isEmpty() -> MapUiState.ForageBlock.EmptyParty
        short != null -> MapUiState.ForageBlock.NotEnoughAtHome(short.unit, party.countOf(short.unit), short.count)
        else -> null
    }
}

private fun FiefSnapshot.previewOf(
    target: PlotAddress,
    party: List<UnitCount>,
    hours: Int,
    terrain: Terrain,
): MapUiState.ForagePreview {
    val road: Duration = oneWayTo(target, party)
    return MapUiState.ForagePreview(
        road = road,
        returnIn = road * 2 + hours.hours,
        loot = lootOf(terrain, party, hours),
    )
}

private fun FiefSnapshot.oneWayTo(target: PlotAddress, party: List<UnitCount>): Duration {
    val baseSeconds: Long = abs(target.province - coordinates.province).toLong() * forageTerms.secondsPerProvince +
        abs(target.plot - coordinates.plot).toLong() * forageTerms.secondsPerPlot
    val slowestPercent: Int = party.maxOfOrNull { sent: UnitCount -> stateOf(sent.unit)?.roadPercent ?: 0 } ?: 0
    val scaled: Long = baseSeconds * slowestPercent * (season?.road ?: NEUTRAL_PERCENT)
    return ((scaled + PERCENT_OF_PERCENT - 1) / PERCENT_OF_PERCENT).seconds
}

private fun FiefSnapshot.lootOf(terrain: Terrain, party: List<UnitCount>, hours: Int): List<ResourceQuantity> {
    val rates: List<ResourceQuantity> = forageTerms.yieldPerHour[terrain].orEmpty()
        .map { rate: ResourceQuantity -> if (rate.kind == ResourceKind.Gold) rate.copy(amount = 0) else rate }
    val yielded: Int = rates.count { rate: ResourceQuantity -> rate.amount > 0 }
    if (yielded == 0) return emptyList()
    val heads: Long = party.sumOf { sent: UnitCount -> sent.count.toLong() }
    val carry: Long = party.sumOf { sent: UnitCount -> sent.count.toLong() * (stateOf(sent.unit)?.carry ?: 0) }
    val carryShare: Long = carry / yielded
    return rates
        .filter { rate: ResourceQuantity -> rate.amount > 0 }
        .map { rate: ResourceQuantity ->
            val percent: Int = season?.loot?.get(rate.kind) ?: NEUTRAL_PERCENT
            val foraged: Long = heads * rate.amount * hours * percent / NEUTRAL_PERCENT
            ResourceQuantity(rate.kind, minOf(foraged, carryShare))
        }
        .filter { loot: ResourceQuantity -> loot.amount > 0 }
}

private fun FiefSnapshot.stateOf(kind: UnitKind): UnitState? =
    units.firstOrNull { state: UnitState -> state.kind == kind }

private fun partyOf(entries: Map<UnitKind, String>): List<UnitCount>? = partyKinds
    .map { kind: UnitKind -> UnitCount(kind, wholeCountOf(entries[kind].orEmpty()) ?: return null) }
    .filter { sent: UnitCount -> sent.count > 0 }

private fun List<UnitCount>.countOf(kind: UnitKind): Int =
    firstOrNull { sent: UnitCount -> sent.unit == kind }?.count ?: 0

private fun wholeCountOf(entry: String): Int? = when {
    entry.isEmpty() -> 0
    wholeCount.matches(entry) -> entry.toIntOrNull()
    else -> null
}

private fun hoursOf(entry: String): Int? =
    if (wholeCount.matches(entry)) entry.toIntOrNull()?.takeIf { hours: Int -> hours >= 1 } else null

private val partyKinds: List<UnitKind> = UnitKind.entries.filter { kind: UnitKind -> kind != UnitKind.Settler }

private val wholeCount: Regex = Regex("^[0-9]+$")

private const val FIRST_HOURS: String = "1"

private const val NEUTRAL_PERCENT: Int = 100

private const val PERCENT_OF_PERCENT: Long = 10_000
