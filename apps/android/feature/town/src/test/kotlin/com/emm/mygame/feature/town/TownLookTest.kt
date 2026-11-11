package com.emm.mygame.feature.town

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownLookTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val idleMutations: TownMutations = TownMutations.none

    private val farmOffer: TownUiState.PlaceCard = TownUiState.PlaceCard(
        kind = TownBuildingKind.Farm,
        level = 1,
        raisedFrom = null,
        isInWork = false,
        next = TownUiState.NextLevelLine(
            level = 2,
            costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 150, isShort = false)),
            duration = 90.seconds,
            people = 3,
        ),
        block = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = listOf(
            TownUiState.StockLine(TownResourceKind.Money, 120, capacity = 900, ratePerHour = 30, skillLevel = 0),
        ),
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        season = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(farmOffer),
        nextStep = caughtUpCard,
        nextStepTime = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = idleOffice,
    )

    private val busySlot: TownUiState.SlotLine.Busy = TownUiState.SlotLine.Busy(
        building = TownBuildingKind.Farm,
        level = 2,
        remaining = 12.minutes,
        total = 20.minutes,
        finishesAt = readInstant,
    )

    private val waitingSchool: TownUiState.WaitingLine = TownUiState.WaitingLine(
        building = TownBuildingKind.School,
        level = 3,
        remaining = 20.minutes,
        finishesAt = readInstant,
    )

    @Test
    fun `holds at most one ink pill on the town home`() {
        val home = mutableStateOf<TownUiState>(riverton)
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = home.value,
                    onIntent = { },
                    onSchoolOpen = { },
                    onReportOpen = { },
                    onMapOpen = {},
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
        val shortOffer: TownUiState.PlaceCard = farmOffer.copy(
            block = TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 30))),
        )
        val storageOffer: TownUiState.PlaceCard = farmOffer.copy(kind = TownBuildingKind.Storage)
        val offers: TownUiState.Content = riverton.copy(places = listOf(farmOffer, storageOffer))
        val homes: List<TownUiState> = listOf(
            offers,
            offers.copy(slot = busySlot, waitingList = listOf(waitingSchool)),
            offers.copy(slot = TownUiState.SlotLine.Done(TownBuildingKind.Farm, 2)),
            offers.copy(places = listOf(shortOffer, storageOffer, farmOffer.copy(next = null))),
        )

        homes.forEach { shown: TownUiState ->
            home.value = shown
            composeRule.waitForIdle()

            assertTrue(composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size <= 1)
        }
    }

    @Test
    fun `says how many places are built on the skyline`() {
        val places: List<TownUiState.PlaceCard> = listOf(
            farmOffer.copy(kind = TownBuildingKind.Homes, level = 3),
            farmOffer.copy(kind = TownBuildingKind.Farm, level = 1),
            farmOffer.copy(kind = TownBuildingKind.School, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Office, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Factory, level = 0),
            farmOffer.copy(kind = TownBuildingKind.PowerStation, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Storage, level = 2),
        )

        show(riverton.copy(places = places))

        composeRule.onNodeWithContentDescription("3 de 7 construidos").assertExists()
    }

    @Test
    fun `sets the skyline under the doors and above the stocks`() {
        show(riverton)

        val skyline: DpRect = composeRule.onNodeWithContentDescription("1 de 7 construidos").getUnclippedBoundsInRoot()

        assertTrue(composeRule.onAllNodesWithTag(OUTLINED_PILL)[1].getUnclippedBoundsInRoot().bottom <= skyline.top)
        assertTrue(skyline.bottom <= topOf("En el almacén"))
    }

    @Test
    fun `writes the level beside every place`() {
        val top: TownUiState.PlaceCard = farmOffer.copy(kind = TownBuildingKind.Homes, level = 10, next = null)
        val places: List<TownUiState.PlaceCard> = listOf(
            farmOffer.copy(kind = TownBuildingKind.School, level = 3),
            farmOffer.copy(kind = TownBuildingKind.Office, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Factory, level = 0, isInWork = true),
            farmOffer.copy(kind = TownBuildingKind.Storage, level = 2, isInWork = true),
            top,
        )

        show(riverton.copy(places = places))

        listOf("Nivel 3", "Sin construir", "En construcción", "Nivel 2 · En construcción", "Nivel 10")
            .forEach { line: String ->
                composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
            }
    }

    @Test
    fun `orders the stocks money, food, power, material`() {
        val town: TownSnapshot = townOf(stocks = stocksOf().reversed())

        show(town.contentAt(readInstant, Duration.ZERO, idleMutations, TownRegistered.nothing, emptyMap()))

        val tops: List<Dp> = listOf("Dinero", "Comida", "Energía", "Material").map { name: String -> topOf(name) }
        val lefts: List<Dp> = listOf("Dinero", "Comida", "Energía", "Material").map { name: String ->
            composeRule.onNodeWithText(name).getUnclippedBoundsInRoot().left
        }
        assertEquals(tops[0], tops[1])
        assertEquals(tops[2], tops[3])
        assertTrue(tops[1] < tops[2])
        assertTrue(lefts[0] < lefts[1])
        assertTrue(lefts[2] < lefts[3])
    }

    @Test
    fun `marks a place in work from the slot and from the waiting list`() {
        val town: TownSnapshot = townOf(
            slot = workOf(building = TownBuildingKind.Farm),
            waitingList = listOf(workOf(building = TownBuildingKind.Storage)),
        )

        val inWork: List<TownBuildingKind> = town
            .contentAt(readInstant, Duration.ZERO, idleMutations, TownRegistered.nothing, emptyMap())
            .places.filter { place: TownUiState.PlaceCard -> place.isInWork }
            .map { place: TownUiState.PlaceCard -> place.kind }

        assertEquals(listOf(TownBuildingKind.Farm, TownBuildingKind.Storage), inWork)
    }

    @Test
    fun `says a shortfall in words`() {
        val short: TownUiState.PlaceCard = farmOffer.copy(
            block = TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 30))),
        )

        var warningInk: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                warningInk = MyGameTheme.colors.warningInk
                TownScreen(
                    state = riverton.copy(places = listOf(short)),
                    onIntent = { },
                    onSchoolOpen = { },
                    onReportOpen = { },
                    onMapOpen = {},
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }

        composeRule.onNodeWithText(MONEY_SHORT).performScrollTo().assertIsDisplayed()
        assertEquals(warningInk, textStyleOf(MONEY_SHORT).color)
    }

    @Test
    fun `keeps a cost's name for TalkBack`() {
        show(riverton)

        composeRule.onNodeWithContentDescription("150 de dinero").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sets a running work's countdown in heading with tabular figures`() {
        show(riverton.copy(slot = busySlot))

        val countdown: TextStyle = textStyleOf("12 min")
        assertEquals(MyGameTypography.heading.fontSize, countdown.fontSize)
        assertEquals(MyGameTypography.heading.fontWeight, countdown.fontWeight)
        assertEquals("tnum", countdown.fontFeatureSettings)
    }

    @Test
    fun `sets a waiting work's countdown in heading with tabular figures`() {
        show(riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool)))

        val countdown: TextStyle = textStyleOf("20 min")
        assertEquals(MyGameTypography.heading.fontSize, countdown.fontSize)
        assertEquals("tnum", countdown.fontFeatureSettings)
    }

    @Test
    fun `carries its icon on a done line`() {
        show(riverton.copy(slot = TownUiState.SlotLine.Done(TownBuildingKind.Farm, 2)))

        composeRule.onNodeWithTag(WORK_DONE_ICON, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no done icon on a running work`() {
        show(riverton.copy(slot = busySlot))

        composeRule.onAllNodesWithTag(WORK_DONE_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `counts the season in force down in days`() {
        val season = TownUiState.SeasonLine(SeasonKind.Fall, year = 2, remaining = 49.hours)

        show(riverton.copy(season = season))

        composeRule.onNodeWithText("Otoño, año 2").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Otoño termina en 2 días").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the last day of a season down by the clock`() {
        val season = TownUiState.SeasonLine(SeasonKind.Spring, year = 1, remaining = 30.minutes)

        show(riverton.copy(season = season))

        composeRule.onNodeWithText("Primavera termina en 30 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sets the season under the people`() {
        val season = TownUiState.SeasonLine(SeasonKind.Fall, year = 2, remaining = 24.hours)

        show(riverton.copy(season = season))

        assertTrue(topOf(PEOPLE) < topOf("Otoño, año 2"))
        assertTrue(topOf("Otoño termina en 1 día") < topOf("Obra"))
    }

    @Test
    fun `draws no season line while no season is in force`() {
        val town: TownSnapshot = townOf(seasonEndsAt = readInstant + 1.hours)

        assertEquals(
            null,
            town.contentAt(readInstant, Duration.ZERO, idleMutations, TownRegistered.nothing, emptyMap()).season,
        )
    }

    @Test
    fun `reads the season in force from the town`() {
        val town: TownSnapshot = townOf(
            seasonInForce = SeasonInForce(SeasonKind.Winter, year = 3),
            seasonEndsAt = readInstant + 1.hours,
        )

        assertEquals(
            TownUiState.SeasonLine(SeasonKind.Winter, year = 3, remaining = 1.hours),
            town.contentAt(readInstant, Duration.ZERO, idleMutations, TownRegistered.nothing, emptyMap()).season,
        )
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text).onLast().getUnclippedBoundsInRoot().top

    private fun show(state: TownUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    onIntent = { },
                    onSchoolOpen = { },
                    onReportOpen = { },
                    onMapOpen = {},
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
    }

    private companion object {
        const val MONEY_SHORT: String = "Necesitas 30 de dinero más."
        const val PEOPLE: String = "Gente: 24 libres, 96 trabajando"
    }
}
