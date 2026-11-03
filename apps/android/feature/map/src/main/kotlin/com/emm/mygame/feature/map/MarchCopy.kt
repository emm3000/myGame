package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import kotlin.time.Duration

internal fun Resources.actionLabelOf(order: MapUiState.OfferedOrder): String = getString(
    when (order) {
        MapUiState.OfferedOrder.Forage -> R.string.forage_send
        MapUiState.OfferedOrder.Attack -> R.string.attack_send
        MapUiState.OfferedOrder.Found -> R.string.founding_send
        MapUiState.OfferedOrder.Transport -> R.string.transport_send
    },
)

internal fun Resources.actionNameOf(order: MapUiState.OfferedOrder, plot: Int): String = getString(
    when (order) {
        MapUiState.OfferedOrder.Forage -> R.string.forage_send_to
        MapUiState.OfferedOrder.Attack -> R.string.attack_send_to
        MapUiState.OfferedOrder.Found -> R.string.founding_send_to
        MapUiState.OfferedOrder.Transport -> R.string.transport_send_to
    },
    plot,
)

internal fun Resources.titleOf(form: MapUiState.MarchForm): String = getString(
    when (form) {
        is MapUiState.ForageForm -> R.string.forage_title
        is MapUiState.AttackForm -> R.string.attack_title
        is MapUiState.FoundingForm -> R.string.founding_title
        is MapUiState.TransportForm -> R.string.transport_title
    },
    form.target.province,
    form.target.plot,
)

internal fun Resources.sendLabelOf(form: MapUiState.MarchForm): String = actionLabelOf(
    when (form) {
        is MapUiState.ForageForm -> MapUiState.OfferedOrder.Forage
        is MapUiState.AttackForm -> MapUiState.OfferedOrder.Attack
        is MapUiState.FoundingForm -> MapUiState.OfferedOrder.Found
        is MapUiState.TransportForm -> MapUiState.OfferedOrder.Transport
    },
)

internal fun Resources.proposedNameOf(terrain: Terrain): String =
    terrainOf(terrain).replaceFirstChar { first: Char -> first.titlecase(spanish) }

internal fun Resources.partyFieldOf(unit: UnitKind): String = getString(
    when (unit) {
        UnitKind.Infantry -> R.string.forage_field_infantry
        UnitKind.Cavalry -> R.string.forage_field_cavalry
        UnitKind.Archer -> R.string.forage_field_archer
        UnitKind.Settler -> R.string.forage_field_settler
    },
)

internal fun Resources.cargoFieldOf(kind: ResourceKind): String = getString(
    when (kind) {
        ResourceKind.Wood -> R.string.transport_field_wood
        ResourceKind.Stone -> R.string.transport_field_stone
        ResourceKind.Iron -> R.string.transport_field_iron
        ResourceKind.Gold -> R.string.transport_field_gold
        ResourceKind.Food -> R.string.transport_field_food
    },
)

internal fun Resources.atHomeOf(home: UnitCount): String = getString(R.string.forage_at_home, countedOf(home))

internal fun Resources.roadLineOf(road: Duration): String = getString(R.string.forage_road, durationOf(road))

internal fun Resources.returnLineOf(returnIn: Duration): String =
    getString(R.string.forage_return, durationOf(returnIn))

internal fun Resources.arrivalLineOf(arrivalIn: Duration): String =
    getString(R.string.founding_arrival, durationOf(arrivalIn))

internal fun Resources.lootLineOf(loot: List<ResourceQuantity>): String =
    getString(R.string.forage_loot, quantitiesOf(loot))

internal fun Resources.forageLinesOf(preview: MapUiState.ForagePreview): List<String> = listOfNotNull(
    roadLineOf(preview.road),
    returnLineOf(preview.returnIn),
    if (preview.loot.isEmpty()) null else lootLineOf(preview.loot),
)

internal fun Resources.attackLinesOf(preview: MapUiState.AttackPreview): List<String> = listOfNotNull(
    roadLineOf(preview.road),
    returnLineOf(preview.returnIn),
    campLineOf(preview.camp),
    getString(if (preview.isWon) R.string.attack_battle_won else R.string.attack_battle_lost),
    getString(R.string.attack_losses, sentPartyOf(preview.unitsLost)),
    getString(R.string.attack_camp_losses, preview.campLost),
    getString(R.string.attack_survivors, sentPartyOf(preview.survivors)),
    if (preview.loot.isEmpty()) null else lootLineOf(preview.loot),
)

internal fun Resources.foundingLinesOf(preview: MapUiState.FoundingPreview): List<String> =
    listOf(roadLineOf(preview.road), arrivalLineOf(preview.road))

internal fun Resources.transportLinesOf(preview: MapUiState.TransportPreview): List<String> = listOfNotNull(
    getString(R.string.transport_carry, formatQuantity(preview.cargo), formatQuantity(preview.carry)),
    preview.road?.let { road: Duration -> roadLineOf(road) },
    preview.road?.let { road: Duration -> arrivalLineOf(road) },
)

internal fun Resources.blockLineOf(block: MapUiState.MarchBlock): String = when (block) {
    MapUiState.MarchBlock.MarchAway -> getString(R.string.forage_march_away)
    MapUiState.MarchBlock.InvalidCount -> getString(R.string.forage_invalid_count)
    is MapUiState.MarchBlock.InvalidHours -> getString(R.string.forage_invalid_hours, block.maxStayHours)
    MapUiState.MarchBlock.EmptyParty -> getString(R.string.forage_empty_party)
    is MapUiState.MarchBlock.NotEnoughAtHome ->
        getString(R.string.forage_not_enough_at_home, countedOf(UnitCount(block.unit, block.needed)), block.atHome)
    MapUiState.MarchBlock.BlankName -> getString(R.string.refusal_blank_fief_name)
    MapUiState.MarchBlock.EmptyCargo -> getString(R.string.refusal_empty_cargo)
    is MapUiState.MarchBlock.CargoAboveCarry ->
        getString(R.string.transport_cargo_above_carry, formatQuantity(block.cargo), formatQuantity(block.carry))
    is MapUiState.MarchBlock.Shortfalls -> shortfallLineOf(block.missing)
}

private fun Resources.sentPartyOf(counts: List<UnitCount>): String {
    val listed: List<UnitCount> = counts.filter { count: UnitCount -> count.count > 0 }
    return partyOf(listed.ifEmpty { counts })
}

private fun Resources.shortfallLineOf(missing: List<ResourceQuantity>): String {
    val isSingleOne: Boolean = missing.size == 1 && missing.first().amount == 1L
    val line: Int = if (isSingleOne) R.string.transport_short_one else R.string.transport_short_many
    return getString(line, quantitiesOf(missing))
}
