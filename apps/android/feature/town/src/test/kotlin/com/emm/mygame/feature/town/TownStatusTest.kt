package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
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

    private val unreadLesson: LessonId = LessonId("lesson-2")

    private val otherLesson: LessonId = LessonId("lesson-3")

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
                    dock = null,
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

    @Test
    fun `opens the first unread lesson's words from the notice's nav row`() {
        val opened: MutableList<LessonId> = mutableListOf()
        showNotice(firstUnread = unreadLesson, onLessonOpen = { lesson: LessonId -> opened += lesson })

        composeRule.onNode(navRowOf(READ_WORDS), useUnmergedTree = true).performClick()

        assertEquals(listOf(unreadLesson), opened)
    }

    @Test
    fun `opens the reviews from the notice's nav row when every word is read`() {
        var reviewsOpened: Int = 0
        showNotice(firstUnread = null, onReviewsOpen = { reviewsOpened += 1 })

        composeRule.onNode(navRowOf(START_REVIEWS), useUnmergedTree = true).performClick()

        assertEquals(1, reviewsOpened)
    }

    @Test
    fun `draws no way on when the dock's go reads the same lesson's words`() {
        showNotice(firstUnread = unreadLesson, dock = dockGoing(NextStepCard.Action.ReadWords(unreadLesson)))

        composeRule.onAllNodes(navRowOf(READ_WORDS), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws the way on when the dock's go reads another lesson's words`() {
        showNotice(firstUnread = unreadLesson, dock = dockGoing(NextStepCard.Action.ReadWords(otherLesson)))

        composeRule.onNode(navRowOf(READ_WORDS), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no way on when the dock's go starts the reviews`() {
        showNotice(firstUnread = null, dock = dockGoing(NextStepCard.Action.StartReviews))

        composeRule.onAllNodes(navRowOf(START_REVIEWS), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws the way to the words when the dock's go starts the reviews`() {
        showNotice(firstUnread = unreadLesson, dock = dockGoing(NextStepCard.Action.StartReviews))

        composeRule.onNode(navRowOf(READ_WORDS), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws the way on when the dock's go to the reviews is blocked`() {
        val blocked: TownStatusUiState.Go = TownStatusUiState.Go.Blocked(
            action = NextStepCard.Action.StartReviews,
            reason = TownStatusUiState.GoBlock.NoReviewsDue,
        )

        showNotice(firstUnread = null, dock = dockWith(blocked))

        composeRule.onNode(navRowOf(START_REVIEWS), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `keeps the close button when the way on is not drawn`() {
        showNotice(firstUnread = null, dock = dockGoing(NextStepCard.Action.StartReviews))

        composeRule.onNodeWithText(CLOSE).assertExists()
    }

    private fun dockGoing(action: NextStepCard.Action): TownStatusUiState.Dock = dockWith(
        TownStatusUiState.Go.Acts(action, isBusy = false),
    )

    private fun dockWith(go: TownStatusUiState.Go): TownStatusUiState.Dock = TownStatusUiState.Dock.Step(
        line = NextStepCard.Line.NoReviewsDue,
        detail = null,
        countdown = null,
        go = go,
        lessonStart = TownUiState.LessonStartStatus.Idle,
        capWait = null,
    )

    private fun showNotice(
        firstUnread: LessonId?,
        dock: TownStatusUiState.Dock? = null,
        onLessonOpen: (LessonId) -> Unit = {},
        onReviewsOpen: () -> Unit = {},
    ) {
        composeRule.setContent {
            MyGameTheme {
                TownStatus(
                    state = TownStatusUiState(
                        running = null,
                        notice = TownStatusUiState.FinishNotice(released, firstUnread),
                    ),
                    dock = dock,
                    onNoticeClose = {},
                    onLessonOpen = onLessonOpen,
                    onReviewsOpen = onReviewsOpen,
                )
            }
        }
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun show(state: TownStatusUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownStatus(state = state, dock = null, onNoticeClose = {}, onLessonOpen = {}, onReviewsOpen = {})
            }
        }
    }

    private companion object {
        const val RELEASED_FINISH_LINE: String = "Las palabras que vuelven de la banda 2, grupo 3 terminaron."
        const val READ_WORDS: String = "Leer las palabras"
        const val START_REVIEWS: String = "Empezar los repasos"
        const val CLOSE: String = "Cerrar"
    }
}
