package com.emm.mygame.feature.fief

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonId
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LessonItemTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `reads the free lesson with its count of words`() {
        draw(FiefUiState.LessonLine.Idle(wordCount = 5, isStudyRunning = false))

        composeRule.onNodeWithText("No cuesta nada. Trae 5 palabras nuevas.").assertIsDisplayed()
    }

    @Test
    fun `opens the review from the studied lesson`() {
        var opened: Int = 0
        draw(FiefUiState.LessonLine.Done, onReviewOpen = { opened += 1 })

        composeRule.onNodeWithText("Ir al repaso").performClick()

        assertEquals(1, opened)
    }

    private fun draw(line: FiefUiState.LessonLine, onReviewOpen: () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                LessonItem(
                    card = FiefUiState.LessonCard(lesson = LessonId("lesson-1"), theme = "A day in town", line = line),
                    isWaiting = false,
                    onIntent = {},
                    onReviewOpen = onReviewOpen,
                )
            }
        }
    }
}
