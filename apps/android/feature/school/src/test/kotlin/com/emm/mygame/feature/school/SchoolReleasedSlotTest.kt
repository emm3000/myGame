package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolReleasedSlotTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val releasedLesson: LessonId = LessonId("released-2-3")

    private val releasedName: LessonName = LessonName.Released(PlacementBand.Second, set = 3)

    private val released: TownSnapshot.ReleasedLesson = TownSnapshot.ReleasedLesson(
        id = releasedLesson,
        band = PlacementBand.Second,
        position = 3,
        duration = 150.seconds,
        requiredSchoolLevel = 1,
        isStudied = false,
        wordCount = 5,
    )

    private val releasedRunning: TownSnapshot = townOf(
        lessonSlot = slotOf(lesson = releasedLesson),
        nextStep = NextStep.LessonRunning(producer = null),
        releasedLessons = listOf(released),
    )

    @Test
    fun `names the running released lesson by its band and set in the slot`() {
        val slot: SchoolUiState.SlotLine = contentAt(readInstant + 30.seconds).slot

        assertEquals(releasedName, (slot as? SchoolUiState.SlotLine.Running)?.name)
    }

    @Test
    fun `names the finished released lesson by its band and set in the slot`() {
        val slot: SchoolUiState.SlotLine = contentAt(readInstant + 150.seconds).slot

        assertEquals(SchoolUiState.SlotLine.Done(releasedLesson, releasedName), slot)
    }

    @Test
    fun `names the running released lesson on the shelved card it blocks`() {
        val card: SchoolUiState.LessonCard? = contentAt(readInstant + 30.seconds).lessons.firstOrNull()

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(releasedName)),
            card?.state,
        )
    }

    @Test
    fun `draws the running released lesson by its band and set in the slot`() {
        show(contentAt(readInstant + 30.seconds))

        composeRule.onAllNodesWithText("Palabras que vuelven: banda 2, grupo 3").onFirst().assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the finished released lesson by its band and set in the slot`() {
        show(contentAt(readInstant + 150.seconds))

        composeRule.onAllNodesWithText("Palabras que vuelven: banda 2, grupo 3").onFirst().assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `names the released lesson on the stop button`() {
        show(contentAt(readInstant + 30.seconds))

        composeRule
            .onNodeWithContentDescription("Parar el estudio de las palabras que vuelven de la banda 2, grupo 3")
            .assertExists()
    }

    @Test
    fun `draws the running released lesson on the shelved card it blocks`() {
        show(contentAt(readInstant + 30.seconds))

        composeRule
            .onNodeWithText("La escuela está estudiando las palabras que vuelven de la banda 2, grupo 3.")
            .assertExists()
    }

    @Test
    fun `offers no words to read while a released lesson runs`() {
        show(contentAt(readInstant + 30.seconds))

        composeRule.onAllNodesWithText("Leer las palabras", substring = true).assertCountEquals(0)
    }

    private fun contentAt(now: Instant): SchoolUiState.Content =
        releasedRunning.contentAt(now = now, gap = Duration.ZERO, mutations = SchoolMutations.none, selected = null)

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = {},
                    onReviewsOpen = {},
                    onLessonOpen = {},
                    onReportOpen = {},
                    onHoldoutCheckOpen = { _: PlacementBand, _: HoldoutCheckWeek -> },
                )
            }
        }
    }
}
