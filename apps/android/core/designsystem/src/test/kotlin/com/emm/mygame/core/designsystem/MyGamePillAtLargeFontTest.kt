package com.emm.mygame.core.designsystem

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private const val LARGE: Float = 1.5f

private const val LARGEST: Float = 2.0f

private const val DP_TOLERANCE: Float = 0.5f

private val narrowWidth: Dp = 200.dp

private const val SHORT_LABEL: String = "Study"

private const val LONG_LABEL: String = "Study the words of the bakery"

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGamePillAtLargeFontTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun showAt(fontScale: Float, pill: @Composable () -> Unit) {
        composeRule.setContent {
            val context: Context = LocalContext.current
            val configuration: Configuration = Configuration(context.resources.configuration)
            configuration.fontScale = fontScale
            CompositionLocalProvider(LocalDensity provides Density(context.createConfigurationContext(configuration))) {
                MyGameTheme {
                    Box(modifier = Modifier.width(narrowWidth)) { pill() }
                }
            }
        }
    }

    private fun inkPill(label: String): @Composable () -> Unit = {
        MyGameButton(label = label, isBusy = false, busyDescription = "Waiting", onClick = {})
    }

    private fun outlinedPill(label: String): @Composable () -> Unit = {
        MyGameOutlinedButton(label = label, isBusy = false, busyDescription = "Waiting", onClick = {})
    }

    private fun assertWrapsInsidePadding(tag: String) {
        val pill: DpRect = composeRule.onNodeWithTag(tag).getBoundsInRoot()
        val label: SemanticsNodeInteraction = composeRule.onNodeWithText(LONG_LABEL, useUnmergedTree = true)
        val text: DpRect = label.getBoundsInRoot()

        assertTrue("the label wraps", layoutOf(label).lineCount > 1)
        assertEquals(MyGameSpacing.step2.value, (text.top - pill.top).value, DP_TOLERANCE)
        assertEquals(MyGameSpacing.step2.value, (pill.bottom - text.bottom).value, DP_TOLERANCE)
    }

    private fun assertEveryLineCentered() {
        val layout: TextLayoutResult = layoutOf(composeRule.onNodeWithText(LONG_LABEL, useUnmergedTree = true))

        assertTrue("the last line is shorter than the label", layout.getLineLeft(layout.lineCount - 1) > 1f)
        for (line: Int in 0 until layout.lineCount) {
            val before: Float = layout.getLineLeft(line)
            val after: Float = layout.size.width - layout.getLineRight(line)
            assertEquals("line $line", before, after, 1f)
        }
    }

    private fun layoutOf(label: SemanticsNodeInteraction): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        label.fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single()
    }

    private fun heightOf(tag: String): Dp = composeRule.onNodeWithTag(tag).getBoundsInRoot().let { it.bottom - it.top }

    @Test
    fun `keeps padding above and below a wrapped ink pill label at a large font`() {
        showAt(LARGE, inkPill(LONG_LABEL))

        assertWrapsInsidePadding(INK_PILL)
    }

    @Test
    fun `keeps padding above and below a wrapped ink pill label at the largest font`() {
        showAt(LARGEST, inkPill(LONG_LABEL))

        assertWrapsInsidePadding(INK_PILL)
    }

    @Test
    fun `keeps padding above and below a wrapped outlined pill label at a large font`() {
        showAt(LARGE, outlinedPill(LONG_LABEL))

        assertWrapsInsidePadding(OUTLINED_PILL)
    }

    @Test
    fun `keeps padding above and below a wrapped outlined pill label at the largest font`() {
        showAt(LARGEST, outlinedPill(LONG_LABEL))

        assertWrapsInsidePadding(OUTLINED_PILL)
    }

    @Test
    fun `centers every line of a wrapped label`() {
        showAt(LARGE, inkPill(LONG_LABEL))

        assertEveryLineCentered()
    }

    @Test
    fun `keeps the ink pill at action height for one line at a large font`() {
        showAt(LARGE, inkPill(SHORT_LABEL))

        assertEquals(MyGameSizes.action.value, heightOf(INK_PILL).value, DP_TOLERANCE)
    }

    @Test
    fun `keeps the ink pill at action height for one line at the largest font`() {
        showAt(LARGEST, inkPill(SHORT_LABEL))

        assertEquals(MyGameSizes.action.value, heightOf(INK_PILL).value, DP_TOLERANCE)
    }

    @Test
    fun `keeps the outlined pill at secondary height for one line at the largest font`() {
        showAt(LARGEST, outlinedPill(SHORT_LABEL))

        assertEquals(MyGameSizes.secondary.value, heightOf(OUTLINED_PILL).value, DP_TOLERANCE)
    }

    @Test
    fun `keeps the outlined pill at secondary height for one line at a large font`() {
        showAt(LARGE, outlinedPill(SHORT_LABEL))

        assertEquals(MyGameSizes.secondary.value, heightOf(OUTLINED_PILL).value, DP_TOLERANCE)
    }
}
