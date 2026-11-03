package com.emm.mygame.feature.map

import android.content.res.Resources
import android.icu.text.ListFormatter
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import java.util.Locale
import kotlin.time.Duration

internal fun Resources.forageActionNameOf(plot: Int): String = getString(R.string.forage_send_to, plot)

internal fun Resources.forageTitleOf(target: PlotAddress): String =
    getString(R.string.forage_title, target.province, target.plot)

internal fun Resources.partyFieldOf(unit: UnitKind): String = getString(
    when (unit) {
        UnitKind.Infantry -> R.string.forage_field_infantry
        UnitKind.Cavalry -> R.string.forage_field_cavalry
        UnitKind.Archer -> R.string.forage_field_archer
        UnitKind.Settler -> R.string.forage_field_settler
    },
)

internal fun Resources.atHomeOf(home: UnitCount): String = getString(R.string.forage_at_home, countedOf(home))

internal fun Resources.roadLineOf(road: Duration): String = getString(R.string.forage_road, durationOf(road))

internal fun Resources.returnLineOf(returnIn: Duration): String =
    getString(R.string.forage_return, durationOf(returnIn))

internal fun Resources.lootLineOf(loot: List<ResourceQuantity>): String =
    getString(R.string.forage_loot, spanishListFormat.format(loot.map { quantity -> quantityOf(quantity) }))

internal fun Resources.blockLineOf(block: MapUiState.ForageBlock): String = when (block) {
    MapUiState.ForageBlock.MarchAway -> getString(R.string.forage_march_away)
    MapUiState.ForageBlock.InvalidCount -> getString(R.string.forage_invalid_count)
    is MapUiState.ForageBlock.InvalidHours -> getString(R.string.forage_invalid_hours, block.maxStayHours)
    MapUiState.ForageBlock.EmptyParty -> getString(R.string.forage_empty_party)
    is MapUiState.ForageBlock.NotEnoughAtHome ->
        getString(R.string.forage_not_enough_at_home, countedOf(UnitCount(block.unit, block.needed)), block.atHome)
}

internal fun Resources.refusalLineOf(refusal: MarchRefusal): String = getString(
    when (refusal) {
        MarchRefusal.NotEnoughUnitsAtHome -> R.string.refusal_not_enough_units_at_home
        MarchRefusal.MarchSlotBusy -> R.string.refusal_march_slot_busy
        MarchRefusal.StayOutOfRange -> R.string.refusal_stay_out_of_range
        MarchRefusal.MarchTargetOutOfBounds -> R.string.refusal_march_target_out_of_bounds
        MarchRefusal.PlotHeld -> R.string.refusal_plot_held
        MarchRefusal.PlotHasCamp -> R.string.refusal_plot_has_camp
        MarchRefusal.PlotReserved -> R.string.refusal_plot_reserved
        MarchRefusal.UnitUnfitForOrder -> R.string.refusal_unit_unfit_for_order
        MarchRefusal.MarchNotFound,
        MarchRefusal.MarchAlreadyReturning,
        MarchRefusal.Unrecognized,
        -> R.string.map_unreachable
    },
)

internal fun Resources.sentLinesOf(sent: MapUiState.SentForage): List<String> = listOfNotNull(
    getString(
        R.string.forage_outbound,
        spanishListFormat.format(sent.units.map { count: UnitCount -> countedOf(count) }),
        sent.target.province,
        sent.target.plot,
    ),
    returnLineOf(sent.returnIn),
    if (sent.loot.isEmpty()) null else lootLineOf(sent.loot),
)

private fun Resources.countedOf(count: UnitCount): String = getQuantityString(
    when (count.unit) {
        UnitKind.Infantry -> R.plurals.unit_infantry_counted
        UnitKind.Cavalry -> R.plurals.unit_cavalry_counted
        UnitKind.Archer -> R.plurals.unit_archer_counted
        UnitKind.Settler -> R.plurals.unit_settler_counted
    },
    count.count,
    count.count,
)

private fun Resources.quantityOf(quantity: ResourceQuantity): String = getString(
    when (quantity.kind) {
        ResourceKind.Wood -> R.string.quantity_wood
        ResourceKind.Stone -> R.string.quantity_stone
        ResourceKind.Iron -> R.string.quantity_iron
        ResourceKind.Gold -> R.string.quantity_gold
        ResourceKind.Food -> R.string.quantity_food
    },
    formatQuantity(quantity.amount),
)

private fun Resources.durationOf(duration: Duration): String {
    val wholeSeconds: Long = duration.inWholeMilliseconds.coerceAtLeast(0).let { millis: Long ->
        (millis + MILLISECONDS_PER_SECOND - 1) / MILLISECONDS_PER_SECOND
    }
    val hours: Long = wholeSeconds / SECONDS_PER_HOUR
    val minutes: Long = wholeSeconds % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> getString(R.string.duration_minutes_seconds, minutes, wholeSeconds % SECONDS_PER_MINUTE)
        minutes == 0L -> getString(R.string.duration_hours, hours)
        else -> getString(R.string.duration_hours_minutes, hours, minutes)
    }
}

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(Locale.forLanguageTag("es"))

private const val MILLISECONDS_PER_SECOND: Long = 1_000

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3_600
