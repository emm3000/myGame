package com.emm.mygame.feature.map

import android.content.res.Resources
import android.icu.text.ListFormatter
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import java.util.Locale
import kotlin.time.Duration

internal fun Resources.campLineOf(camp: MarchCamp): String = getString(R.string.attack_camp, camp.tier, camp.strength)

internal fun Resources.partyOf(units: List<UnitCount>): String =
    spanishListFormat.format(units.map { count: UnitCount -> countedOf(count) })

internal fun Resources.quantitiesOf(quantities: List<ResourceQuantity>): String =
    spanishListFormat.format(quantities.map { quantity: ResourceQuantity -> quantityOf(quantity) })

internal fun Resources.countedOf(count: UnitCount): String = getQuantityString(
    when (count.unit) {
        UnitKind.Infantry -> R.plurals.map_unit_infantry_counted
        UnitKind.Cavalry -> R.plurals.map_unit_cavalry_counted
        UnitKind.Archer -> R.plurals.map_unit_archer_counted
        UnitKind.Settler -> R.plurals.map_unit_settler_counted
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

internal fun Resources.durationOf(duration: Duration): String {
    val wholeSeconds: Long = duration.inWholeMilliseconds.coerceAtLeast(0).let { millis: Long ->
        (millis + MILLISECONDS_PER_SECOND - 1) / MILLISECONDS_PER_SECOND
    }
    val hours: Long = wholeSeconds / SECONDS_PER_HOUR
    val minutes: Long = wholeSeconds % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> getString(R.string.map_duration_minutes_seconds, minutes, wholeSeconds % SECONDS_PER_MINUTE)
        minutes == 0L -> getString(R.string.map_duration_hours, hours)
        else -> getString(R.string.map_duration_hours_minutes, hours, minutes)
    }
}

internal val spanish: Locale = Locale.forLanguageTag("es")

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(spanish)

private const val MILLISECONDS_PER_SECOND: Long = 1_000

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3_600
