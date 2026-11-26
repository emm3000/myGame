package com.emm.mygame.feature.today

import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.projection.town.ReadyTime
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.Shortfall
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.finishClockLabelOf
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.core.ui.timeLeftLabelOf
import com.emm.mygame.core.ui.wholeSecondsOf
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds

internal fun PlayerCopy.canDoTitleOf(isLessonRunning: Boolean): MyGameLabel =
    if (isLessonRunning) fixedLabel(fixedCopy(R.string.today_while_you_wait)) else chrome(R.string.today_can_do_now)

internal fun PlayerCopy.nextLevelTitleOf(building: TownBuildingKind, next: NextLevelLine): MyGameLabel = chrome {
    text(R.string.today_next_level, "place" to text(placeNameOf(building)), "level" to next.level.toString())
}

internal fun PlayerCopy.buildLabelOf(next: NextLevelLine): MyGameLabel = chrome {
    text(R.string.today_build_for, "cost" to listPhraseOf(next.costs.map { cost: CostLine -> amountLineOf(cost) }))
}

internal fun PlayerCopy.blockLineOf(block: BlockReason): MyGameLabel = when (block) {
    is BlockReason.WaitingListFull ->
        fixedLabel(fixedCopy(R.string.today_refusal_waiting_list_full, "cap" to block.cap))
    is BlockReason.PeopleShort ->
        chrome(R.string.today_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is BlockReason.WordsShort -> chrome(
        R.string.today_words_short,
        "standing" to neededWordSelectorOf(block.standing),
        "held" to block.held.toString(),
        "needed" to block.needed.toString(),
    )
    is BlockReason.Resources -> chrome { shortfallLineOf(block) }
}

internal fun PlayerCopy.buildRefusalOf(build: StartStatus, building: TownBuildingKind): String? = when (build) {
    is StartStatus.Refused -> if (build.building == building) fixedCopy { workRefusalLineOf(build.refusal) } else null
    is StartStatus.Unreachable ->
        if (build.building == building) fixedCopy(R.string.today_refusal_unexpected) else null
    StartStatus.Idle, is StartStatus.Waiting -> null
}

private fun CopyReader.workRefusalLineOf(refusal: TownWorkRefusal): String = when (refusal) {
    is TownWorkRefusal.WaitingListFull -> text(R.string.today_refusal_waiting_list_full, "cap" to refusal.cap)
    is TownWorkRefusal.TopLevelReached ->
        text(R.string.today_refusal_top_level_reached, "level" to refusal.level.toString())
    is TownWorkRefusal.NotEnoughPeople -> text(
        R.string.today_refusal_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    is TownWorkRefusal.NotEnoughWords -> text(
        R.string.today_refusal_not_enough_words,
        "needed" to refusal.needed.toString(),
        "held" to refusal.held.toString(),
        "standing" to neededWordSelectorOf(refusal.standing),
    )
    TownWorkRefusal.NotEnoughResources -> text(R.string.today_refusal_not_enough_resources)
    TownWorkRefusal.TownNotFound -> text(R.string.today_refusal_town_not_found)
    is TownWorkRefusal.BuildingWorkNotFound, TownWorkRefusal.Unrecognized -> text(R.string.today_refusal_unexpected)
}

private fun neededWordSelectorOf(standing: NeededWordKind): String = when (standing) {
    NeededWordKind.Stable -> "stable"
    NeededWordKind.Retained -> "retained"
}

private fun CopyReader.shortfallLineOf(block: BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    val shortfall: String = text(R.string.today_shortfall, "missing" to listPhraseOf(amounts))
    val ready: ReadyTime = block.ready ?: return shortfall
    return "$shortfall ${readyWordsOf(ready)} ${readyTimeLabelOf(ready)}"
}

private fun CopyReader.readyWordsOf(ready: ReadyTime): String =
    if (ready.isWithinTheHour) text(R.string.today_ready_in) else text(R.string.today_ready_at)

private fun CopyReader.readyTimeLabelOf(ready: ReadyTime): String {
    if (ready.isWithinTheHour) return timeLeftLabelOf(ready.remaining, todayDurationCopy)
    val finish: FinishClock = finishClockOf(ready.readyAt, ready.remaining, ZoneId.systemDefault())
    return finishClockLabelOf(finish, todayDurationCopy)
}

private val ReadyTime.isWithinTheHour: Boolean
    get() = wholeSecondsOf(remaining).seconds < 1.hours

private fun CopyReader.amountLineOf(cost: CostLine): String = amountLineOf(cost.kind, cost.amount)

private fun CopyReader.amountLineOf(kind: TownResourceKind, amount: Long): String = text(
    R.string.today_amount,
    "amount" to formatQuantity(amount),
    "resource" to text(resourceNameOf(kind)),
)

private fun resourceNameOf(kind: TownResourceKind): Int = when (kind) {
    TownResourceKind.Money -> R.string.today_resource_money
    TownResourceKind.Food -> R.string.today_resource_food
    TownResourceKind.Power -> R.string.today_resource_power
    TownResourceKind.Material -> R.string.today_resource_material
}
