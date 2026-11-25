package com.emm.mygame.feature.school

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolStudyGoTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val asked: MutableList<SchoolIntent> = mutableListOf()

    private val twoLessons: TownSnapshot = townOf(lessons = listOf(lessonOf(), lessonOf(id = secondLesson)))

    private fun goOf(state: SchoolUiState, held: TownSnapshot?): MyGameDockGo? {
        var shown: MyGameDockGo? = null
        composeRule.setContent {
            MyGameTheme {
                shown = schoolStudyGo(
                    state = state,
                    held = held,
                    number = 2,
                    onIntent = { intent: SchoolIntent -> asked += intent },
                )
            }
        }
        composeRule.waitForIdle()
        return shown
    }

    @Test
    fun `waits while no town is held`() {
        assertTrue(goOf(SchoolUiState.Loading, held = null)?.isBusy == true)
    }

    @Test
    fun `studies the lesson the held town names, whatever the school has read`() {
        val older: SchoolUiState = townOf(lessons = listOf(lessonOf())).contentAt(
            now = readInstant,
            gap = Duration.ZERO,
            requests = SchoolRequests.none,
            selected = null,
        )

        goOf(older, held = twoLessons)?.onClick?.invoke()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(secondLesson)), asked)
    }

    @Test
    fun `blocks the go with the time the school last drew for a busy slot`() {
        val busySchool: TownSnapshot = twoLessons.copy(lessonSlot = slotOf())
        val drawn: SchoolUiState = busySchool.contentAt(
            now = readInstant + 100.seconds,
            gap = Duration.ZERO,
            requests = SchoolRequests.none,
            selected = null,
        )

        assertEquals(
            "La escuela está estudiando la lección 1. Queda libre en 0:50.",
            goOf(drawn, held = busySchool)?.blockedReason?.text,
        )
    }
}
