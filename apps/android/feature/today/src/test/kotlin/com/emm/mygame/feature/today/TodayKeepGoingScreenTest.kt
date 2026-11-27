package com.emm.mygame.feature.today

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.frame.BLOCK_HUE
import com.emm.mygame.core.designsystem.frame.FRAME_STYLE
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.uitesting.outlinedDoorOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TodayKeepGoingScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var colors: MyGameColors? = null

    @Test
    fun `each frame is drawn under Read more with its card-word token's support`() {
        show(contentWith(TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame, homeFrame), tapped = null)))

        composeRule.onNodeWithText(READ_MORE).performScrollTo()
        composeRule.onNodeWithText(RIVER_BESIDE, substring = true).performScrollTo()
        composeRule.onNodeWithText(HOME_BESIDE, substring = true).performScrollTo()
    }

    @Test
    fun `draws Read more's frames on surface-sunken`() {
        show(contentWith(TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame), tapped = null)))

        val frame: DpRect = composeRule.onNodeWithText(RIVER_BESIDE, substring = true)
            .performScrollTo()
            .getBoundsInRoot()

        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val insideCardX: Int = with(composeRule.density) { (frame.left - 8.dp).roundToPx() }
        val middle: Int = with(composeRule.density) { ((frame.top + frame.bottom) / 2).roundToPx() }
        assertEquals(hexOf(colors?.surfaceSunken), hexOf(pixels[insideCardX, middle]))
    }

    @Test
    fun `draws Read more on no block hue`() {
        show(contentWith(TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame), tapped = null)))

        val blocksHoldingFrame: SemanticsMatcher =
            SemanticsMatcher.keyIsDefined(BLOCK_HUE) and hasAnyDescendant(hasText(RIVER_BESIDE, substring = true))
        assertEquals(0, composeRule.onAllNodes(blocksHoldingFrame, useUnmergedTree = true).fetchSemanticsNodes().size)
    }

    @Test
    fun `inks Read more's frames in ink, readable on the dark sunken card`() {
        show(contentWith(TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame), tapped = null)), isDark = true)

        val riverFrameText: SemanticsMatcher =
            hasText(RIVER_BESIDE, substring = true) and SemanticsMatcher.keyIsDefined(FRAME_STYLE)
        val style: Color = composeRule.onNode(riverFrameText).fetchSemanticsNode().config[FRAME_STYLE].color
        assertEquals(hexOf(colors?.ink), hexOf(style))
    }

    @Test
    fun `a tapped frame word draws its on-tap support`() {
        val riverTapped: TodayUiState.KeepGoing.Frames = TodayUiState.KeepGoing.Frames(
            sentences = listOf(onTapFrame),
            tapped = ReadingSpan(sentence = 0, span = 1),
        )

        show(contentWith(riverTapped))

        composeRule.onNodeWithText(RIVER_BESIDE, substring = true).performScrollTo()
    }

    @Test
    fun `the newest open text is offered under Read more as an outlined door that opens it`() {
        val opened: MutableList<TextId> = mutableListOf()
        show(contentWith(TodayUiState.KeepGoing.Text(TextId("text-1"), "A New Course")), onTextOpen = opened::add)

        composeRule.onNodeWithText(READ_MORE).performScrollTo()
        composeRule.onNode(outlinedDoorOf("A New Course"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(listOf(TextId("text-1")), opened)
    }

    @Test
    fun `with nothing to read Read more is not drawn`() {
        show(contentWith(keepGoing = null))

        assertEquals(0, composeRule.onAllNodes(hasText(READ_MORE)).fetchSemanticsNodes().size)
    }

    private fun show(state: TodayUiState, onTextOpen: (TextId) -> Unit = {}, isDark: Boolean = false) {
        composeRule.setContent {
            MyGameTheme(darkTheme = isDark) {
                colors = MyGameTheme.colors
                TodayScreen(
                    state = state,
                    onIntent = {},
                    navigation = TodayNavigation(
                        onLessonOpen = {},
                        onReviewsOpen = {},
                        onHoldoutCheckOpen = { _, _ -> },
                        onMapOpen = {},
                        onNewsOpen = {},
                        onTextOpen = onTextOpen,
                        onNoTown = {},
                    ),
                )
            }
        }
    }

    private fun hexOf(color: Color?): String = Integer.toHexString(color?.toArgb() ?: 0)

    private fun contentWith(keepGoing: TodayUiState.KeepGoing?): TodayUiState.Content = TodayUiState.Content(
        eyebrow = TodayUiState.Eyebrow.WhatIsNext,
        first = TodayUiState.FirstCard.CaughtUp(TodayUiState.CaughtUpLine.NoReviewsDue, nextReview = null),
        gained = emptyList(),
        whatHappened = null,
        lesson = null,
        work = null,
        job = null,
        canDo = emptyList(),
        locked = emptyList(),
        start = TodayUiState.LessonStart.Idle,
        build = StartStatus.Idle,
        keepGoing = keepGoing,
    )

    private companion object {
        const val READ_MORE: String = "Lee más"
        const val RIVER_BESIDE: String = "río"
        const val HOME_BESIDE: String = "casa"

        fun spanish(shown: WordSupport.Shown, text: String): WordSupport =
            WordSupport(shown, text, WordSupport.Language.Spanish)

        val riverFrame: List<FrameSpan> = listOf(
            FrameSpan(text = "I live by the ", support = null),
            FrameSpan(text = "river", support = spanish(WordSupport.Shown.Beside, "río")),
            FrameSpan(text = ".", support = null),
        )
        val homeFrame: List<FrameSpan> = listOf(
            FrameSpan(text = "My ", support = null),
            FrameSpan(text = "home", support = spanish(WordSupport.Shown.Beside, "casa")),
            FrameSpan(text = " is small.", support = null),
        )
        val onTapFrame: List<FrameSpan> = listOf(
            FrameSpan(text = "I live by the ", support = null),
            FrameSpan(text = "river", support = spanish(WordSupport.Shown.OnTap, "río")),
            FrameSpan(text = ".", support = null),
        )
    }
}
