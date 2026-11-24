package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.NextLevelLine
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.PlaceStocks
import com.emm.mygame.feature.town.building.StartStatus
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.WordNeedLine
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.building.work.SlotLine
import com.emm.mygame.feature.town.building.work.StopStatus
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.seconds

@RunWith(RobolectricTestRunner::class)
class TownWordsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val farmOffer: PlaceCard = PlaceCard(
        kind = TownBuildingKind.Farm,
        level = 1,
        raisedFrom = null,
        isInWork = false,
        next = NextLevelLine(
            level = 2,
            costs = listOf(CostLine(TownResourceKind.Money, 150, isShort = false)),
            duration = 90.seconds,
            people = 3,
            wordsNeeded = null,
        ),
        block = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = listOf(
            StockLine(
                TownResourceKind.Money,
                130,
                capacity = 900,
                ratePerHour = 30,
                skillLevel = 0,
                fill = null,
            ),
        ),
        people = PeopleLine(free = 24, atWork = 96),
        words = WordsLine(stable = 0, retained = 0),
        season = null,
        buildMark = null,
        slot = SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(farmOffer),
        nextStepPlace = TownBuildingKind.Farm,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = StartStatus.Idle,
        stop = StopStatus.Idle,
        hiring = idleHiringLine,
    )

    @Test
    fun `draws a stable need with its count`() {
        showPlaces(riverton.copy(places = listOf(farmNeeding(WordNeedLine(10, 4, NeededWordKind.Stable)))))

        composeRule.onNodeWithText("Necesita 10 palabras fuera de aprendizaje: 4 de 10").assertIsDisplayed()
    }

    @Test
    fun `draws a retained need with its count`() {
        val need: WordNeedLine = WordNeedLine(50, held = 3, NeededWordKind.Retained)

        showPlaces(riverton.copy(places = listOf(farmNeeding(need))))

        composeRule.onNodeWithText("Necesita 50 palabras aprendidas: 3 de 50").assertIsDisplayed()
    }

    @Test
    fun `draws no need below level 3`() {
        showPlaces(riverton)

        composeRule.onAllNodesWithText("Necesita", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the town's reviewed and learned words`() {
        showStocks(riverton.copy(words = WordsLine(stable = 14, retained = 3)))

        composeRule.onNodeWithText("Palabras fuera de aprendizaje: 14").assertIsDisplayed()
        composeRule.onNodeWithText("Palabras aprendidas: 3").assertIsDisplayed()
    }

    private fun farmNeeding(need: WordNeedLine): PlaceCard =
        farmOffer.copy(level = 2, next = farmOffer.next?.copy(level = 3, wordsNeeded = need))

    private fun showPlaces(content: TownUiState.Content) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(state = content, onIntent = {}, onSchoolOpen = {}, onMapOpen = {}, onTextOpen = {})
            }
        }
    }

    private fun showStocks(content: TownUiState.Content) {
        composeRule.setContent {
            MyGameTheme {
                PlaceStocks(place = TownBuildingKind.School, content = content)
            }
        }
    }
}
