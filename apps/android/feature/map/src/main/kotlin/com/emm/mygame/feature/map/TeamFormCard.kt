package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TeamFormCard(
    form: MapUiState.SiteForm,
    title: MyGameLabel,
    send: MapUiState.SendRequest,
    quoteRefusal: TownJobRefusal?,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
    extraFields: @Composable () -> Unit = {},
    quote: @Composable (isSendAnswered: Boolean) -> Unit,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = form.block?.let { block: MapUiState.JobBlock -> copy.jobBlockLabelOf(block) }
    val isSendAnswered: Boolean = send.isAnsweredFor(form.site)
    val isApiAnswered: Boolean = isSendAnswered || quoteRefusal != null
    val quoteReason: String? = quoteRefusal?.takeUnless { isSendAnswered }?.let { refusal: TownJobRefusal ->
        copy.fixedCopy { jobRefusalLineOf(refusal) }
    }
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                label = title,
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            JobField(
                value = form.workers,
                label = copy.chrome(R.string.map_job_workers),
                field = MapIntent.JobField.Workers,
                onIntent = onIntent,
                supportingText = copy.chrome(R.string.map_job_at_home, "count" to form.workersAtHome.toString()).spoken,
            )
            JobField(
                value = form.trucks,
                label = copy.chrome(R.string.map_job_trucks),
                field = MapIntent.JobField.Trucks,
                onIntent = onIntent,
                supportingText = copy.chrome(R.string.map_job_at_home, "count" to form.trucksAtHome.toString()).spoken,
            )
            extraFields()
            quote(isSendAnswered)
            form.roadMark?.let { mark: MapUiState.DurationMark -> RoadMarkRow(mark = mark) }
            MyGameButton(
                label = copy.chrome(R.string.map_job_send),
                isBusy = send == MapUiState.SendRequest.Waiting,
                busyDescription = copy.chrome(R.string.map_waiting).spoken,
                onClick = { onIntent(MapIntent.SendTapped) },
                blockedReason = reason?.spoken ?: quoteReason,
            )
            reason?.takeUnless { isApiAnswered }?.let { line: MyGameLabel ->
                MyGameText(
                    label = line,
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.warningInk,
                    modifier = Modifier.semantics { hideFromAccessibility() },
                )
            }
            SendAnswer(site = form.site, send = send)
        }
    }
}

@Composable
private fun RoadMarkRow(mark: MapUiState.DurationMark, modifier: Modifier = Modifier) {
    SeasonMark(
        icon = seasonIconOf(mark.season),
        label = chromeResource(
            R.string.map_season_road_mark,
            "season" to seasonSelectorOf(mark.season),
            "percent" to mark.percent.toString(),
        ),
        modifier = modifier,
    )
}
