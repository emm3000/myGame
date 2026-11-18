package com.emm.mygame.core.designsystem

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.WindowInfo
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.height
import androidx.compose.ui.unit.width
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.GraphicsMode

private const val GO_SHARE: Float = 3f

private const val SHARES: Float = 4f

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
        Landscape(qualifiers = "+w640dp-h360dp-land", isLifted = false),
        LandscapeLifted(qualifiers = "+w640dp-h360dp-land", isLifted = true),
    }

    enum class Language(val step: String, val go: String, val door: String) {
        English(step = "Lesson 3", go = "Read the words", door = "Town"),
        Spanish(step = "Lección 3", go = "Leer las palabras", door = "Pueblo"),
    }

    enum class DoorPlace { Beside, Under }

    data class Case(
        val window: Window,
        val fontScale: Float,
        val language: Language,
        val count: String,
        val door: DoorPlace,
    ) {
        override fun toString(): String = "$language, count $count, $window at $fontScale: door $door"
    }

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var isFolded: Boolean = false

    private fun showDock() {
        RuntimeEnvironment.setQualifiers(case.window.qualifiers)
        RuntimeEnvironment.setFontScale(case.fontScale)
        composeRule.setContent {
            val real: WindowInfo = LocalWindowInfo.current
            val shown: WindowInfo = if (case.window.isLifted) UnfoldingWindow(real) else real
            CompositionLocalProvider(LocalWindowInfo provides shown) {
                MyGameTheme {
                    MyGameDock(
                        line = MyGameDockLine(
                            title = MyGameLabel(text = "What is next", translation = null),
                            step = MyGameLabel(text = case.language.step, translation = null),
                        ),
                        go = MyGameDockGo(
                            label = MyGameLabel(text = case.language.go, translation = null),
                            isBusy = false,
                            busyDescription = "Waiting",
                            onClick = {},
                            badge = case.count,
                        ),
                        onFoldChange = { folded: Boolean -> isFolded = folded },
                        door = MyGameDockDoor(
                            label = MyGameLabel(text = case.language.door, translation = null),
                            onClick = {},
                        ),
                    )
                }
            }
        }
    }

    private fun goButton(): DpRect =
        composeRule.onNodeWithContentDescription("${case.language.go}, ${case.language.step}").getBoundsInRoot()

    private fun doorButton(): DpRect = composeRule.onNodeWithText(case.language.door).getBoundsInRoot()

    private fun doorPlace(): DoorPlace = if (doorButton().top == goButton().top) DoorPlace.Beside else DoorPlace.Under

    private fun goShare(): Float {
        val sheet: Float = composeRule.onRoot().getBoundsInRoot().width.value - MyGameSpacing.step5.value * 2
        return (sheet - MyGameSpacing.step3.value) * GO_SHARE / SHARES
    }

    private fun doorShare(): Float {
        val sheet: Float = composeRule.onRoot().getBoundsInRoot().width.value - MyGameSpacing.step5.value * 2
        return sheet - MyGameSpacing.step3.value - goShare()
    }

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

    private fun goWidthOnOneLine(): Float {
        val discRight: Float = placedBounds(SemanticsMatcher.keyIsDefined(PILL_BADGE)).right.value
        val go: DpRect = goButton()
        val centeredContent: Float = (discRight - (go.left.value + go.right.value) / 2) * 2
        return centeredContent + goPillLook(lightColors).sidePadding.value * 2
    }

    private fun doorWidthOnOneLine(): Float =
        placedBounds(hasText(case.language.door)).width.value + dockDoorLook(lightColors).sidePadding.value * 2

    private fun rowFits(): Boolean = goWidthOnOneLine() <= goShare() && doorWidthOnOneLine() <= doorShare()

    @Test
    fun `the case's expected place is the drawn widths against the three to one shares`() {
        showDock()

        assertEquals(case.door == DoorPlace.Beside, rowFits())
    }

    @Test
    fun `a go button with a count keeps the door beside it exactly when the three to one row fits`() {
        showDock()

        assertFalse("the dock folded", isFolded)
        assertEquals(case.door, doorPlace())
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

        private fun casesOn(window: Window, fontScale: Float, doors: Map<Language, List<DoorPlace>>): List<Case> =
            doors.flatMap { (language: Language, places: List<DoorPlace>) ->
                require(places.size == counts.size) { "one place per count" }
                counts.zip(places) { count: String, door: DoorPlace ->
                    Case(window = window, fontScale = fontScale, language = language, count = count, door = door)
                }
            }

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun cases(): List<Case> = listOf(
            casesOn(
                window = Window.Portrait360,
                fontScale = 1.0f,
                doors = mapOf(
                    Language.English to listOf(DoorPlace.Beside, DoorPlace.Beside, DoorPlace.Under),
                    Language.Spanish to listOf(DoorPlace.Under, DoorPlace.Under, DoorPlace.Under),
                ),
            ),
            casesOn(
                window = Window.Portrait360,
                fontScale = 2.0f,
                doors = mapOf(
                    Language.English to listOf(DoorPlace.Under, DoorPlace.Under, DoorPlace.Under),
                    Language.Spanish to listOf(DoorPlace.Under, DoorPlace.Under, DoorPlace.Under),
                ),
            ),
            casesOn(
                window = Window.Landscape,
                fontScale = 1.0f,
                doors = mapOf(
                    Language.English to listOf(DoorPlace.Beside, DoorPlace.Beside, DoorPlace.Beside),
                    Language.Spanish to listOf(DoorPlace.Beside, DoorPlace.Beside, DoorPlace.Beside),
                ),
            ),
            casesOn(
                window = Window.LandscapeLifted,
                fontScale = 2.0f,
                doors = mapOf(
                    Language.English to listOf(DoorPlace.Beside, DoorPlace.Beside, DoorPlace.Beside),
                    Language.Spanish to listOf(DoorPlace.Beside, DoorPlace.Beside, DoorPlace.Beside),
                ),
            ),
        ).flatten()
    }
}
