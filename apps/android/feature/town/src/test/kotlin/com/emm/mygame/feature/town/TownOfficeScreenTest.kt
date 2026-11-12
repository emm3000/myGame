package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownOfficeScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val intents: MutableList<TownIntent> = mutableListOf()

    private val threeWorkers: TownUiState.HireOffer = TownUiState.HireOffer(
        count = 3,
        costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 120, isShort = false)),
        people = 3,
        isPeopleShort = false,
        duration = 3.minutes,
    )

    private val workerForm: TownUiState.HireForm =
        TownUiState.HireForm(entry = "3", isEntryDisabled = false, offer = threeWorkers, block = null)

    private val workers: TownUiState.HireCard =
        TownUiState.HireCard(TownHireKind.Worker, team = 4, requiredOfficeLevel = 1, form = workerForm)

    private val lockedTrucks: TownUiState.HireCard =
        TownUiState.HireCard(TownHireKind.Truck, team = 0, requiredOfficeLevel = 3, form = null)

    private val workerTarget: TownUiState.HiringTarget = TownUiState.HiringTarget(TownHireKind.Worker, readInstant)

    private val busyHiring: TownUiState.HiringLine.Busy = TownUiState.HiringLine.Busy(
        target = workerTarget,
        count = 3,
        delivered = 1,
        remaining = 2.minutes,
        total = 3.minutes,
        finishesAt = readInstant,
    )

    private val office: TownUiState.OfficeLine = TownUiState.OfficeLine(
        hiring = TownUiState.HiringLine.Idle,
        hires = listOf(workers, lockedTrucks),
        place = TownUiState.HireStatus.Idle,
        stop = TownUiState.HireStopStatus.Idle,
    )

    private val shortOfMoney: TownUiState.HireBlock =
        TownUiState.HireBlock.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 20)))

    private val shortOfMoneyLine: String = "Necesitas 20 de dinero más."

    @Test
    fun `offers hires with their count and duration on the button`() {
        show(office)

        composeRule.onNodeWithText("Contratar 3 trabajadores · 3:00").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.HireTapped(TownHireKind.Worker)), intents)
    }

    @Test
    fun `draws the cost and the people of the hires`() {
        show(office)

        composeRule.onNodeWithContentDescription("120 de dinero").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("3 personas").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sends the count the player writes`() {
        show(office)

        composeRule.onNodeWithText("3").performScrollTo().performTextReplacement("5")

        assertEquals(listOf<TownIntent>(TownIntent.HireEntryChanged(TownHireKind.Worker, "5")), intents)
    }

    @Test
    fun `names the office level a locked kind needs`() {
        show(office)

        composeRule.onNodeWithText("Necesita la oficina en nivel 3").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `offers no hire of a locked kind`() {
        show(office)

        composeRule.onNodeWithText("Camiones a contratar").assertDoesNotExist()
    }

    @Test
    fun `counts the hires the town holds`() {
        show(office)

        composeRule.onNodeWithText("Tu equipo: 4 trabajadores").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `names too few free people for the hires`() {
        show(blocked(TownUiState.HireBlock.PeopleShort(needed = 3, free = 2)))

        assertBlockedBy("Gente necesaria: 3. Libres: 2.")
    }

    @Test
    fun `names the shortfall of the hires`() {
        show(blocked(TownUiState.HireBlock.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 20)))))

        assertBlockedBy("Necesitas 20 de dinero más.")
    }

    @Test
    fun `invites a hiring when none runs`() {
        show(office)

        composeRule.onNodeWithText("Ahora no hay ninguna contratación.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the delivered hires of the open order`() {
        show(office.copy(hiring = busyHiring))

        composeRule.onNodeWithText("1 de 3 contratados").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `counts the open order down`() {
        show(office.copy(hiring = busyHiring))

        composeRule.onNodeWithText("2 min").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the open order`() {
        show(office.copy(hiring = busyHiring))

        composeRule
            .onNodeWithContentDescription("Parar la contratación de trabajadores")
            .performScrollTo()
            .performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopHiringTapped(workerTarget)), intents)
    }

    @Test
    fun `tells an order that reached its end`() {
        show(office.copy(hiring = TownUiState.HiringLine.Done(TownHireKind.Worker, count = 3, delivered = 3)))

        composeRule
            .onNodeWithText("La contratación terminó. Estamos leyendo tu pueblo otra vez…")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws a hiring refusal with its message`() {
        val refused: TownUiState.HireStatus =
            TownUiState.HireStatus.Refused(TownHireKind.Worker, TownHiringRefusal.OfficeTooLow(1, 3))

        show(office.copy(place = refused))

        composeRule
            .onNodeWithText("Tu oficina está en nivel 1 y esta contratación necesita el nivel 3.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `disables the count field while an order is open`() {
        show(office.copy(hires = listOf(workers.copy(form = workerForm.copy(isEntryDisabled = true)), lockedTrucks)))

        composeRule.onNodeWithContentDescription("Trabajadores a contratar").performScrollTo().assertIsNotEnabled()
    }

    @Test
    fun `names the hire in a refusal for too few free people`() {
        val tooFew: TownHiringRefusal = TownHiringRefusal.NotEnoughPeople(required = 3, free = 2)
        val refused: TownUiState.HireStatus = TownUiState.HireStatus.Refused(TownHireKind.Worker, tooFew)

        show(office.copy(place = refused))

        composeRule
            .onNodeWithText("Esta contratación necesita 3 personas libres y tienes 2. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `names the hire in a refusal for resources the town lacks`() {
        val refused: TownUiState.HireStatus =
            TownUiState.HireStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources)

        show(office.copy(place = refused))

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
        val refused: TownUiState.HireStatus =
            TownUiState.HireStatus.Refused(TownHireKind.Worker, TownHiringRefusal.NotEnoughResources)

        show(blocked(shortOfMoney).copy(place = refused))

        composeRule.onNodeWithText(shortOfMoneyLine, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `drops the block reason once the server could not be reached`() {
        show(blocked(shortOfMoney).copy(place = TownUiState.HireStatus.Unreachable(TownHireKind.Worker)))

        composeRule.onNodeWithText(shortOfMoneyLine, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `draws a stop refusal with its message`() {
        show(
            office.copy(
                hiring = busyHiring,
                stop = TownUiState.HireStopStatus.Refused(TownHiringRefusal.HiringOrderNotFound),
            ),
        )

        composeRule.onNodeWithText("Esta contratación ya terminó.").performScrollTo().assertIsDisplayed()
    }

    private fun blocked(block: TownUiState.HireBlock): TownUiState.OfficeLine =
        office.copy(hires = listOf(workers.copy(form = workerForm.copy(block = block)), lockedTrucks))

    private fun assertBlockedBy(reason: String) {
        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, reason))
            .performScrollTo()
            .assertIsDisplayed()
    }

    private fun show(shown: TownUiState.OfficeLine) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = homeWith(shown),
                    onIntent = { intent: TownIntent -> intents += intent },
                    onSchoolOpen = { },
                    onReportOpen = { },
                    onMapOpen = {},
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
    }

    private fun homeWith(shown: TownUiState.OfficeLine): TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = emptyList(),
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        season = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = emptyList(),
        nextStep = caughtUpCard,
        nextStepTime = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = shown,
    )
}
