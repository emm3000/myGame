package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteractionCollection
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.designsystem.PLACE_ART
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundRefusal
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val intents: MutableList<TownIntent> = mutableListOf()

    private var schoolOpens: Int = 0

    private var reportOpens: Int = 0

    private var mapOpens: Int = 0

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
        goal = null,
        tip = null,
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

    private val slotTarget: TownUiState.WorkTarget = TownUiState.WorkTarget(TownBuildingKind.Farm, 2)

    private val waitingTarget: TownUiState.WorkTarget = TownUiState.WorkTarget(TownBuildingKind.School, 3)

    private val localFinish: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 6, 9, 30).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

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
    fun `labels a town with the word town`() {
        show(riverton)

        composeRule.onNodeWithText("RIVERTON · PUEBLO").assertIsDisplayed()
    }

    @Test
    fun `titles the places of a town`() {
        show(riverton)

        composeRule.onNodeWithText("Tu pueblo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `labels a city with the word city`() {
        show(riverton.copy(label = TownLabel.City))

        composeRule.onNodeWithText("RIVERTON · CIUDAD").assertIsDisplayed()
    }

    @Test
    fun `titles the places of a city`() {
        show(riverton.copy(label = TownLabel.City))

        composeRule.onNodeWithText("Tu ciudad").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws a stock with its capacity and rate`() {
        show(riverton)

        listOf("Dinero", "120", "de 900", "+30 / h").forEach { line: String ->
            composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun `shows the earned skill beside its resource`() {
        val skilledMoney: TownUiState.StockLine =
            TownUiState.StockLine(TownResourceKind.Money, 120, capacity = 900, ratePerHour = 30, skillLevel = 2)
        show(riverton.copy(stocks = listOf(skilledMoney)))

        composeRule.onNodeWithText("Habilidad de dinero, nivel 2").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows no skill beside a resource with none earned`() {
        show(riverton)

        composeRule.onAllNodesWithText("Habilidad", substring = true).assertCountEquals(0)
    }

    @Test
    fun `tells a full store in words`() {
        val full: TownUiState.StockLine = TownUiState.StockLine(TownResourceKind.Money, 900, 900, 30, skillLevel = 0)

        show(riverton.copy(stocks = listOf(full)))

        composeRule.onNodeWithText("Lleno: 900").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `keeps a stock's capacity in tabular figures`() {
        show(riverton)

        assertEquals("tnum", fontFeaturesOf(text = "de 900"))
    }

    @Test
    fun `keeps a stock's rate in tabular figures`() {
        show(riverton)

        assertEquals("tnum", fontFeaturesOf(text = "+30 / h"))
    }

    @Test
    fun `keeps a full store's capacity in tabular figures`() {
        val full: TownUiState.StockLine = TownUiState.StockLine(TownResourceKind.Money, 900, 900, 30, skillLevel = 0)

        show(riverton.copy(stocks = listOf(full)))

        assertEquals("tnum", fontFeaturesOf(text = "Lleno: 900"))
    }

    @Test
    fun `counts the free and the working people`() {
        show(riverton)

        composeRule.onNodeWithText("Gente: 24 libres, 96 trabajando").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `uses the singular for one free person`() {
        show(riverton.copy(people = TownUiState.PeopleLine(free = 1, atWork = 0)))

        composeRule.onNodeWithText("Gente: 1 libre, 0 trabajando").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `offers a level with its duration on the button`() {
        show(riverton)

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.Farm)), intents)
    }

    @Test
    fun `draws the cost and the people of a level`() {
        show(riverton)

        composeRule.onNodeWithText("Gente trabajando: +3").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("150 de dinero").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `tells a short cost in words`() {
        val shortCost: TownUiState.PlaceCard = farmOffer.copy(
            next = farmOffer.next?.copy(
                costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 60, isShort = true)),
            ),
        )

        show(riverton.copy(places = listOf(shortCost)))

        composeRule.onNodeWithContentDescription("60 de dinero, falta").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names one shortfall`() {
        show(blocked(shortOf(TownResourceKind.Food, 20)))

        assertBlockedBy("Necesitas 20 de comida más.")
    }

    @Test
    fun `joins several shortfalls`() {
        show(
            blocked(
                TownUiState.BlockReason.Resources(
                    listOf(
                        TownUiState.Shortfall(TownResourceKind.Money, 5),
                        TownUiState.Shortfall(TownResourceKind.Food, 6),
                        TownUiState.Shortfall(TownResourceKind.Power, 7),
                    ),
                    ready = null,
                ),
            ),
        )

        assertBlockedBy("Necesitas 5 de dinero, 6 de comida y 7 de energía más.")
    }

    @Test
    fun `names too few free people`() {
        show(blocked(TownUiState.BlockReason.PeopleShort(needed = 5, free = 2)))

        assertBlockedBy("Gente necesaria: 5. Libres: 2.")
    }

    @Test
    fun `tells the waiting list is full`() {
        show(blocked(TownUiState.BlockReason.WaitingListFull(cap = 2)))

        assertBlockedBy("La lista de espera ya tiene 2 obras. Espera a que termine alguna.")
    }

    @Test
    fun `uses the singular for one free person among the people needed`() {
        show(blocked(TownUiState.BlockReason.PeopleShort(needed = 5, free = 1)))

        assertBlockedBy("Gente necesaria: 5. Libre: 1.")
    }

    @Test
    fun `uses the singular for a waiting list of one`() {
        show(blocked(TownUiState.BlockReason.WaitingListFull(cap = 1)))

        assertBlockedBy("La lista de espera ya tiene 1 obra. Espera a que termine alguna.")
    }

    @Test
    fun `uses the singular for a work that needs one person`() {
        val refused: TownUiState.StartStatus =
            TownUiState.StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.NotEnoughPeople(1, 0))

        show(riverton.copy(start = refused))

        composeRule
            .onNodeWithText("Esta obra necesita 1 persona libre y tienes 0. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `keeps a blocked level tappable`() {
        show(blocked(TownUiState.BlockReason.PeopleShort(needed = 5, free = 2)))

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.Farm)), intents)
    }

    @Test
    fun `draws a place at its top level`() {
        show(riverton.copy(places = listOf(farmOffer.copy(level = 10, next = null))))

        composeRule.onNodeWithText("Nivel máximo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws a start refusal with its message`() {
        val refused: TownUiState.StartStatus =
            TownUiState.StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.NotEnoughPeople(5, 2))

        show(riverton.copy(start = refused))

        composeRule
            .onNodeWithText("Esta obra necesita 5 personas libres y tienes 2. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws a failed start beside its place`() {
        show(riverton.copy(start = TownUiState.StartStatus.Unreachable(TownBuildingKind.Farm)))

        composeRule.onNodeWithText(UNEXPECTED).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `invites work into an idle slot`() {
        show(riverton)

        composeRule.onNodeWithText("Ahora no hay ninguna obra.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts a busy slot down in minutes`() {
        show(riverton.copy(slot = busySlot))

        composeRule.onNodeWithText("12 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the last minute in seconds`() {
        show(riverton.copy(slot = busySlot.copy(remaining = 45.seconds)))

        composeRule.onNodeWithText("0:45").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names the hours of a long work`() {
        show(riverton.copy(slot = busySlot.copy(remaining = 45.minutes + 1.hours, total = 2.hours)))

        composeRule.onNodeWithText("1 h 45 min", substring = true).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the slot by its place and level`() {
        show(riverton.copy(slot = busySlot))

        composeRule.onNodeWithContentDescription("Parar la obra: Granja, nivel 2").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.Farm, 2)), intents)
    }

    @Test
    fun `tells the refund beside a stop`() {
        show(riverton.copy(slot = busySlot))

        composeRule.onNodeWithText(REFUND).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `tells a finished work until the next read`() {
        show(riverton.copy(slot = TownUiState.SlotLine.Done(TownBuildingKind.Farm, 2)))

        composeRule
            .onNodeWithText("La obra está lista. Estamos leyendo tu pueblo otra vez…")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws waiting work with its stop`() {
        show(riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool)))

        composeRule.onNodeWithContentDescription("Parar la obra: Escuela, nivel 3").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.School, 3)), intents)
    }

    @Test
    fun `titles the waiting list with its last finish`() {
        show(riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool)))

        composeRule.onNodeWithText("Lista de espera · 20 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws a refused stop with its message`() {
        val target: TownUiState.WorkTarget = TownUiState.WorkTarget(TownBuildingKind.Farm, 2)
        val refused: TownUiState.StopStatus =
            TownUiState.StopStatus.Refused(target, TownWorkRefusal.BuildingWorkNotFound(level = 2))

        show(riverton.copy(slot = busySlot, stop = refused))

        composeRule
            .onNodeWithText("La obra del nivel 2 ya no está en la lista. Quizá ya terminó.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws a start refusal under its own place alone`() {
        show(twoPlaces(TownUiState.StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.NotEnoughResources)))

        assertDrawnOnceAbove(NOT_ENOUGH, "Escuela")
    }

    @Test
    fun `draws a start refusal under the later place it belongs to`() {
        show(twoPlaces(TownUiState.StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughResources)))

        assertDrawnOnceBelow(NOT_ENOUGH, "Escuela")
    }

    @Test
    fun `draws a failed start under its own place alone`() {
        show(twoPlaces(TownUiState.StartStatus.Unreachable(TownBuildingKind.Farm)))

        assertDrawnOnceAbove(UNEXPECTED, "Escuela")
    }

    @Test
    fun `draws a stop refusal beside its own work alone`() {
        show(twoWorks(TownUiState.StopStatus.Refused(slotTarget, TownWorkRefusal.BuildingWorkNotFound(level = 2))))

        assertDrawnOnceAbove(WORK_GONE, "Escuela")
    }

    @Test
    fun `draws a stop refusal beside the waiting work it belongs to`() {
        show(twoWorks(TownUiState.StopStatus.Refused(waitingTarget, TownWorkRefusal.BuildingWorkNotFound(level = 2))))

        assertDrawnOnceBelow(WORK_GONE, "Escuela")
    }

    @Test
    fun `draws a failed stop beside its own work alone`() {
        show(twoWorks(TownUiState.StopStatus.Unreachable(slotTarget)))

        assertDrawnOnceAbove(UNEXPECTED, "Escuela")
    }

    @Test
    fun `gives no clock to work with exactly one hour left`() {
        show(riverton.copy(slot = busySlot.copy(remaining = 1.hours)))

        composeRule.onNodeWithText("1 h").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names tomorrow in the finish of a long work`() {
        show(riverton.copy(slot = busySlot.copy(remaining = 12.hours, finishesAt = localFinish)))

        composeRule.onNodeWithText("12 h · mañana 09:30").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names the day in the finish of a longer work`() {
        show(riverton.copy(slot = busySlot.copy(remaining = 72.hours, finishesAt = localFinish)))

        composeRule.onNodeWithText("72 h · 6 nov 09:30").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the art of a built place beside its name`() {
        show(riverton)

        assertTrue(placeNameLeft() >= MyGameSizes.thumbnail / 2)
    }

    @Test
    fun `draws a place at level 0 with its silhouette`() {
        show(riverton.copy(places = listOf(farmOffer.copy(level = 0))))

        assertTrue(placeNameLeft() >= MyGameSizes.thumbnail / 2)
    }

    private fun placeNameLeft(): Dp =
        composeRule.onAllNodesWithText("Granja").onLast().performScrollTo().getUnclippedBoundsInRoot().left

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text).onLast().getUnclippedBoundsInRoot().top

    private fun assertDrawnOnceAbove(line: String, later: String) {
        composeRule.onAllNodesWithText(line).assertCountEquals(1)
        assertTrue(topOf(line) < topOf(later))
    }

    private fun assertDrawnOnceBelow(line: String, earlier: String) {
        composeRule.onAllNodesWithText(line).assertCountEquals(1)
        assertTrue(topOf(line) > topOf(earlier))
    }

    private fun twoPlaces(start: TownUiState.StartStatus): TownUiState.Content =
        riverton.copy(places = listOf(farmOffer, farmOffer.copy(kind = TownBuildingKind.School)), start = start)

    private fun twoWorks(stop: TownUiState.StopStatus): TownUiState.Content =
        riverton.copy(slot = busySlot, waitingList = listOf(waitingSchool), stop = stop)

    private fun assertBlockedBy(reason: String) {
        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, reason))
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `opens the school from the school's card`() {
        show(riverton.copy(places = listOf(farmOffer.copy(kind = TownBuildingKind.School))))

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `offers the school only on the school's card`() {
        show(riverton)

        composeRule.onAllNodesWithText("Ir a la escuela").assertCountEquals(0)
    }

    private fun fontFeaturesOf(text: String): String? {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        val node: SemanticsNode = composeRule.onNodeWithText(text).fetchSemanticsNode()
        node.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().layoutInput.style.fontFeatureSettings
    }

    private fun emptyNaming(): TownUiState.Naming = TownUiState.Naming("", TownUiState.NamingStatus.Idle)

    private fun blocked(reason: TownUiState.BlockReason): TownUiState.Content =
        riverton.copy(places = listOf(farmOffer.copy(block = reason)))

    @Test
    fun `opens the school and the Report from the two doors`() {
        show(riverton.copy(places = emptyList()))

        composeRule.onNodeWithText("Escuela").performClick()
        composeRule.onNodeWithText("Informe").performClick()

        assertEquals(1 to 1, schoolOpens to reportOpens)
    }

    @Test
    fun `opens the map from its row on the town home`() {
        show(riverton)

        composeRule.onNodeWithText("Ir al mapa").performScrollTo().performClick()

        assertEquals(1, mapOpens)
    }

    @Test
    fun `sets the doors under the header and above the stocks`() {
        show(riverton)

        val doorTop: Dp = composeRule.onNodeWithText("Escuela").getUnclippedBoundsInRoot().top

        assertTrue(composeRule.onNodeWithText("RIVERTON · PUEBLO").getUnclippedBoundsInRoot().top < doorTop)
        assertTrue(doorTop < composeRule.onNodeWithText("de 900").getUnclippedBoundsInRoot().top)
    }

    @Test
    fun `shows a player with no town no doors`() {
        show(TownUiState.Naming("", TownUiState.NamingStatus.Idle))

        doors().assertCountEquals(0)
    }

    @Test
    fun `shows a town that failed to read no doors`() {
        show(TownUiState.Failed)

        doors().assertCountEquals(0)
    }

    @Test
    fun `heads the home with the town's name and label in meta`() {
        show(riverton)

        composeRule
            .onNodeWithText("RIVERTON · PUEBLO")
            .assert(hasContentDescription("Riverton · Pueblo"))
            .assert(isHeading())
    }

    @Test
    fun `offers sign-out under the naming form`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.SignOutTapped), intents)
    }

    @Test
    fun `offers sign-out under a failed read`() {
        show(TownUiState.Failed)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.SignOutTapped), intents)
    }

    @Test
    fun `offers no sign-out while loading`() {
        show(TownUiState.Loading)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    @Test
    fun `offers no sign-out on the town home`() {
        show(riverton)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    @Test
    fun `announces the sign-out as waiting while the session ends`() {
        show(TownUiState.SigningOut)

        composeRule
            .onNodeWithText("Salir")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Esperando"))
    }

    @Test
    fun `sends nothing from the sign-out while the session ends`() {
        show(TownUiState.SigningOut)

        composeRule.onNodeWithText("Salir").performClick()

        assertEquals(emptyList<TownIntent>(), intents)
    }

    @Test
    fun `holds the sign-out at the touch minimum in height`() {
        show(TownUiState.Failed)

        val target: DpRect = composeRule.onNodeWithText("Salir").getUnclippedBoundsInRoot()

        assertTrue(target.bottom - target.top >= MyGameSizes.control)
    }

    @Test
    fun `holds the sign-out at the touch minimum in width`() {
        show(TownUiState.Failed)

        val target: DpRect = composeRule.onNodeWithText("Salir").getUnclippedBoundsInRoot()

        assertTrue(target.right - target.left >= MyGameSizes.control)
    }

    @Test
    fun `keeps the smaller top padding to the town home`() {
        show(riverton)

        assertTrue(topOf("RIVERTON · PUEBLO") < MyGameSpacing.step8)
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
        show(TownUiState.SigningOut)

        assertEquals(MyGameSpacing.step8.value, topOf("Salir").value, PIXEL_TOLERANCE)
    }

    private fun doors(): SemanticsNodeInteractionCollection = composeRule.onAllNodesWithTag(OUTLINED_PILL)

    private fun showSlowRead() {
        show(TownUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
    }

    private fun show(state: TownUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    onIntent = { intent: TownIntent -> intents += intent },
                    onSchoolOpen = { schoolOpens += 1 },
                    onReportOpen = { reportOpens += 1 },
                    onMapOpen = { mapOpens += 1 },
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
    }

    private companion object {
        const val PIXEL_TOLERANCE: Float = 0.5f
        const val READING_LINE: String = "Estamos leyendo tu pueblo…"
        const val REVEAL_MARGIN_MILLIS: Long = 50
        const val UNEXPECTED: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOT_ENOUGH: String =
            "No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas."
        const val WORK_GONE: String = "La obra del nivel 2 ya no está en la lista. Quizá ya terminó."
        const val REFUND: String =
            "Si la paras, recuperas todo lo que costó, y lo mismo por cada obra en espera que dependa de ella."
    }
}
