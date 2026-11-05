package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.ui.icuStringResource

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
            text = icuStringResource(
                R.string.season_line,
                "season" to stringResource(seasonNameOf(season.kind)),
                "year" to season.year.toString(),
            ),
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
            text = icuStringResource(
                R.string.season_countdown,
                "season" to stringResource(seasonNameOf(season.next)),
                "timeLeft" to seasonTimeLeftOf(season.countdown),
            ),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun seasonTimeLeftOf(countdown: FiefUiState.SeasonCountdown): String = when (countdown) {
    is FiefUiState.SeasonCountdown.InDays ->
        icuStringResource(R.string.season_days_left, "days" to countdown.days)
    is FiefUiState.SeasonCountdown.UnderADay -> countdownLabelOf(countdown.remaining)
    is FiefUiState.SeasonCountdown.InSeconds -> icuStringResource(
        R.string.slot_countdown_seconds,
        "seconds" to countdown.seconds.toString(),
    )
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
