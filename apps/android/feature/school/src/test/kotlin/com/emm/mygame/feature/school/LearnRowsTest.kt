package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import androidx.compose.ui.unit.Dp
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LearnRowsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val readyLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        enteringWordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(readyLesson),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        start = SchoolUiState.LessonRequestStatus.Idle,
        stop = SchoolUiState.LessonRequestStatus.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
        reviews = null,
    )

    private fun show(state: SchoolUiState, placement: @Composable () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = {},
                    onLessonOpen = {},
                    onTextOpen = {},
                    onReviewsOpen = {},
                    placement = placement,
                )
            }
        }
    }

    @Test
    fun `Learn draws no building level and no building work`() {
        show(idleSchool)

        composeRule.onNodeWithText("Aprender").assertIsDisplayed()
        composeRule.onAllNodesWithText("Nivel", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("Obra", substring = true).assertCountEquals(0)
    }

    @Test
    fun `a running lesson is Learn's own row above the lessons`() {
        show(idleSchool.copy(slot = runningLesson))

        val countdownTop: Dp = composeRule.onNodeWithText("2\u00A0min").getUnclippedBoundsInRoot().top
        val lessonTop: Dp = composeRule.onNodeWithText(LESSON_SUMMARY).getUnclippedBoundsInRoot().top
        assertTrue("countdown at $countdownTop, lesson at $lessonTop", countdownTop < lessonTop)
    }

    @Test
    fun `Learn draws no running lesson row while no lesson runs`() {
        show(idleSchool)

        composeRule.onAllNodesWithText("En estudio").assertCountEquals(0)
    }

    @Test
    fun `the placement's offer is a row of Learn while the server offers it`() {
        show(idleSchool) {
            MyGameText(text = PLACEMENT_OFFER, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }

        composeRule.onNodeWithText(PLACEMENT_OFFER).performScrollTo().assertIsDisplayed()
    }

    private val runningLesson: SchoolUiState.SlotLine.Busy =
        SchoolUiState.SlotLine.Busy(firstLesson, firstLessonName, remaining = 150.seconds, total = 150.seconds)

    private companion object {
        const val PLACEMENT_OFFER: String = "Placement offer"

        const val LESSON_SUMMARY: String = "5 palabras · Habilidad: comida +5\u00A0%"
    }
}
