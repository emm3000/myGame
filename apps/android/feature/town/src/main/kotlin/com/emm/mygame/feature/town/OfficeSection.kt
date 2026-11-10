package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun OfficeSection(
    office: TownUiState.OfficeLine,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            text = stringResource(placeNameOf(TownBuildingKind.Office)),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
                modifier = Modifier.padding(vertical = MyGameSpacing.step4),
            ) {
                HiringHeading()
                when (val hiring: TownUiState.HiringLine = office.hiring) {
                    TownUiState.HiringLine.Idle -> MyGameText(
                        text = stringResource(R.string.town_office_idle),
                        style = MyGameTypography.caption,
                        color = MyGameTheme.colors.inkMuted,
                    )
                    is TownUiState.HiringLine.Done -> DoneHiring(hiring = hiring)
                    is TownUiState.HiringLine.Busy ->
                        BusyHiring(hiring = hiring, stop = office.stop, onIntent = onIntent)
                }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            office.hires.forEachIndexed { index: Int, card: TownUiState.HireCard ->
                if (index > 0) MyGameHairline()
                HireItem(card = card, place = office.place, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun HiringHeading(modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.slot, tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            text = stringResource(R.string.town_office_hiring),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun HiringTitle(hire: TownHireKind, count: Int, delivered: Int, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameText(
            text = stringResource(hireNameOf(hire)),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.weight(1f),
        )
        MyGameText(
            text = icuStringResource(
                R.string.town_office_delivered,
                "delivered" to delivered.toString(),
                "count" to count.toString(),
            ),
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun DoneHiring(hiring: TownUiState.HiringLine.Done, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        HiringTitle(hire = hiring.hire, count = hiring.count, delivered = hiring.delivered)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(icon = MyGameIcons.check, tint = MyGameTheme.colors.ink)
            MyGameText(
                text = stringResource(R.string.town_office_done),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}

@Composable
private fun BusyHiring(
    hiring: TownUiState.HiringLine.Busy,
    stop: TownUiState.HireStopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        HiringTitle(hire = hiring.target.hire, count = hiring.count, delivered = hiring.delivered)
        RunningCountdown(text = finishLabelOf(hiring.remaining, hiring.finishesAt))
        MyGameTrack(
            filled = 1f - (hiring.remaining / hiring.total).toFloat(),
            color = MyGameTheme.colors.action,
        )
        MyGameText(
            text = stringResource(R.string.town_office_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameOutlinedButton(
            label = stringResource(R.string.town_office_stop),
            isBusy = stop == TownUiState.HireStopStatus.Waiting,
            busyDescription = stringResource(R.string.town_waiting),
            onClick = { onIntent(TownIntent.StopHiringTapped(hiring.target)) },
            accessibleName = stringResource(stopOfHireOf(hiring.target.hire)),
        )
        StopHiringAnswer(stop = stop)
    }
}

@Composable
private fun StopHiringAnswer(stop: TownUiState.HireStopStatus, modifier: Modifier = Modifier) {
    val message: String? = when (stop) {
        is TownUiState.HireStopStatus.Refused -> hiringRefusalLineOf(stop.refusal)
        TownUiState.HireStopStatus.Unreachable -> stringResource(R.string.town_refusal_unexpected)
        TownUiState.HireStopStatus.Idle, TownUiState.HireStopStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
