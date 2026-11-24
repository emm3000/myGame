package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.timeLeftLabelOf
import com.emm.mygame.feature.town.building.capitalized
import com.emm.mygame.feature.town.building.seasonNameOf

@Composable
internal fun SeasonRow(season: SeasonLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
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
            label = copy.chrome {
                text(R.string.town_season_line, "season" to seasonLabelOf(season), "year" to season.year.toString())
            },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome(R.string.town_season_separator),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.clearAndSetSemantics { },
        )
        FiguredCaption(
            label = copy.chrome {
                text(
                    R.string.town_season_ends_in,
                    "season" to seasonLabelOf(season),
                    "timeLeft" to seasonTimeLeftOf(season),
                )
            },
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

private fun CopyReader.seasonLabelOf(season: SeasonLine): String =
    capitalized(text(seasonNameOf(season.kind)))

private fun CopyReader.seasonTimeLeftOf(season: SeasonLine): String {
    val days: Long = season.remaining.inWholeDays
    if (days < 1) return timeLeftLabelOf(season.remaining, townDurationCopy)
    return text(R.string.town_season_days, "days" to days.toInt())
}
