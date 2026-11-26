package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.uitesting.navRowOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolSlotTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

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

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onTextOpen = {},
                )
            }
        }
    }

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
    }

    private fun busySlot(remaining: Duration): SchoolUiState.SlotLine.Busy =
        SchoolUiState.SlotLine.Busy(firstLesson, firstLessonName, remaining = remaining, total = 150.seconds)

    @Test
    fun `opens the words of the running lesson from a nav row`() {
        show(idleSchool.copy(slot = busySlot(150.seconds)))

        composeRule.onNode(navRowOf("Leer las palabras"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(listOf(firstLesson), lessonOpens)
    }

    @Test
    fun `draws a running lesson's countdown in seconds in its last minute`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        showing("0:42")
    }

    @Test
    fun `draws a running lesson's countdown in minutes`() {
        show(idleSchool.copy(slot = busySlot(150.seconds)))

        showing("2\u00A0min")
    }

    @Test
    fun `rounds a running lesson's countdown up to the whole second`() {
        show(idleSchool.copy(slot = busySlot(42.5.seconds)))

        showing("0:43")
    }

    @Test
    fun `fills the track with the share of the lesson already run`() {
        show(idleSchool.copy(slot = busySlot(37.5.seconds)))

        composeRule
            .onNode(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.ProgressBarRangeInfo,
                    ProgressBarRangeInfo(current = 0.75f, range = 0f..1f),
                ),
            )
            .assertExists()
    }

    @Test
    fun `keeps a refused stop beside an idle slot`() {
        show(
            idleSchool.copy(
                stop = SchoolUiState.LessonRequestStatus.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a refused stop beside a finished lesson`() {
        show(
            idleSchool.copy(
                slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName),
                stop = SchoolUiState.LessonRequestStatus.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a stop's outage beside an idle slot`() {
        show(idleSchool.copy(stop = SchoolUiState.LessonRequestStatus.Unreachable(firstLesson)))

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `draws a countdown of whole hours`() {
        show(idleSchool.copy(slot = busySlot(2.hours)))

        showing("2\u00A0h")
    }

    @Test
    fun `draws a countdown of hours and minutes`() {
        show(idleSchool.copy(slot = busySlot(1.hours + 20.minutes)))

        showing("1\u00A0h 20\u00A0min")
    }

    @Test
    fun `names the running lesson in the slot`() {
        show(idleSchool.copy(slot = busySlot(42.seconds), lessons = emptyList()))

        showing("Lección 1")
    }

    @Test
    fun `says what a stop leaves`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        showing("Si lo paras, la lección queda por estudiar y puedes volver a empezarla.")
    }

    @Test
    fun `stops a running lesson from its button`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        composeRule.onNodeWithContentDescription("Parar el estudio de la lección 1").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StopTapped(firstLesson)), intents)
    }

    @Test
    fun `names the lesson a stop button stops`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        composeRule.onNodeWithContentDescription("Parar el estudio de la lección 1").assertExists()
    }

    @Test
    fun `announces a stop while it waits`() {
        show(idleSchool.copy(slot = busySlot(42.seconds), stop = SchoolUiState.LessonRequestStatus.Waiting))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Enviando…"))
            .assertExists()
    }

    @Test
    fun `keeps a refused stop beside the slot`() {
        show(
            idleSchool.copy(
                slot = busySlot(42.seconds),
                stop = SchoolUiState.LessonRequestStatus.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a stop's outage beside the slot`() {
        show(
            idleSchool.copy(
                slot = busySlot(42.seconds),
                stop = SchoolUiState.LessonRequestStatus.Unreachable(firstLesson),
            ),
        )

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `draws a finished lesson while the town reads again`() {
        show(idleSchool.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName), lessons = emptyList()))

        showing("Lección 1")
        showing("La lección está lista. Estamos leyendo tu pueblo otra vez…")
    }
}
