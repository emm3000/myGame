package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.GO_OUTLINED_PILL
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.projection.town.ReadyTime
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.Shortfall
import com.emm.mygame.core.projection.town.building.StartStatus
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TodayRowsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<TodayIntent> = mutableListOf()

    @Test
    fun `Today draws one filled go, the first card's, at each next step`() {
        val shown: MutableState<TodayUiState> = mutableStateOf(contentWith(first = null))
        show(shown)

        val filled: List<Int> = firstCards.map { first: TodayUiState.FirstCard? ->
            shown.value = contentWith(first = first, lesson = if (first == null) runningLesson else null)
            composeRule.waitForIdle()
            composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size
        }

        assertEquals(listOf(1, 1, 1, 1, 0, 0), filled)
    }

    @Test
    fun `each row of You can do now has its own outlined go button naming the verb and the cost`() {
        show(contentWith(canDo = listOf(farmRow, homesRow)))

        composeRule.onAllNodesWithTag(GO_OUTLINED_PILL).assertCountEquals(2)
        composeRule.onNode(hasText(BUILD_FOR_FIFTY) and hasTestTag(GO_OUTLINED_PILL)).assertExists()
    }

    @Test
    fun `a row's button asks to start that building's work`() {
        show(contentWith(canDo = listOf(farmRow)))

        composeRule.onNodeWithText(BUILD_FOR_FIFTY).performScrollTo().performClick()

        assertEquals(listOf<TodayIntent>(TodayIntent.BuildTapped(TownBuildingKind.Farm)), intents)
    }

    @Test
    fun `the section is titled You can do now`() {
        show(contentWith(canDo = listOf(farmRow)))

        composeRule.onNodeWithText(CAN_DO_NOW).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `the section is titled While you wait while a lesson runs`() {
        show(contentWith(first = null, lesson = runningLesson, canDo = listOf(farmRow)))

        composeRule.onNodeWithText(WHILE_YOU_WAIT).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `a locked row draws the people needed against the people free`() {
        show(contentWith(locked = listOf(locked(BlockReason.PeopleShort(needed = 5, free = 4)))))

        composeRule.onNodeWithText(PEOPLE_SHORT, substring = true).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `a locked row draws the shortfall and when it is covered`() {
        val shortOfMoney: BlockReason = BlockReason.Resources(
            shortfalls = listOf(Shortfall(TownResourceKind.Money, 60)),
            ready = ReadyTime(remaining = 24.minutes, readyAt = readAt + 24.minutes),
        )

        show(contentWith(locked = listOf(locked(shortOfMoney))))

        composeRule.onNodeWithText(SHORT_OF_MONEY, substring = true).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `the Locked section holds the rows the town cannot start`() {
        show(contentWith(locked = listOf(locked(BlockReason.PeopleShort(needed = 5, free = 4)))))

        composeRule.onNodeWithText(LOCKED).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `a refused start is drawn beside its row`() {
        val refused: StartStatus = StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.NotEnoughResources)

        show(contentWith(canDo = listOf(farmRow), build = refused))

        composeRule.onNodeWithText(NOT_ENOUGH_RESOURCES).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `the placement's offer is a row of You can do now`() {
        show(contentWith(canDo = listOf(farmRow))) {
            MyGameText(text = PLACEMENT_OFFER, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        }

        composeRule.onNodeWithText(PLACEMENT_OFFER).performScrollTo().assertIsDisplayed()
    }

    private fun show(state: TodayUiState, placement: @Composable () -> Unit = {}) {
        show(mutableStateOf(state), placement)
    }

    private fun show(shown: MutableState<TodayUiState>, placement: @Composable () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                TodayScreen(
                    state = shown.value,
                    onIntent = { intent: TodayIntent -> intents += intent },
                    navigation = navigation,
                    placement = placement,
                )
            }
        }
    }

    private fun contentWith(
        first: TodayUiState.FirstCard? = TodayUiState.FirstCard.Study(firstLesson, number = 1),
        lesson: TodayUiState.RunningLesson? = null,
        canDo: List<TodayUiState.CanDo> = listOf(farmRow),
        locked: List<TodayUiState.Locked> = emptyList(),
        build: StartStatus = StartStatus.Idle,
    ): TodayUiState.Content = TodayUiState.Content(
        eyebrow = TodayUiState.Eyebrow.StartHere,
        first = first,
        gained = emptyList(),
        whatHappened = null,
        lesson = lesson,
        work = null,
        job = null,
        canDo = canDo,
        locked = locked,
        start = TodayUiState.LessonStart.Idle,
        build = build,
        keepGoing = null,
    )

    private fun locked(block: BlockReason): TodayUiState.Locked =
        TodayUiState.Locked(TownBuildingKind.School, levelTwoCosting(100), block)

    private companion object {
        const val BUILD_FOR_FIFTY: String = "Construir por 50 de dinero"
        const val CAN_DO_NOW: String = "Puedes hacer ahora"
        const val WHILE_YOU_WAIT: String = "Mientras esperas"
        const val LOCKED: String = "Bloqueado"
        const val PEOPLE_SHORT: String = "Gente necesaria: 5. Libres: 4."
        const val SHORT_OF_MONEY: String = "Necesitas 60 de dinero más."
        const val NOT_ENOUGH_RESOURCES: String =
            "No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas."
        const val PLACEMENT_OFFER: String = "Placement offer"

        val firstLesson: LessonId = LessonId("lesson-1")

        val runningLesson: TodayUiState.RunningLesson =
            TodayUiState.RunningLesson(firstLesson, LessonName.Shelved(1), 8.minutes, readAt + 8.minutes)

        fun levelTwoCosting(money: Long): NextLevelLine = NextLevelLine(
            level = 2,
            costs = listOf(CostLine(TownResourceKind.Money, money, isShort = false)),
            duration = 3.minutes,
            people = 1,
            wordsNeeded = null,
        )

        val farmRow: TodayUiState.CanDo = TodayUiState.CanDo(TownBuildingKind.Farm, levelTwoCosting(50))

        val homesRow: TodayUiState.CanDo = TodayUiState.CanDo(TownBuildingKind.Homes, levelTwoCosting(80))

        val firstCards: List<TodayUiState.FirstCard?> = listOf(
            TodayUiState.FirstCard.Study(firstLesson, number = 1),
            TodayUiState.FirstCard.StudyReleased(firstLesson, PlacementBand.Second, position = 1),
            TodayUiState.FirstCard.Reviews(count = 4, readFirst = null),
            TodayUiState.FirstCard.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.Eighth),
            null,
            TodayUiState.FirstCard.CaughtUp(TodayUiState.CaughtUpLine.NoReviewsDue, nextReview = null),
        )

        val navigation: TodayNavigation = TodayNavigation(
            onLessonOpen = {},
            onReviewsOpen = {},
            onHoldoutCheckOpen = { _, _ -> },
            onMapOpen = {},
            onNewsOpen = {},
            onTextOpen = {},
            onNoTown = {},
        )
    }
}
