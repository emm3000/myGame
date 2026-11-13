package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import kotlin.time.Duration.Companion.minutes
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownStatusTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val released: LessonName = LessonName.Released(PlacementBand.Second, set = 3)

    @Test
    fun `draws the running released lesson by its band and set`() {
        val running = TownStatusUiState.RunningLesson(name = released, remaining = 5.minutes, finishesAt = readInstant)

        show(TownStatusUiState(running = running, notice = null))

        composeRule.onNodeWithText("Palabras que vuelven: banda 2, grupo 3 listas en").assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the finished released lesson by its band and set`() {
        show(TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released, firstUnread = null)))

        composeRule.onNodeWithText("Las palabras que vuelven de la banda 2, grupo 3 terminaron.").assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    private fun show(state: TownStatusUiState) {
        composeRule.setContent {
            MyGameTheme { TownStatus(state = state, onNoticeClose = {}, onLessonOpen = {}, onReviewsOpen = {}) }
        }
    }
}
