package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.ui.icuStringResource

private const val STOCKS_PER_ROW: Int = 2

@Composable
internal fun StocksSection(content: TownUiState.Content, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = stringResource(R.string.town_stocks),
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            content.stocks.chunked(STOCKS_PER_ROW).forEach { row: List<TownUiState.StockLine> ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    row.forEach { stock: TownUiState.StockLine ->
                        StockItem(stock = stock, modifier = Modifier.weight(1f))
                    }
                }
            }
            MyGameHairline()
            PeopleRow(people = content.people)
            content.season?.let { season: TownUiState.SeasonLine -> SeasonRow(season = season) }
        }
    }
}

@Composable
private fun StockItem(stock: TownUiState.StockLine, modifier: Modifier = Modifier) {
    val capacity: String = formatQuantity(stock.capacity)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(icon = resourceIconOf(stock.kind), tint = MyGameTheme.colors.ink)
            MyGameText(
                text = capitalized(stringResource(resourceNameOf(stock.kind))),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.ink,
            )
        }
        MyGameText(
            text = formatQuantity(stock.amount),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.ink,
        )
        FlowRow(
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth(),
        ) {
            MyGameText(
                text = if (stock.isFull) {
                    icuStringResource(R.string.town_full, "capacity" to capacity)
                } else {
                    icuStringResource(R.string.town_stock_of, "capacity" to capacity)
                },
                style = MyGameTypography.caption.withTabularFigures(),
                color = MyGameTheme.colors.inkMuted,
            )
            MyGameText(
                text = icuStringResource(R.string.town_rate, "rate" to formatQuantity(stock.ratePerHour)),
                style = MyGameTypography.caption.withTabularFigures(),
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameTrack(filled = stock.amount.toFloat() / stock.capacity.toFloat(), color = MyGameTheme.colors.ink)
        SkillMark(stock = stock)
    }
}

@Composable
private fun SkillMark(stock: TownUiState.StockLine, modifier: Modifier = Modifier) {
    if (stock.skillLevel == 0) return
    MyGameText(
        text = icuStringResource(
            R.string.town_skill_name,
            "resource" to stringResource(resourceNameOf(stock.kind)),
            "level" to stock.skillLevel.toString(),
        ),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.ink,
        modifier = modifier,
    )
}

@Composable
private fun PeopleRow(people: TownUiState.PeopleLine, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.people, tint = MyGameTheme.colors.ink)
        MyGameText(
            text = icuStringResource(
                R.string.town_people,
                "free" to people.free,
                "atWork" to people.atWork.toString(),
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun SeasonRow(season: TownUiState.SeasonLine, modifier: Modifier = Modifier) {
    val name: String = capitalized(stringResource(seasonNameOf(season.kind)))
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
            text = icuStringResource(R.string.town_season_line, "season" to name, "year" to season.year.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.town_season_separator),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.clearAndSetSemantics { },
        )
        MyGameText(
            text = icuStringResource(
                R.string.town_season_ends_in,
                "season" to name,
                "timeLeft" to seasonTimeLeftOf(season),
            ),
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun seasonTimeLeftOf(season: TownUiState.SeasonLine): String {
    val days: Long = season.remaining.inWholeDays
    if (days < 1) return timeLeftLabelOf(season.remaining)
    return icuStringResource(R.string.town_season_days, "days" to days.toInt())
}
