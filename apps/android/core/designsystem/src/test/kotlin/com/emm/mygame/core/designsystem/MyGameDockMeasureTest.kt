package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.height
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private const val MEASURED_TOLERANCE: Float = 1f

private const val SPANISH_DOCK_AT_LARGEST_ON_360: Float = 435f

private const val SPANISH_DOCK_AT_LARGEST_ON_411: Float = 349f

private const val SPANISH_DOCK_AT_DEFAULT_IN_LANDSCAPE: Float = 167f

private fun spanish(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private val returningWordsLine: MyGameDockLine = MyGameDockLine(
    title = spanish("Tu siguiente paso"),
    step = spanish("Palabras que vuelven: banda 2, grupo 3"),
)

private val studyReturningWords: MyGameDockGo = MyGameDockGo(
    label = spanish("Estudiar las palabras que vuelven"),
    isBusy = false,
    busyDescription = "Esperando",
    onClick = {},
)

private val puebloDoor: MyGameDockDoor = MyGameDockDoor(label = spanish("Pueblo"), onClick = {})

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameDockMeasureTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var isFolded: Boolean = false

    private fun showSpanishDock() {
        composeRule.setContent {
            MyGameTheme {
                MyGameDock(
                    line = returningWordsLine,
                    go = studyReturningWords,
                    onFoldChange = { folded: Boolean -> isFolded = folded },
                    door = puebloDoor,
                )
            }
        }
    }

    private fun dockHeight(): Float = composeRule.onRoot().getBoundsInRoot().height.value

    private fun isDoorBeside(): Boolean {
        val go: DpRect = composeRule.onNodeWithTag(INK_PILL).getBoundsInRoot()
        val door: DpRect = composeRule.onNodeWithTag(OUTLINED_PILL).getBoundsInRoot()
        return door.top == go.top
    }

    @Test
    @Config(qualifiers = "+w360dp-h2000dp", fontScale = 2.0f)
    fun `the unfolded Spanish dock is 435 dp tall at font scale 2 on a 360 dp wide window`() {
        showSpanishDock()

        assertFalse("the dock folded", isFolded)
        assertEquals(SPANISH_DOCK_AT_LARGEST_ON_360, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w411dp-h2000dp", fontScale = 2.0f)
    fun `the unfolded Spanish dock is 349 dp tall at font scale 2 on a 411 dp wide window`() {
        showSpanishDock()

        assertFalse("the dock folded", isFolded)
        assertEquals(SPANISH_DOCK_AT_LARGEST_ON_411, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w411dp-h915dp", fontScale = 2.0f)
    fun `the Spanish dock folds at font scale 2 on a 411 by 915 window`() {
        showSpanishDock()

        assertTrue("the dock folded", isFolded)
    }

    @Test
    @Config(qualifiers = "+w411dp-h430dp", fontScale = 0.85f)
    fun `the Spanish dock folds past half the window at a font scale under 1`() {
        showSpanishDock()

        assertTrue("the dock folded", isFolded)
    }

    @Test
    @Config(qualifiers = "+w411dp-h915dp")
    fun `the Spanish dock stays unfolded at font scale 1 on a 411 by 915 window`() {
        showSpanishDock()

        assertFalse("the dock folded", isFolded)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `the Spanish dock folds at font scale 2 on a 360 by 640 window`() {
        showSpanishDock()

        assertTrue("the dock folded", isFolded)
    }

    @Test
    @Config(qualifiers = "+w640dp-h360dp-land")
    fun `the scaffold-alone Spanish dock stays unfolded at 167 dp in landscape at font scale 1`() {
        showSpanishDock()

        assertFalse("the dock folded", isFolded)
        assertEquals(SPANISH_DOCK_AT_DEFAULT_IN_LANDSCAPE, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the Spanish label and door do not share a row at font scale 1 on a 360 by 640 window`() {
        showSpanishDock()

        assertFalse("the door sits beside the go button", isDoorBeside())
    }

    @Test
    @Config(qualifiers = "+w360dp-h2000dp", fontScale = 2.0f)
    fun `the Spanish label and door do not share a row at font scale 2 on a 360 dp wide window`() {
        showSpanishDock()

        assertFalse("the door sits beside the go button", isDoorBeside())
    }

    @Test
    @Config(qualifiers = "+w412dp-h915dp")
    fun `the Spanish label and door do not share a row at font scale 1 on a 412 by 915 window`() {
        showSpanishDock()

        assertFalse("the door sits beside the go button", isDoorBeside())
    }

    @Test
    @Config(qualifiers = "+w411dp-h2000dp", fontScale = 2.0f)
    fun `the Spanish label and door do not share a row at font scale 2 on a 411 dp wide window`() {
        showSpanishDock()

        assertFalse("the door sits beside the go button", isDoorBeside())
    }

    @Test
    @Config(qualifiers = "+w640dp-h360dp-land")
    fun `the Spanish label and door share a row in landscape at font scale 1`() {
        showSpanishDock()

        assertTrue("the door sits beside the go button", isDoorBeside())
    }
}
