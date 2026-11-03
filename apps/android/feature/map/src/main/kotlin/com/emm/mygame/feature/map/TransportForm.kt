package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.UnitCount

internal fun FiefSnapshot.transportFormOf(choice: MarchChoice): MapUiState.TransportForm {
    val party: List<UnitCount>? = partyOf(choice.entries)
    val cargo: List<ResourceQuantity>? = cargoOf(choice.cargoEntries)
    val atHome: List<UnitCount> = unitsAtHome()
    return MapUiState.TransportForm(
        target = choice.target,
        atHome = atHome,
        entries = atHome.map { home: UnitCount ->
            MapUiState.PartyEntry(home.unit, choice.entries[home.unit].orEmpty())
        },
        cargoEntries = ResourceKind.entries.map { kind: ResourceKind ->
            MapUiState.CargoEntry(kind, choice.cargoEntries[kind].orEmpty())
        },
        isFieldLocked = march != null,
        preview = if (party == null || cargo == null) null else transportPreviewOf(choice.target, party, cargo),
        block = when {
            march != null -> MapUiState.MarchBlock.MarchAway
            party == null || cargo == null -> MapUiState.MarchBlock.InvalidCount
            else -> partyBlockOf(party) ?: cargoBlockOf(party, cargo)
        },
        send = choice.send,
    )
}

internal fun transportLoadOf(choice: MarchChoice): TransportLoad? {
    val party: List<UnitCount> = partyOf(choice.entries)?.takeIf { sent: List<UnitCount> -> sent.isNotEmpty() }
        ?: return null
    val cargo: List<ResourceQuantity> = cargoOf(choice.cargoEntries) ?: return null
    return TransportLoad(party = party.everyPartyKind(), cargo = cargo)
}

private fun FiefSnapshot.transportPreviewOf(
    target: PlotAddress,
    party: List<UnitCount>,
    cargo: List<ResourceQuantity>,
): MapUiState.TransportPreview = MapUiState.TransportPreview(
    cargo = cargo.total(),
    carry = carryOf(party),
    road = if (party.isEmpty()) null else oneWayTo(target, party),
)

private fun FiefSnapshot.cargoBlockOf(party: List<UnitCount>, cargo: List<ResourceQuantity>): MapUiState.MarchBlock? {
    val total: Long = cargo.total()
    val carry: Long = carryOf(party)
    val shortfalls: List<ResourceQuantity> = cargo.mapNotNull { sent: ResourceQuantity ->
        val stored: Long = resources.firstOrNull { stock: StoredResource -> stock.kind == sent.kind }?.amount ?: 0
        (sent.amount - stored).takeIf { missing: Long -> missing > 0 }
            ?.let { missing: Long -> ResourceQuantity(sent.kind, missing) }
    }
    return when {
        total == 0L -> MapUiState.MarchBlock.EmptyCargo
        total > carry -> MapUiState.MarchBlock.CargoAboveCarry(cargo = total, carry = carry)
        shortfalls.isNotEmpty() -> MapUiState.MarchBlock.Shortfalls(shortfalls)
        else -> null
    }
}

private fun cargoOf(entries: Map<ResourceKind, String>): List<ResourceQuantity>? = ResourceKind.entries.map { kind ->
    ResourceQuantity(kind, wholeCountOf(entries[kind].orEmpty())?.toLong() ?: return null)
}

private fun List<ResourceQuantity>.total(): Long = sumOf { quantity: ResourceQuantity -> quantity.amount }
