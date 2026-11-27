package com.emm.mygame.feature.today

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.ReadingSpan
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TodayKeepGoingScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `each frame is drawn under Read more with its card-word token's support`() {
        show(contentWith(TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame, homeFrame), tapped = null)))

        composeRule.onNodeWithText(READ_MORE).performScrollTo()
        composeRule.onNodeWithText(RIVER_BESIDE, substring = true).performScrollTo()
        composeRule.onNodeWithText(HOME_BESIDE, substring = true).performScrollTo()
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
    fun `the newest open text is offered under Read more as a row that opens it`() {
        val opened: MutableList<TextId> = mutableListOf()
        show(contentWith(TodayUiState.KeepGoing.Text(TextId("text-1"), "A New Course")), onTextOpen = opened::add)

        composeRule.onNodeWithText(READ_MORE).performScrollTo()
        composeRule.onNodeWithText("A New Course").performScrollTo().performClick()

        assertEquals(listOf(TextId("text-1")), opened)
    }

    @Test
    fun `with nothing to read Read more is not drawn`() {
        show(contentWith(keepGoing = null))

        assertEquals(0, composeRule.onAllNodes(hasText(READ_MORE)).fetchSemanticsNodes().size)
    }

    private fun show(state: TodayUiState, onTextOpen: (TextId) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme(darkTheme = false) {
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
