package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UnitState
import kotlin.math.abs
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

internal val partyKinds: List<UnitKind> = UnitKind.entries.filter { kind: UnitKind -> kind != UnitKind.Settler }

internal fun FiefSnapshot.unitsAtHome(): List<UnitCount> = units
    .filter { state: UnitState -> state.kind in partyKinds }
    .map { state: UnitState -> UnitCount(state.kind, state.count - state.away) }

internal fun FiefSnapshot.settlersAtHome(): Int =
    stateOf(UnitKind.Settler)?.let { state: UnitState -> state.count - state.away } ?: 0

internal fun FiefSnapshot.firstEntries(): Map<UnitKind, String> {
    val atHome: List<UnitCount> = unitsAtHome()
    val firstSent: UnitKind = atHome.firstOrNull { home: UnitCount -> home.count > 0 }?.unit ?: atHome.first().unit
    return atHome.associate { home: UnitCount -> home.unit to if (home.unit == firstSent) "1" else "0" }
}

internal fun FiefSnapshot.partyBlockOf(party: List<UnitCount>): MapUiState.MarchBlock? {
    val short: UnitCount? = unitsAtHome().firstOrNull { home: UnitCount -> party.countOf(home.unit) > home.count }
    return when {
        party.isEmpty() -> MapUiState.MarchBlock.EmptyParty
        short != null -> MapUiState.MarchBlock.NotEnoughAtHome(short.unit, party.countOf(short.unit), short.count)
        else -> null
    }
}

internal fun FiefSnapshot.oneWayTo(target: PlotAddress, party: List<UnitCount>): Duration {
    val baseSeconds: Long = abs(target.province - coordinates.province).toLong() * forageTerms.secondsPerProvince +
        abs(target.plot - coordinates.plot).toLong() * forageTerms.secondsPerPlot
    val slowestPercent: Int = party
        .filter { sent: UnitCount -> sent.count >= 1 }
        .maxOfOrNull { sent: UnitCount -> stateOf(sent.unit)?.roadPercent ?: 0 } ?: 0
    val scaled: Long = baseSeconds * slowestPercent * (season?.road ?: NEUTRAL_PERCENT)
    return ((scaled + PERCENT_OF_PERCENT - 1) / PERCENT_OF_PERCENT).seconds
}

internal fun FiefSnapshot.carryOf(party: List<UnitCount>): Long =
    party.sumOf { sent: UnitCount -> sent.count.toLong() * (stateOf(sent.unit)?.carry ?: 0) }

internal fun FiefSnapshot.stateOf(kind: UnitKind): UnitState? =
    units.firstOrNull { state: UnitState -> state.kind == kind }

internal fun partyOf(entries: Map<UnitKind, String>): List<UnitCount>? = partyKinds
    .map { kind: UnitKind -> UnitCount(kind, wholeCountOf(entries[kind].orEmpty()) ?: return null) }
    .filter { sent: UnitCount -> sent.count > 0 }

internal fun List<UnitCount>.countOf(kind: UnitKind): Int =
    firstOrNull { sent: UnitCount -> sent.unit == kind }?.count ?: 0

internal fun List<UnitCount>.everyPartyKind(): List<UnitCount> =
    partyKinds.map { kind: UnitKind -> UnitCount(kind, countOf(kind)) }

internal fun wholeCountOf(entry: String): Int? = when {
    entry.isEmpty() -> 0
    wholeCount.matches(entry) -> entry.toIntOrNull()
    else -> null
}

internal val wholeCount: Regex = Regex("^[0-9]+$")

internal const val NEUTRAL_PERCENT: Int = 100

private const val PERCENT_OF_PERCENT: Long = 10_000
