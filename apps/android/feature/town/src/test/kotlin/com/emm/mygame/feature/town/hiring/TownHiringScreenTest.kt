package com.emm.mygame.feature.town.hiring

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.feature.town.ReadyTime
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreen
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.bareOffice
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.Shortfall
import com.emm.mygame.feature.town.building.StartStatus
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.building.work.SlotLine
import com.emm.mygame.feature.town.building.work.StopStatus
import com.emm.mygame.feature.town.readInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TownHiringScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<TownIntent> = mutableListOf()

    private val threeWorkers: HiringOffer = HiringOffer(
        count = 3,
        costs = listOf(CostLine(TownResourceKind.Money, 120, isShort = false)),
        people = 3,
        isPeopleShort = false,
        duration = 3.minutes,
    )

    private val workerForm: HiringForm =
        HiringForm(entry = "3", isEntryDisabled = false, offer = threeWorkers, block = null)

    private val workers: HiringCard =
        HiringCard(TownHireKind.Worker, team = 4, requiredOfficeLevel = 1, form = workerForm)

    private val lockedTrucks: HiringCard =
        HiringCard(TownHireKind.Truck, team = 0, requiredOfficeLevel = 3, form = null)

    private val workerTarget: HiringTarget = HiringTarget(TownHireKind.Worker, readInstant)

    private val busyHiring: HiringOrderLine.Busy = HiringOrderLine.Busy(
        target = workerTarget,
        count = 3,
        delivered = 1,
        remaining = 2.minutes,
        total = 3.minutes,
        finishesAt = readInstant,
    )

    private val hiring: HiringLine = HiringLine(
        order = HiringOrderLine.Idle,
        hires = listOf(workers, lockedTrucks),
        hireMark = null,
        place = HiringPlaceStatus.Idle,
        stop = HiringStopStatus.Idle,
    )

    private val shortOfMoney: HiringBlock =
        HiringBlock.Resources(listOf(Shortfall(TownResourceKind.Money, 20)), ready = null)

    private val shortOfMoneyLine: String = "Necesitas 20 de dinero más."

    @Test
    fun `offers hires with their count and duration on the button`() {
        show(hiring)

        composeRule.onNodeWithText("Contratar 3 trabajadores · 3:00").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.PlaceHiringTapped(TownHireKind.Worker)), intents)
    }

    @Test
    fun `draws the cost and the people of the hires`() {
        show(hiring)

        composeRule.onNodeWithContentDescription("120 de dinero").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("3 personas").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sends the count the player writes`() {
        show(hiring)

        composeRule.onNodeWithText("3").performScrollTo().performTextReplacement("5")

        assertEquals(listOf<TownIntent>(TownIntent.HiringEntryChanged(TownHireKind.Worker, "5")), intents)
    }

    @Test
    fun `names the office level a locked kind needs`() {
        show(hiring)

        composeRule.onNodeWithText("Necesita la oficina en nivel 3").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `offers no hire of a locked kind`() {
        show(hiring)

        composeRule.onNodeWithText("Camiones a contratar").assertDoesNotExist()
    }

    @Test
    fun `counts the hires the town holds`() {
        show(hiring)

        composeRule.onNodeWithText("Tu equipo: 4 trabajadores").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names too few free people for the hires`() {
        show(blocked(HiringBlock.PeopleShort(needed = 3, free = 2)))

        assertBlockedBy("Gente necesaria: 3. Libres: 2.")
    }

    @Test
    fun `names the shortfall of the hires`() {
        show(blocked(shortOfMoney))

        assertBlockedBy("Necesitas 20 de dinero más.")
    }

    @Test
    fun `names the minute the resources for the hires arrive`() {
        show(blocked(shortOfMoneyUntil(ReadyTime(remaining = 24.minutes, readyAt = readInstant))))

        composeRule.onNodeWithText("Lista en 24 min", substring = true, useUnmergedTree = true)
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `drops the ready minute once the api refused the hire`() {
        val refused: HiringPlaceStatus =
            HiringPlaceStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources)
        val ready: ReadyTime = ReadyTime(remaining = 24.minutes, readyAt = readInstant)

        show(blocked(shortOfMoneyUntil(ready)).copy(place = refused))

        composeRule.onNodeWithText("Lista en 24 min", substring = true, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `invites a hiring when none runs`() {
        show(hiring)

        composeRule.onNodeWithText("Ahora no hay ninguna contratación.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the delivered hires of the open order`() {
        show(hiring.copy(order = busyHiring))

        composeRule.onNodeWithText("1 de 3 contratados").performScrollTo().assertIsDisplayed()
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `breaks the hiring's name only between words on a phone at the largest font`() {
        show(hiring.copy(order = busyHiring))

        assertEquals(emptyList<String>(), wordFragmentsOf("Trabajadores"))
    }

    @Test
    fun `counts the open order down`() {
        show(hiring.copy(order = busyHiring))

        composeRule.onNodeWithText("2 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the open order`() {
        show(hiring.copy(order = busyHiring))

        composeRule
            .onNodeWithContentDescription("Parar la contratación de trabajadores")
            .performScrollTo()
            .performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopHiringTapped(workerTarget)), intents)
    }

    @Test
    fun `tells an order that reached its end`() {
        show(hiring.copy(order = HiringOrderLine.Done(TownHireKind.Worker, count = 3, delivered = 3)))

        composeRule
            .onNodeWithText("La contratación terminó. Estamos leyendo tu pueblo otra vez…")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws a hiring refusal with its message`() {
        val refused: HiringPlaceStatus =
            HiringPlaceStatus.Refused(TownHireKind.Worker, TownHiringRefusal.OfficeTooLow(1, 3))

        show(hiring.copy(place = refused))

        composeRule
            .onNodeWithText("Tu oficina está en nivel 1 y esta contratación necesita el nivel 3.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `disables the count field while an order is open`() {
        show(hiring.copy(hires = listOf(workers.copy(form = workerForm.copy(isEntryDisabled = true)), lockedTrucks)))

        composeRule.onNodeWithContentDescription("Trabajadores a contratar").performScrollTo().assertIsNotEnabled()
    }

    @Test
    fun `names the hire in a refusal for too few free people`() {
        val tooFew: TownHiringRefusal = TownHiringRefusal.NotEnoughPeople(required = 3, free = 2)
        val refused: HiringPlaceStatus = HiringPlaceStatus.Refused(TownHireKind.Worker, tooFew)

        show(hiring.copy(place = refused))

        composeRule
            .onNodeWithText("Esta contratación necesita 3 personas libres y tienes 2. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `names the hire in a refusal for resources the town lacks`() {
        val refused: HiringPlaceStatus =
            HiringPlaceStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources)

        show(hiring.copy(place = refused))

        composeRule
            .onNodeWithText("No tienes recursos suficientes para esta contratación. Espera a que crezcan tus reservas.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `writes the block reason under the hire button`() {
        show(blocked(shortOfMoney))

        composeRule.onNodeWithText(shortOfMoneyLine, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `drops the block reason once the api refused the hire`() {
        val refused: HiringPlaceStatus =
            HiringPlaceStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources)

        show(blocked(shortOfMoney).copy(place = refused))

        composeRule.onNodeWithText(shortOfMoneyLine, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `drops the block reason once the server could not be reached`() {
        show(blocked(shortOfMoney).copy(place = HiringPlaceStatus.Unreachable(TownHireKind.Worker)))

        composeRule.onNodeWithText(shortOfMoneyLine, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `draws a stop refusal with its message`() {
        show(
            hiring.copy(
                order = busyHiring,
                stop = HiringStopStatus.Refused(TownHiringRefusal.HiringOrderNotFound),
            ),
        )

        composeRule.onNodeWithText("Esta contratación ya terminó.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `brings a hire refusal at the end of the page fully into view above the street`() {
        val shown: MutableState<HiringLine> = mutableStateOf(hiring)
        showOnAPhone(shown)

        shown.value = hiring.copy(
            place = HiringPlaceStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources),
        )
        composeRule.waitForIdle()

        assertAboveTheStreet(HIRE_SHORT)
    }

    @Test
    fun `brings a refused hiring stop at the end of the page fully into view above the street`() {
        val busy: HiringLine = hiring.copy(order = busyHiring)
        val shown: MutableState<HiringLine> = mutableStateOf(busy)
        showOnAPhone(shown)

        shown.value = busy.copy(stop = HiringStopStatus.Refused(TownHiringRefusal.HiringOrderNotFound))
        composeRule.waitForIdle()

        assertAboveTheStreet(HIRING_OVER)
    }

    private fun shortOfMoneyUntil(ready: ReadyTime): HiringBlock =
        HiringBlock.Resources(listOf(Shortfall(TownResourceKind.Money, 20)), ready = ready)

    private fun blocked(block: HiringBlock): HiringLine =
        hiring.copy(hires = listOf(workers.copy(form = workerForm.copy(block = block)), lockedTrucks))

    private fun assertBlockedBy(reason: String) {
        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, reason))
            .performScrollTo()
            .assertIsDisplayed()
    }

    private fun showOnAPhone(shown: MutableState<HiringLine>) {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.size(DpSize(360.dp, 640.dp))) {
                    TownScreen(
                        state = homeWith(shown.value),
                        onIntent = { intent: TownIntent -> intents += intent },
                        onSchoolOpen = {},
                        onMapOpen = {},
                        onTextOpen = {},
                    )
                }
            }
        }
    }

    private fun assertAboveTheStreet(line: String) {
        val alert: DpRect = composeRule.onNodeWithText(line).getUnclippedBoundsInRoot()
        val streetTop: Dp =
            composeRule.onNode(hasContentDescription(STREET, substring = true)).getUnclippedBoundsInRoot().top
        assertTrue("refusal ends at ${alert.bottom}, street starts at $streetTop", alert.bottom <= streetTop)
        assertTrue("refusal starts at ${alert.top}", alert.top >= 0.dp)
    }

    private fun wordFragmentsOf(name: String): List<String> {
        val words: List<String> = name.split(" ")
        val shown: List<SemanticsNode> =
            composeRule.onAllNodesWithText(name, useUnmergedTree = true).fetchSemanticsNodes()
        check(shown.isNotEmpty()) { "no node shows $name" }
        return shown.flatMap(::linesOf).filterNot { line: String -> words.containsAll(line.trim().split(" ")) }
    }

    private fun linesOf(node: SemanticsNode): List<String> {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        node.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        val layout: TextLayoutResult = layouts.single()
        return (0 until layout.lineCount).map { line: Int ->
            layout.layoutInput.text.text.substring(layout.getLineStart(line), layout.getLineEnd(line))
        }
    }

    private fun show(shown: HiringLine) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = homeWith(shown),
                    onIntent = { intent: TownIntent -> intents += intent },
                    onSchoolOpen = { },
                    onMapOpen = {},
                    onTextOpen = {},
                )
            }
        }
    }

    private fun homeWith(shown: HiringLine): TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = emptyList(),
        people = PeopleLine(free = 24, atWork = 96),
        words = WordsLine(stable = 0, retained = 0),
        season = null,
        buildMark = null,
        slot = SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(bareOffice),
        nextStepPlace = TownBuildingKind.Office,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = StartStatus.Idle,
        stop = StopStatus.Idle,
        hiring = shown,
    )

    private companion object {
        const val STREET: String = "Tu pueblo:"
        const val HIRE_SHORT: String =
            "No tienes recursos suficientes para esta contratación. Espera a que crezcan tus reservas."
        const val HIRING_OVER: String = "Esta contratación ya terminó."
    }
}
