package com.emm.mygame.feature.map

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.PLACE_ART
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import com.emm.mygame.core.designsystem.R as DesignSystemR

@RunWith(RobolectricTestRunner::class)
class MapCleanUpScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<MapIntent> = mutableListOf()

    private val pay: List<MapUiState.PayLine> = listOf(
        MapUiState.PayLine(TownResourceKind.Money, 24L),
        MapUiState.PayLine(TownResourceKind.Material, 36L),
    )

    private val form: MapUiState.CleanUpForm = MapUiState.CleanUpForm(
        site = 5,
        workers = "3",
        trucks = "1",
        workersAtHome = 3,
        trucksAtHome = 1,
        block = null,
        roadMark = null,
        quote = null,
    )

    private val cleanUpOut: MapUiState.JobOut = MapUiState.JobOut(
        kind = MapUiState.JobKind.CleanUp(waste = 12, outcome = null),
        site = TownSite(region = 1, area = 1, site = 5),
        workers = 3,
        trucks = 1,
        phase = TownSnapshot.JobPhase.Outbound,
        remaining = 9.minutes,
        finishesAt = readInstant,
        pay = pay,
        canCallBack = true,
    )

    private fun contentOf(
        form: MapUiState.SiteForm? = null,
        jobOut: MapUiState.JobOut? = null,
        send: MapUiState.SendRequest = MapUiState.SendRequest.Idle,
    ): MapUiState.Content = MapUiState.Content(
        areaLine = MapUiState.AreaLine(area = 1, terrain = Terrain.Fields),
        previousArea = null,
        nextArea = 2,
        sites = listOf(
            MapUiState.SiteRow.Waste(site = 4, size = WasteSize.Small, waste = 3),
            MapUiState.SiteRow.Waste(site = 5, size = WasteSize.Medium, waste = 12),
            MapUiState.SiteRow.Waste(site = 6, size = WasteSize.Large, waste = 40),
        ),
        form = form,
        send = send,
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

    private fun silhouetteOf(drawable: Int): SemanticsMatcher =
        SemanticsMatcher.expectValue(PLACE_ART, MyGameArt(drawable, MyGameArtTint.InkMuted))

    @Test
    fun `draws each waste site with its silhouette and its waste`() {
        show(contentOf())

        listOf(
            Triple(DesignSystemR.drawable.designsystem_waste_1, "Tamaño 1", "Residuos: 3"),
            Triple(DesignSystemR.drawable.designsystem_waste_2, "Tamaño 2", "Residuos: 12"),
            Triple(DesignSystemR.drawable.designsystem_waste_3, "Tamaño 3", "Residuos: 40"),
        ).forEach { (drawable: Int, size: String, waste: String) ->
            composeRule.onNode(silhouetteOf(drawable), useUnmergedTree = true).performScrollTo().assertIsDisplayed()
            composeRule.onNodeWithText(size).performScrollTo().assertIsDisplayed()
            composeRule.onNodeWithText(waste).performScrollTo().assertIsDisplayed()
        }
        composeRule.onAllNodesWithText("Sitio con residuos").assertCountEquals(3)
    }

    @Test
    fun `opens the clean-up form from the waste site's button`() {
        show(contentOf())

        composeRule.onNodeWithContentDescription("Enviar un equipo al sitio 5").performScrollTo().performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTeamTapped(site = 5)), intents)
    }

    @Test
    fun `draws the clean-up form with no hours`() {
        show(contentOf(form = form))

        composeRule.onNodeWithText("Limpiar los residuos del sitio 5").performScrollTo().assertIsDisplayed()
        composeRule.onAllNodesWithText("Horas de trabajo", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the strength of a team that covers the waste and its pay`() {
        val covered: MapUiState.CleanUpQuote =
            MapUiState.CleanUpQuote.Quoted(strength = 12, waste = 12, pay = pay, isShort = false)

        show(contentOf(form = form.copy(quote = covered)))

        composeRule.onNodeWithText("Tu equipo: 12", substring = true).performScrollTo().assertIsDisplayed()
        composeRule
            .onNodeWithText("Limpiar los residuos paga 24 de dinero y 36 de material", substring = true)
            .performScrollTo()
            .assertIsDisplayed()
        composeRule.onAllNodesWithText("Volverá sin pago.", substring = true).assertCountEquals(0)
    }

    @Test
    fun `warns when the team cannot cover the waste`() {
        val short: MapUiState.CleanUpQuote =
            MapUiState.CleanUpQuote.Quoted(strength = 8, waste = 12, pay = emptyList(), isShort = true)

        show(contentOf(form = form.copy(quote = short)))

        composeRule
            .onNodeWithText("Tu equipo no puede limpiar estos residuos. Volverá sin pago.", substring = true)
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `sends the clean-up from the send button`() {
        show(contentOf(form = form))

        composeRule.onNodeWithText("Enviar el equipo").performScrollTo().performClick()

        assertEquals(listOf<MapIntent>(MapIntent.SendTapped), intents)
    }

    @Test
    fun `draws the api's refusal of a clean-up with its message`() {
        show(contentOf(form = form, send = MapUiState.SendRequest.Refused(site = 5, TownJobRefusal.NoWasteYet)))

        composeRule
            .onNodeWithText("Ese sitio está limpio por ahora. Vuelve más tarde.", useUnmergedTree = true)
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws a clean-up out with its waste and its pay`() {
        show(contentOf(jobOut = cleanUpOut))

        composeRule.onNodeWithText("Limpieza").assertIsDisplayed()
        composeRule.onAllNodesWithText("Residuos: 12").assertCountEquals(2)
        composeRule.onNodeWithText("Pago: 24 de dinero y 36 de material").assertIsDisplayed()
    }

    @Test
    fun `draws a clean-up done with its pay`() {
        val done: MapUiState.JobOut = cleanUpOut.copy(
            kind = MapUiState.JobKind.CleanUp(waste = 12, outcome = MapUiState.CleanUpOutcome.Cleaned),
            phase = TownSnapshot.JobPhase.Returning,
            canCallBack = false,
        )

        show(contentOf(jobOut = done))

        composeRule.onNodeWithText("Tu equipo limpió los residuos.").assertIsDisplayed()
        composeRule.onNodeWithText("Pago: 24 de dinero y 36 de material").assertIsDisplayed()
    }

    @Test
    fun `draws a clean-up failed`() {
        val failed: MapUiState.JobOut = cleanUpOut.copy(
            kind = MapUiState.JobKind.CleanUp(waste = 12, outcome = MapUiState.CleanUpOutcome.NotCleaned),
            phase = TownSnapshot.JobPhase.Returning,
            pay = emptyList(),
            canCallBack = false,
        )

        show(contentOf(jobOut = failed))

        composeRule.onNodeWithText("Tu equipo no pudo limpiar los residuos.").assertIsDisplayed()
        composeRule.onAllNodesWithText("Pago:", substring = true).assertCountEquals(0)
    }
}
