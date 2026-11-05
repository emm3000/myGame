package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import android.icu.text.ListFormatter
import androidx.annotation.StringRes
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.ui.getIcuString
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun Resources.instantLabelOf(line: ChronicleInstant): String {
    val time: String = line.at.format(clockFormat)
    return when (line.day) {
        ChronicleInstant.Day.Today -> getIcuString(R.string.chronicle_today, "time" to time)
        ChronicleInstant.Day.ThisYear -> getIcuString(
            R.string.chronicle_day,
            "day" to line.at.format(dayFormat),
            "time" to time,
        )
        ChronicleInstant.Day.EarlierYear ->
            getIcuString(
                R.string.chronicle_day_of_year,
                "day" to line.at.format(dayFormat),
                "year" to line.at.year.toString(),
                "time" to time,
            )
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
        getIcuString(R.string.subject_recruits, "units" to countedUnits(event.unit, event.count))
    is ChronicleEvent.RecruitsCancelled -> getIcuString(
        R.string.subject_recruits_cancelled,
        "delivered" to countedUnits(event.unit, event.delivered),
        "cancelled" to countedUnits(event.unit, event.cancelled),
    )
    is ChronicleEvent.MarchReturned ->
        getIcuString(
            R.string.subject_march,
            "province" to event.plot.province.toString(),
            "plot" to event.plot.plot.toString(),
            "party" to partyPhrase(event.units),
        )
    is ChronicleEvent.BattleFought -> getIcuString(
        R.string.subject_battle,
        "province" to event.plot.province.toString(),
        "plot" to event.plot.plot.toString(),
        "tier" to event.campTier.toString(),
        "losses" to lossesClause(event.unitsLost),
        "campLost" to event.campLost.toString(),
    )
    is ChronicleEvent.FoundingSent -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.FiefFounded -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.TransportSent -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
    is ChronicleEvent.TransportArrived -> fiefAtPlot(event.fiefName, event.plot.province, event.plot.plot)
}

private fun Resources.buildingSubject(building: BuildingKind, level: Int): String =
    getIcuString(R.string.subject_level, "name" to getString(buildingLabelOf(building)), "level" to level.toString())

private fun Resources.artSubject(art: ArtKind, level: Int): String =
    getIcuString(R.string.subject_level, "name" to getString(artLabelOf(art)), "level" to level.toString())

private fun Resources.fiefAtPlot(name: String, province: Int, plot: Int): String =
    getIcuString(
        R.string.subject_fief_at_plot,
        "name" to name,
        "province" to province.toString(),
        "plot" to plot.toString(),
    )

private fun Resources.countedUnits(unit: UnitKind, count: Int): String =
    getIcuString(unitLabelOf(unit), "count" to count)

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
        1 -> getIcuString(R.string.losses_one_kind, "units" to spanishList(listed))
        else -> getIcuString(R.string.losses_several_kinds, "units" to spanishList(listed))
    }
}

internal fun spanishList(items: List<String>): String = spanishListFormat.format(items)

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(Locale.forLanguageTag("es"))

@StringRes
private fun buildingLabelOf(building: BuildingKind): Int = when (building) {
    BuildingKind.Sawmill -> R.string.chronicle_building_sawmill
    BuildingKind.Quarry -> R.string.chronicle_building_quarry
    BuildingKind.IronMine -> R.string.chronicle_building_iron_mine
    BuildingKind.Farm -> R.string.chronicle_building_farm
    BuildingKind.Warehouse -> R.string.chronicle_building_warehouse
    BuildingKind.Library -> R.string.chronicle_building_library
    BuildingKind.Barracks -> R.string.chronicle_building_barracks
}

@StringRes
private fun artLabelOf(art: ArtKind): Int = when (art) {
    ArtKind.Smithing -> R.string.chronicle_art_smithing
    ArtKind.Masonry -> R.string.chronicle_art_masonry
}

@StringRes
private fun unitLabelOf(unit: UnitKind): Int = when (unit) {
    UnitKind.Infantry -> R.string.units_infantry
    UnitKind.Cavalry -> R.string.units_cavalry
    UnitKind.Archer -> R.string.units_archer
    UnitKind.Settler -> R.string.units_settler
}
