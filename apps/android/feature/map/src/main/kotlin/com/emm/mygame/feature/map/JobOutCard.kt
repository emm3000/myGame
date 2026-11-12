package com.emm.mygame.feature.map

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
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun JobOutCard(
    jobOut: MapUiState.JobOut,
    callBack: MapUiState.CallBackRequest,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = stringResource(jobOutTitleOf(jobOut.kind)),
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = icuStringResource(
                    R.string.map_job_out_site,
                    "region" to jobOut.site.region.toString(),
                    "area" to jobOut.site.area.toString(),
                    "site" to jobOut.site.site.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameText(
                text = icuStringResource(
                    R.string.map_job_out_team,
                    "workers" to jobOut.workers,
                    "trucks" to jobOut.trucks,
                ),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
            JobCountdown(jobOut = jobOut)
            (jobOut.kind as? MapUiState.JobKind.CleanUp)?.let { cleanUp: MapUiState.JobKind.CleanUp ->
                CleanUpLines(cleanUp = cleanUp)
            }
            if (jobOut.pay.isNotEmpty()) {
                MyGameText(
                    text = payLineOf(jobOut),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
            if (jobOut.canCallBack) {
                MyGameOutlinedButton(
                    label = stringResource(R.string.map_job_out_call_back),
                    isBusy = callBack == MapUiState.CallBackRequest.Waiting,
                    busyDescription = stringResource(R.string.map_waiting),
                    onClick = { onIntent(MapIntent.CallBackTapped) },
                )
            }
            CallBackAnswer(callBack = callBack)
        }
    }
}

@Composable
private fun JobCountdown(jobOut: MapUiState.JobOut, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            text = stringResource(phaseWordsOf(jobOut.phase)),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = finishLabelOf(jobOut.remaining, jobOut.finishesAt),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun CleanUpLines(cleanUp: MapUiState.JobKind.CleanUp) {
    MyGameText(
        text = icuStringResource(R.string.map_waste, "waste" to cleanUp.waste.toString()),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.inkMuted,
    )
    cleanUp.outcome?.let { outcome: MapUiState.CleanUpOutcome ->
        MyGameText(
            text = stringResource(cleanUpOutcomeLineOf(outcome)),
            style = MyGameTypography.body,
            color = if (outcome == MapUiState.CleanUpOutcome.Cleaned) {
                MyGameTheme.colors.ink
            } else {
                MyGameTheme.colors.warningInk
            },
        )
    }
}

@Composable
private fun CallBackAnswer(callBack: MapUiState.CallBackRequest, modifier: Modifier = Modifier) {
    val message: String? = when (callBack) {
        is MapUiState.CallBackRequest.Refused -> jobRefusalLineOf(callBack.refusal)
        MapUiState.CallBackRequest.Unreachable -> stringResource(R.string.map_refusal_unexpected)
        MapUiState.CallBackRequest.Idle, MapUiState.CallBackRequest.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
