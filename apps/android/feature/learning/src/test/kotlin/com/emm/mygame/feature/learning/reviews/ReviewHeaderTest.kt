package com.emm.mygame.feature.learning.reviews

import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ReviewHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private lateinit var colors: MyGameColors

    private val lastCardRated: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 3,
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recognition(
            wordId = schoolRecognition.wordId,
            word = schoolRecognition.word,
            frame = schoolRecognition.frame,
            choices = schoolRecognition.choices,
            chosen = schoolRecognition.choices.first().id,
            openSpan = null,
        ),
        step = ReviewUiState.ReviewStep.Correct(skill = null, openedLevel = null),
        isDealtFromStack = false,
    )

    @Test
    fun `sets the due count on the title's row, after the title`() {
        draw(lastCardRated)

        val title: DpRect = composeRule.onNode(hasText("Repaso")).getBoundsInRoot()
        val dueCount: DpRect = composeRule.onNode(hasText("Por repasar: 1")).getBoundsInRoot()
        assertTrue(dueCount.top < title.bottom && title.top < dueCount.bottom)
        assertTrue(title.right <= dueCount.left)
    }

    @Test
    fun `draws the review track in ink`() {
        draw(lastCardRated)

        val fill: Int = mostDrawnColorOf(composeRule.onNode(hasProgress(current = 1f)).captureToImage())
        assertEquals(colors.ink.toArgb(), fill)
        assertNotEquals(colors.go.toArgb(), fill)
    }

    private fun hasProgress(current: Float): SemanticsMatcher = SemanticsMatcher.expectValue(
        SemanticsProperties.ProgressBarRangeInfo,
        ProgressBarRangeInfo(current = current, range = 0f..1f),
    )

    private fun draw(state: ReviewUiState) {
        composeRule.setContent {
            MyGameTheme {
                colors = MyGameTheme.colors
                ReviewScreen(state = state, onIntent = { }, onDone = {})
            }
        }
    }

    private fun mostDrawnColorOf(image: ImageBitmap): Int {
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels.toList()
            .groupingBy { pixel: Int -> pixel }
            .eachCount()
            .maxBy { entry: Map.Entry<Int, Int> -> entry.value }
            .key
    }
}
