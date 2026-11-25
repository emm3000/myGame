package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
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

private val noticeBetweenTheLimits: Dp = 100.dp

private const val MEASURED_TOLERANCE: Float = 1f

private const val DOCK_AT_REST_AT_DEFAULT: Float = 84f

private const val DOCK_WITH_REFUSAL_AT_DEFAULT: Float = 140f

private const val SPANISH_DOCK_AT_LARGEST_ON_360: Float = 157f

private const val SPANISH_REFUSAL: String = "No pudimos llegar a tu pueblo. Inténtalo de nuevo."

private fun spanish(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private val studyReturningWords: MyGameDockGo = MyGameDockGo(
    label = spanish("Estudiar las palabras que vuelven"),
    isBusy = false,
    busyDescription = MyGameLabel(text = "Esperando", translation = null),
    onClick = {},
)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameDockMeasureTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var isFolded: Boolean = false

    private fun showSpanishDock(notice: @Composable () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                MyGameDock(
                    go = studyReturningWords,
                    step = spanish("Palabras que vuelven: banda 2, grupo 3"),
                    onFoldChange = { folded: Boolean -> isFolded = folded },
                    notice = notice,
                )
            }
        }
    }

    private fun dockHeight(): Float = composeRule.onRoot().getBoundsInRoot().height.value

    @Test
    @Config(qualifiers = "+w411dp-h915dp")
    fun `the dock at rest is 84 dp tall at font scale 1 on a 411 by 915 window`() {
        showSpanishDock()

        assertFalse("the dock folded", isFolded)
        assertEquals(DOCK_AT_REST_AT_DEFAULT, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w411dp-h915dp")
    fun `the dock with a refusal is 140 dp tall at font scale 1 on a 411 by 915 window`() {
        showSpanishDock(notice = { MyGameInlineAlert(message = SPANISH_REFUSAL) })

        assertFalse("the dock folded", isFolded)
        assertEquals(DOCK_WITH_REFUSAL_AT_DEFAULT, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `the Spanish dock is 157 dp tall at font scale 2 on a 360 by 640 window`() {
        showSpanishDock()

        assertEquals(SPANISH_DOCK_AT_LARGEST_ON_360, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `a refusal folds out of the Spanish dock at font scale 2 on a 360 by 640 window`() {
        showSpanishDock(notice = { MyGameInlineAlert(message = SPANISH_REFUSAL) })

        assertTrue("the dock folded", isFolded)
        assertEquals(SPANISH_DOCK_AT_LARGEST_ON_360, dockHeight(), MEASURED_TOLERANCE)
    }

    @Test
    @Config(qualifiers = "+w411dp-h360dp", fontScale = 0.85f)
    fun `a notice folds past half the window at a font scale under 1`() {
        showSpanishDock(notice = { Spacer(modifier = Modifier.height(noticeBetweenTheLimits)) })

        assertTrue("the dock folded", isFolded)
    }
}
