package com.emm.mygame.feature.map

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.assertCountEquals
import com.emm.mygame.core.network.TownJobRefusal
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MapScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<MapIntent> = mutableListOf()

    private val nobodyForm: MapUiState.JobForm = MapUiState.JobForm(
        site = 1,
        workers = "0",
        trucks = "0",
        hours = "1",
        workersAtHome = 3,
        trucksAtHome = 1,
        block = MapUiState.JobBlock.InvalidTeam,
        roadMark = null,
        quote = null,
    )

    private val readyForm: MapUiState.JobForm = nobodyForm.copy(workers = "2", trucks = "1", hours = "3", block = null)

    private val outbound: MapUiState.JobOut = MapUiState.JobOut(
        kind = MapUiState.JobKind.Job,
        site = TownSite(region = 1, area = 2, site = 4),
        workers = 2,
        trucks = 1,
        phase = TownSnapshot.JobPhase.Outbound,
        remaining = 9.minutes,
        finishesAt = readInstant,
        pay = listOf(
            MapUiState.PayLine(TownResourceKind.Money, 120L),
            MapUiState.PayLine(TownResourceKind.Material, 40L),
        ),
        canCallBack = true,
    )

    private fun contentOf(form: MapUiState.JobForm? = null, jobOut: MapUiState.JobOut? = null): MapUiState.Content =
        MapUiState.Content(
            areaLine = MapUiState.AreaLine(area = 1, terrain = Terrain.River),
            previousArea = null,
            nextArea = 2,
            sites = listOf(
                MapUiState.SiteRow.Free(site = 1),
                MapUiState.SiteRow.Town(site = 2, name = "Hillcrest"),
                MapUiState.SiteRow.Own(site = 3, name = "Riverton"),
            ),
            form = form,
            send = MapUiState.SendRequest.Idle,
            jobOut = jobOut,
            callBack = MapUiState.CallBackRequest.Idle,
        )

    private fun show(state: MapUiState) {
        composeRule.setContent {
            MyGameTheme {
                MapScreen(state = state, onIntent = { intent: MapIntent -> intents += intent })
            }
        }
    }

    @Test
    fun `draws a free site, another town and the own town`() {
        show(contentOf())

        composeRule.onNodeWithText("Libre").assertIsDisplayed()
        composeRule.onNodeWithText("Hillcrest").assertIsDisplayed()
        composeRule.onNodeWithText("Tu pueblo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `opens the job form from the free site's button`() {
        show(contentOf())

        composeRule.onNodeWithContentDescription("Enviar un equipo al sitio 1").performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTeamTapped(site = 1)), intents)
    }

    @Test
    fun `draws the job form's fields with the team at home`() {
        show(contentOf(form = nobodyForm))

        composeRule.onNodeWithText("Trabajo en el sitio 1").assertIsDisplayed()
        composeRule.onNodeWithText("3 en casa", substring = true).performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Horas de trabajo", substring = true).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `reads the block reason on the send button`() {
        show(contentOf(form = nobodyForm))

        composeRule
            .onNode(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Elige al menos un trabajador o un camión para el equipo.",
                ),
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws the api's refusal in place of the block line`() {
        show(
            contentOf(form = nobodyForm).copy(
                send = MapUiState.SendRequest.Refused(site = 1, refusal = TownJobRefusal.InvalidTeam),
            ),
        )

        composeRule
            .onAllNodesWithText("Elige al menos un trabajador o un camión para el equipo.", useUnmergedTree = true)
            .assertCountEquals(1)
    }

    @Test
    fun `sends the job from the send button even while it is blocked`() {
        show(contentOf(form = nobodyForm))

        composeRule.onNodeWithText("Enviar el equipo").performScrollTo().performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTapped), intents)
    }

    @Test
    fun `draws the job out with its site, team and pay`() {
        show(contentOf(jobOut = outbound))

        composeRule.onNodeWithText("Región 1, zona 2, sitio 4").assertIsDisplayed()
        composeRule.onNodeWithText("Tu equipo: 2 trabajadores, 1 camión").assertIsDisplayed()
        composeRule.onNodeWithText("Pago: 120 de dinero y 40 de material").assertIsDisplayed()
    }

    @Test
    fun `draws the job's phase and the time left to it`() {
        show(contentOf(jobOut = outbound))

        composeRule.onNodeWithText("En camino").assertIsDisplayed()
        composeRule.onNodeWithText("9 min").assertIsDisplayed()
    }

    @Test
    fun `calls the job back from its button`() {
        show(contentOf(jobOut = outbound))

        composeRule.onNodeWithText("Llamar de vuelta al equipo").performScrollTo().performClick()

        assertEquals(listOf<MapIntent>(MapIntent.CallBackTapped), intents)
    }

    @Test
    fun `draws the quoted pay on the job form`() {
        val quoted: MapUiState.PayQuote = MapUiState.PayQuote.Quoted(
            listOf(MapUiState.PayLine(TownResourceKind.Money, 90L), MapUiState.PayLine(TownResourceKind.Material, 30L)),
        )

        show(contentOf(form = readyForm.copy(quote = quoted)))

        composeRule
            .onNodeWithText("Este trabajo paga 90 de dinero y 30 de material")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws the api's refusal of a quote on the job form`() {
        show(contentOf(form = readyForm.copy(quote = MapUiState.PayQuote.Refused(TownJobRefusal.SiteHeld))))

        composeRule
            .onNodeWithText("En ese sitio hay otro pueblo. Elige un sitio libre.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `says so on the job form when the quote cannot be read`() {
        show(contentOf(form = readyForm.copy(quote = MapUiState.PayQuote.Unreachable)))

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `keeps the send button of a form whose quote cannot be read`() {
        show(contentOf(form = readyForm.copy(quote = MapUiState.PayQuote.Unreachable)))

        composeRule.onNodeWithText("Enviar el equipo").performScrollTo().performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTapped), intents)
    }

    @Test
    fun `draws one refusal when the send is refused as its quote was`() {
        val refused: MapUiState.Content = contentOf(
            form = readyForm.copy(quote = MapUiState.PayQuote.Refused(TownJobRefusal.TeamAlreadyOut)),
        ).copy(send = MapUiState.SendRequest.Refused(site = 1, refusal = TownJobRefusal.TeamAlreadyOut))

        show(refused)

        composeRule
            .onAllNodesWithText("Tu equipo ya está fuera. Espera a que vuelva.", useUnmergedTree = true)
            .assertCountEquals(1)
    }

    @Test
    fun `draws the quote's refusal in place of the block line`() {
        show(contentOf(form = nobodyForm.copy(quote = MapUiState.PayQuote.Refused(TownJobRefusal.InvalidTeam))))

        composeRule
            .onAllNodesWithText("Elige al menos un trabajador o un camión para el equipo.", useUnmergedTree = true)
            .assertCountEquals(1)
    }

    @Test
    fun `marks the send with the reason of a refused quote`() {
        show(contentOf(form = readyForm.copy(quote = MapUiState.PayQuote.Refused(TownJobRefusal.TeamAlreadyOut))))

        composeRule
            .onNode(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Tu equipo ya está fuera. Espera a que vuelva.",
                ),
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `sends a team its refused quote marks, since the api decides`() {
        show(contentOf(form = readyForm.copy(quote = MapUiState.PayQuote.Refused(TownJobRefusal.TeamAlreadyOut))))

        composeRule
            .onNode(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Tu equipo ya está fuera. Espera a que vuelva.",
                ),
            )
            .performScrollTo()
            .performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTapped), intents)
    }
}
