package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.durationLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@Composable
internal fun NextLevel(
    building: TownBuildingKind,
    next: TownUiState.NextLevelLine,
    block: TownUiState.BlockReason?,
    isWaiting: Boolean,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: TownUiState.BlockReason -> copy.blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.town_people_at_work, "people" to next.people.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        Costs(next = next)
        MyGameOutlinedButton(
            label = copy.chrome {
                text(
                    R.string.town_build_with_duration,
                    "action" to text(R.string.town_build, "level" to next.level.toString()),
                    "duration" to durationLabelOf(next.duration, townDurationCopy),
                )
            },
            isBusy = isWaiting,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.BuildTapped(building)) },
            blockedReason = reason?.spoken,
        )
        reason?.let { line: MyGameLabel ->
            MyGameText(
                label = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics { hideFromAccessibility() },
            )
        }
        (block as? TownUiState.BlockReason.Resources)?.ready?.let { ready: TownUiState.ReadyTime ->
            ReadyLine(ready = ready)
        }
    }
}

@Composable
private fun Costs(next: TownUiState.NextLevelLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        next.costs.forEach { cost: TownUiState.CostLine -> CostItem(cost = cost) }
    }
}

@Composable
internal fun CostItem(cost: TownUiState.CostLine, modifier: Modifier = Modifier) {
    val description: String = rememberPlayerCopy().chrome {
        shortMarked(amountLineOf(cost.kind, cost.amount), cost.isShort)
    }.spoken
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    ) {
        MyGameIcon(
            icon = resourceIconOf(cost.kind),
            tint = MyGameTheme.colors.ink,
            modifier = Modifier.size(MyGameSizes.iconSmall),
        )
        MyGameText(
            text = formatQuantity(cost.amount),
            style = MyGameTypography.caption.withTabularFigures(),
            color = if (cost.isShort) MyGameTheme.colors.warningInk else MyGameTheme.colors.ink,
        )
    }
}

@Composable
internal fun StartAnswer(building: TownBuildingKind, start: TownUiState.StartStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (start) {
        is TownUiState.StartStatus.Refused ->
            if (start.building == building) copy.fixedCopy { workRefusalLineOf(start.refusal) } else null
        is TownUiState.StartStatus.Unreachable ->
            if (start.building == building) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        TownUiState.StartStatus.Idle, is TownUiState.StartStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}

private fun PlayerCopy.blockLineOf(block: TownUiState.BlockReason): MyGameLabel = when (block) {
    is TownUiState.BlockReason.WaitingListFull -> MyGameLabel(
        text = fixedCopy(R.string.town_refusal_waiting_list_full, "cap" to block.cap),
        translation = null,
    )
    is TownUiState.BlockReason.PeopleShort ->
        chrome(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is TownUiState.BlockReason.Resources -> chrome { shortfallLineOf(block) }
}

internal fun CopyReader.shortfallLineOf(block: TownUiState.BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: TownUiState.Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    return text(R.string.town_shortfall, "missing" to listPhraseOf(amounts))
}

private fun CopyReader.amountLineOf(kind: TownResourceKind, amount: Long): String = text(
    R.string.town_amount,
    "amount" to formatQuantity(amount),
    "resource" to text(resourceNameOf(kind)),
)

private val previewNextLevel: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
    level = 2,
    costs = listOf(TownUiState.CostLine(TownResourceKind.Food, amount = 120, isShort = true)),
    duration = 3.minutes,
    people = 2,
    wordsNeeded = null,
)

private fun shortOfFoodUntil(ready: TownUiState.ReadyTime): TownUiState.BlockReason =
    TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Food, amount = 40)), ready = ready)

private class ReadyLineStates : PreviewParameterProvider<TownUiState.BlockReason> {

    override val values: Sequence<TownUiState.BlockReason> = sequenceOf(
        shortOfFoodUntil(TownUiState.ReadyTime(24.minutes, Instant.parse("2026-11-12T15:24:00Z"))),
        shortOfFoodUntil(TownUiState.ReadyTime(2.hours, Instant.parse("2026-11-12T13:00:00Z"))),
        shortOfFoodUntil(TownUiState.ReadyTime(23.hours, Instant.parse("2026-11-13T11:00:00Z"))),
        TownUiState.BlockReason.PeopleShort(needed = 2, free = 0),
    )
}

@PreviewMyGame
@Composable
private fun NextLevelReadyPreview(@PreviewParameter(ReadyLineStates::class) block: TownUiState.BlockReason) {
    MyGamePreviewSurface {
        NextLevel(
            building = TownBuildingKind.Farm,
            next = previewNextLevel,
            block = block,
            isWaiting = false,
            onIntent = {},
        )
    }
}
