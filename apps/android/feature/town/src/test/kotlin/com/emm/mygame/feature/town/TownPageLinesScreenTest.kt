package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.work.SlotLine
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration

@RunWith(RobolectricTestRunner::class)
class TownPageLinesScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val home: TownUiState.Content =
        homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null))

    private val factoryGoal: TownGoal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Underway,
    )

    private val factoryGoalLine: String = "Meta 2 de 9: Fábrica, nivel 1"

    @Test
    fun `draws the goal once on the goal building's page, in its goal block`() {
        show(
            homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)),
            place = TownBuildingKind.Factory,
        )

        composeRule.onAllNodesWithText(factoryGoalLine).assertCountEquals(0)
        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(1)
        composeRule.onAllNodesWithText("En construcción").assertCountEquals(1)
    }

    @Test
    fun `shows the earned skill beside its resource on storage's page`() {
        val skilled: List<StockLine> = home.stocks.map { stock: StockLine ->
            if (stock.kind == TownResourceKind.Money) stock.copy(skillLevel = 2) else stock
        }

        show(home.copy(stocks = skilled), place = TownBuildingKind.Storage)

        composeRule.onNodeWithText("Habilidad de dinero, nivel 2").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the stable word refusal on the page of its place`() {
        val refused: StartStatus = StartStatus.Refused(
            TownBuildingKind.Farm,
            TownWorkRefusal.NotEnoughWords(needed = 10, held = 9, standing = NeededWordKind.Stable),
        )

        show(home.copy(start = refused), place = TownBuildingKind.Farm)

        composeRule
            .onNodeWithText(
                "Este nivel necesita 10 palabras fuera de aprendizaje y tienes 9. " +
                    "Estudia lecciones nuevas y repasa las palabras que te tocan.",
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws the retained word refusal on the page of its place`() {
        val refused: StartStatus = StartStatus.Refused(
            TownBuildingKind.Farm,
            TownWorkRefusal.NotEnoughWords(needed = 50, held = 49, standing = NeededWordKind.Retained),
        )

        show(home.copy(start = refused), place = TownBuildingKind.Farm)

        composeRule
            .onNodeWithText(
                "Este nivel necesita 50 palabras aprendidas y tienes 49. " +
                    "Estudia lecciones nuevas y repasa las palabras que te tocan.",
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `tells a finished work on its place's page until the next read`() {
        show(home.copy(slot = SlotLine.Done(TownBuildingKind.Farm, 2)), place = TownBuildingKind.Farm)

        composeRule
            .onNodeWithText("La obra está lista. Estamos leyendo tu pueblo otra vez…")
            .performScrollTo()
            .assertIsDisplayed()
    }

    private fun homeOn(step: NextStep): TownUiState.Content = townOf(nextStep = step).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = TownRequests.none,
        registered = TownRegistered.nothing,
        hiringEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    private fun show(state: TownUiState, place: TownBuildingKind) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    place = place,
                    onIntent = {},
                    onPlaceOpen = {},
                    onNewsOpen = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                )
            }
        }
    }
}
