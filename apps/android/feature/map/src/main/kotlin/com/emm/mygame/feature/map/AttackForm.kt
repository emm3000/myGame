package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import kotlin.time.Duration

internal fun FiefSnapshot.attackFormOf(choice: MarchChoice, camp: MarchCamp, terrain: Terrain): MapUiState.AttackForm {
    val party: List<UnitCount>? = partyOf(choice.entries)
    val atHome: List<UnitCount> = unitsAtHome()
    return MapUiState.AttackForm(
        target = choice.target,
        atHome = atHome,
        entries = atHome.map { home: UnitCount ->
            MapUiState.PartyEntry(home.unit, choice.entries[home.unit].orEmpty())
        },
        isFieldLocked = march != null,
        preview = if (party == null || party.isEmpty()) null else attackPreviewOf(choice.target, party, camp, terrain),
        block = when {
            march != null -> MapUiState.MarchBlock.MarchAway
            party == null -> MapUiState.MarchBlock.InvalidCount
            else -> partyBlockOf(party)
        },
        send = choice.send,
    )
}

internal fun attackPartyOf(choice: MarchChoice): List<UnitCount>? =
    partyOf(choice.entries)?.takeIf { sent: List<UnitCount> -> sent.isNotEmpty() }?.everyPartyKind()

private fun FiefSnapshot.attackPreviewOf(
    target: PlotAddress,
    party: List<UnitCount>,
    camp: MarchCamp,
    terrain: Terrain,
): MapUiState.AttackPreview {
    val road: Duration = oneWayTo(target, party)
    val battle: PartyBattle = partyBattleOf(party.everyPartyKind(), camp.strength)
    val sentKinds: List<UnitKind> = party.map { sent: UnitCount -> sent.unit }
    return MapUiState.AttackPreview(
        road = road,
        returnIn = road * 2,
        camp = camp,
        isWon = battle.isWon,
        unitsLost = battle.unitsLost.filter { lost: UnitCount -> lost.unit in sentKinds },
        campLost = battle.campLost,
        survivors = battle.survivors.filter { survivor: UnitCount -> survivor.unit in sentKinds },
        loot = attackLootOf(terrain, camp.strength, battle.survivors),
    )
}

private data class PartyBattle(
    val isWon: Boolean,
    val unitsLost: List<UnitCount>,
    val campLost: Int,
    val survivors: List<UnitCount>,
)

private fun FiefSnapshot.partyBattleOf(party: List<UnitCount>, campStrength: Int): PartyBattle {
    val ownStrength: Long = party.sumOf { sent: UnitCount -> sent.count.toLong() * strengthOf(sent.unit) }
    val camp: Long = campStrength.toLong()
    if (ownStrength > camp) {
        val tallied: List<UnitCount> = tallyLosses(party, lostStrength = ceilDiv(camp * camp, ownStrength))
        val unitsLost: List<UnitCount> = sparingTheLastReached(party, tallied)
        return PartyBattle(
            isWon = true,
            unitsLost = unitsLost,
            campLost = campStrength,
            survivors = party.map { sent: UnitCount -> sent.copy(count = sent.count - unitsLost.countOf(sent.unit)) },
        )
    }
    val campLost: Long = minOf(camp - 1, ceilDiv(ownStrength * ownStrength, camp))
    return PartyBattle(
        isWon = false,
        unitsLost = party,
        campLost = campLost.toInt(),
        survivors = party.map { sent: UnitCount -> sent.copy(count = 0) },
    )
}

private fun FiefSnapshot.tallyLosses(party: List<UnitCount>, lostStrength: Long): List<UnitCount> {
    var rest: Long = lostStrength
    return party.map { sent: UnitCount ->
        if (sent.count == 0) return@map sent
        val strength: Long = strengthOf(sent.unit).toLong()
        val lost: Long = if (strength == 0L) {
            sent.count.toLong()
        } else {
            minOf(sent.count.toLong(), ceilDiv(rest, strength))
        }
        rest = maxOf(0, rest - lost * strength)
        sent.copy(count = lost.toInt())
    }
}

private fun sparingTheLastReached(party: List<UnitCount>, lost: List<UnitCount>): List<UnitCount> {
    val isEveryUnitLost: Boolean = party.all { sent: UnitCount -> lost.countOf(sent.unit) == sent.count }
    val lastReached: UnitKind = lost.lastOrNull { reached: UnitCount -> reached.count > 0 }?.unit ?: return lost
    if (!isEveryUnitLost) return lost
    return lost.map { reached: UnitCount ->
        if (reached.unit == lastReached) reached.copy(count = reached.count - 1) else reached
    }
}

private fun FiefSnapshot.attackLootOf(
    terrain: Terrain,
    campStrength: Int,
    survivors: List<UnitCount>,
): List<ResourceQuantity> {
    val rates: List<ResourceQuantity> = forageTerms.yieldPerHour[terrain].orEmpty()
        .map { rate: ResourceQuantity -> if (rate.kind == ResourceKind.Gold) rate.copy(amount = 0) else rate }
    val yielded: Int = rates.count { rate: ResourceQuantity -> rate.amount > 0 }
    val share: Long = minOf(combatTerms.lootPerStrength.toLong() * campStrength, carryOf(survivors)) / (yielded + 1)
    return rates
        .map { rate: ResourceQuantity ->
            val isCarried: Boolean = rate.kind == ResourceKind.Gold || rate.amount > 0
            ResourceQuantity(rate.kind, if (isCarried) share else 0)
        }
        .filter { loot: ResourceQuantity -> loot.amount > 0 }
}

private fun FiefSnapshot.strengthOf(kind: UnitKind): Int = stateOf(kind)?.strength ?: 0

private fun ceilDiv(dividend: Long, divisor: Long): Long =
    if (divisor == 0L) 0 else (dividend + divisor - 1) / divisor
