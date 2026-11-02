package com.emm.mygame.feature.fief

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.ResourceKind

@Composable
internal fun ResourcesSection(content: FiefUiState.Content, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.fief_resources_title))
        Card {
            content.resources.forEachIndexed { index: Int, resource: FiefUiState.ResourceLine ->
                if (index > 0) Divider()
                ResourceRow(resource = resource)
            }
        }
    }
}

@Composable
internal fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = text,
        style = MyGameTypography.label,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics { heading() },
    )
}

@Composable
internal fun Card(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceRaised, shape)
            .border(MyGameSizes.hairline, colors.line, shape)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step1),
    ) {
        content()
    }
}

@Composable
private fun Divider(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxWidth().height(MyGameSizes.hairline).background(MyGameTheme.colors.line))
}

@Composable
private fun ResourceRow(resource: FiefUiState.ResourceLine, modifier: Modifier = Modifier) {
    val name: String = stringResource(resourceNameOf(resource.kind))
    val amount: String = formatQuantity(resource.amount)
    val capacity: String = formatQuantity(resource.capacity)
    val rate: String = formatQuantity(resource.ratePerHour)
    val description: String = if (resource.isFull) {
        stringResource(R.string.resource_description_full, name, amount, capacity)
    } else {
        stringResource(R.string.resource_description, name, amount, capacity, rate)
    }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = MyGameSpacing.step3)
            .clearAndSetSemantics { contentDescription = description },
    ) {
        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameText(
                text = name,
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.weight(1f),
            )
            MyGameText(text = amount, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
            MyGameText(
                text = stringResource(R.string.resource_capacity, capacity),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        if (resource.isFull) {
            MyGameText(
                text = stringResource(R.string.resource_full),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.rust,
            )
        } else {
            MyGameText(
                text = stringResource(R.string.resource_rate, rate),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        ProgressBar(resource = resource)
    }
}

@Composable
private fun ProgressBar(resource: FiefUiState.ResourceLine, modifier: Modifier = Modifier) {
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    val filled: Float = (resource.amount.toFloat() / resource.capacity.toFloat()).coerceIn(0f, 1f)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(MyGameSizes.bar)
            .background(MyGameTheme.colors.surfaceSunken, shape),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(filled)
                .height(MyGameSizes.bar)
                .background(resourceColorOf(resource.kind), shape),
        )
    }
}

private fun resourceNameOf(kind: ResourceKind): Int = when (kind) {
    ResourceKind.Wood -> R.string.resource_wood
    ResourceKind.Stone -> R.string.resource_stone
    ResourceKind.Iron -> R.string.resource_iron
    ResourceKind.Gold -> R.string.resource_gold
    ResourceKind.Food -> R.string.resource_food
}

@Composable
private fun resourceColorOf(kind: ResourceKind): Color {
    val colors: MyGameColors = MyGameTheme.colors
    return when (kind) {
        ResourceKind.Wood -> colors.wood
        ResourceKind.Stone -> colors.stone
        ResourceKind.Iron -> colors.iron
        ResourceKind.Gold -> colors.gold
        ResourceKind.Food -> colors.food
    }
}
