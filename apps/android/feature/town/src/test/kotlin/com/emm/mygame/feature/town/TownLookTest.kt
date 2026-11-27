package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
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
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.control.INK_PILL
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.DurationMark
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.building.work.SlotLine
import com.emm.mygame.feature.town.building.work.StopStatus
import com.emm.mygame.feature.town.building.work.WORK_DONE_ICON
import com.emm.mygame.feature.town.building.work.WaitingLine
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

@RunWith(RobolectricTestRunner::class)
class TownLookTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val idleRequests: TownRequests = TownRequests.none

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
                120,
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
        tip = null,
        start = StartStatus.Idle,
        stop = StopStatus.Idle,
        hiring = idleHiringLine,
    )

    private val everyStock: List<StockLine> = TownResourceKind.entries.map { kind: TownResourceKind ->
        StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
    }

    private val storageOffer: PlaceCard = farmOffer.copy(kind = TownBuildingKind.Storage)

    private val farmInWork: TownUiState.Content = riverton.copy(places = listOf(farmOffer.copy(isInWork = true)))

    private val onStorage: TownUiState.Content =
        riverton.copy(stocks = everyStock, places = listOf(storageOffer), nextStepPlace = TownBuildingKind.Storage)

    private val busySlot: SlotLine.Busy = SlotLine.Busy(
        building = TownBuildingKind.Farm,
        level = 2,
        remaining = 12.minutes,
        total = 20.minutes,
        finishesAt = readInstant,
    )

    private val waitingSchool: WaitingLine = WaitingLine(
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
                    place = null,
                    onPlaceOpen = {},
                    onNewsOpen = {},
                    state = home.value,
                    onIntent = { },
                    onSchoolOpen = { },
                    onMapOpen = {},
                )
            }
        }
        val shortOffer: PlaceCard = farmOffer.copy(
            block = shortOf(TownResourceKind.Money, 30),
        )
        val offers: TownUiState.Content = riverton.copy(places = listOf(farmOffer, storageOffer))
        val homes: List<TownUiState> = listOf(
            offers,
            offers.copy(slot = busySlot, waitingList = listOf(waitingSchool)),
            offers.copy(slot = SlotLine.Done(TownBuildingKind.Farm, 2)),
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
        val top: PlaceCard = farmOffer.copy(kind = TownBuildingKind.Homes, level = 10, next = null)
        val places: List<PlaceCard> = listOf(
            top,
            farmOffer.copy(kind = TownBuildingKind.School, level = 3),
            farmOffer.copy(kind = TownBuildingKind.Office, level = 0),
            farmOffer.copy(kind = TownBuildingKind.Factory, level = 0, isInWork = true),
            farmOffer.copy(kind = TownBuildingKind.Storage, level = 2, isInWork = true),
        )

        val opened: MutableState<TownBuildingKind?> = mutableStateOf(null)
        composeRule.setContent { MyGameTheme { Home(riverton.copy(places = places), opened.value) } }

        val lines: Map<TownBuildingKind, String> = mapOf(
            TownBuildingKind.Homes to "Nivel máximo",
            TownBuildingKind.School to "Nivel 3",
            TownBuildingKind.Office to "Sin construir",
            TownBuildingKind.Factory to "En construcción",
            TownBuildingKind.Storage to "Nivel 2 · En construcción",
        )
        lines.forEach { (place: TownBuildingKind, line: String) ->
            opened.value = place
            composeRule.waitForIdle()
            composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun `orders the stocks money, food, power, material`() {
        val town: TownSnapshot = townOf(stocks = stocksOf().reversed())

        show(town.readContent(), place = TownBuildingKind.Storage)

        val tops: List<Dp> = listOf("Dinero", "Comida", "Energía", "Material").map { name: String -> topOf(name) }
        assertEquals(tops.sorted(), tops)
        assertEquals(tops.size, tops.distinct().size)
    }

    @Test
    fun `sets a stock's name in title ink`() {
        var ink: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                ink = MyGameTheme.colors.ink
                Home(onStorage, place = TownBuildingKind.Storage)
            }
        }

        val name: TextStyle = textStyleOf("Comida")
        assertEquals(MyGameTypography.title.fontSize, name.fontSize)
        assertEquals(MyGameTypography.title.fontWeight, name.fontWeight)
        assertEquals(ink, name.color)
    }

    @Test
    fun `marks a place in work from the slot and from the waiting list`() {
        val town: TownSnapshot = townOf(
            slot = workOf(building = TownBuildingKind.Farm),
            waitingList = listOf(workOf(building = TownBuildingKind.Storage)),
        )

        val inWork: List<TownBuildingKind> = town
            .readContent()
            .places.filter { place: PlaceCard -> place.isInWork }
            .map { place: PlaceCard -> place.kind }

        assertEquals(listOf(TownBuildingKind.Farm, TownBuildingKind.Storage), inWork)
    }

    @Test
    fun `says a shortfall in words`() {
        val short: PlaceCard = farmOffer.copy(
            block = shortOf(TownResourceKind.Money, 30),
        )

        var warningInk: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                warningInk = MyGameTheme.colors.warningInk
                Home(riverton.copy(places = listOf(short)), place = TownBuildingKind.Farm)
            }
        }

        composeRule.onNodeWithText(MONEY_SHORT).performScrollTo().assertIsDisplayed()
        assertEquals(warningInk, textStyleOf(MONEY_SHORT).color)
    }

    @Test
    fun `keeps a cost's name for TalkBack`() {
        show(riverton, place = TownBuildingKind.Farm)

        composeRule.onNodeWithContentDescription("150 de dinero").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sets a running work's countdown in title with tabular figures`() {
        show(riverton.copy(slot = busySlot), place = TownBuildingKind.Farm)

        val countdown: TextStyle = textStyleOf("12 min")
        assertEquals(MyGameTypography.title.fontSize, countdown.fontSize)
        assertEquals(MyGameTypography.title.fontWeight, countdown.fontWeight)
        assertEquals("tnum", countdown.fontFeatureSettings)
    }

    @Test
    fun `sets a waiting work's countdown in title with tabular figures`() {
        val school: PlaceCard = farmOffer.copy(kind = TownBuildingKind.School, isInWork = true)
        show(
            riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool), places = listOf(farmOffer, school)),
            place = TownBuildingKind.School,
        )

        val countdown: TextStyle = textStyleOf("20 min")
        assertEquals(MyGameTypography.title.fontSize, countdown.fontSize)
        assertEquals(MyGameTypography.title.fontWeight, countdown.fontWeight)
        assertEquals("tnum", countdown.fontFeatureSettings)
    }

    @Test
    fun `draws the running work's heading as one section title`() {
        show(riverton.copy(slot = busySlot), place = TownBuildingKind.Farm)

        assertWorkHeadingIsOneSectionTitle()
    }

    @Test
    fun `draws the done work's heading as one section title`() {
        show(riverton.copy(slot = SlotLine.Done(TownBuildingKind.Farm, 2)), place = TownBuildingKind.Farm)

        assertWorkHeadingIsOneSectionTitle()
    }

    private fun assertWorkHeadingIsOneSectionTitle() {
        composeRule.onAllNodes(hasText(WORK_TITLE) and isHeading()).assertCountEquals(1)
        val title: TextStyle = textStyleOf(WORK_TITLE)
        assertEquals(MyGameTypography.heading.fontSize, title.fontSize)
        assertEquals(MyGameTypography.heading.fontWeight, title.fontWeight)
    }

    @Test
    fun `carries its icon on a done line`() {
        show(riverton.copy(slot = SlotLine.Done(TownBuildingKind.Farm, 2)), place = TownBuildingKind.Farm)

        composeRule.onNodeWithTag(WORK_DONE_ICON, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no done icon on a running work`() {
        show(riverton.copy(slot = busySlot), place = TownBuildingKind.Farm)

        composeRule.onAllNodesWithTag(WORK_DONE_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `counts the season in force down in days`() {
        val season = SeasonLine(
            SeasonKind.Fall,
            year = 2,
            remaining = 49.hours,
            productionMarks = emptyList(),
        )

        show(riverton.copy(season = season), place = null)

        composeRule.onNodeWithText("Otoño, año 2").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Otoño termina en 2 días").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the last day of a season down by the clock`() {
        val season = SeasonLine(
            SeasonKind.Spring,
            year = 1,
            remaining = 30.minutes,
            productionMarks = emptyList(),
        )

        show(riverton.copy(season = season), place = null)

        composeRule.onNodeWithText("Primavera termina en 30 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws a production mark under its stock`() {
        val season: SeasonLine = SeasonLine(
            SeasonKind.Summer,
            year = 2,
            remaining = 24.hours,
            productionMarks = listOf(
                ProductionMark(TownResourceKind.Food, percent = 125),
                ProductionMark(TownResourceKind.Power, percent = 75),
            ),
        )

        show(onStorage.copy(season = season), place = TownBuildingKind.Storage)

        assertTrue(topOf("Comida") < topOf(SUMMER_FOOD))
        assertTrue(topOf(SUMMER_FOOD) < topOf("Energía"))
        assertTrue(topOf("Energía") < topOf(SUMMER_POWER))
        assertTrue(topOf(SUMMER_POWER) < topOf("Material"))
    }

    @Test
    fun `draws no build mark while the overview answers none`() {
        show(riverton, place = TownBuildingKind.Farm)

        composeRule.onAllNodesWithText(SUMMER_BUILD).assertCountEquals(0)
    }

    @Test
    fun `sets a season mark in caption`() {
        show(farmInWork.copy(buildMark = DurationMark(SeasonKind.Summer, percent = 75)), place = TownBuildingKind.Farm)

        assertEquals(MyGameTypography.caption.fontSize, textStyleOf(SUMMER_BUILD).fontSize)
    }

    @Test
    fun `sets a season mark in ink-muted`() {
        var inkMuted: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inkMuted = MyGameTheme.colors.inkMuted
                Home(farmInWork.copy(buildMark = DurationMark(SeasonKind.Summer, percent = 75)), TownBuildingKind.Farm)
            }
        }

        assertEquals(inkMuted, textStyleOf(SUMMER_BUILD).color)
    }

    @Test
    fun `names each season on the build mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(farmInWork)
        composeRule.setContent { MyGameTheme { Home(home.value, TownBuildingKind.Farm) } }

        seasonWords.forEach { (season: SeasonKind, word: String) ->
            home.value = farmInWork.copy(buildMark = DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNodeWithText("$word: las obras tardan el 75 % del tiempo").assertExists()
        }
    }

    @Test
    fun `draws each season's icon beside the build mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(farmInWork)
        composeRule.setContent { MyGameTheme { Home(home.value, TownBuildingKind.Farm) } }

        seasonIcons.forEach { (season: SeasonKind, icon: ImageVector) ->
            home.value = farmInWork.copy(buildMark = DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNode(seasonMarkOf(icon, text = "las obras tardan el 75 % del tiempo")).assertExists()
        }
    }

    @Test
    fun `draws the season's icon beside a production mark`() {
        val season: SeasonLine = SeasonLine(
            SeasonKind.Winter,
            year = 2,
            remaining = 24.hours,
            productionMarks = listOf(ProductionMark(TownResourceKind.Power, percent = 75)),
        )

        show(onStorage.copy(season = season), place = TownBuildingKind.Storage)

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
            SeasonLine(SeasonKind.Winter, year = 3, remaining = 1.hours, productionMarks = emptyList()),
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

    private fun show(state: TownUiState, place: TownBuildingKind?) {
        composeRule.setContent { MyGameTheme { Home(state, place) } }
    }

    @Composable
    private fun Home(state: TownUiState, place: TownBuildingKind?) {
        TownScreen(
            place = place,
            onPlaceOpen = {},
            onNewsOpen = {},
            state = state,
            onIntent = { },
            onSchoolOpen = { },
            onMapOpen = {},
        )
    }

    private companion object {
        const val WORK_TITLE: String = "Obra"
        const val MONEY_SHORT: String = "Necesitas 30 de dinero más."
        const val SUMMER_FOOD: String = "Verano: comida al 125 %"
        const val SUMMER_POWER: String = "Verano: energía al 75 %"
        const val SUMMER_BUILD: String = "Verano: las obras tardan el 75 % del tiempo"
    }

    private fun TownSnapshot.readContent(): TownUiState.Content = contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = idleRequests,
        registered = TownRegistered.nothing,
        hiringEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )
}
