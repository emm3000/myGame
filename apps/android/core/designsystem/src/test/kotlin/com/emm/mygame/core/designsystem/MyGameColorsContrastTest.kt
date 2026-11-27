package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.darkColors
import com.emm.mygame.core.designsystem.theme.lightColors
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
    fun `on-go on go reads as text in both themes`() {
        assertEquals(
            listOf("light $GO_LABEL 6.55", "dark $GO_LABEL 9.19"),
            measuredRatiosOf(PairKind.Text, GO_LABEL),
        )
    }

    @Test
    fun `go reads as a boundary on surface-raised and on surface-sunken`() {
        assertEquals(
            listOf(
                "light $GO_ON_DOCK 6.28",
                "dark $GO_ON_DOCK 9.24",
                "light $GO_ON_SUNKEN 5.30",
                "dark $GO_ON_SUNKEN 7.85",
            ),
            measuredRatiosOf(PairKind.Boundary, GO_ON_DOCK, GO_ON_SUNKEN),
        )
    }

    @Test
    fun `go reads as a graphic on surface`() {
        assertEquals(
            listOf("light $NEXT_STEP_DOT 5.90", "dark $NEXT_STEP_DOT 10.13"),
            measuredRatiosOf(PairKind.Graphic, NEXT_STEP_DOT),
        )
    }

    @Test
    fun `the outlined button's ink edge reads as a boundary on every ground a button is drawn on`() {
        assertEquals(
            listOf(
                "light $OUTLINED_ON_PAGE 16.51",
                "dark $OUTLINED_ON_PAGE 16.51",
                "light $OUTLINED_IN_CARD 17.56",
                "dark $OUTLINED_IN_CARD 15.07",
                "light $OUTLINED_ON_SUNKEN 14.83",
                "dark $OUTLINED_ON_SUNKEN 12.80",
            ),
            measuredRatiosOf(PairKind.Boundary, OUTLINED_ON_PAGE, OUTLINED_IN_CARD, OUTLINED_ON_SUNKEN),
        )
    }

    @Test
    fun `on-block reads on an achievement's block-peach at twelve to one in both themes`() {
        assertEquals(
            listOf("light $ACHIEVEMENT_TEXT 12.04", "dark $ACHIEVEMENT_TEXT 12.04"),
            measuredRatiosOf(PairKind.Text, ACHIEVEMENT_TEXT),
        )
    }

    @Test
    fun `on-block-muted reads on an achievement's block-peach at six to one in both themes`() {
        assertEquals(
            listOf("light $ACHIEVEMENT_MUTED 6.32", "dark $ACHIEVEMENT_MUTED 6.32"),
            measuredRatiosOf(PairKind.Text, ACHIEVEMENT_MUTED),
        )
    }

    @Test
    fun `an achievement's seal reads as a graphic on block-peach in both themes`() {
        assertEquals(
            listOf("light $ACHIEVEMENT_SEAL 12.04", "dark $ACHIEVEMENT_SEAL 12.04"),
            measuredRatiosOf(PairKind.Graphic, ACHIEVEMENT_SEAL),
        )
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

private const val CONTROL_BOUNDARY: String = "MyGameTextField and MyGameSwitchRow outline"

private const val FOCUS_RING: String = "focus ring, 3 dp outside its control"

private const val GO_LABEL: String = "the go button's label and its count"

private const val GO_ON_DOCK: String = "the go button on the dock"

private const val GO_ON_SUNKEN: String = "the go button on a sunken ground"

private const val NEXT_STEP_DOT: String = "the next step's dot on the strip"

private const val ACHIEVEMENT_TEXT: String = "an achievement's text"

private const val ACHIEVEMENT_MUTED: String = "an achievement's muted text"

private const val ACHIEVEMENT_SEAL: String = "an achievement's seal"

private const val OUTLINED_ON_PAGE: String = "MyGameOutlinedButton edge on the page"

private const val OUTLINED_IN_CARD: String = "MyGameOutlinedButton edge in a card"

private const val OUTLINED_ON_SUNKEN: String = "MyGameOutlinedButton edge on the finish notice"

private val blocks: List<(MyGameColors) -> Color> = listOf(
    { it.blockPeach },
    { it.blockMint },
    { it.blockPeriwinkle },
    { it.blockLavender },
)

private val pairs: List<ColorPair> = listOf(
    ColorPair(
        PairKind.Text,
        { it.ink },
        { it.surface },
        "running text on the page, MyGameTextLink, MyGameBackLink, MyGameSwitchRow label, MyGameTimeField time",
    ),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceRaised }, "text in a card, MyGameTextField value"),
    ColorPair(PairKind.Text, { it.ink }, { it.surfaceSunken }, "ink words on a sunken surface"),
    ColorPair(
        PairKind.Text,
        { it.inkMuted },
        { it.surface },
        "captions on the page, a busy MyGameTextLink, a disabled MyGameBackLink, MyGameSwitchRow line",
    ),
    ColorPair(PairKind.Text, { it.inkMuted }, { it.surfaceRaised }, "captions in a card, MyGameTextField label"),
    ColorPair(
        PairKind.Text,
        { it.inkMuted },
        { it.surfaceSunken },
        "busy and blocked MyGameButton label, disabled MyGameSwitchRow",
    ),
    ColorPair(PairKind.Text, { it.onAction }, { it.action }, "an outlined button's count"),
    ColorPair(PairKind.Text, { it.action }, { it.surface }, "AuthHeader"),
    ColorPair(PairKind.Text, { it.action }, { it.surfaceRaised }, "chosen review choice"),
    ColorPair(PairKind.Text, { it.ink }, { it.destructiveSoft }, "MyGameErrorBanner link"),
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
    ColorPair(PairKind.Boundary, { it.action }, { it.surfaceRaised }, "chosen choice ring"),
    ColorPair(PairKind.Boundary, { it.action }, { it.surfaceSunken }, "progress fill on its track"),
    ColorPair(PairKind.Boundary, { it.ink }, { it.surfaceSunken }, "ink frame on a sunken surface"),
    ColorPair(PairKind.Boundary, { it.ink }, { it.surface }, OUTLINED_ON_PAGE),
    ColorPair(PairKind.Boundary, { it.ink }, { it.surfaceRaised }, OUTLINED_IN_CARD),
    ColorPair(PairKind.Boundary, { it.ink }, { it.surfaceSunken }, OUTLINED_ON_SUNKEN),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surface }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceRaised }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.surfaceSunken }, FOCUS_RING),
    ColorPair(PairKind.Boundary, { it.focus }, { it.destructiveSoft }, FOCUS_RING),
    ColorPair(PairKind.Graphic, { it.destructiveInk }, { it.surface }, "MyGameInlineAlert icon"),
    ColorPair(PairKind.Graphic, { it.destructiveInk }, { it.destructiveSoft }, "MyGameErrorBanner icon"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surface }, "action graphic on the page"),
    ColorPair(PairKind.Graphic, { it.action }, { it.surfaceRaised }, "action graphic in a card"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surface }, "icon in ink, MyGameBackLink chevron"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.lineStrong }, "MyGameRing mark beside its track"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceRaised }, "icon in ink in a card, resource icon"),
    ColorPair(PairKind.Graphic, { it.ink }, { it.surfaceSunken }, "icon in ink on a well, resource track fill"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surface }, "icon in muted ink"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceRaised }, "icon in muted ink in a card"),
    ColorPair(PairKind.Graphic, { it.inkMuted }, { it.surfaceSunken }, "MyGameSeasonMark icon"),
    ColorPair(PairKind.Text, { it.onGo }, { it.go }, GO_LABEL),
    ColorPair(PairKind.Boundary, { it.go }, { it.surfaceRaised }, GO_ON_DOCK),
    ColorPair(PairKind.Boundary, { it.go }, { it.surfaceSunken }, GO_ON_SUNKEN),
    ColorPair(PairKind.Graphic, { it.go }, { it.surface }, NEXT_STEP_DOT),
    ColorPair(PairKind.Text, { it.onBlock }, { it.blockPeach }, ACHIEVEMENT_TEXT),
    ColorPair(PairKind.Text, { it.onBlockMuted }, { it.blockPeach }, ACHIEVEMENT_MUTED),
    ColorPair(PairKind.Graphic, { it.onBlock }, { it.blockPeach }, ACHIEVEMENT_SEAL),
    ColorPair(PairKind.Boundary, { it.action }, { it.surface }, "MyGameSwitchRow track, on"),
    ColorPair(PairKind.Graphic, { it.onAction }, { it.action }, "MyGameSwitchRow thumb, on"),
    ColorPair(PairKind.Boundary, { it.lineStrong }, { it.surface }, "MyGameSwitchRow track and thumb, off"),
    ColorPair(PairKind.Boundary, { it.lineStrong }, { it.surfaceSunken }, "disabled MyGameSwitchRow track and thumb"),
    ColorPair(PairKind.Graphic, { it.surfaceSunken }, { it.lineStrong }, "disabled MyGameSwitchRow thumb, on"),
    ColorPair(
        PairKind.Graphic,
        { it.surfaceSunken },
        { it.surface },
        "MyGameSkeleton block",
        exemption = "a loading skeleton, decorative, its loading line spoken in a live region, WCAG 1.4.11",
    ),
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

private fun measuredRatiosOf(kind: PairKind, vararg uses: String): List<String> =
    uses.flatMap { use: String ->
        pairs
            .filter { pair: ColorPair -> pair.kind == kind && pair.usedBy == use }
            .flatMap { pair: ColorPair ->
                themes.map { (theme: String, colors: MyGameColors) ->
                    "$theme $use ${"%.2f".format(pair.ratioIn(colors))}"
                }
            }
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
