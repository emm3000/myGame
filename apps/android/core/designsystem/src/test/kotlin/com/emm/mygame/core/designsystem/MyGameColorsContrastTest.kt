package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.math.pow

class MyGameColorsContrastTest {

    @Test
    fun `measures black on white at twenty-one to one`() {
        assertEquals(21.0, contrast(Color.Black, Color.White), 1e-6)
    }

    @Test
    fun `keeps every text pair at four and a half to one in both themes`() {
        assertEquals(emptyList<String>(), checkedPairsUnderMinimum(PairKind.Text))
    }

    @Test
    fun `keeps every control boundary at three to one in both themes`() {
        assertEquals(emptyList<String>(), checkedPairsUnderMinimum(PairKind.Boundary))
    }

    @Test
    fun `keeps every graphic at three to one in both themes`() {
        assertEquals(emptyList<String>(), checkedPairsUnderMinimum(PairKind.Graphic))
    }

    @Test
    fun `exempts only a pair that falls under its minimum in some theme`() {
        val needlessExemptions: List<String> = pairs
            .filter { pair: ColorPair -> pair.exemption != null }
            .filter { pair: ColorPair -> themes.values.all { colors: MyGameColors -> pair.meetsMinimumIn(colors) } }
            .map { pair: ColorPair -> pair.usedBy }
        assertEquals(emptyList<String>(), needlessExemptions)
    }
}

private enum class PairKind(val minimum: Double) {
    Text(minimum = 4.5),
    Boundary(minimum = 3.0),
    Graphic(minimum = 3.0),
}

private data class ColorPair(
    val kind: PairKind,
    val foreground: (MyGameColors) -> Color,
    val background: (MyGameColors) -> Color,
    val usedBy: String,
    val exemption: String? = null,
) {
    fun ratioIn(colors: MyGameColors): Double = contrast(foreground(colors), background(colors))

    fun meetsMinimumIn(colors: MyGameColors): Boolean = ratioIn(colors) >= kind.minimum
}

private val themes: Map<String, MyGameColors> = mapOf("light" to lightColors, "dark" to darkColors)

private const val CONTROL_BOUNDARY: String = "MyGameTextField and quiet MyGameButton border"

private const val FOCUS_RING: String = "focus ring, 3 dp at a 2 dp offset"

private val blocks: List<(MyGameColors) -> Color> = listOf(
    { it.blockPeach },
    { it.blockMint },
    { it.blockPeriwinkle },
    { it.blockLavender },
)

private val pairs: List<ColorPair> = listOf(
    ColorPair(PairKind.Text, { it.ink }, { it.surface }, "running text on the page"),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceRaised }, "text in a card, MyGameTextField value"),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceSunken }, "MyGameSeasonMark words, MarchPanel sent outcome"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surface }, "captions on the page, disabled MyGameNavigationItem"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surfaceRaised }, "captions in a card, MyGameTextField label"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surfaceSunken }, "busy and blocked MyGameButton label"),
    ColorPair(PairKind.Text, { it.onAction }, { it.action }, "MyGameButton label"),
    ColorPair(PairKind.Text, { it.action }, { it.surface }, "MyGameTextLink, AuthHeader, current MyGameNavigationItem"),
    ColorPair(PairKind.Text, { it.action }, { it.surfaceRaised }, "FiefSwitcher other fief, chosen review choice"),
    ColorPair(PairKind.Text, { it.action }, { it.destructiveSoft }, "MyGameErrorBanner action"),
    ColorPair(PairKind.Text, { it.warningInk }, { it.surface }, "a full store, a short cost on the page"),
    ColorPair(PairKind.Text, { it.warningInk }, { it.surfaceRaised }, "a short cost in a card"),
    ColorPair(PairKind.Text, { it.warningInk }, { it.warningSoft }, "a warning on its strip"),
    ColorPair(PairKind.Text, { it.destructiveInk }, { it.surface }, "MyGameInlineAlert, BlockedReason"),
    ColorPair(PairKind.Text, { it.destructiveInk }, { it.surfaceRaised }, "UnitItem and LibrarySection in a card"),
    ColorPair(PairKind.Text, { it.destructiveInk }, { it.destructiveSoft }, "MyGameErrorBanner line"),
    ColorPair(
        PairKind.Text,
        { it.lineStrong },
        { it.surfaceSunken },
        "disabled choice label",
        exemption = "inactive component, WCAG 1.4.3",
    ),
    ColorPair(PairKind.Boundary, { it.lineStrong }, { it.surface }, CONTROL_BOUNDARY),
    ColorPair(PairKind.Boundary, { it.lineStrong }, { it.surfaceRaised }, CONTROL_BOUNDARY),
    ColorPair(PairKind.Boundary, { it.lineStrong }, { it.surfaceSunken }, "busy and blocked MyGameButton border"),
    ColorPair(PairKind.Boundary, { it.action }, { it.surface }, "MyGameButton border, current tab mark"),
    ColorPair(PairKind.Boundary, { it.action }, { it.surfaceRaised }, "FiefSwitcher current frame, chosen choice ring"),
    ColorPair(PairKind.Boundary, { it.action }, { it.surfaceSunken }, "progress fill on its track"),
    ColorPair(PairKind.Boundary, { it.ink }, { it.surfaceSunken }, "MarchPanel sent frame"),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surface }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceRaised }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceSunken }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.destructiveSoft }, FOCUS_RING),
    ColorPair(PairKind.Graphic, { it.destructiveInk }, { it.surface }, "MyGameInlineAlert icon"),
    ColorPair(PairKind.Graphic, { it.destructiveInk }, { it.destructiveSoft }, "MyGameErrorBanner icon"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surface }, "hourglass icon on the page"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surfaceRaised }, "hourglass icon in a card"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surface }, "icon in ink"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceRaised }, "icon in ink in a card, resource icon"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceSunken }, "icon in ink on a well, resource track fill"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surface }, "icon in muted ink"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceRaised }, "icon in muted ink in a card"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceSunken }, "MyGameSeasonMark icon"),
) + blocks.flatMap { block: (MyGameColors) -> Color ->
    listOf(
        ColorPair(PairKind.Text, { it.onBlock }, block, "text, a window, focus on a block"),
        ColorPair(PairKind.Text, { it.onBlockMuted }, block, "muted text on a block"),
    )
}

private fun checkedPairsUnderMinimum(kind: PairKind): List<String> =
    themes.flatMap { (theme: String, colors: MyGameColors) ->
        pairs
            .filter { pair: ColorPair -> pair.kind == kind && pair.exemption == null }
            .filterNot { pair: ColorPair -> pair.meetsMinimumIn(colors) }
            .map { pair: ColorPair -> "$theme ${pair.usedBy}: ${"%.2f".format(pair.ratioIn(colors))}" }
    }

private fun contrast(first: Color, second: Color): Double {
    val lighter: Double = maxOf(relativeLuminance(first), relativeLuminance(second))
    val darker: Double = minOf(relativeLuminance(first), relativeLuminance(second))
    return (lighter + 0.05) / (darker + 0.05)
}

private fun relativeLuminance(color: Color): Double =
    0.2126 * linear(color.red) + 0.7152 * linear(color.green) + 0.0722 * linear(color.blue)

private fun linear(channel: Float): Double {
    val value: Double = channel.toDouble()
    return if (value <= 0.04045) value / 12.92 else ((value + 0.055) / 1.055).pow(2.4)
}
