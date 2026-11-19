package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownStatusTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val released: LessonName = LessonName.Released(PlacementBand.Second, set = 3)

    @Test
    fun `draws the running released lesson by its band and set`() {
        val running = TownStatusUiState.RunningLesson(name = released, remaining = 5.minutes, finishesAt = readInstant)

        show(TownStatusUiState(running = running, notice = null))

        composeRule.onNodeWithText("Palabras que vuelven: banda 2, grupo 3 listas en").assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the finished released lesson by its band and set`() {
        show(TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released, firstUnread = null)))

        composeRule.onNodeWithText(RELEASED_FINISH_LINE).assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `sets the finish line in body ink`() {
        var ink: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                ink = MyGameTheme.colors.ink
                TownStatus(
                    state = TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released, null)),
                    onNoticeClose = {},
                    onLessonOpen = {},
                    onReviewsOpen = {},
                )
            }
        }

        val line: TextStyle = textStyleOf(RELEASED_FINISH_LINE)
        assertEquals(MyGameTypography.body.fontSize, line.fontSize)
        assertEquals(MyGameTypography.body.fontWeight, line.fontWeight)
        assertEquals(ink, line.color)
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun show(state: TownStatusUiState) {
        composeRule.setContent {
            MyGameTheme { TownStatus(state = state, onNoticeClose = {}, onLessonOpen = {}, onReviewsOpen = {}) }
        }
    }

    private companion object {
        const val RELEASED_FINISH_LINE: String = "Las palabras que vuelven de la banda 2, grupo 3 terminaron."
    }
}
