package com.emm.mygame.feature.jobs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.control.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun SiteItem(
    row: MapUiState.SiteRow,
    content: MapUiState.Content,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.padding(vertical = MyGameSpacing.step2),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(siteRowGap),
            modifier = Modifier.fillMaxWidth(),
        ) {
            SiteLines(row = row, modifier = Modifier.weight(1f))
            if (row.canSendTeam()) {
                SendTeamButton(
                    site = row.site,
                    onIntent = onIntent,
                    modifier = Modifier.atMostHalfTheRow().width(IntrinsicSize.Max),
                )
            }
        }
        SiteForm(row = row, content = content, onIntent = onIntent)
    }
}

@Composable
private fun SiteLines(row: MapUiState.SiteRow, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.semantics(mergeDescendants = true) { heading() },
    ) {
        MyGameText(
            label = copy.chrome(R.string.map_site, "site" to row.site.toString()),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(label = copy.statusOf(row), style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
    }
}

private val siteRowGap: Dp = MyGameSpacing.step3

private fun Modifier.atMostHalfTheRow(): Modifier = layout { measurable: Measurable, constraints: Constraints ->
    val half: Int = (constraints.maxWidth - siteRowGap.roundToPx()) / 2
    val placeable: Placeable = measurable.measure(
        constraints.copy(minWidth = constraints.minWidth.coerceAtMost(half), maxWidth = half),
    )
    layout(placeable.width, placeable.height) { placeable.place(x = 0, y = 0) }
}

private fun MapUiState.SiteRow.canSendTeam(): Boolean = when (this) {
    is MapUiState.SiteRow.Free, is MapUiState.SiteRow.Waste -> true
    is MapUiState.SiteRow.Town, is MapUiState.SiteRow.Own -> false
}

private fun PlayerCopy.statusOf(row: MapUiState.SiteRow): MyGameLabel = when (row) {
    is MapUiState.SiteRow.Free -> chrome(R.string.map_free)
    is MapUiState.SiteRow.Waste -> chrome(
        R.string.map_waste_status,
        "size" to sizeNumberOf(row.size).toString(),
        "waste" to row.waste.toString(),
    )
    is MapUiState.SiteRow.Town -> MyGameLabel(text = row.name, translation = null)
    is MapUiState.SiteRow.Own -> chrome(R.string.map_own_status, "name" to row.name)
}

@Composable
private fun SiteForm(row: MapUiState.SiteRow, content: MapUiState.Content, onIntent: (MapIntent) -> Unit) {
    val form: MapUiState.SiteForm? = content.form?.takeIf { open: MapUiState.SiteForm -> open.site == row.site }
    when (form) {
        is MapUiState.JobForm -> JobFormCard(form = form, send = content.send, onIntent = onIntent)
        is MapUiState.CleanUpForm -> CleanUpFormCard(form = form, send = content.send, onIntent = onIntent)
        null -> Unit
    }
}

@Composable
private fun SendTeamButton(site: Int, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameGoOutlinedButton(
        label = copy.chrome(R.string.map_send_team),
        isBusy = false,
        busyDescription = copy.chrome(R.string.map_waiting),
        onClick = { onIntent(MapIntent.SendTeamTapped(site)) },
        modifier = modifier,
        accessibleName = copy.chrome(R.string.map_send_team_to, "site" to site.toString()).spoken,
    )
}
