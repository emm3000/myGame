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
import com.emm.mygame.core.designsystem.MyGameSeasonMark
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun ResourcesSection(content: FiefUiState.Content, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.fief_resources_title))
        Card {
            content.resources.forEachIndexed { index: Int, resource: FiefUiState.ResourceLine ->
                if (index > 0) Divider()
                ResourceRow(resource = resource)
            }
            Divider()
            PeasantsRow(peasants = content.peasants)
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
internal fun ResourceRow(resource: FiefUiState.ResourceLine, modifier: Modifier = Modifier) {
    val name: String = stringResource(resourceNameOf(resource.kind))
    val amount: String = formatQuantity(resource.amount)
    val capacity: String = formatQuantity(resource.capacity)
    val seasonMark: FiefUiState.SeasonMark? = resource.seasonMark
    val description: String = resourceDescriptionOf(resource = resource, name = name)
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
                text = icuStringResource(R.string.resource_capacity, "capacity" to capacity),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        RateLine(resource = resource)
        if (seasonMark != null) {
            MyGameSeasonMark(
                icon = seasonIconOf(seasonMark.season),
                words = seasonMarkWordsOf(mark = seasonMark, resourceName = name),
            )
        }
        ProgressBar(resource = resource)
    }
}

@Composable
private fun RateLine(resource: FiefUiState.ResourceLine, modifier: Modifier = Modifier) {
    if (resource.isFull) {
        MyGameText(
            text = stringResource(R.string.resource_full),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.rust,
            modifier = modifier,
        )
    } else {
        MyGameText(
            text = icuStringResource(R.string.resource_rate, "rate" to formatQuantity(resource.ratePerHour)),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
            modifier = modifier,
        )
    }
}

@Composable
private fun resourceDescriptionOf(resource: FiefUiState.ResourceLine, name: String): String {
    val amount: String = formatQuantity(resource.amount)
    val capacity: String = formatQuantity(resource.capacity)
    val rowDescription: String = if (resource.isFull) {
        icuStringResource(
            R.string.resource_description_full,
            "name" to name,
            "amount" to amount,
            "capacity" to capacity,
        )
    } else {
        icuStringResource(
            R.string.resource_description,
            "name" to name,
            "amount" to amount,
            "capacity" to capacity,
            "rate" to formatQuantity(resource.ratePerHour),
        )
    }
    val seasonMark: FiefUiState.SeasonMark = resource.seasonMark ?: return rowDescription
    return icuStringResource(
        R.string.resource_description_with_season_mark,
        "description" to rowDescription,
        "seasonMark" to seasonMarkWordsOf(mark = seasonMark, resourceName = name),
    )
}

@Composable
private fun seasonMarkWordsOf(mark: FiefUiState.SeasonMark, resourceName: String): String {
    val season: String = stringResource(seasonNameOf(mark.season))
    val resource: String = resourceName.lowercase(spanish)
    return if (mark.change > 0) {
        icuStringResource(
            R.string.resource_season_mark_raised,
            "season" to season,
            "percent" to mark.change.toString(),
            "resource" to resource,
        )
    } else {
        icuStringResource(
            R.string.resource_season_mark_lowered,
            "season" to season,
            "percent" to (-mark.change).toString(),
            "resource" to resource,
        )
    }
}

@Composable
private fun PeasantsRow(peasants: FiefUiState.PeasantsLine, modifier: Modifier = Modifier) {
    val free: String = formatQuantity(peasants.free.toLong())
    val supplied: String = formatQuantity(peasants.supplied.toLong())
    val description: String = icuStringResource(
        R.string.peasants_description,
        "suppliedCount" to peasants.supplied,
        "free" to free,
        "supplied" to supplied,
    )
    Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = MyGameSpacing.step3)
            .clearAndSetSemantics { contentDescription = description },
    ) {
        MyGameText(
            text = stringResource(R.string.resource_peasants),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.weight(1f),
        )
        MyGameText(
            text = icuStringResource(
                R.string.peasants_free,
                "suppliedCount" to peasants.supplied,
                "free" to free,
                "supplied" to supplied,
            ),
            style = MyGameTypography.action,
            color = MyGameTheme.colors.ink,
        )
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

internal fun resourceNameOf(kind: ResourceKind): Int = when (kind) {
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
