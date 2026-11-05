package com.emm.mygame.feature.fief

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LibraryLessonCardTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `links the library's lesson card to the reviews with no start button`() {
        draw()

        composeRule.onNodeWithText("Lección 1").assertExists()
        composeRule.onAllNodes(hasClickAction()).assertCountEquals(1)
        composeRule.onAllNodes(hasClickAction() and hasText("Ir al repaso")).assertCountEquals(1)
    }

    @Test
    fun `opens the reviews from the library's lesson card`() {
        var opened: Int = 0
        draw(onReviewOpen = { opened += 1 })

        composeRule.onNodeWithText("Ir al repaso").performClick()

        assertEquals(1, opened)
    }

    private fun draw(onReviewOpen: () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                LibrarySection(
                    library = FiefUiState.LibraryLine(
                        slot = FiefUiState.StudySlotLine.Idle,
                        arts = emptyList(),
                        study = FiefUiState.StudyStatus.Idle,
                    ),
                    onIntent = {},
                    onReviewOpen = onReviewOpen,
                )
            }
        }
    }
}
