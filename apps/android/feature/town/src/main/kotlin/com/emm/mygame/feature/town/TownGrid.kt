package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import com.emm.mygame.core.designsystem.control.MyGameTextLink
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.navigation.MyGameTabHeader
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.formatQuantity
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.PlaceTile
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.resourceNameOf

private const val GRID_COLUMNS: Int = 2

private const val STOCK_COLUMNS: Int = 4

private const val NARROW_STOCK_COLUMNS: Int = 2

private val twoCardsWidth: Dp = MyGameSizes.placeCard * GRID_COLUMNS

private val stockLineStyle: TextStyle = MyGameTypography.meta.copy(letterSpacing = TextUnit.Unspecified)

@Composable
internal fun TownGrid(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onPlaceOpen: (TownBuildingKind) -> Unit,
    onNewsOpen: () -> Unit,
    ring: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
        val isNarrow: Boolean = maxWidth / LocalDensity.current.fontScale < twoCardsWidth
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
            MyGameTabHeader(
                title = rememberPlayerCopy().townTitleOf(name = content.name, label = content.label),
                modifier = Modifier.frameHeaderTurn(),
                ring = ring,
                under = { MyGameTextLink(label = chromeResource(R.string.town_news_link), onClick = onNewsOpen) },
            )
            content.season?.let { season: SeasonLine -> SeasonRow(season = season) }
            TownStocks(content = content, columns = if (isNarrow) NARROW_STOCK_COLUMNS else STOCK_COLUMNS)
            PlaceGrid(
                content = content,
                columns = if (isNarrow) 1 else GRID_COLUMNS,
                onIntent = onIntent,
                onPlaceOpen = onPlaceOpen,
            )
        }
    }
}

@Composable
private fun PlaceGrid(
    content: TownUiState.Content,
    columns: Int,
    onIntent: (TownIntent) -> Unit,
    onPlaceOpen: (TownBuildingKind) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        content.places.chunked(columns).forEach { row: List<PlaceCard> ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
                modifier = Modifier.height(IntrinsicSize.Min),
            ) {
                row.forEach { place: PlaceCard ->
                    PlaceTile(
                        place = place,
                        start = content.start,
                        onIntent = onIntent,
                        onOpen = { onPlaceOpen(place.kind) },
                        modifier = Modifier.weight(1f).fillMaxHeight(),
                    )
                }
                repeat(columns - row.size) { Spacer(modifier = Modifier.weight(1f).height(MyGameSpacing.step1)) }
            }
        }
    }
}

@Composable
private fun TownStocks(content: TownUiState.Content, columns: Int, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(top = MyGameSpacing.step2, bottom = MyGameSpacing.step3),
        ) {
            content.stocks.chunked(columns).forEach { row: List<StockLine> ->
                Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
                    row.forEach { stock: StockLine -> StockCell(stock = stock, modifier = Modifier.weight(1f)) }
                    repeat(columns - row.size) { Spacer(modifier = Modifier.weight(1f)) }
                }
            }
        }
        MyGameHairline()
    }
}

@Composable
private fun StockCell(stock: StockLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(modifier = modifier.semantics(mergeDescendants = true) {}) {
        MyGameText(
            text = formatQuantity(stock.amount),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome { text(resourceNameOf(stock.kind)) },
            style = stockLineStyle,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome(R.string.town_stock_of, "capacity" to formatQuantity(stock.capacity)),
            style = stockLineStyle,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

private fun PlayerCopy.townTitleOf(name: String, label: TownLabel): MyGameLabel = chrome {
    text(R.string.town_title, "name" to name, "label" to text(labelOf(label)))
}

private fun labelOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_label_town
    TownLabel.City -> R.string.town_label_city
}
