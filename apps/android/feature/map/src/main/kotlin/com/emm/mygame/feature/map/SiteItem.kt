package com.emm.mygame.feature.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

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
            text = icuStringResource(R.string.map_site, "site" to row.site.toString()),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (row) {
            is MapUiState.SiteRow.Free -> FreeSite(row = row, content = content, onIntent = onIntent)
            is MapUiState.SiteRow.Town -> TownName(name = row.name)
            is MapUiState.SiteRow.Own -> {
                TownName(name = row.name)
                MyGameText(
                    text = stringResource(R.string.map_own_town),
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
        text = stringResource(R.string.map_free),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.inkMuted,
    )
    MyGameOutlinedButton(
        label = stringResource(R.string.map_send_team),
        isBusy = false,
        busyDescription = stringResource(R.string.map_waiting),
        onClick = { onIntent(MapIntent.SendTeamTapped(row.site)) },
        accessibleName = icuStringResource(R.string.map_send_team_to, "site" to row.site.toString()),
    )
    content.form?.takeIf { form: MapUiState.JobForm -> form.site == row.site }?.let { form: MapUiState.JobForm ->
        JobFormCard(form = form, send = content.send, onIntent = onIntent)
    }
}

@Composable
private fun TownName(name: String, modifier: Modifier = Modifier) {
    MyGameText(text = name, style = MyGameTypography.body, color = MyGameTheme.colors.ink, modifier = modifier)
}
