package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun LibrarySection(
    library: FiefUiState.LibraryLine,
    onIntent: (FiefIntent) -> Unit,
    onReviewOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isWaiting: Boolean = library.study == FiefUiState.StudyStatus.Waiting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.library_title))
        when (val slot: FiefUiState.StudySlotLine = library.slot) {
            FiefUiState.StudySlotLine.Idle -> Card { IdleStudy() }
            is FiefUiState.StudySlotLine.Busy ->
                Card { BusyStudy(slot = slot, isWaiting = isWaiting, onIntent = onIntent) }
        }
        library.arts.forEach { card: FiefUiState.ArtCard ->
            ArtItem(card = card, isWaiting = isWaiting, onIntent = onIntent)
        }
        LessonItem(onReviewOpen = onReviewOpen)
        StudyAnswer(study = library.study)
    }
}

@Composable
private fun IdleStudy(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.study_idle),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    )
}

@Composable
private fun BusyStudy(
    slot: FiefUiState.StudySlotLine.Busy,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val countdown: String = countdownLabelOf(slot.remaining)
    val description: String = icuStringResource(R.string.slot_countdown_description, "countdown" to countdown)
    val art: String = stringResource(artNameOf(slot.art)).lowercase(spanish)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        MyGameText(
            text = stringResource(R.string.study_busy_title),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(artNameOf(slot.art)),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = icuStringResource(R.string.slot_level, "level" to slot.targetLevel.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.clearAndSetSemantics { contentDescription = description },
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.umber)
            MyGameText(text = countdown, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
        }
        MyGameButton(
            label = stringResource(R.string.study_cancel),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.StudyCancelTapped(slot.art, slot.targetLevel)) },
            accessibleName = icuStringResource(
                R.string.study_cancel_description,
                "art" to art,
                "level" to slot.targetLevel.toString(),
            ),
        )
        if (slot.refund.isNotEmpty()) {
            MyGameText(
                text = icuStringResource(R.string.study_refund, "refund" to refundOf(slot)),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}

@Composable
private fun ArtItem(
    card: FiefUiState.ArtCard,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            MyGameText(
                text = stringResource(artNameOf(card.kind)),
                style = MyGameTypography.brand,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = artLevelOf(card.level),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.inkMuted,
            )
            MyGameText(
                text = effectOf(card),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            when (val next: FiefUiState.NextArtLine? = card.next) {
                null -> MyGameText(
                    text = stringResource(R.string.building_max_level),
                    style = MyGameTypography.action,
                    color = MyGameTheme.colors.ink,
                )
                else -> NextArt(art = card.kind, next = next, isWaiting = isWaiting, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun NextArt(
    art: ArtKind,
    next: FiefUiState.NextArtLine,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val blocked: BlockedReason? = next.block?.let { block: FiefUiState.StudyBlock ->
        blockedReasonOf(reasonOf(block), (block as? FiefUiState.BlockReason.Resources)?.ready)
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        ) {
            next.costs.forEach { cost: FiefUiState.CostLine ->
                CostItem(
                    text = icuStringResource(costNameOf(cost.kind), "amount" to formatQuantity(cost.amount)),
                    isShort = cost.isShort,
                )
            }
        }
        MyGameText(
            text = icuStringResource(R.string.art_requires, "level" to next.requiredLibraryLevel.toString()),
            style = MyGameTypography.body,
            color = if (next.isLibraryTooLow) MyGameTheme.colors.rust else MyGameTheme.colors.inkMuted,
        )
        MyGameButton(
            label = icuStringResource(R.string.study_start, "duration" to durationLabelOf(next.duration)),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.StudyTapped(art)) },
            blockedReason = blocked?.description,
        )
        blocked?.let { line: BlockedReason -> BlockedReasonLine(blocked = line) }
    }
}

@Composable
private fun reasonOf(block: FiefUiState.StudyBlock): String = when (block) {
    FiefUiState.StudyBlock.StudyRunning -> stringResource(R.string.reason_study_running)
    is FiefUiState.StudyBlock.LibraryTooLow ->
        icuStringResource(
            R.string.reason_library_too_low,
            "required" to block.required.toString(),
            "built" to block.built.toString(),
        )
    is FiefUiState.BlockReason.Resources -> shortfallReasonOf(block)
}

@Composable
private fun StudyAnswer(study: FiefUiState.StudyStatus, modifier: Modifier = Modifier) {
    val message: Int? = when (study) {
        is FiefUiState.StudyStatus.Refused -> refusalOf(study.refusal)
        FiefUiState.StudyStatus.Unreachable -> R.string.fief_unreachable
        FiefUiState.StudyStatus.Idle, FiefUiState.StudyStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = stringResource(message), modifier = modifier)
}

@Composable
private fun artLevelOf(level: Int): String {
    if (level == 0) return stringResource(R.string.art_unstudied)
    return icuStringResource(R.string.building_level, "level" to level.toString())
}

@Composable
private fun effectOf(card: FiefUiState.ArtCard): String {
    val rate: String = icuStringResource(rateLineOf(card.resource), "percent" to percentLabelOf(card.ratePercent))
    return when (val next: FiefUiState.NextArtLine? = card.next) {
        null -> icuStringResource(R.string.art_effect_at_max_level, "rate" to rate)
        else -> icuStringResource(
            R.string.art_effect,
            "rate" to rate,
            "level" to next.level.toString(),
            "percent" to percentLabelOf(next.ratePercent),
        )
    }
}

@Composable
private fun refundOf(slot: FiefUiState.StudySlotLine.Busy): String = spanishListOf(
    items = slot.refund.map { cost: ResourceCost ->
        icuStringResource(costNameOf(cost.kind), "amount" to formatQuantity(cost.amount))
    },
    pairPattern = stringResource(R.string.list_pair),
    morePattern = stringResource(R.string.list_more),
)

private fun artNameOf(art: ArtKind): Int = when (art) {
    ArtKind.Smithing -> R.string.art_smithing
    ArtKind.Masonry -> R.string.art_masonry
}

private fun rateLineOf(resource: ResourceKind): Int = when (resource) {
    ResourceKind.Wood -> R.string.art_rate_wood
    ResourceKind.Stone -> R.string.art_rate_stone
    ResourceKind.Iron -> R.string.art_rate_iron
    ResourceKind.Gold -> R.string.art_rate_gold
    ResourceKind.Food -> R.string.art_rate_food
}

private fun refusalOf(refusal: StudyRefusal): Int = when (refusal) {
    StudyRefusal.StudySlotBusy -> R.string.refusal_study_slot_busy
    StudyRefusal.LibraryLevelTooLow -> R.string.refusal_library_level_too_low
    StudyRefusal.ArtMaxLevelReached -> R.string.refusal_art_max_level_reached
    StudyRefusal.StudyNotFound -> R.string.refusal_study_not_found
    StudyRefusal.InsufficientResources -> R.string.refusal_insufficient_resources
    StudyRefusal.Unrecognized -> R.string.fief_unreachable
}
