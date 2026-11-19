package com.emm.mygame.feature.map

import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.DurationCopy
import com.emm.mygame.core.ui.PlayerCopy

internal fun terrainNameOf(terrain: Terrain): Int = when (terrain) {
    Terrain.Fields -> R.string.map_terrain_fields
    Terrain.River -> R.string.map_terrain_river
    Terrain.Hills -> R.string.map_terrain_hills
}

private const val SMALL_SIZE_NUMBER: Int = 1

private const val MEDIUM_SIZE_NUMBER: Int = 2

private const val LARGE_SIZE_NUMBER: Int = 3

internal fun sizeNumberOf(size: WasteSize): Int = when (size) {
    WasteSize.Small -> SMALL_SIZE_NUMBER
    WasteSize.Medium -> MEDIUM_SIZE_NUMBER
    WasteSize.Large -> LARGE_SIZE_NUMBER
}

internal fun phaseWordsOf(phase: TownSnapshot.JobPhase): Int = when (phase) {
    TownSnapshot.JobPhase.Outbound -> R.string.map_job_out_outbound
    TownSnapshot.JobPhase.Working -> R.string.map_job_out_working
    TownSnapshot.JobPhase.Returning -> R.string.map_job_out_returning
}

private fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.map_resource_money
    TownResourceKind.Food -> R.string.map_resource_food
    TownResourceKind.Power -> R.string.map_resource_power
    TownResourceKind.Material -> R.string.map_resource_material
}

private fun hireSelectorOf(hire: TownHireKind): String = when (hire) {
    TownHireKind.Worker -> "worker"
    TownHireKind.Truck -> "truck"
}

internal fun cleanUpOutcomeLineOf(outcome: MapUiState.CleanUpOutcome): Int = when (outcome) {
    MapUiState.CleanUpOutcome.Short -> R.string.map_clean_up_short
    MapUiState.CleanUpOutcome.Cleaned -> R.string.map_clean_up_out_done
    MapUiState.CleanUpOutcome.NotCleaned -> R.string.map_clean_up_out_failed
}

internal fun jobOutTitleOf(kind: MapUiState.JobKind): Int = when (kind) {
    MapUiState.JobKind.Job -> R.string.map_job_out_title
    is MapUiState.JobKind.CleanUp -> R.string.map_clean_up_out_title
}

internal fun CopyReader.amountsOf(pay: List<MapUiState.PayLine>): String = listPhraseOf(
    pay.map { line: MapUiState.PayLine ->
        text(
            R.string.map_job_amount,
            "amount" to formatQuantity(line.amount),
            "resource" to text(resourceNameOf(line.resource)),
        )
    },
)

internal fun PlayerCopy.jobBlockLabelOf(block: MapUiState.JobBlock): MyGameLabel = when (block) {
    MapUiState.JobBlock.CountNeeded -> chrome(R.string.map_job_count_needed)
    MapUiState.JobBlock.InvalidTeam ->
        MyGameLabel(text = fixedCopy(R.string.map_refusal_invalid_team), translation = null)
    MapUiState.JobBlock.HoursNeeded -> chrome(R.string.map_job_hours_needed)
}

internal fun CopyReader.jobRefusalLineOf(refusal: TownJobRefusal): String = when (refusal) {
    TownJobRefusal.InvalidTeam -> text(R.string.map_refusal_invalid_team)
    is TownJobRefusal.JobHoursOutOfRange ->
        text(R.string.map_refusal_job_hours_out_of_range, "maxHours" to refusal.maxHours.toString())
    TownJobRefusal.JobSiteOutOfBounds -> text(R.string.map_refusal_job_site_out_of_bounds)
    TownJobRefusal.TeamAlreadyOut -> text(R.string.map_refusal_team_already_out)
    TownJobRefusal.JobToOwnSite -> text(R.string.map_refusal_job_to_own_site)
    TownJobRefusal.SiteHeld -> text(R.string.map_refusal_site_held)
    TownJobRefusal.NotAWasteSite -> text(R.string.map_refusal_not_a_waste_site)
    TownJobRefusal.NoWasteYet -> text(R.string.map_refusal_no_waste_yet)
    is TownJobRefusal.NotEnoughHiresAtHome -> notEnoughHiresLineOf(refusal.hire, refusal.count, refusal.atHome)
    TownJobRefusal.JobNotFound -> text(R.string.map_refusal_job_not_found)
    TownJobRefusal.JobAlreadyReturning -> text(R.string.map_refusal_job_already_returning)
    TownJobRefusal.TownNotFound -> text(R.string.map_refusal_town_not_found)
    TownJobRefusal.Unrecognized -> text(R.string.map_refusal_unexpected)
}

private fun CopyReader.notEnoughHiresLineOf(hire: TownHireKind, count: Int, atHome: Int): String = text(
    R.string.map_refusal_not_enough_hires_at_home,
    "hire" to hireSelectorOf(hire),
    "count" to count,
    "atHome" to atHome.toString(),
)

internal val mapDurationCopy: DurationCopy = DurationCopy(
    minutesSeconds = R.string.map_duration_minutes_seconds,
    hours = R.string.map_duration_hours,
    hoursMinutes = R.string.map_duration_hours_minutes,
    minutes = R.string.map_duration_minutes,
    finishWithClock = R.string.map_finish_with_clock,
    finishTomorrow = R.string.map_finish_tomorrow,
    finishDay = R.string.map_finish_day,
)
