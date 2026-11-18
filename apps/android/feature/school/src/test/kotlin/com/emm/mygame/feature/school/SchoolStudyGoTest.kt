package com.emm.mygame.feature.school

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameTheme
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
    fun `leaves a study step the read school has no lesson for to the dock`() {
        val shown: MutableList<MyGameDockGo?> = mutableListOf()
        val read: SchoolUiState = townOf(lessons = listOf(lessonOf())).contentAt(
            now = readInstant,
            mutations = SchoolMutations.none,
            selected = null,
        )
        composeRule.setContent {
            MyGameTheme {
                shown += schoolStudyGo(state = read, number = 9, onIntent = {})
            }
        }
        composeRule.waitForIdle()

        assertEquals(listOf<MyGameDockGo?>(null), shown.distinct())
    }
}
