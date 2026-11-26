package com.emm.mygame.feature.today

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.projection.town.building.StartStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class TodayAwayScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `What happened draws each gain under What your town earned`() {
        show(contentWith(gained = gains, events = null))

        composeRule.onNodeWithText(EARNED_TITLE).performScrollTo()
        composeRule.onNodeWithText(MONEY_GAINED).performScrollTo()
        composeRule.onNodeWithText(FOOD_GAINED).performScrollTo()
    }

    @Test
    fun `the gains come before the Town News`() {
        show(contentWith(gained = gains, events = listOf(TodayUiState.NewsEvent.Plain(farmStopped))))

        val gainsTop: Float = topOf(EARNED_TITLE)
        val newsTop: Float = topOf(TOWN_NEWS)

        assertTrue("gains at $gainsTop, news at $newsTop", gainsTop < newsTop)
    }

    @Test
    fun `no gains draw no title`() {
        show(contentWith(gained = emptyList(), events = null))

        assertEquals(0, composeRule.onAllNodes(hasText(EARNED_TITLE)).fetchSemanticsNodes().size)
    }

    @Test
    fun `the gains draw no count of days away and no streak`() {
        show(contentWith(gained = gains, events = null))

        assertEquals(0, composeRule.onAllNodes(hasText(DAY, substring = true)).fetchSemanticsNodes().size)
        assertEquals(0, composeRule.onAllNodes(hasText(STREAK, substring = true)).fetchSemanticsNodes().size)
    }

    private fun topOf(text: String): Float =
        composeRule.onNodeWithText(text).fetchSemanticsNode().boundsInRoot.top

    private fun show(state: TodayUiState) {
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
                        onTextOpen = {},
                        onNoTown = {},
                    ),
                )
            }
        }
    }

    private fun contentWith(
        gained: List<TownSnapshot.Cost>,
        events: List<TodayUiState.NewsEvent>?,
    ): TodayUiState.Content = TodayUiState.Content(
        eyebrow = TodayUiState.Eyebrow.WhatIsNext,
        first = null,
        gained = gained,
        whatHappened = events?.let { drawn: List<TodayUiState.NewsEvent> ->
            TodayUiState.WhatHappened(drawn, receivedAt, TodayUiState.NewsClose.Idle)
        },
        lesson = null,
        work = null,
        job = null,
        canDo = emptyList(),
        locked = emptyList(),
        start = TodayUiState.LessonStart.Idle,
        build = StartStatus.Idle,
        keepGoing = null,
    )

    private companion object {
        const val EARNED_TITLE: String = "Lo que ganó tu pueblo"
        const val MONEY_GAINED: String = "120 de dinero"
        const val FOOD_GAINED: String = "45 de comida"
        const val TOWN_NEWS: String = "Noticias del pueblo"
        const val DAY: String = "día"
        const val STREAK: String = "racha"

        val receivedAt: Instant = Instant.parse("2026-11-05T10:00:00Z")
        val farmStopped: TownNews = TownNews.BuildingWorkStopped(
            receivedAt - 20.minutes,
            TownBuildingKind.Farm,
            level = 2,
            refund = emptyList(),
        )
        val gains: List<TownSnapshot.Cost> = listOf(
            TownSnapshot.Cost(TownResourceKind.Money, 120),
            TownSnapshot.Cost(TownResourceKind.Food, 45),
        )
    }
}
