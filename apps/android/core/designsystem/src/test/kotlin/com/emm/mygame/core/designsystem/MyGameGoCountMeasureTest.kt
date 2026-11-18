package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private const val DP_TOLERANCE: Float = 1f

private const val READ_THE_WORDS: String = "Read the words"

private val measuredWidth: Dp = 360.dp

private class Measures {
    var maxWidth: Dp? = null
    var minHeight: Dp? = null
    var maxHeight: Dp? = null
    var placedHeight: Dp? = null
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "+w640dp-h915dp")
class MyGameGoCountMeasureTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val withoutCount: Measures = Measures()

    private val withCount: Measures = Measures()

    @Composable
    private fun Measured(into: Measures, content: @Composable () -> Unit) {
        Layout(content = content) { measurables: List<Measurable>, constraints: Constraints ->
            record(measurables.single(), constraints, into)
        }
    }

    private fun MeasureScope.record(button: Measurable, constraints: Constraints, into: Measures): MeasureResult {
        val width: Int = measuredWidth.roundToPx()
        into.maxWidth = button.maxIntrinsicWidth(Constraints.Infinity).toDp()
        into.minHeight = button.minIntrinsicHeight(width).toDp()
        into.maxHeight = button.maxIntrinsicHeight(width).toDp()
        val placed: Placeable = button.measure(constraints.copy(minWidth = width, maxWidth = width))
        into.placedHeight = placed.height.toDp()
        return layout(placed.width, placed.height) { placed.place(0, 0) }
    }

    private fun showGoButtons(count: String) {
        composeRule.setContent {
            MyGameTheme {
                Column {
                    Measured(into = withoutCount) {
                        MyGameButton(label = READ_THE_WORDS, isBusy = false, busyDescription = "Waiting", onClick = {})
                    }
                    Measured(into = withCount) {
                        MyGameButton(
                            label = READ_THE_WORDS,
                            isBusy = false,
                            busyDescription = "Waiting",
                            onClick = {},
                            badge = count,
                        )
                    }
                }
            }
        }
    }

    private fun discWidth(): Float {
        val disc: SemanticsNode = composeRule
            .onAllNodes(SemanticsMatcher.keyIsDefined(PILL_BADGE), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .single()
        return disc.boundsInRoot.width / disc.layoutInfo.density.density
    }

    private fun valueOf(measure: Dp?): Float = requireNotNull(measure) { "the go button was never measured" }.value

    private fun assertCountAddsGapAndDisc(count: String) {
        showGoButtons(count = count)

        val expected: Float = valueOf(withoutCount.maxWidth) + MyGameSpacing.step2.value + discWidth()
        assertEquals(expected, valueOf(withCount.maxWidth), DP_TOLERANCE)
    }

    @Test
    fun `a one-digit count widens the go button by the gap plus its disc`() {
        assertCountAddsGapAndDisc(count = "5")
    }

    @Test
    fun `a three-digit count widens the go button by the gap plus its disc`() {
        assertCountAddsGapAndDisc(count = "123")
    }

    @Test
    fun `a go button with a count needs at least the height it draws at`() {
        showGoButtons(count = "5")

        assertEquals(valueOf(withCount.placedHeight), valueOf(withCount.minHeight), DP_TOLERANCE)
    }

    @Test
    fun `a go button with a count needs at most the height it draws at`() {
        showGoButtons(count = "5")

        assertEquals(valueOf(withCount.placedHeight), valueOf(withCount.maxHeight), DP_TOLERANCE)
    }
}
