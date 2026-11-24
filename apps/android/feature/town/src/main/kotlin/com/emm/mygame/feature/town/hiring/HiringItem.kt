package com.emm.mygame.feature.town.hiring

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
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.durationLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.ReadyLine
import com.emm.mygame.feature.town.ReadyTime
import com.emm.mygame.feature.town.RevealedAlert
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.building.BlockReason
import com.emm.mygame.feature.town.building.CostItem
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.shortfallLineOf
import com.emm.mygame.feature.town.shortMarked
import com.emm.mygame.feature.town.townDurationCopy

@Composable
internal fun HiringItem(
    card: HiringCard,
    place: HiringPlaceStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val form: HiringForm? = card.form
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        Column {
            MyGameText(
                label = chromeResource(hireNameOf(card.kind)),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                label = chromeResource(teamOf(card.kind), "count" to card.team),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameText(
            label = chromeResource(R.string.town_office_needs_level, "level" to card.requiredOfficeLevel.toString()),
            style = MyGameTypography.caption,
            color = if (form == null) MyGameTheme.colors.warningInk else MyGameTheme.colors.inkMuted,
        )
        if (form != null) {
            HiringOrderForm(
                kind = card.kind,
                form = form,
                isWaiting = place == HiringPlaceStatus.Waiting(card.kind),
                isAnswered = place.isAnsweredFor(card.kind),
                onIntent = onIntent,
            )
        }
        HiringAnswer(kind = card.kind, place = place)
    }
}

@Composable
private fun HiringOrderForm(
    kind: TownHireKind,
    form: HiringForm,
    isWaiting: Boolean,
    isAnswered: Boolean,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = form.block?.let { blocked: HiringBlock -> copy.hiringBlockLineOf(blocked) }
    val offer: HiringOffer? = form.offer
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameTextField(
            value = form.entry,
            label = copy.chrome(countLabelOf(kind)),
            isSecret = false,
            isReadOnly = false,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            onValueChange = { entry: String -> onIntent(TownIntent.HiringEntryChanged(kind, entry)) },
            isEnabled = !form.isEntryDisabled,
        )
        if (offer != null) HiringCosts(offer = offer)
        MyGameOutlinedButton(
            label = if (offer == null) copy.chrome(hireAnyOf(kind)) else copy.chrome { hireLabelOf(kind, offer) },
            isBusy = isWaiting,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.PlaceHiringTapped(kind)) },
            blockedReason = reason?.spoken,
        )
        reason?.takeUnless { isAnswered }?.let { line: MyGameLabel ->
            MyGameText(
                label = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics { hideFromAccessibility() },
            )
        }
        val ready: ReadyTime? = (form.block as? HiringBlock.Resources)?.ready
        if (ready != null && !isAnswered) ReadyLine(ready = ready)
    }
}

@Composable
private fun HiringCosts(offer: HiringOffer, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        offer.costs.forEach { cost: CostLine -> CostItem(cost = cost) }
        PeopleCost(people = offer.people, isShort = offer.isPeopleShort)
    }
}

@Composable
private fun PeopleCost(people: Long, isShort: Boolean, modifier: Modifier = Modifier) {
    val description: String = rememberPlayerCopy().chrome {
        shortMarked(text(R.string.town_office_people_cost, "count" to people), isShort)
    }.spoken
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
private fun HiringAnswer(kind: TownHireKind, place: HiringPlaceStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (place) {
        is HiringPlaceStatus.Refused ->
            if (place.hire == kind) copy.fixedCopy { hiringRefusalLineOf(place.refusal) } else null
        is HiringPlaceStatus.Unreachable ->
            if (place.hire == kind) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        HiringPlaceStatus.Idle, is HiringPlaceStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}

private fun HiringPlaceStatus.isAnsweredFor(kind: TownHireKind): Boolean = when (this) {
    is HiringPlaceStatus.Refused -> hire == kind
    is HiringPlaceStatus.Unreachable -> hire == kind
    HiringPlaceStatus.Idle, is HiringPlaceStatus.Waiting -> false
}

private fun CopyReader.hireLabelOf(kind: TownHireKind, offer: HiringOffer): String = text(
    R.string.town_build_with_duration,
    "action" to text(hireOf(kind), "count" to offer.count),
    "duration" to durationLabelOf(offer.duration, townDurationCopy),
)

private fun PlayerCopy.hiringBlockLineOf(block: HiringBlock): MyGameLabel = when (block) {
    HiringBlock.CountNeeded -> chrome(R.string.town_office_count_needed)
    HiringBlock.Busy -> chrome(R.string.town_office_busy)
    is HiringBlock.PeopleShort ->
        chrome(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is HiringBlock.Resources ->
        chrome { shortfallLineOf(BlockReason.Resources(block.shortfalls, ready = null)) }
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
