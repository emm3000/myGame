package com.emm.mygame.feature.school

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolStudyGoTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `waits while the school is still reading`() {
        var shown: MyGameDockGo? = null
        composeRule.setContent {
            MyGameTheme {
                shown = schoolStudyGo(state = SchoolUiState.Loading, number = 2, onIntent = {})
            }
        }
        composeRule.waitForIdle()

        assertTrue(shown?.isBusy == true)
    }

    @Test
    fun `asks the school once to read a study step it does not hold`() {
        val asked: MutableList<SchoolIntent> = mutableListOf()
        val shown: MutableState<SchoolUiState> = mutableStateOf(oneLesson)
        composeRule.setContent {
            MyGameTheme {
                schoolStudyGo(state = shown.value, number = 2, onIntent = { intent: SchoolIntent -> asked += intent })
            }
        }
        composeRule.waitForIdle()

        shown.value = oneLesson.copy(unheldStep = SchoolUiState.UnheldStep.Reading(number = 2))
        composeRule.waitForIdle()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.DockStepUnheld(number = 2)), asked)
    }

    @Test
    fun `blocks a study step it does not hold while the town is read`() {
        assertEquals(READING_TOWN, reasonOf(oneLesson.copy(unheldStep = SchoolUiState.UnheldStep.Reading(number = 2))))
    }

    @Test
    fun `blocks a study step its read answered without as unreachable`() {
        assertEquals(UNREACHABLE, reasonOf(oneLesson.copy(unheldStep = SchoolUiState.UnheldStep.Unheld(number = 2))))
    }

    @Test
    fun `lets the study go once the school's read holds the lesson`() {
        val read: SchoolUiState.Content = townOf(lessons = listOf(lessonOf(), lessonOf(id = secondLesson)))
            .contentAt(now = readInstant, mutations = SchoolMutations.none, selected = null)
            .copy(unheldStep = SchoolUiState.UnheldStep.Unheld(number = 2))

        assertNull(reasonOf(read))
    }

    private val oneLesson: SchoolUiState.Content = townOf(lessons = listOf(lessonOf())).contentAt(
        now = readInstant,
        mutations = SchoolMutations.none,
        selected = null,
    )

    private fun reasonOf(state: SchoolUiState): String? {
        var shown: MyGameDockGo? = null
        composeRule.setContent {
            MyGameTheme {
                shown = schoolStudyGo(state = state, number = 2, onIntent = {})
            }
        }
        composeRule.waitForIdle()
        return shown?.blockedReason
    }

    private companion object {
        const val READING_TOWN: String = "Estamos leyendo tu pueblo…"
        const val UNREACHABLE: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
    }
}
