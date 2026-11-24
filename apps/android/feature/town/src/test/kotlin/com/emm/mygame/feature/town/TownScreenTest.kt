package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.designsystem.PLACE_ART
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownFoundRefusal
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.ui.navRowOf
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

@RunWith(RobolectricTestRunner::class)
class TownScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<TownIntent> = mutableListOf()

    private var schoolOpens: Int = 0

    private var mapOpens: Int = 0

    private val levelTwo: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
        level = 2,
        costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 150, isShort = false)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    private fun placeOf(kind: TownBuildingKind): TownUiState.PlaceCard = TownUiState.PlaceCard(
        kind = kind,
        level = 1,
        raisedFrom = null,
        isInWork = false,
        next = levelTwo,
        block = null,
    )

    private val street: List<TownUiState.PlaceCard> = streetOrder.map(::placeOf)

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
            TownUiState.StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
        },
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        words = TownUiState.WordsLine(stable = 3, retained = 1),
        season = null,
        buildMark = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = street,
        nextStepPlace = TownBuildingKind.School,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        hiring = idleHiring,
    )

    private val factoryGoal: TownGoal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Underway,
    )

    private val busyFarm: TownUiState.SlotLine.Busy = TownUiState.SlotLine.Busy(
        building = TownBuildingKind.Farm,
        level = 2,
        remaining = 12.minutes,
        total = 20.minutes,
        finishesAt = readInstant,
    )

    private val waitingSchool: TownUiState.WaitingLine = TownUiState.WaitingLine(
        building = TownBuildingKind.School,
        level = 2,
        remaining = 20.minutes,
        finishesAt = readInstant,
    )

    private val summer: TownUiState.SeasonLine = TownUiState.SeasonLine(
        kind = SeasonKind.Summer,
        year = 2,
        remaining = 3.days,
        productionMarks = emptyList(),
    )

    @Test
    fun `the town home opens on the goal's building`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = factoryGoal, text = null)))

        tab("Fábrica").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school when caught up with no goal`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school while a lesson runs toward a goal`() {
        show(homeOn(NextStep.LessonRunning(goal = factoryGoal, text = null)))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school on a step of learning`() {
        show(homeOn(NextStep.Reviews(count = 4, readFirst = emptyList())))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school on every other step of learning`() {
        val steps: List<NextStep> = listOf(
            NextStep.LessonToStudy(LessonId("lesson-1")),
            NextStep.ReleasedLesson(LessonId("lesson-2"), com.emm.mygame.core.model.placement.PlacementBand.First, 1),
            NextStep.HoldoutCheck(
                com.emm.mygame.core.model.placement.PlacementBand.First,
                com.emm.mygame.core.model.holdout.HoldoutCheckWeek.entries.first(),
            ),
        )

        assertEquals(
            steps.map { TownBuildingKind.School },
            steps.map { step: NextStep -> homeOn(step).nextStepPlace },
        )
    }

    @Test
    fun `a later read keeps the page the player is on`() {
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown)
        tab("Granja").performScrollTo().performClick()

        shown.value = riverton.copy(nextStepPlace = TownBuildingKind.Factory, words = riverton.words.copy(stable = 9))
        composeRule.waitForIdle()

        tab("Granja").assertIsSelected()
    }

    @Test
    fun `keeps the page the player is on through a recreation`() {
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        restoration.setContent { Screen(riverton) }
        tab("Granja").performScrollTo().performClick()

        restoration.emulateSavedInstanceStateRestore()

        tab("Granja").assertIsSelected()
    }

    @Test
    fun `each place is a tab named by its place and level`() {
        show(riverton.copy(places = street.leveled(TownBuildingKind.Farm, level = 4)))

        composeRule
            .onNode(isTab and hasContentDescription("Granja, Nivel 4"))
            .assertExists()
    }

    @Test
    fun `lays the places out in the street's order`() {
        show(riverton)

        val tabs: List<String> = composeRule
            .onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab))
            .fetchSemanticsNodes()
            .map { node -> node.config[SemanticsProperties.ContentDescription].single().substringBefore(",") }
        assertEquals(
            listOf("Hogares", "Granja", "Escuela", "Oficina", "Fábrica", "Central eléctrica", "Almacén"),
            tabs,
        )
    }

    @Test
    fun `adds the next step to its place's tab name`() {
        show(riverton)

        composeRule.onNode(hasContentDescription("Escuela, Nivel 1, tu siguiente paso")).assertExists()
    }

    @Test
    fun `adds the work to the tab name of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))

        composeRule.onNode(hasContentDescription("Granja, Nivel 1, en construcción")).assertExists()
    }

    @Test
    fun `names the street with its built count`() {
        show(riverton.copy(places = street.leveled(TownBuildingKind.Office, level = 0)))

        composeRule.onNode(hasContentDescription("Tu pueblo: 6 de 7 construidos")).assertExists()
    }

    @Test
    fun `opens a place's page from its tab`() {
        show(riverton)

        tab("Almacén").performScrollTo().performClick()

        tab("Almacén").assertIsSelected()
        composeRule.onNodeWithText("Edificio 7 de 7").assertIsDisplayed()
    }

    @Test
    fun `heads every page with the town's name and label in title`() {
        show(riverton)

        composeRule.onNodeWithText("Riverton · Pueblo").assert(isHeading()).assertIsDisplayed()
        tab("Hogares").performScrollTo().performClick()
        composeRule.onNodeWithText("Riverton · Pueblo").assertIsDisplayed()
    }

    @Test
    fun `tells the page's place on the street`() {
        show(riverton)

        composeRule.onNodeWithText("Edificio 3 de 7").assertIsDisplayed()
    }

    @Test
    fun `draws the ring on every page`() {
        show(riverton, ring = { BasicText(RING) })
        composeRule.onNodeWithText(RING).assertIsDisplayed()

        tab("Fábrica").performScrollTo().performClick()

        composeRule.onNodeWithText(RING).assertIsDisplayed()
    }

    @Test
    fun `draws the season line in the header of every page`() {
        show(riverton.copy(season = summer))
        composeRule.onNodeWithText("Verano, año 2").assertIsDisplayed()

        tab("Hogares").performScrollTo().performClick()

        composeRule.onNodeWithText("Verano, año 2").assertIsDisplayed()
    }

    @Test
    fun `draws the running lesson's time in the header of every page`() {
        show(riverton, status = { BasicText(RUNNING) })
        composeRule.onNodeWithText(RUNNING).assertIsDisplayed()

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText(RUNNING).assertIsDisplayed()
    }

    @Test
    fun `draws the build mark on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm))

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText(BUILD_MARK).assertExists()
    }

    @Test
    fun `draws no build mark on a page with no work`() {
        show(inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm))

        composeRule.onAllNodesWithText(BUILD_MARK).assertCountEquals(0)
    }

    @Test
    fun `offers the place's next level on its own page`() {
        show(riverton)
        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.Farm)), intents)
    }

    @Test
    fun `draws the build action outlined`() {
        show(riverton)

        composeRule.onAllNodesWithTag(OUTLINED_PILL).assertCountEquals(1)
    }

    @Test
    fun `draws the level's cost and people on its page`() {
        show(riverton)

        composeRule.onNodeWithText("Gente trabajando: +3").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("150 de dinero").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `says a shortfall of the build in words`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(block = shortOf(TownResourceKind.Food, 20))))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Necesitas 20 de comida más."))
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `keeps a blocked level tappable`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(block = TownUiState.BlockReason.PeopleShort(5, 2))))

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.School)), intents)
    }

    @Test
    fun `draws the words a level needs over a segmented track`() {
        val need: TownUiState.WordNeedLine =
            TownUiState.WordNeedLine(needed = 10, held = 4, standing = NeededWordKind.Stable)
        show(onSchool(placeOf(TownBuildingKind.School).copy(next = levelTwo.copy(wordsNeeded = need))))

        composeRule
            .onNodeWithText("Necesita 10 palabras fuera de aprendizaje: 4 de 10")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws no words line when the level needs none`() {
        show(riverton)

        composeRule.onAllNodesWithText("Necesita", substring = true).assertCountEquals(0)
    }

    @Test
    fun `a top-level place shows no words, no cost and no build`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(level = 10, next = null)))

        composeRule.onNodeWithText("Nivel máximo").assertIsDisplayed()
        composeRule.onAllNodesWithText("Necesita", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithContentDescription("de dinero", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("Construir", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws a start refusal on the page of its place`() {
        val refused: TownUiState.StartStatus =
            TownUiState.StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughPeople(5, 2))

        show(riverton.copy(start = refused))

        composeRule
            .onNodeWithText("Esta obra necesita 5 personas libres y tienes 2. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `brings a start refusal at the end of the page fully into view above the street`() {
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown, window = phoneWindow)
        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performClick()

        shown.value = riverton.copy(
            start = TownUiState.StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughResources),
        )
        composeRule.waitForIdle()

        val refusal: DpRect = composeRule.onNodeWithText(NOT_ENOUGH).getUnclippedBoundsInRoot()
        val streetTop: Dp = composeRule.onNode(hasContentDescription(STREET)).getUnclippedBoundsInRoot().top
        assertTrue("refusal ends at ${refusal.bottom}, street starts at $streetTop", refusal.bottom <= streetTop)
        assertTrue("refusal starts at ${refusal.top}", refusal.top >= 0.dp)
    }

    @Test
    fun `brings a refused stop at the end of the page fully into view above the street`() {
        val waiting: TownUiState = inWork(riverton.copy(waitingList = listOf(waitingSchool)), TownBuildingKind.School)
        val shown: MutableState<TownUiState> = mutableStateOf(waiting)
        showState(shown, window = phoneWindow)

        shown.value = (shown.value as TownUiState.Content).copy(
            stop = TownUiState.StopStatus.Unreachable(TownUiState.WorkTarget(TownBuildingKind.School, 2)),
        )
        composeRule.waitForIdle()

        val refusal: DpRect = composeRule.onNodeWithText(UNEXPECTED).getUnclippedBoundsInRoot()
        val streetTop: Dp = composeRule.onNode(hasContentDescription(STREET)).getUnclippedBoundsInRoot().top
        assertTrue("refusal ends at ${refusal.bottom}, street starts at $streetTop", refusal.bottom <= streetTop)
    }

    @Test
    fun `draws the slot on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))
        composeRule.onAllNodesWithContentDescription(STOP_FARM).assertCountEquals(0)

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the slot from the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))
        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.Farm, 2)), intents)
    }

    @Test
    fun `draws each waiting entry with its stop on its own place's page`() {
        val busy: TownUiState.Content = riverton.copy(slot = busyFarm, waitingList = listOf(waitingSchool))
        show(inWork(busy, TownBuildingKind.Farm, TownBuildingKind.School))

        composeRule.onNodeWithText("Lista de espera").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("Parar la obra: Escuela, nivel 2").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.School, 2)), intents)
    }

    @Test
    fun `shows each producer's stock on its own page`() {
        show(riverton)

        val producers: List<Pair<String, String>> =
            listOf("Granja" to "Comida", "Fábrica" to "Material", "Central eléctrica" to "Energía")
        val shown: List<String> = producers
            .filter { (place: String, stock: String) ->
                tab(place).performScrollTo().performClick()
                composeRule.onAllNodesWithText(stock).fetchSemanticsNodes().size == 1
            }
            .map { (place: String, _) -> place }
        assertEquals(listOf("Granja", "Fábrica", "Central eléctrica"), shown)
    }

    @Test
    fun `shows every stock with its capacity on storage's page`() {
        show(riverton)

        tab("Almacén").performScrollTo().performClick()

        listOf("Dinero", "Comida", "Energía", "Material").forEach { stock: String ->
            composeRule.onNodeWithText(stock).performScrollTo().assertIsDisplayed()
        }
        composeRule.onAllNodesWithText("de 900").assertCountEquals(TownResourceKind.entries.size)
    }

    @Test
    fun `shows the people on homes' page`() {
        show(riverton)

        tab("Hogares").performScrollTo().performClick()

        composeRule.onNodeWithText("Gente: 24 libres, 96 trabajando").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows no stock on the school's page`() {
        show(riverton)

        composeRule.onAllNodesWithText("de 900").assertCountEquals(0)
    }

    @Test
    fun `draws the goal's state on the goal building's page`() {
        show(riverton.copy(goal = factoryGoal, nextStepPlace = TownBuildingKind.Factory))

        composeRule.onNodeWithText("En construcción").performScrollTo().assertIsDisplayed()
        tab("Granja").performScrollTo().performClick()
        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(0)
    }

    @Test
    fun `closes the goal from the goal building's page`() {
        show(riverton.copy(goal = factoryGoal, nextStepPlace = TownBuildingKind.Factory))

        composeRule.onNodeWithText("Cerrar la meta").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoalClosed), intents)
    }

    @Test
    fun `draws the placement offer on the school's page`() {
        show(riverton, placement = { BasicText(PLACEMENT) })
        composeRule.onNodeWithText(PLACEMENT).performScrollTo().assertIsDisplayed()

        tab("Granja").performScrollTo().performClick()

        composeRule.onAllNodesWithText(PLACEMENT).assertCountEquals(0)
    }

    @Test
    fun `opens the school from the school page's nav row`() {
        show(riverton)

        composeRule.onNode(navRowOf("Ir a la escuela"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `draws the town's words on the school's page`() {
        show(riverton)

        composeRule.onNodeWithText("Palabras fuera de aprendizaje: 3").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the office on the office's page`() {
        show(riverton)
        composeRule.onAllNodesWithText(OFFICE_IDLE).assertCountEquals(0)

        tab("Oficina").performScrollTo().performClick()

        composeRule.onNodeWithText(OFFICE_IDLE).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `opens the map from the office page's nav row`() {
        show(riverton)
        tab("Oficina").performScrollTo().performClick()

        composeRule.onNode(navRowOf("Ir al mapa"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, mapOpens)
    }

    @Test
    fun `draws each tip on the page of the place it talks about`() {
        val pages: Map<TipKind, String> = mapOf(
            TipKind.Seasons to "Almacén",
            TipKind.FullStore to "Almacén",
            TipKind.People to "Hogares",
            TipKind.Office to "Oficina",
            TipKind.Jobs to "Oficina",
        )
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown)

        val found: Map<TipKind, String> = pages.mapValues { (tip: TipKind, page: String) ->
            shown.value = riverton.copy(tip = tip)
            tab(page).performScrollTo().performClick()
            composeRule.onAllNodesWithText("Cerrar el consejo").fetchSemanticsNodes().size.let { count: Int ->
                if (count == 1) page else "none"
            }
        }
        assertEquals(pages, found)
    }

    @Test
    fun `draws the waiting list tip on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm, tip = TipKind.WaitingList), TownBuildingKind.Farm))
        composeRule.onAllNodesWithText("Cerrar el consejo").assertCountEquals(0)

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `closes the tip it shows`() {
        show(riverton.copy(tip = TipKind.People, nextStepPlace = TownBuildingKind.Homes))

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.TipClosed(TipKind.People)), intents)
    }

    @Test
    fun `offers no sign-out on the town home`() {
        show(riverton)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    @Test
    fun `keeps the smaller top padding to the town home`() {
        show(riverton)

        assertTrue(composeRule.onNodeWithText("Riverton · Pueblo").getUnclippedBoundsInRoot().top < MyGameSpacing.step8)
    }

    @Test
    fun `draws the skeleton's blocks while a slow read loads`() {
        showSlowRead()

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(5)
    }

    @Test
    fun `never draws the reading line`() {
        showSlowRead()

        composeRule.onAllNodesWithText(READING_LINE).assertCountEquals(0)
    }

    @Test
    fun `speaks the reading line in a polite live region`() {
        showSlowRead()

        composeRule.onNodeWithContentDescription(READING_LINE)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `asks for a retry on a failed read`() {
        show(TownUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.RetryTapped), intents)
    }

    @Test
    fun `asks for the town's name`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Ponle nombre a tu pueblo").assertIsDisplayed()
    }

    @Test
    fun `sends what the player writes`() {
        show(emptyNaming())

        composeRule.onNodeWithContentDescription("Nombre del pueblo").performTextInput("Riverton")

        assertEquals(listOf<TownIntent>(TownIntent.NameChanged("Riverton")), intents)
    }

    @Test
    fun `submits the name`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Empezar").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.NameSubmitted), intents)
    }

    @Test
    fun `draws a blank name refusal`() {
        show(TownUiState.Naming("", TownUiState.NamingStatus.Refused(TownFoundRefusal.BlankTownName)))

        composeRule.onNodeWithText("Escribe un nombre para tu pueblo.").assertIsDisplayed()
    }

    @Test
    fun `offers the town a player already holds`() {
        show(TownUiState.Naming("R", TownUiState.NamingStatus.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown)))

        composeRule.onNodeWithText("Ir a tu pueblo").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoToTownTapped), intents)
    }

    @Test
    fun `draws a failed founding beside its button`() {
        show(TownUiState.Naming("R", TownUiState.NamingStatus.Unreachable))

        composeRule.onNodeWithText(UNEXPECTED).assertIsDisplayed()
    }

    @Test
    fun `sets the skeleton under the larger top padding`() {
        showSlowRead()

        val top: Dp = composeRule.onNodeWithContentDescription(READING_LINE).getUnclippedBoundsInRoot().top
        assertEquals(MyGameSpacing.step8.value, top.value, PIXEL_TOLERANCE)
    }

    @Test
    fun `sets a failed read under the larger top padding`() {
        show(TownUiState.Failed)

        val bannerInset: Dp = MyGameSpacing.step3
        assertEquals(
            (MyGameSpacing.step8 + bannerInset).value,
            topOf(UNEXPECTED).value,
            PIXEL_TOLERANCE,
        )
    }

    @Test
    fun `sets the naming form under the larger top padding`() {
        show(emptyNaming())

        val cardInset: Dp = MyGameSpacing.step1 + MyGameSpacing.step4
        assertEquals(
            (MyGameSpacing.step8 + cardInset).value,
            composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(PLACE_ART)).onFirst()
                .getUnclippedBoundsInRoot().top.value,
            PIXEL_TOLERANCE,
        )
    }

    @Test
    fun `sets signing out under the larger top padding`() {
        show(TownUiState.SigningOut(isLeavingNaming = false))

        assertEquals(MyGameSpacing.step8.value, topOf("Salir").value, PIXEL_TOLERANCE)
    }

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text).onFirst().getUnclippedBoundsInRoot().top

    private fun tab(place: String): SemanticsNodeInteraction = composeRule.onNode(
        isTab and hasContentDescription(place, substring = true),
    )

    private fun homeOn(step: NextStep): TownUiState.Content = townOf(nextStep = step).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = TownRequests.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    private fun inWork(content: TownUiState.Content, vararg kinds: TownBuildingKind): TownUiState.Content =
        content.copy(
            places = content.places.map { place: TownUiState.PlaceCard ->
                if (place.kind in kinds) place.copy(isInWork = true) else place
            },
        )

    private fun onSchool(school: TownUiState.PlaceCard): TownUiState.Content = riverton.copy(
        places = street.map { place: TownUiState.PlaceCard -> if (place.kind == school.kind) school else place },
    )

    private val summerBuild: TownUiState.DurationMark = TownUiState.DurationMark(SeasonKind.Summer, percent = 75)

    private val phoneWindow: DpSize = DpSize(360.dp, 640.dp)

    private fun showSlowRead() {
        show(TownUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
    }

    private fun show(
        state: TownUiState,
        ring: @Composable () -> Unit = {},
        status: @Composable () -> Unit = {},
        placement: @Composable () -> Unit = {},
    ) {
        composeRule.setContent { Screen(state = state, ring = ring, status = status, placement = placement) }
    }

    private fun showState(shown: MutableState<TownUiState>, window: DpSize? = null) {
        composeRule.setContent {
            Box(modifier = if (window == null) Modifier else Modifier.size(window)) {
                Screen(state = shown.value)
            }
        }
    }

    @Composable
    private fun Screen(
        state: TownUiState,
        ring: @Composable () -> Unit = {},
        status: @Composable () -> Unit = {},
        placement: @Composable () -> Unit = {},
    ) {
        MyGameTheme {
            TownScreen(
                state = state,
                onIntent = { intent: TownIntent -> intents += intent },
                onSchoolOpen = { schoolOpens += 1 },
                onMapOpen = { mapOpens += 1 },
                onTextOpen = {},
                ring = ring,
                status = status,
                placement = placement,
            )
        }
    }

    private companion object {
        const val PIXEL_TOLERANCE: Float = 0.5f
        const val READING_LINE: String = "Estamos leyendo tu pueblo…"
        const val REVEAL_MARGIN_MILLIS: Long = 50
        const val UNEXPECTED: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOT_ENOUGH: String =
            "No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas."
        const val STREET: String = "Tu pueblo: 7 de 7 construidos"
        const val OFFICE_IDLE: String = "Ahora no hay ninguna contratación."
        const val BUILD_MARK: String = "Verano: las obras tardan el 75 % del tiempo"
        const val STOP_FARM: String = "Parar la obra: Granja, nivel 2"
        const val RING: String = "Ring"
        const val RUNNING: String = "Running lesson"
        const val PLACEMENT: String = "Placement offer"
    }
}
