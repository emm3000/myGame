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

private const val RESOURCE_LABEL: String = "resource label beside its icon"

private const val CONTROL_BOUNDARY: String = "MyGameTextField and quiet MyGameButton border"

private const val FOCUS_RING: String = "focus ring, 3 dp at a 2 dp offset"

private val pairs: List<ColorPair> = listOf(
    ColorPair(PairKind.Text, { it.ink }, { it.surface }, "running text on the page"),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceRaised }, "text in a card, MyGameTextField value"),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceSunken }, "MyGameSeasonMark words"),
    ColorPair(PairKind.Text, { it.ink }, { it.actionSoft }, "text on a pressed or selected fill"),
    ColorPair(PairKind.Text, { it.ink }, { it.glossSoft }, "text in the gloss pop-over"),
    ColorPair(PairKind.Text, { it.ink }, { it.rightSoft }, "MarchPanel sent outcome"),
    ColorPair(PairKind.Text, { it.ink }, { it.missSoft }, "MyGameErrorBanner line"),
    ColorPair(PairKind.Text, { it.ink }, { it.hintSoft }, "near-miss prompt"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surface }, "captions on the page, disabled MyGameNavigationItem"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surfaceRaised }, "captions in a card, MyGameTextField label"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surfaceSunken }, "busy and blocked MyGameButton label"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.rightSoft }, "secondary copy on the right strip"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.missSoft }, "secondary copy on the miss strip"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.hintSoft }, "secondary copy on the hint strip"),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.glossSoft }, "gloss text in its pop-over"),
    ColorPair(PairKind.Text, { it.inkFaint }, { it.surface }, "metadata on the page"),
    ColorPair(PairKind.Text, { it.inkFaint }, { it.surfaceRaised }, "metadata in a card"),
    ColorPair(PairKind.Text, { it.action }, { it.surface }, "MyGameTextLink, AuthHeader, current MyGameNavigationItem"),
    ColorPair(PairKind.Text, { it.action }, { it.surfaceRaised }, "FiefSwitcher other fief, chosen review choice"),
    ColorPair(PairKind.Text, { it.action }, { it.actionSoft }, "selected choice label"),
    ColorPair(PairKind.Text, { it.onAction }, { it.action }, "MyGameButton label"),
    ColorPair(PairKind.Text, { it.right }, { it.surfaceRaised }, "right feedback word"),
    ColorPair(PairKind.Text, { it.right }, { it.rightSoft }, "right feedback word on its strip"),
    ColorPair(PairKind.Text, { it.miss }, { it.surface }, "MyGameInlineAlert, BlockedReason, short cost"),
    ColorPair(PairKind.Text, { it.miss }, { it.surfaceRaised }, "UnitItem and LibrarySection requirement in a card"),
    ColorPair(PairKind.Text, { it.miss }, { it.missSoft }, "missed feedback word on its strip"),
    ColorPair(PairKind.Text, { it.hint }, { it.surfaceRaised }, "hint letters"),
    ColorPair(PairKind.Text, { it.hint }, { it.hintSoft }, "near-miss prompt word"),
    ColorPair(PairKind.Text, { it.onBadge }, { it.badge }, "due-count numeral"),
    ColorPair(PairKind.Text, { it.money }, { it.surface }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.money }, { it.surfaceRaised }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.food }, { it.surface }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.food }, { it.surfaceRaised }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.power }, { it.surface }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.power }, { it.surfaceRaised }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.material }, { it.surface }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.material }, { it.surfaceRaised }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.people }, { it.surface }, RESOURCE_LABEL),
    ColorPair(PairKind.Text, { it.people }, { it.surfaceRaised }, RESOURCE_LABEL),
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
    ColorPair(PairKind.Boundary, { it.gloss }, { it.surface }, "gloss mark"),
    ColorPair(PairKind.Boundary, { it.gloss }, { it.surfaceRaised }, "gloss mark in a card"),
    ColorPair(PairKind.Boundary, { it.gloss }, { it.glossSoft }, "gloss mark on its pop-over"),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surface }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceRaised }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceSunken }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.rightSoft }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.missSoft }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.hintSoft }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.glossSoft }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.actionSoft }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.right }, { it.rightSoft }, "MarchPanel sent frame, right choice ring"),
    ColorPair(PairKind.Boundary, { it.miss }, { it.missSoft }, "wrong choice ring"),
    ColorPair(PairKind.Boundary, { it.badge }, { it.surface }, "due-count badge on the page"),
    ColorPair(PairKind.Graphic, { it.right }, { it.surfaceRaised }, "check icon"),
    ColorPair(PairKind.Graphic, { it.miss }, { it.surface }, "MyGameInlineAlert icon"),
    ColorPair(PairKind.Graphic, { it.miss }, { it.surfaceRaised }, "retry icon in a card"),
    ColorPair(PairKind.Graphic, { it.miss }, { it.missSoft }, "MyGameErrorBanner icon"),
    ColorPair(PairKind.Graphic, { it.hint }, { it.hintSoft }, "hint icon"),
    ColorPair(PairKind.Graphic, { it.hint }, { it.surfaceRaised }, "hint icon in a card"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surface }, "hourglass icon on the page"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surfaceRaised }, "hourglass icon in a card"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surface }, "icon in ink"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceRaised }, "icon in ink in a card"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceSunken }, "icon in ink on a well"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surface }, "icon in muted ink"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceRaised }, "icon in muted ink in a card"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceSunken }, "MyGameSeasonMark icon"),
    ColorPair(PairKind.Graphic, { it.money }, { it.surfaceRaised }, "resource icon"),
    ColorPair(PairKind.Graphic, { it.food }, { it.surfaceRaised }, "resource icon"),
    ColorPair(PairKind.Graphic, { it.material }, { it.surfaceRaised }, "resource icon"),
    ColorPair(PairKind.Graphic, { it.money }, { it.surfaceSunken }, "resource track fill"),
    ColorPair(PairKind.Graphic, { it.food }, { it.surfaceSunken }, "resource track fill"),
    ColorPair(PairKind.Graphic, { it.material }, { it.surfaceSunken }, "resource track fill"),
)

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
