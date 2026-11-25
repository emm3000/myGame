package com.emm.mygame.core.designsystem

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.WindowInfo
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.height
import androidx.compose.ui.unit.width
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.GraphicsMode

private const val UNFOLDING_HEIGHT: Int = 100_000

private const val DISC_TOLERANCE: Float = 1f

private class UnfoldingWindow(private val window: WindowInfo) : WindowInfo by window {
    override val containerSize: IntSize
        get() = IntSize(width = window.containerSize.width, height = UNFOLDING_HEIGHT)
}

@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameDockCountTest(private val case: Case) {

    enum class Window(val qualifiers: String, val isLifted: Boolean) {
        Portrait360(qualifiers = "+w360dp-h800dp-port", isLifted = false),
        Portrait360Lifted(qualifiers = "+w360dp-h800dp-port", isLifted = true),
        Landscape(qualifiers = "+w640dp-h360dp-land", isLifted = false),
        LandscapeLifted(qualifiers = "+w640dp-h360dp-land", isLifted = true),
    }

    enum class Language(val step: String, val go: String) {
        English(step = "Lesson 3", go = "Read the words"),
        Spanish(step = "Lección 3", go = "Leer las palabras"),
    }

    data class Case(val window: Window, val fontScale: Float, val language: Language, val count: String) {
        override fun toString(): String = "$language, count $count, $window at $fontScale"
    }

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun showDock() {
        RuntimeEnvironment.setQualifiers(case.window.qualifiers)
        RuntimeEnvironment.setFontScale(case.fontScale)
        composeRule.setContent {
            val real: WindowInfo = LocalWindowInfo.current
            val shown: WindowInfo = if (case.window.isLifted) UnfoldingWindow(real) else real
            CompositionLocalProvider(LocalWindowInfo provides shown) {
                MyGameTheme {
                    MyGameDock(
                        go = MyGameDockGo(
                            label = MyGameLabel(text = case.language.go, translation = null),
                            isBusy = false,
                            busyDescription = MyGameLabel(text = "Waiting", translation = null),
                            onClick = {},
                            badge = case.count,
                        ),
                        step = MyGameLabel(text = case.language.step, translation = null),
                        onFoldChange = {},
                    )
                }
            }
        }
    }

    private fun goButton(): DpRect =
        composeRule.onNodeWithContentDescription("${case.language.go}, ${case.language.step}").getBoundsInRoot()

    private fun placedBounds(matcher: SemanticsMatcher): DpRect {
        val placed: SemanticsNode = composeRule
            .onAllNodes(matcher, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .single { node: SemanticsNode -> node.layoutInfo.isPlaced }
        val density: Float = placed.layoutInfo.density.density
        return DpRect(
            left = (placed.boundsInRoot.left / density).dp,
            top = (placed.boundsInRoot.top / density).dp,
            right = (placed.boundsInRoot.right / density).dp,
            bottom = (placed.boundsInRoot.bottom / density).dp,
        )
    }

    @Test
    fun `the count's disc stays a whole circle inside the go button`() {
        showDock()

        val disc: DpRect = placedBounds(SemanticsMatcher.keyIsDefined(PILL_BADGE))
        val go: DpRect = goButton()
        assertEquals("the disc is round", disc.width.value, disc.height.value, DISC_TOLERANCE)
        assertTrue(
            "the disc ends inside the go button",
            disc.right.value <= go.right.value - goPillLook(lightColors).sidePadding.value,
        )
    }

    companion object {

        private val counts: List<String> = listOf("5", "42", "123")

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun cases(): List<Case> = Window.entries.flatMap { window: Window ->
            val fontScale: Float = if (window.isLifted) 2.0f else 1.0f
            Language.entries.flatMap { language: Language ->
                counts.map { count: String ->
                    Case(window = window, fontScale = fontScale, language = language, count = count)
                }
            }
        }
    }
}
