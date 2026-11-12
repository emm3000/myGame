package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun HireItem(
    card: TownUiState.HireCard,
    place: TownUiState.HireStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val form: TownUiState.HireForm? = card.form
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        Column {
            MyGameText(
                text = stringResource(hireNameOf(card.kind)),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = icuStringResource(teamOf(card.kind), "count" to card.team),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameText(
            text = icuStringResource(R.string.town_office_needs_level, "level" to card.requiredOfficeLevel.toString()),
            style = MyGameTypography.caption,
            color = if (form == null) MyGameTheme.colors.warningInk else MyGameTheme.colors.inkMuted,
        )
        if (form != null) {
            HireForm(
                kind = card.kind,
                form = form,
                isWaiting = place == TownUiState.HireStatus.Waiting(card.kind),
                isAnswered = place.isAnsweredFor(card.kind),
                onIntent = onIntent,
            )
        }
        HireAnswer(kind = card.kind, place = place)
    }
}

@Composable
private fun HireForm(
    kind: TownHireKind,
    form: TownUiState.HireForm,
    isWaiting: Boolean,
    isAnswered: Boolean,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = form.block?.let { blocked: TownUiState.HireBlock -> hireBlockLineOf(blocked) }
    val offer: TownUiState.HireOffer? = form.offer
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameTextField(
            value = form.entry,
            label = stringResource(countLabelOf(kind)),
            isSecret = false,
            isReadOnly = false,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            onValueChange = { entry: String -> onIntent(TownIntent.HireEntryChanged(kind, entry)) },
            isEnabled = !form.isEntryDisabled,
        )
        if (offer != null) HireCosts(offer = offer)
        MyGameOutlinedButton(
            label = if (offer == null) stringResource(hireAnyOf(kind)) else hireLabelOf(kind, offer),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.town_waiting),
            onClick = { onIntent(TownIntent.HireTapped(kind)) },
            blockedReason = reason,
        )
        reason?.takeUnless { isAnswered }?.let { line: String ->
            MyGameText(
                text = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics { hideFromAccessibility() },
            )
        }
        val ready: TownUiState.ReadyTime? = (form.block as? TownUiState.HireBlock.Resources)?.ready
        if (ready != null && !isAnswered) ReadyLine(ready = ready)
    }
}

@Composable
private fun HireCosts(offer: TownUiState.HireOffer, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        offer.costs.forEach { cost: TownUiState.CostLine -> CostItem(cost = cost) }
        PeopleCost(people = offer.people, isShort = offer.isPeopleShort)
    }
}

@Composable
private fun PeopleCost(people: Long, isShort: Boolean, modifier: Modifier = Modifier) {
    val spoken: String = icuStringResource(R.string.town_office_people_cost, "count" to people)
    val description: String = if (isShort) spoken + stringResource(R.string.town_short_mark) else spoken
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    ) {
        MyGameIcon(
            icon = MyGameIcons.people,
            tint = MyGameTheme.colors.ink,
            modifier = Modifier.size(MyGameSizes.iconSmall),
        )
        MyGameText(
            text = formatQuantity(people),
            style = MyGameTypography.caption.withTabularFigures(),
            color = if (isShort) MyGameTheme.colors.warningInk else MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun HireAnswer(kind: TownHireKind, place: TownUiState.HireStatus, modifier: Modifier = Modifier) {
    val message: String? = when (place) {
        is TownUiState.HireStatus.Refused -> if (place.hire == kind) hiringRefusalLineOf(place.refusal) else null
        is TownUiState.HireStatus.Unreachable ->
            if (place.hire == kind) stringResource(R.string.town_refusal_unexpected) else null
        TownUiState.HireStatus.Idle, is TownUiState.HireStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

private fun TownUiState.HireStatus.isAnsweredFor(kind: TownHireKind): Boolean = when (this) {
    is TownUiState.HireStatus.Refused -> hire == kind
    is TownUiState.HireStatus.Unreachable -> hire == kind
    TownUiState.HireStatus.Idle, is TownUiState.HireStatus.Waiting -> false
}

@Composable
private fun hireLabelOf(kind: TownHireKind, offer: TownUiState.HireOffer): String = icuStringResource(
    R.string.town_build_with_duration,
    "action" to icuStringResource(hireOf(kind), "count" to offer.count),
    "duration" to durationLabelOf(offer.duration),
)

@Composable
private fun hireBlockLineOf(block: TownUiState.HireBlock): String = when (block) {
    TownUiState.HireBlock.CountNeeded -> stringResource(R.string.town_office_count_needed)
    TownUiState.HireBlock.Busy -> stringResource(R.string.town_office_busy)
    is TownUiState.HireBlock.PeopleShort ->
        icuStringResource(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is TownUiState.HireBlock.Resources ->
        shortfallLineOf(TownUiState.BlockReason.Resources(block.shortfalls, ready = null))
}

internal fun hireNameOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_name_worker
    TownHireKind.Truck -> R.string.town_office_name_truck
}

internal fun stopOfHireOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_stop_of_worker
    TownHireKind.Truck -> R.string.town_office_stop_of_truck
}

private fun teamOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_team_worker
    TownHireKind.Truck -> R.string.town_office_team_truck
}

private fun countLabelOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_count_worker
    TownHireKind.Truck -> R.string.town_office_count_truck
}

private fun hireOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_hire_worker
    TownHireKind.Truck -> R.string.town_office_hire_truck
}

private fun hireAnyOf(kind: TownHireKind): Int = when (kind) {
    TownHireKind.Worker -> R.string.town_office_hire_any_worker
    TownHireKind.Truck -> R.string.town_office_hire_any_truck
}
