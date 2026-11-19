package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
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
    val composeRule: ComposeContentTestRule = createComposeRule()

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
            wordsNeeded = null,
        ),
        block = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = listOf(
            TownUiState.StockLine(
                TownResourceKind.Money,
                120,
                capacity = 900,
                ratePerHour = 30,
                skillLevel = 0,
                fill = null,
            ),
        ),
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        words = TownUiState.WordsLine(stable = 0, retained = 0),
        season = null,
        buildMark = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(farmOffer),
        nextStepPlace = TownBuildingKind.Farm,
        goal = null,
        caughtUpGoal = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = idleOffice,
    )

    private val everyStock: List<TownUiState.StockLine> = TownResourceKind.entries.map { kind: TownResourceKind ->
        TownUiState.StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
    }

    private val storageOffer: TownUiState.PlaceCard = farmOffer.copy(kind = TownBuildingKind.Storage)

    private val farmInWork: TownUiState.Content = riverton.copy(places = listOf(farmOffer.copy(isInWork = true)))

    private val onStorage: TownUiState.Content =
        riverton.copy(stocks = everyStock, places = listOf(storageOffer), nextStepPlace = TownBuildingKind.Storage)

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
                    onMapOpen = {},
                )
            }
        }
        val shortOffer: TownUiState.PlaceCard = farmOffer.copy(
            block = shortOf(TownResourceKind.Money, 30),
        )
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
    fun `writes the level on every place's page`() {
        val top: TownUiState.PlaceCard = farmOffer.copy(kind = TownBuildingKind.Homes, level = 10, next = null)
        val places: List<TownUiState.PlaceCard> = listOf(
            top,
            farmOffer.copy(kind = TownBuildingKind.School, level = 3),
            farmOffer.copy(kind = TownBuildingKind.Office, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Factory, level = 0, isInWork = true),
            farmOffer.copy(kind = TownBuildingKind.Storage, level = 2, isInWork = true),
        )

        show(riverton.copy(places = places, nextStepPlace = TownBuildingKind.School))

        val lines: Map<String, String> = mapOf(
            "Hogares" to "Nivel máximo",
            "Escuela" to "Nivel 3",
            "Oficina" to "Sin construir",
            "Fábrica" to "En construcción",
            "Almacén" to "Nivel 2 · En construcción",
        )
        lines.forEach { (place: String, line: String) ->
            tab(place).performScrollTo().performClick()
            composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun `orders the stocks money, food, power, material`() {
        val town: TownSnapshot = townOf(stocks = stocksOf().reversed())

        show(town.readContent())
        tab("Almacén").performScrollTo().performClick()

        val tops: List<Dp> = listOf("Dinero", "Comida", "Energía", "Material").map { name: String -> topOf(name) }
        assertEquals(tops.sorted(), tops)
        assertEquals(tops.size, tops.distinct().size)
    }

    @Test
    fun `marks a place in work from the slot and from the waiting list`() {
        val town: TownSnapshot = townOf(
            slot = workOf(building = TownBuildingKind.Farm),
            waitingList = listOf(workOf(building = TownBuildingKind.Storage)),
        )

        val inWork: List<TownBuildingKind> = town
            .readContent()
            .places.filter { place: TownUiState.PlaceCard -> place.isInWork }
            .map { place: TownUiState.PlaceCard -> place.kind }

        assertEquals(listOf(TownBuildingKind.Farm, TownBuildingKind.Storage), inWork)
    }

    @Test
    fun `says a shortfall in words`() {
        val short: TownUiState.PlaceCard = farmOffer.copy(
            block = shortOf(TownResourceKind.Money, 30),
        )

        var warningInk: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                warningInk = MyGameTheme.colors.warningInk
                TownScreen(
                    state = riverton.copy(places = listOf(short)),
                    onIntent = { },
                    onSchoolOpen = { },
                    onMapOpen = {},
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
        val school: TownUiState.PlaceCard = farmOffer.copy(kind = TownBuildingKind.School, isInWork = true)
        show(riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool), places = listOf(farmOffer, school)))
        tab("Escuela").performScrollTo().performClick()

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
        val season = TownUiState.SeasonLine(
            SeasonKind.Fall,
            year = 2,
            remaining = 49.hours,
            productionMarks = emptyList(),
        )

        show(riverton.copy(season = season))

        composeRule.onNodeWithText("Otoño, año 2").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Otoño termina en 2 días").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the last day of a season down by the clock`() {
        val season = TownUiState.SeasonLine(
            SeasonKind.Spring,
            year = 1,
            remaining = 30.minutes,
            productionMarks = emptyList(),
        )

        show(riverton.copy(season = season))

        composeRule.onNodeWithText("Primavera termina en 30 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws a production mark under its stock`() {
        val season: TownUiState.SeasonLine = TownUiState.SeasonLine(
            SeasonKind.Summer,
            year = 2,
            remaining = 24.hours,
            productionMarks = listOf(
                TownUiState.ProductionMark(TownResourceKind.Food, percent = 125),
                TownUiState.ProductionMark(TownResourceKind.Power, percent = 75),
            ),
        )

        show(onStorage.copy(season = season))

        assertTrue(topOf("Comida") < topOf(SUMMER_FOOD))
        assertTrue(topOf(SUMMER_FOOD) < topOf("Energía"))
        assertTrue(topOf("Energía") < topOf(SUMMER_POWER))
        assertTrue(topOf(SUMMER_POWER) < topOf("Material"))
    }

    @Test
    fun `draws no build mark while the overview answers none`() {
        show(riverton)

        composeRule.onAllNodesWithText(SUMMER_BUILD).assertCountEquals(0)
    }

    @Test
    fun `sets a season mark in caption`() {
        show(farmInWork.copy(buildMark = TownUiState.DurationMark(SeasonKind.Summer, percent = 75)))

        assertEquals(MyGameTypography.caption.fontSize, textStyleOf(SUMMER_BUILD).fontSize)
    }

    @Test
    fun `sets a season mark in ink-muted`() {
        var inkMuted: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inkMuted = MyGameTheme.colors.inkMuted
                Home(farmInWork.copy(buildMark = TownUiState.DurationMark(SeasonKind.Summer, percent = 75)))
            }
        }

        assertEquals(inkMuted, textStyleOf(SUMMER_BUILD).color)
    }

    @Test
    fun `names each season on the build mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(farmInWork)
        composeRule.setContent { MyGameTheme { Home(home.value) } }

        seasonWords.forEach { (season: SeasonKind, word: String) ->
            home.value = farmInWork.copy(buildMark = TownUiState.DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNodeWithText("$word: las obras tardan el 75 % del tiempo").assertExists()
        }
    }

    @Test
    fun `draws each season's icon beside the build mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(farmInWork)
        composeRule.setContent { MyGameTheme { Home(home.value) } }

        seasonIcons.forEach { (season: SeasonKind, icon: ImageVector) ->
            home.value = farmInWork.copy(buildMark = TownUiState.DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNode(seasonMarkOf(icon, text = "las obras tardan el 75 % del tiempo")).assertExists()
        }
    }

    @Test
    fun `draws the season's icon beside a production mark`() {
        val season: TownUiState.SeasonLine = TownUiState.SeasonLine(
            SeasonKind.Winter,
            year = 2,
            remaining = 24.hours,
            productionMarks = listOf(TownUiState.ProductionMark(TownResourceKind.Power, percent = 75)),
        )

        show(onStorage.copy(season = season))

        composeRule.onNode(seasonMarkOf(MyGameIcons.winter, text = "Invierno: energía al 75 %")).assertExists()
    }

    @Test
    fun `draws no season line while no season is in force`() {
        val town: TownSnapshot = townOf(seasonEndsAt = readInstant + 1.hours)

        assertEquals(
            null,
            town.readContent().season,
        )
    }

    @Test
    fun `reads the season in force from the town`() {
        val town: TownSnapshot = townOf(
            seasonInForce = seasonOf(SeasonKind.Winter).copy(year = 3),
            seasonEndsAt = readInstant + 1.hours,
        )

        assertEquals(
            TownUiState.SeasonLine(SeasonKind.Winter, year = 3, remaining = 1.hours, productionMarks = emptyList()),
            town.readContent().season,
        )
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text).onLast().getUnclippedBoundsInRoot().top

    private fun tab(place: String): SemanticsNodeInteraction = composeRule.onNode(
        isTab and hasContentDescription(place, substring = true),
    )

    private fun show(state: TownUiState) {
        composeRule.setContent { MyGameTheme { Home(state) } }
    }

    @Composable
    private fun Home(state: TownUiState) {
        TownScreen(
            state = state,
            onIntent = { },
            onSchoolOpen = { },
            onMapOpen = {},
        )
    }

    private companion object {
        const val MONEY_SHORT: String = "Necesitas 30 de dinero más."
        const val SUMMER_FOOD: String = "Verano: comida al 125 %"
        const val SUMMER_POWER: String = "Verano: energía al 75 %"
        const val SUMMER_BUILD: String = "Verano: las obras tardan el 75 % del tiempo"
    }

    private fun TownSnapshot.readContent(): TownUiState.Content = contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = idleMutations,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )
}
