package com.emm.mygame.feature.town.building

import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.finishClockLabelOf
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.neededWordSelectorOf
import com.emm.mygame.feature.town.townDurationCopy
import java.time.ZoneId

internal fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.town_resource_money
    TownResourceKind.Food -> R.string.town_resource_food
    TownResourceKind.Power -> R.string.town_resource_power
    TownResourceKind.Material -> R.string.town_resource_material
}

internal fun seasonNameOf(kind: SeasonKind): Int = when (kind) {
    SeasonKind.Spring -> R.string.town_season_spring
    SeasonKind.Summer -> R.string.town_season_summer
    SeasonKind.Fall -> R.string.town_season_fall
    SeasonKind.Winter -> R.string.town_season_winter
}

internal fun CopyReader.workRefusalLineOf(refusal: TownWorkRefusal): String = when (refusal) {
    is TownWorkRefusal.WaitingListFull -> text(R.string.town_refusal_waiting_list_full, "cap" to refusal.cap)
    is TownWorkRefusal.TopLevelReached ->
        text(R.string.town_refusal_top_level_reached, "level" to refusal.level.toString())
    is TownWorkRefusal.NotEnoughPeople -> text(
        R.string.town_refusal_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    is TownWorkRefusal.NotEnoughWords -> text(
        R.string.town_refusal_not_enough_words,
        "needed" to refusal.needed.toString(),
        "held" to refusal.held.toString(),
        "standing" to neededWordSelectorOf(refusal.standing),
    )
    TownWorkRefusal.NotEnoughResources -> text(R.string.town_refusal_not_enough_resources)
    is TownWorkRefusal.BuildingWorkNotFound ->
        text(R.string.town_refusal_building_work_not_found, "level" to refusal.level.toString())
    TownWorkRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
    TownWorkRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
}

internal fun CopyReader.fillLabelOf(fill: FillTime): String {
    val finish: FinishClock = finishClockOf(fill.fullAt, fill.remaining, ZoneId.systemDefault())
    return text(R.string.town_full_at, "clock" to finishClockLabelOf(finish, townDurationCopy))
}

internal fun CopyReader.amountLineOf(kind: TownResourceKind, amount: Long): String = text(
    R.string.town_amount,
    "amount" to formatQuantity(amount),
    "resource" to text(resourceNameOf(kind)),
)
