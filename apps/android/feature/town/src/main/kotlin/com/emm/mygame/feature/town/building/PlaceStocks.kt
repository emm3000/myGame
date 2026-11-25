package com.emm.mygame.feature.town.building

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.seasonIconOf
import com.emm.mygame.core.ui.seasonSelectorOf
import com.emm.mygame.feature.town.FiguredCaption
import com.emm.mygame.feature.town.ProductionMark
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.SeasonLine
import com.emm.mygame.feature.town.TownUiState
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@Composable
internal fun PlaceStocks(place: TownBuildingKind, content: TownUiState.Content, modifier: Modifier = Modifier) {
    val shown: List<StockLine> = content.stocks.filter { stock: StockLine ->
        stock.kind in stocksOf(place)
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        shown.forEach { stock: StockLine ->
            Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
                StockItem(stock = stock)
                content.season?.let { season: SeasonLine ->
                    season.productionMarks
                        .filter { mark: ProductionMark -> mark.resource == stock.kind }
                        .forEach { mark: ProductionMark ->
                            ProductionMarkRow(season = season.kind, mark = mark)
                        }
                }
            }
        }
        if (place == TownBuildingKind.Homes) PeopleRow(people = content.people)
        if (place == TownBuildingKind.School) WordsRows(words = content.words)
    }
}

private fun stocksOf(place: TownBuildingKind): Set<TownResourceKind> = when (place) {
    TownBuildingKind.Farm -> setOf(TownResourceKind.Food)
    TownBuildingKind.Factory -> setOf(TownResourceKind.Material)
    TownBuildingKind.PowerStation -> setOf(TownResourceKind.Power)
    TownBuildingKind.Storage -> TownResourceKind.entries.toSet()
    TownBuildingKind.Homes, TownBuildingKind.School, TownBuildingKind.Office -> emptySet()
}

@Composable
private fun StockItem(stock: StockLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val capacity: String = formatQuantity(stock.capacity)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(icon = resourceIconOf(stock.kind), tint = MyGameTheme.colors.ink)
            MyGameText(
                label = copy.chrome { capitalized(text(resourceNameOf(stock.kind))) },
                style = MyGameTypography.title,
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
            FiguredCaption(
                label = copy.chrome(
                    if (stock.isFull) R.string.town_full else R.string.town_stock_of,
                    "capacity" to capacity,
                ),
                color = MyGameTheme.colors.inkMuted,
            )
            FiguredCaption(
                label = copy.chrome {
                    stock.fill?.let { fill: FillTime -> fillLabelOf(fill) }
                        ?: text(R.string.town_rate, "rate" to formatQuantity(stock.ratePerHour))
                },
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameTrack(filled = stock.amount.toFloat() / stock.capacity.toFloat(), color = MyGameTheme.colors.ink)
        SkillMark(stock = stock)
    }
}

@Composable
private fun SkillMark(stock: StockLine, modifier: Modifier = Modifier) {
    if (stock.skillLevel == 0) return
    MyGameText(
        label = rememberPlayerCopy().chrome {
            text(
                R.string.town_skill_name,
                "resource" to text(resourceNameOf(stock.kind)),
                "level" to stock.skillLevel.toString(),
            )
        },
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.ink,
        modifier = modifier,
    )
}

@Composable
private fun PeopleRow(people: PeopleLine, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.people, tint = MyGameTheme.colors.ink)
        MyGameText(
            label = chromeResource(
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
private fun WordsRows(words: WordsLine, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.town_words_reviewed, "count" to words.stable.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = chromeResource(R.string.town_words_learned, "count" to words.retained.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun ProductionMarkRow(season: SeasonKind, mark: ProductionMark, modifier: Modifier = Modifier) {
    SeasonMark(
        icon = seasonIconOf(season),
        label = rememberPlayerCopy().chrome {
            text(
                R.string.town_season_production_mark,
                "season" to seasonSelectorOf(season),
                "resource" to text(resourceNameOf(mark.resource)),
                "percent" to mark.percent.toString(),
            )
        },
        modifier = modifier,
    )
}

private fun previewLocalInstantOf(local: LocalDateTime): Instant =
    Instant.fromEpochMilliseconds(local.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())

private fun previewStockOf(kind: TownResourceKind, amount: Long, fill: FillTime?): StockLine =
    StockLine(kind, amount, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = fill)

private class StockItemStates : PreviewParameterProvider<StockLine> {

    override val values: Sequence<StockLine> = sequenceOf(
        previewStockOf(
            TownResourceKind.Money,
            amount = 810,
            fill = FillTime(3.hours, previewLocalInstantOf(LocalDateTime.of(2026, 11, 12, 19, 0))),
        ),
        previewStockOf(
            TownResourceKind.Food,
            amount = 750,
            fill = FillTime(5.hours, previewLocalInstantOf(LocalDateTime.of(2026, 11, 13, 3, 0))),
        ),
        previewStockOf(TownResourceKind.Power, amount = 120, fill = null),
        previewStockOf(TownResourceKind.Material, amount = 900, fill = null),
    )
}

@PreviewMyGame
@Composable
private fun StockItemPreview(@PreviewParameter(StockItemStates::class) stock: StockLine) {
    MyGamePreviewSurface {
        StockItem(stock = stock)
    }
}
