package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import kotlin.time.Duration.Companion.seconds
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
    )

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(state = state, onIntent = {}, onLessonOpen = {}, onTextOpen = {})
            }
        }
    }

    @Test
    fun `Learn draws no building level and no building work`() {
        show(idleSchool)

        composeRule.onNodeWithText("Escuela").assertIsDisplayed()
        composeRule.onAllNodesWithText("Nivel", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("Obra", substring = true).assertCountEquals(0)
    }
}
