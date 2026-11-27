package com.emm.mygame.feature.town.building

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.ReadyTime
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.Shortfall
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.durationLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.neededWordSelectorOf
import com.emm.mygame.feature.town.townDurationCopy
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@Composable
internal fun NextLevel(
    building: TownBuildingKind,
    next: NextLevelLine,
    block: BlockReason?,
    start: StartStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: BlockReason -> copy.blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.town_people_at_work, "people" to next.people.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        Costs(next = next)
        MyGameGoOutlinedButton(
            label = copy.chrome {
                text(
                    R.string.town_build_with_duration,
                    "action" to text(R.string.town_build, "level" to next.level.toString()),
                    "duration" to durationLabelOf(next.duration, townDurationCopy),
                )
            },
            isBusy = start is StartStatus.Waiting,
            busyDescription = copy.chrome(R.string.town_sending),
            onClick = { onIntent(TownIntent.BuildTapped(building)) },
            blockedReason = reason,
        )
        StartAnswer(building = building, start = start)
    }
}

@Composable
private fun Costs(next: NextLevelLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        next.costs.forEach { cost: CostLine -> CostItem(cost = cost) }
    }
}

internal fun PlayerCopy.blockLineOf(block: BlockReason): MyGameLabel = when (block) {
    is BlockReason.WaitingListFull -> MyGameLabel(
        text = fixedCopy(R.string.town_refusal_waiting_list_full, "cap" to block.cap),
        translation = null,
    )
    is BlockReason.PeopleShort ->
        chrome(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is BlockReason.WordsShort -> chrome(
        R.string.town_words_needed,
        "standing" to neededWordSelectorOf(block.standing),
        "held" to block.held.toString(),
        "needed" to block.needed.toString(),
    )
    is BlockReason.Resources -> chrome { shortfallLineOf(block) }
}

private val previewNextLevel: NextLevelLine = NextLevelLine(
    level = 2,
    costs = listOf(CostLine(TownResourceKind.Food, amount = 120, isShort = true)),
    duration = 3.minutes,
    people = 2,
    wordsNeeded = null,
)

private fun shortOfFoodUntil(ready: ReadyTime): BlockReason =
    BlockReason.Resources(listOf(Shortfall(TownResourceKind.Food, amount = 40)), ready = ready)

private class BlockedStates : PreviewParameterProvider<BlockReason> {

    override val values: Sequence<BlockReason> = sequenceOf(
        shortOfFoodUntil(ReadyTime(24.minutes, Instant.parse("2026-11-12T15:24:00Z"))),
        shortOfFoodUntil(ReadyTime(2.hours, Instant.parse("2026-11-12T13:00:00Z"))),
        shortOfFoodUntil(ReadyTime(23.hours, Instant.parse("2026-11-13T11:00:00Z"))),
        BlockReason.PeopleShort(needed = 2, free = 0),
    )
}

@PreviewMyGame
@Composable
private fun NextLevelBlockedPreview(@PreviewParameter(BlockedStates::class) block: BlockReason) {
    MyGamePreviewSurface {
        NextLevel(
            building = TownBuildingKind.Farm,
            next = previewNextLevel,
            block = block,
            start = StartStatus.Idle,
            onIntent = {},
        )
    }
}
