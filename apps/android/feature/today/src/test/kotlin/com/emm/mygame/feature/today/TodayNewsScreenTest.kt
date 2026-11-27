package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.SEAL
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.uitesting.textStyleOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class TodayNewsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<TodayIntent> = mutableListOf()

    private var newsOpened: Int = 0

    private val peach: SemanticsMatcher = SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Peach)

    @Test
    fun `an achievement event is a peach block`() {
        show(contentWith(events = listOf(TodayUiState.NewsEvent.Achievement(farmBuilt))))

        composeRule.onNode(peach and hasAnyDescendant(hasText(FARM_BUILT))).assertExists()
    }

    @Test
    fun `an achievement event opens with a seal`() {
        show(contentWith(events = listOf(TodayUiState.NewsEvent.Achievement(farmBuilt))))

        composeRule.onNode(peach and hasAnyDescendant(SemanticsMatcher.keyIsDefined(SEAL)), useUnmergedTree = true)
            .assertExists()
    }

    @Test
    fun `every other event is a plain row`() {
        show(contentWith(events = listOf(TodayUiState.NewsEvent.Plain(jobBack))))

        composeRule.onNodeWithText(JOB_BACK).performScrollTo()
        composeRule.onNode(peach).assertDoesNotExist()
    }

    @Test
    fun `What happened links to all the news`() {
        show(contentWith(events = listOf(TodayUiState.NewsEvent.Plain(jobBack))))

        composeRule.onNodeWithText(ALL_THE_NEWS).performScrollTo().performClick()

        assertEquals(1, newsOpened)
    }

    @Test
    fun `Close asks to close the news`() {
        show(contentWith(events = listOf(TodayUiState.NewsEvent.Plain(jobBack))))

        composeRule.onNodeWithText(CLOSE_THE_NEWS).performScrollTo().performClick()

        assertEquals(listOf<TodayIntent>(TodayIntent.NewsCloseTapped), intents)
    }

    @Test
    fun `What happened draws nothing once the news is closed`() {
        show(contentWith(events = null))

        assertEquals(0, composeRule.onAllNodesWithText(TOWN_NEWS).fetchSemanticsNodes().size)
    }

    @Test
    fun `the caught-up first card is an achievement`() {
        show(contentWith(first = caughtUp, events = null))

        composeRule.onNode(peach and hasAnyDescendant(hasText(NO_REVIEWS_DUE))).assertExists()
    }

    @Test
    fun `the caught-up first card draws its line in on-block in the dark theme`() {
        var onBlock: Color = Color.Unspecified
        show(contentWith(first = caughtUp, events = null), isDark = true) { onBlock = MyGameTheme.colors.onBlock }

        assertEquals(onBlock, textStyleOf(composeRule, NO_REVIEWS_DUE).color)
    }

    @Test
    fun `any other first card is paper, not a block`() {
        show(contentWith(first = TodayUiState.FirstCard.Study(LessonId("lesson-1"), number = 1), events = null))

        composeRule.onNode(peach).assertDoesNotExist()
    }

    private fun show(state: TodayUiState, isDark: Boolean = false, onTheme: @Composable () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme(darkTheme = isDark) {
                onTheme()
                TodayScreen(
                    state = state,
                    onIntent = { intent: TodayIntent -> intents += intent },
                    navigation = TodayNavigation(
                        onLessonOpen = {},
                        onReviewsOpen = {},
                        onHoldoutCheckOpen = { _, _ -> },
                        onMapOpen = {},
                        onNewsOpen = { newsOpened += 1 },
                        onTextOpen = {},
                        onNoTown = {},
                    ),
                )
            }
        }
    }

    private fun contentWith(
        first: TodayUiState.FirstCard? = null,
        events: List<TodayUiState.NewsEvent>?,
    ): TodayUiState.Content = TodayUiState.Content(
        eyebrow = TodayUiState.Eyebrow.WhatIsNext,
        first = first,
        gained = emptyList(),
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
        const val FARM_BUILT: String = "Granja: ahora en nivel 2."
        const val JOB_BACK: String = "Tu equipo volvió de la región 1, zona 2, sitio 3."
        const val ALL_THE_NEWS: String = "Leer todas las noticias"
        const val CLOSE_THE_NEWS: String = "Cerrar las noticias"
        const val TOWN_NEWS: String = "Noticias del pueblo"
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."

        val receivedAt: Instant = Instant.parse("2026-11-05T10:00:00Z")
        val farmBuilt: TownNews =
            TownNews.BuildingWorkFinished(receivedAt - 20.minutes, TownBuildingKind.Farm, level = 2)
        val jobBack: TownNews =
            TownNews.JobBack(receivedAt - 30.minutes, TownSite(region = 1, area = 2, site = 3), pay = emptyList())
        val caughtUp: TodayUiState.FirstCard =
            TodayUiState.FirstCard.CaughtUp(line = TodayUiState.CaughtUpLine.NoReviewsDue, nextReview = null)
    }
}
