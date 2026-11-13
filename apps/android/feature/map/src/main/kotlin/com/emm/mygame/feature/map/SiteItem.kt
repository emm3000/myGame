package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun SiteItem(
    row: MapUiState.SiteRow,
    content: MapUiState.Content,
    onIntent: (MapIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        MyGameText(
            label = chromeResource(R.string.map_site, "site" to row.site.toString()),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (row) {
            is MapUiState.SiteRow.Free -> FreeSite(row = row, content = content, onIntent = onIntent)
            is MapUiState.SiteRow.Waste -> WasteSite(row = row, content = content, onIntent = onIntent)
            is MapUiState.SiteRow.Town -> TownName(name = row.name)
            is MapUiState.SiteRow.Own -> {
                TownName(name = row.name)
                MyGameText(
                    label = chromeResource(R.string.map_own_town),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
        }
    }
}

@Composable
private fun FreeSite(
    row: MapUiState.SiteRow.Free,
    content: MapUiState.Content,
    onIntent: (MapIntent) -> Unit,
) {
    MyGameText(
        label = chromeResource(R.string.map_free),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.inkMuted,
    )
    SendTeamButton(site = row.site, onIntent = onIntent)
    (content.form as? MapUiState.JobForm)?.takeIf { form: MapUiState.JobForm -> form.site == row.site }
        ?.let { form: MapUiState.JobForm -> JobFormCard(form = form, send = content.send, onIntent = onIntent) }
}

@Composable
private fun WasteSite(
    row: MapUiState.SiteRow.Waste,
    content: MapUiState.Content,
    onIntent: (MapIntent) -> Unit,
) {
    MyGamePlaceArt(art = wasteArtOf(row.size), risenFrom = null)
    MyGameText(
        label = chromeResource(R.string.map_waste_site),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.ink,
    )
    MyGameText(
        label = chromeResource(R.string.map_waste_size, "size" to sizeNumberOf(row.size).toString()),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.inkMuted,
    )
    MyGameText(
        label = chromeResource(R.string.map_waste, "waste" to row.waste.toString()),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.inkMuted,
    )
    SendTeamButton(site = row.site, onIntent = onIntent)
    (content.form as? MapUiState.CleanUpForm)?.takeIf { form: MapUiState.CleanUpForm -> form.site == row.site }
        ?.let { form: MapUiState.CleanUpForm -> CleanUpFormCard(form = form, send = content.send, onIntent = onIntent) }
}

@Composable
private fun SendTeamButton(site: Int, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameOutlinedButton(
        label = copy.chrome(R.string.map_send_team),
        isBusy = false,
        busyDescription = copy.chrome(R.string.map_waiting).spoken,
        onClick = { onIntent(MapIntent.SendTeamTapped(site)) },
        modifier = modifier,
        accessibleName = copy.chrome(R.string.map_send_team_to, "site" to site.toString()).spoken,
    )
}

@Composable
private fun TownName(name: String, modifier: Modifier = Modifier) {
    MyGameText(text = name, style = MyGameTypography.body, color = MyGameTheme.colors.ink, modifier = modifier)
}
