package com.emm.mygame.feature.review

import android.text.InputType
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewRecallKeyboardTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `asks the keyboard for no autocorrect on the recall field`() {
        val keyboardRequest: EditorInfo = keyboardRequestOfRecallField()

        assertEquals(0, keyboardRequest.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT)
    }

    @Test
    fun `asks the keyboard for no capitalization on the recall field`() {
        val capitalizations: Int = InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS or
            InputType.TYPE_TEXT_FLAG_CAP_WORDS or
            InputType.TYPE_TEXT_FLAG_CAP_SENTENCES

        val keyboardRequest: EditorInfo = keyboardRequestOfRecallField()

        assertEquals(0, keyboardRequest.inputType and capitalizations)
    }

    private fun keyboardRequestOfRecallField(): EditorInfo {
        val hostView: View = drawRecall()
        composeRule.onNode(hasSetTextAction()).performClick()
        val keyboardRequest = EditorInfo()
        val connection: InputConnection? = composeRule.runOnIdle { hostView.onCreateInputConnection(keyboardRequest) }
        assertNotNull(connection)
        return keyboardRequest
    }

    private fun drawRecall(): View {
        var hostView: View? = null
        composeRule.setContent {
            hostView = LocalView.current
            MyGameTheme {
                ReviewScreen(state = answeringRecall(), onIntent = { }, onLessonOpen = { }, onTownOpen = { })
            }
        }
        composeRule.waitForIdle()
        return requireNotNull(hostView)
    }

    private fun answeringRecall(): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recall(
            wordId = homeRecall.wordId,
            gloss = homeRecall.gloss,
            gappedFrame = homeRecall.gappedFrame,
            typed = "",
            hint = null,
        ),
        step = ReviewUiState.ReviewStep.Answering,
        isDealtFromStack = false,
    )
}
