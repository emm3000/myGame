package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolStepLessonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val stepCard: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
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

    private val otherCard: SchoolUiState.LessonCard =
        stepCard.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val studyFirst: NextStepCard = NextStepCard(
        line = NextStepCard.Line.Lesson(number = 1),
        detail = NextStepCard.Detail.Words(count = 5),
        countdown = null,
        action = NextStepCard.Action.Study(number = 1),
    )

    private val stepSchool: SchoolUiState.Content = SchoolUiState.Content(
        schoolLevel = 1,
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(stepCard, otherCard),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = studyFirst,
        start = SchoolUiState.LessonRequestStatus.Idle,
        stop = SchoolUiState.LessonRequestStatus.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
    )

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onLessonOpen = {},
                    onTextOpen = {},
                )
            }
        }
    }

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names What is next above the step's lesson`() {
        show(stepSchool)

        val eyebrowBottom: Dp = composeRule.onNodeWithText(WHAT_IS_NEXT, ignoreCase = true, useUnmergedTree = true)
            .assertIsDisplayed()
            .getUnclippedBoundsInRoot().bottom
        val titleTop: Dp = composeRule.onNodeWithText("Lección 1", useUnmergedTree = true)
            .getUnclippedBoundsInRoot().top
        assertTrue(eyebrowBottom <= titleTop)
    }

    @Test
    fun `names no What is next over a selected lesson that is not the step's`() {
        show(stepSchool.copy(selected = secondLesson))

        showing("Work and money")
        composeRule.onAllNodesWithText(WHAT_IS_NEXT, ignoreCase = true, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `names no What is next while the step is not a lesson`() {
        show(stepSchool.copy(nextStep = caughtUpCard))

        showing("Lección 1")
        composeRule.onAllNodesWithText(WHAT_IS_NEXT, ignoreCase = true, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `studies the step's lesson from its own button`() {
        show(stepSchool)

        composeRule.onNodeWithText("Estudiar la lección 1 · 2:30").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(firstLesson)), intents)
    }

    @Test
    fun `draws the study button for a selected lesson that is not the step's`() {
        show(stepSchool.copy(selected = secondLesson))

        composeRule.onNodeWithText("Estudiar la lección 2 · 2:30").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(secondLesson)), intents)
    }

    private companion object {
        const val WHAT_IS_NEXT: String = "Tu siguiente paso"
    }
}
