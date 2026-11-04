package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SeasonKind

@Composable
internal fun SeasonLine(season: FiefUiState.SeasonLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier,
    ) {
        MyGameIcon(
            icon = seasonIconOf(season.kind),
            tint = MyGameTheme.colors.inkMuted,
            modifier = Modifier.align(Alignment.CenterVertically),
        )
        MyGameText(
            text = stringResource(R.string.season_line, stringResource(seasonNameOf(season.kind)), season.year),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.season_separator),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.clearAndSetSemantics { },
        )
        MyGameText(
            text = stringResource(
                R.string.season_countdown,
                stringResource(seasonNameOf(season.next)),
                seasonTimeLeftOf(season.countdown),
            ),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun seasonTimeLeftOf(countdown: FiefUiState.SeasonCountdown): String = when (countdown) {
    is FiefUiState.SeasonCountdown.InDays ->
        pluralStringResource(R.plurals.season_days_left, countdown.days, countdown.days)
    is FiefUiState.SeasonCountdown.UnderADay -> countdownLabelOf(countdown.remaining)
    is FiefUiState.SeasonCountdown.InSeconds -> stringResource(R.string.slot_countdown_seconds, countdown.seconds)
}

internal fun seasonNameOf(kind: SeasonKind): Int = when (kind) {
    SeasonKind.Spring -> R.string.season_spring
    SeasonKind.Summer -> R.string.season_summer
    SeasonKind.Autumn -> R.string.season_autumn
    SeasonKind.Winter -> R.string.season_winter
}

internal fun seasonIconOf(kind: SeasonKind): ImageVector = when (kind) {
    SeasonKind.Spring -> MyGameIcons.spring
    SeasonKind.Summer -> MyGameIcons.summer
    SeasonKind.Autumn -> MyGameIcons.autumn
    SeasonKind.Winter -> MyGameIcons.winter
}
