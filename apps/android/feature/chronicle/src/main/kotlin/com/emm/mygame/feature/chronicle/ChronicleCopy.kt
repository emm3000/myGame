package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import android.icu.text.ListFormatter
import androidx.annotation.PluralsRes
import androidx.annotation.StringRes
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun Resources.instantLabelOf(line: ChronicleInstant): String {
    val time: String = line.at.format(clockFormat)
    return when (line.day) {
        ChronicleInstant.Day.Today -> getString(R.string.chronicle_today, time)
        ChronicleInstant.Day.ThisYear -> getString(R.string.chronicle_day, line.at.format(dayFormat), time)
        ChronicleInstant.Day.EarlierYear ->
            getString(R.string.chronicle_day_of_year, line.at.format(dayFormat), line.at.year, time)
    }
}

internal fun Resources.headingOf(event: ChronicleEvent): String = getString(
    when (event) {
        is ChronicleEvent.UpgradeFinished -> R.string.heading_upgrade_finished
        is ChronicleEvent.ArtLearned -> R.string.heading_art_learned
        is ChronicleEvent.UpgradeCancelled -> R.string.heading_upgrade_cancelled
        is ChronicleEvent.StudyCancelled -> R.string.heading_study_cancelled
        is ChronicleEvent.RecruitsDelivered -> R.string.heading_recruits_delivered
        is ChronicleEvent.RecruitsCancelled -> R.string.heading_recruits_cancelled
        is ChronicleEvent.MarchReturned ->
            if (event.isRecalled) R.string.heading_march_recalled else R.string.heading_march_returned
        is ChronicleEvent.BattleFought -> if (event.isWon) R.string.heading_battle_won else R.string.heading_battle_lost
        is ChronicleEvent.FoundingSent -> R.string.heading_founding_sent
        is ChronicleEvent.FiefFounded -> R.string.heading_fief_founded
        is ChronicleEvent.TransportSent -> R.string.heading_transport_sent
        is ChronicleEvent.TransportArrived -> R.string.heading_transport_arrived
    },
)

internal fun Resources.subjectOf(event: ChronicleEvent): String = when (event) {
    is ChronicleEvent.UpgradeFinished -> buildingSubject(event.building, event.level)
    is ChronicleEvent.UpgradeCancelled -> buildingSubject(event.building, event.level)
    is ChronicleEvent.ArtLearned -> artSubject(event.art, event.level)
    is ChronicleEvent.StudyCancelled -> artSubject(event.art, event.level)
    is ChronicleEvent.RecruitsDelivered ->
        getString(R.string.subject_recruits, countedUnits(event.unit, event.count))
    is ChronicleEvent.RecruitsCancelled -> getString(
        R.string.subject_recruits_cancelled,
        countedUnits(event.unit, event.delivered),
        countedUnits(event.unit, event.cancelled),
    )
    is ChronicleEvent.MarchReturned ->
        getString(R.string.subject_march, event.plot.province, event.plot.plot, partyPhrase(event.units))
    is ChronicleEvent.BattleFought -> getString(
        R.string.subject_battle,
        event.plot.province,
        event.plot.plot,
        event.campTier,
        lossesClause(event.unitsLost),
        event.campLost,
    )
    is ChronicleEvent.FoundingSent -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.FiefFounded -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.TransportSent -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.TransportArrived -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
}

internal fun Resources.amountsOf(event: ChronicleEvent): String? = when (event) {
    is ChronicleEvent.UpgradeCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.StudyCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.RecruitsCancelled -> listedAmounts(event.refund, R.string.amounts_refunded)
    is ChronicleEvent.MarchReturned -> listedAmounts(event.loot, R.string.amounts_received)
    is ChronicleEvent.TransportArrived -> listedAmounts(event.cargo, R.string.amounts_received)
    is ChronicleEvent.TransportSent -> listedAmounts(event.cargo, R.string.amounts_sent)
    is ChronicleEvent.UpgradeFinished,
    is ChronicleEvent.ArtLearned,
    is ChronicleEvent.RecruitsDelivered,
    is ChronicleEvent.BattleFought,
    is ChronicleEvent.FoundingSent,
    is ChronicleEvent.FiefFounded,
    -> null
}

private fun Resources.buildingSubject(building: BuildingKind, level: Int): String =
    getString(R.string.subject_level, getString(buildingLabelOf(building)), level)

private fun Resources.artSubject(art: ArtKind, level: Int): String =
    getString(R.string.subject_level, getString(artLabelOf(art)), level)

private fun Resources.fiefAtPlot(name: String, province: Int, plot: Int): String =
    getString(R.string.subject_fief_at_plot, name, province, plot)

private fun Resources.countedUnits(unit: UnitKind, count: Int): String =
    getQuantityString(unitLabelOf(unit), count, count)

private fun Resources.listedUnits(counts: List<UnitCount>): List<String> =
    counts.filter { it.count > 0 }.map { countedUnits(it.unit, it.count) }

private fun Resources.partyPhrase(counts: List<UnitCount>): String {
    val listed: List<String> = listedUnits(counts)
    return if (listed.isEmpty()) countedUnits(UnitKind.entries.first(), 0) else spanishList(listed)
}

private fun Resources.lossesClause(unitsLost: List<UnitCount>): String {
    val listed: List<String> = listedUnits(unitsLost)
    return when (listed.size) {
        0 -> getString(R.string.losses_none)
        1 -> getString(R.string.losses_one_kind, spanishList(listed))
        else -> getString(R.string.losses_several_kinds, spanishList(listed))
    }
}

private fun Resources.listedAmounts(amounts: List<ResourceQuantity>, @StringRes sentence: Int): String? {
    val listed: List<String> = amounts.filter { it.amount > 0 }.map { quantity: ResourceQuantity ->
        getString(quantityLabelOf(quantity.kind), formatQuantity(quantity.amount))
    }
    return if (listed.isEmpty()) null else getString(sentence, spanishList(listed))
}

private fun spanishList(items: List<String>): String = spanishListFormat.format(items)

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(Locale.forLanguageTag("es"))

@StringRes
private fun buildingLabelOf(building: BuildingKind): Int = when (building) {
    BuildingKind.Sawmill -> R.string.building_sawmill
    BuildingKind.Quarry -> R.string.building_quarry
    BuildingKind.IronMine -> R.string.building_iron_mine
    BuildingKind.Farm -> R.string.building_farm
    BuildingKind.Warehouse -> R.string.building_warehouse
    BuildingKind.Library -> R.string.building_library
    BuildingKind.Barracks -> R.string.building_barracks
}

@StringRes
private fun artLabelOf(art: ArtKind): Int = when (art) {
    ArtKind.Smithing -> R.string.art_smithing
    ArtKind.Masonry -> R.string.art_masonry
}

@PluralsRes
private fun unitLabelOf(unit: UnitKind): Int = when (unit) {
    UnitKind.Infantry -> R.plurals.units_infantry
    UnitKind.Cavalry -> R.plurals.units_cavalry
    UnitKind.Archer -> R.plurals.units_archer
    UnitKind.Settler -> R.plurals.units_settler
}

@StringRes
private fun quantityLabelOf(resource: ResourceKind): Int = when (resource) {
    ResourceKind.Wood -> R.string.quantity_wood
    ResourceKind.Stone -> R.string.quantity_stone
    ResourceKind.Iron -> R.string.quantity_iron
    ResourceKind.Gold -> R.string.quantity_gold
    ResourceKind.Food -> R.string.quantity_food
}
