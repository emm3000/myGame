package com.emm.mygame.feature.jobs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.town.jobs.TownJobRefusal
import com.emm.mygame.core.ui.DurationMark
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.seasonIconOf
import com.emm.mygame.core.ui.seasonSelectorOf

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
    val isSendAnswered: Boolean = send.isAnsweredFor(form.site)
    val quoteReason: MyGameLabel? = quoteRefusal?.let { refusal: TownJobRefusal ->
        MyGameLabel(text = copy.fixedCopy { jobRefusalLineOf(refusal) }, translation = null)
    }
    val blockReason: MyGameLabel? = form.block?.let { block: MapUiState.JobBlock -> copy.jobBlockLabelOf(block) }
    val reason: MyGameLabel? = if (isSendAnswered) null else quoteReason ?: blockReason
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
                supportingText = copy.chrome(R.string.map_job_at_home, "count" to form.workersAtHome.toString()),
            )
            JobField(
                value = form.trucks,
                label = copy.chrome(R.string.map_job_trucks),
                field = MapIntent.JobField.Trucks,
                onIntent = onIntent,
                supportingText = copy.chrome(R.string.map_job_at_home, "count" to form.trucksAtHome.toString()),
            )
            extraFields()
            quote(isSendAnswered)
            form.roadMark?.let { mark: DurationMark -> RoadMarkRow(mark = mark) }
            MyGameOutlinedButton(
                label = copy.chrome(R.string.map_job_send),
                isBusy = send == MapUiState.SendRequest.Waiting,
                busyDescription = copy.chrome(R.string.map_waiting),
                onClick = { onIntent(MapIntent.SendTapped) },
                blockedReason = reason,
            )
            SendAnswer(site = form.site, send = send)
        }
    }
}

@Composable
private fun RoadMarkRow(mark: DurationMark, modifier: Modifier = Modifier) {
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
