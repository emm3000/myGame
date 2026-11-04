package com.emm.mygame

import android.content.res.Resources
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.FiefAddress
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FreeSlot
import com.emm.mygame.core.network.ResourceKind

private const val ENTRIES_PER_ROW: Int = 2

private const val VADOALTO: Int = 1

@Composable
internal fun FiefSwitcher(
    listed: FiefSwitcherUiState.Listed,
    isEnabled: Boolean,
    onChoose: (FiefId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val resources: Resources = LocalResources.current
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceRaised)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = resources.getString(R.string.fief_switcher_label).uppercase(),
            style = MyGameTypography.label,
            color = colors.inkMuted,
            modifier = Modifier.semantics { heading() },
        )
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            listed.entries.chunked(ENTRIES_PER_ROW).forEach { row: List<FiefSwitcherUiState.Entry> ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                    modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                ) {
                    row.forEach { entry: FiefSwitcherUiState.Entry ->
                        FiefEntry(
                            entry = entry,
                            isEnabled = isEnabled,
                            onChoose = onChoose,
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                        )
                    }
                    repeat(ENTRIES_PER_ROW - row.size) { Box(modifier = Modifier.weight(1f)) }
                }
            }
        }
        Box(modifier = Modifier.fillMaxWidth().height(MyGameSizes.hairline).background(colors.line))
    }
}

@Composable
private fun FiefEntry(
    entry: FiefSwitcherUiState.Entry,
    isEnabled: Boolean,
    onChoose: (FiefId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val resources: Resources = LocalResources.current
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val currentLabel: String = resources.getString(R.string.fief_switcher_current)
    val framed: Modifier = if (entry.isCurrent) {
        modifier
            .background(colors.surfaceRaised, shape)
            .border(MyGameSizes.hairline, colors.river, shape)
            .semantics(mergeDescendants = true) { stateDescription = currentLabel }
    } else {
        modifier
            .background(colors.surface, shape)
            .border(MyGameSizes.hairline, colors.line, shape)
            .clickable(enabled = isEnabled, role = Role.Button) { onChoose(entry.fief) }
    }
    Row(modifier = framed.heightIn(min = MyGameSizes.control)) {
        if (entry.isCurrent) {
            Box(modifier = Modifier.width(MyGameSizes.bar).fillMaxHeight().background(colors.river, shape))
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1, Alignment.CenterVertically),
            modifier = Modifier
                .heightIn(min = MyGameSizes.control)
                .padding(horizontal = MyGameSpacing.step3, vertical = MyGameSpacing.step1),
        ) {
            MyGameText(
                text = entry.name,
                style = if (entry.isCurrent) {
                    MyGameTypography.action.copy(fontWeight = FontWeight.Bold)
                } else {
                    MyGameTypography.action.copy(textDecoration = TextDecoration.Underline)
                },
                color = if (entry.isCurrent) colors.ink else colors.umber,
            )
            MyGameText(
                text = resources.addressOf(entry.address),
                style = MyGameTypography.caption.copy(fontWeight = FontWeight.SemiBold),
                color = colors.inkMuted,
            )
            if (entry.badges.isNotEmpty()) FiefBadges(entry = entry)
        }
    }
}

@Composable
private fun FiefBadges(entry: FiefSwitcherUiState.Entry, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(bottom = MyGameSpacing.step1),
    ) {
        entry.badges.forEach { badge: FiefSwitcherUiState.Badge -> FiefBadge(badge = badge) }
    }
}

@Composable
private fun FiefBadge(badge: FiefSwitcherUiState.Badge, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    val resources: Resources = LocalResources.current
    val shape: Shape = RoundedCornerShape(MyGameRadii.sm)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .background(colors.surfaceRaised, shape)
            .border(MyGameSizes.hairline, colors.line, shape)
            .padding(horizontal = MyGameSpacing.step1),
    ) {
        MyGameIcon(icon = iconOf(badge), tint = tintOf(badge, colors))
        MyGameText(
            text = resources.badgeLineOf(badge),
            style = MyGameTypography.caption.copy(fontWeight = FontWeight.SemiBold),
            color = colors.ink,
        )
    }
}

private fun Resources.addressOf(address: FiefAddress): String =
    getString(R.string.fief_switcher_address, kingdomOf(address.kingdom), address.province, address.plot)

private fun Resources.kingdomOf(kingdom: Int): String = when (kingdom) {
    VADOALTO -> getString(R.string.fief_switcher_kingdom_vadoalto)
    else -> kingdom.toString()
}

private fun Resources.badgeLineOf(badge: FiefSwitcherUiState.Badge): String = when (badge) {
    is FiefSwitcherUiState.Badge.Idle -> getString(idleLineOf(badge.slot))
    is FiefSwitcherUiState.Badge.FullStore ->
        getString(R.string.fief_switcher_full_store, getString(resourceNameOf(badge.resource)))
}

private fun idleLineOf(slot: FreeSlot): Int = when (slot) {
    FreeSlot.Build -> R.string.fief_switcher_idle_build
    FreeSlot.Study -> R.string.fief_switcher_idle_study
    FreeSlot.Recruit -> R.string.fief_switcher_idle_recruit
    FreeSlot.March -> R.string.fief_switcher_idle_march
}

private fun resourceNameOf(resource: ResourceKind): Int = when (resource) {
    ResourceKind.Wood -> R.string.fief_switcher_resource_wood
    ResourceKind.Stone -> R.string.fief_switcher_resource_stone
    ResourceKind.Iron -> R.string.fief_switcher_resource_iron
    ResourceKind.Gold -> R.string.fief_switcher_resource_gold
    ResourceKind.Food -> R.string.fief_switcher_resource_food
}

private fun iconOf(badge: FiefSwitcherUiState.Badge): ImageVector = when (badge) {
    is FiefSwitcherUiState.Badge.Idle -> if (badge.slot == FreeSlot.March) MyGameIcons.march else MyGameIcons.slot
    is FiefSwitcherUiState.Badge.FullStore -> when (badge.resource) {
        ResourceKind.Wood -> MyGameIcons.wood
        ResourceKind.Stone -> MyGameIcons.stone
        ResourceKind.Iron -> MyGameIcons.iron
        ResourceKind.Gold -> MyGameIcons.gold
        ResourceKind.Food -> MyGameIcons.food
    }
}

private fun tintOf(badge: FiefSwitcherUiState.Badge, colors: MyGameColors): Color = when (badge) {
    is FiefSwitcherUiState.Badge.Idle -> colors.ink
    is FiefSwitcherUiState.Badge.FullStore -> when (badge.resource) {
        ResourceKind.Wood -> colors.wood
        ResourceKind.Stone -> colors.stone
        ResourceKind.Iron -> colors.iron
        ResourceKind.Gold -> colors.gold
        ResourceKind.Food -> colors.food
    }
}
