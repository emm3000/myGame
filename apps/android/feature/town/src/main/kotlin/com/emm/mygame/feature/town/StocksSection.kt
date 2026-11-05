package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun StocksSection(content: TownUiState.Content, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.town_stocks))
        MyGameCard {
            content.stocks.forEach { stock: TownUiState.StockLine -> StockRow(stock = stock) }
            MyGameText(
                text = icuStringResource(
                    R.string.town_people,
                    "free" to content.people.free,
                    "atWork" to content.people.atWork.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.padding(vertical = MyGameSpacing.step3),
            )
        }
    }
}

@Composable
private fun StockRow(stock: TownUiState.StockLine, modifier: Modifier = Modifier) {
    val capacity: String = formatQuantity(stock.capacity)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.fillMaxWidth().padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = capitalized(stringResource(resourceNameOf(stock.kind))),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
        Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.fillMaxWidth(),
        ) {
            MyGameText(
                text = formatQuantity(stock.amount),
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
            )
            MyGameText(
                text = if (stock.isFull) {
                    icuStringResource(R.string.town_full, "capacity" to capacity)
                } else {
                    icuStringResource(R.string.town_stock_of, "capacity" to capacity)
                },
                style = MyGameTypography.numeral,
                color = MyGameTheme.colors.inkMuted,
                modifier = Modifier.weight(1f),
            )
            MyGameText(
                text = icuStringResource(R.string.town_rate, "rate" to formatQuantity(stock.ratePerHour)),
                style = MyGameTypography.numeral,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameTrack(filled = stock.amount.toFloat() / stock.capacity.toFloat(), color = stockColorOf(stock.kind))
    }
}

@Composable
private fun stockColorOf(kind: TownResourceKind): Color {
    val colors: MyGameColors = MyGameTheme.colors
    return when (kind) {
        TownResourceKind.Money -> colors.money
        TownResourceKind.Food -> colors.food
        TownResourceKind.Power -> colors.power
        TownResourceKind.Material -> colors.material
    }
}
