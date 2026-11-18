package com.emm.mygame.core.designsystem

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.Dp

@Composable
fun MyGameStreetStrip(
    street: MyGameStreet,
    selected: Int,
    name: String,
    nextStepWords: String,
    inWorkWords: String,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth().semantics { contentDescription = name }) {
        val tabWidth: Dp = maxOf(MyGameSizes.control, maxWidth / street.tabs.size.coerceAtLeast(1))
        val scroll: ScrollState = rememberScrollState()
        val centered: Int = with(LocalDensity.current) { (tabWidth * selected + (tabWidth - maxWidth) / 2).roundToPx() }
        LaunchedEffect(centered) { scroll.animateScrollTo(centered.coerceIn(0, scroll.maxValue)) }
        Column(modifier = Modifier.horizontalScroll(scroll)) {
            Row(modifier = Modifier.selectableGroup()) {
                street.tabs.forEachIndexed { index: Int, tab: MyGameStreetTab ->
                    StreetTab(
                        tab = tab,
                        name = nameOf(tab = tab, nextStepWords = nextStepWords, inWorkWords = inWorkWords),
                        isSelected = index == selected,
                        onClick = { onSelect(index) },
                        modifier = Modifier.width(tabWidth),
                    )
                }
            }
            MyGameHairline(modifier = Modifier.width(tabWidth * street.tabs.size))
        }
    }
}

@Composable
private fun StreetTab(
    tab: MyGameStreetTab,
    name: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1, Alignment.Bottom),
        modifier = modifier
            .defaultMinSize(minHeight = MyGameSizes.control)
            .then(if (isFocused) Modifier.border(MyGameStrokeWidths.focus, colors.focus, shape) else Modifier)
            .selectable(
                selected = isSelected,
                interactionSource = interactions,
                indication = LocalIndication.current,
                role = Role.Tab,
                onClick = onClick,
            )
            .semantics { contentDescription = name },
    ) {
        TabMarks(tab = tab)
        MyGamePlaceArt(art = tab.art, risenFrom = null, modifier = Modifier.height(MyGameSizes.control))
        SelectedMark(isSelected = isSelected)
    }
}

@Composable
private fun TabMarks(tab: MyGameStreetTab, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.height(MyGameSizes.iconSmall),
    ) {
        if (tab.isNextStep) {
            Box(modifier = Modifier.size(MyGameSpacing.step2).background(MyGameTheme.colors.go, CircleShape))
        }
        if (tab.isInWork) {
            MyGameIcon(
                icon = MyGameIcons.slot,
                tint = MyGameTheme.colors.inkMuted,
                modifier = Modifier.size(MyGameSizes.iconSmall),
            )
        }
    }
}

@Composable
private fun SelectedMark(isSelected: Boolean, modifier: Modifier = Modifier) {
    val sized: Modifier = modifier.size(width = MyGameSizes.control, height = MyGameStrokeWidths.ring)
    Box(modifier = if (isSelected) sized.background(MyGameTheme.colors.ink) else sized)
}

private fun nameOf(tab: MyGameStreetTab, nextStepWords: String, inWorkWords: String): String = listOfNotNull(
    tab.name,
    nextStepWords.takeIf { tab.isNextStep },
    inWorkWords.takeIf { tab.isInWork },
).joinToString(separator = ", ")

private fun previewTab(drawable: Int, isNextStep: Boolean = false, isInWork: Boolean = false): MyGameStreetTab =
    MyGameStreetTab(
        art = MyGameArt(drawable = drawable, tint = MyGameArtTint.None),
        name = "",
        isNextStep = isNextStep,
        isInWork = isInWork,
    )

private val previewStreet: MyGameStreet = MyGameStreet(
    tabs = listOf(
        previewTab(R.drawable.designsystem_place_homes_3),
        previewTab(R.drawable.designsystem_place_farm_2, isInWork = true),
        previewTab(R.drawable.designsystem_place_school_4, isNextStep = true),
        previewTab(R.drawable.designsystem_place_office_1),
        MyGameStreetTab(
            art = MyGameArt(drawable = R.drawable.designsystem_place_factory_0, tint = MyGameArtTint.SurfaceSunken),
            name = "",
            isNextStep = false,
            isInWork = false,
        ),
        previewTab(R.drawable.designsystem_place_power_station_1),
        previewTab(R.drawable.designsystem_place_storage_10),
    ),
)

private class StreetStripSelections : PreviewParameterProvider<Int> {

    override val values: Sequence<Int> = sequenceOf(1, 2, 6)
}

@PreviewMyGame
@Composable
private fun MyGameStreetStripPreview(@PreviewParameter(StreetStripSelections::class) selected: Int) {
    MyGamePreviewSurface {
        MyGameStreetStrip(
            street = previewStreet,
            selected = selected,
            name = "6 of 7 built",
            nextStepWords = "your next step",
            inWorkWords = "in work",
            onSelect = {},
        )
    }
}
