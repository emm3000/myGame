package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun TeamFormCard(
    form: MapUiState.SiteForm,
    title: String,
    send: MapUiState.SendRequest,
    quoteRefusal: TownJobRefusal?,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
    extraFields: @Composable () -> Unit = {},
    quote: @Composable (isSendAnswered: Boolean) -> Unit,
) {
    val reason: String? = form.block?.let { block: MapUiState.JobBlock -> jobBlockLineOf(block) }
    val isSendAnswered: Boolean = send.isAnsweredFor(form.site)
    val isApiAnswered: Boolean = isSendAnswered || quoteRefusal != null
    val quoteReason: String? = quoteRefusal?.takeUnless { isSendAnswered }?.let { refusal: TownJobRefusal ->
        jobRefusalLineOf(refusal)
    }
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = title,
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            JobField(
                value = form.workers,
                label = stringResource(R.string.map_job_workers),
                field = MapIntent.JobField.Workers,
                onIntent = onIntent,
                supportingText = icuStringResource(R.string.map_job_at_home, "count" to form.workersAtHome.toString()),
            )
            JobField(
                value = form.trucks,
                label = stringResource(R.string.map_job_trucks),
                field = MapIntent.JobField.Trucks,
                onIntent = onIntent,
                supportingText = icuStringResource(R.string.map_job_at_home, "count" to form.trucksAtHome.toString()),
            )
            extraFields()
            quote(isSendAnswered)
            MyGameButton(
                label = stringResource(R.string.map_job_send),
                isBusy = send == MapUiState.SendRequest.Waiting,
                busyDescription = stringResource(R.string.map_waiting),
                onClick = { onIntent(MapIntent.SendTapped) },
                blockedReason = reason ?: quoteReason,
            )
            reason?.takeUnless { isApiAnswered }?.let { line: String ->
                MyGameText(
                    text = line,
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.warningInk,
                    modifier = Modifier.semantics { hideFromAccessibility() },
                )
            }
            SendAnswer(site = form.site, send = send)
        }
    }
}
