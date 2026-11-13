package com.emm.mygame.feature.map

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class MapLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val moneyAndMaterial: List<MapUiState.PayLine> = listOf(
        MapUiState.PayLine(TownResourceKind.Money, 120L),
        MapUiState.PayLine(TownResourceKind.Material, 40L),
    )

    private val emptyTeamForm: MapUiState.JobForm = MapUiState.JobForm(
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

    private val quotedForm: MapUiState.JobForm = emptyTeamForm.copy(
        workers = "2",
        trucks = "1",
        block = null,
        quote = MapUiState.PayQuote.Quoted(moneyAndMaterial),
    )

    private val workingJob: MapUiState.JobOut = MapUiState.JobOut(
        kind = MapUiState.JobKind.Job,
        site = TownSite(region = 1, area = 2, site = 4),
        workers = 2,
        trucks = 1,
        phase = TownSnapshot.JobPhase.Working,
        remaining = 9.minutes,
        finishesAt = readInstant + 9.minutes,
        pay = moneyAndMaterial,
        canCallBack = true,
    )

    private val localNoonOnNovemberEighth: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 8, 12, 0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private val jobForThreeDays: MapUiState.JobOut =
        workingJob.copy(remaining = 3.days, finishesAt = localNoonOnNovemberEighth)

    private val riverAreaWithJobOut: MapUiState.Content = MapUiState.Content(
        areaLine = MapUiState.AreaLine(area = 1, terrain = Terrain.River),
        previousArea = null,
        nextArea = 2,
        sites = listOf(
            MapUiState.SiteRow.Free(site = 1),
            MapUiState.SiteRow.Own(site = 3, name = "Riverton"),
            MapUiState.SiteRow.Waste(site = 4, size = WasteSize.Medium, waste = 12),
        ),
        form = quotedForm,
        send = MapUiState.SendRequest.Idle,
        jobOut = workingJob,
        callBack = MapUiState.CallBackRequest.Idle,
    )

    private val refusedSend: MapUiState.Content =
        riverAreaWithJobOut.copy(send = MapUiState.SendRequest.Refused(site = 1, refusal = TownJobRefusal.SiteHeld))

    private fun show(language: CopyLanguage, state: MapUiState = riverAreaWithJobOut) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    MapScreen(state = state, onIntent = {})
                }
            }
        }
    }

    private fun assertDrawn(vararg lines: String) {
        lines.forEach { line: String ->
            composeRule.onAllNodesWithText(line, useUnmergedTree = true).onFirst().assertExists()
        }
    }

    private fun assertNotDrawn(vararg lines: String) {
        lines.forEach { line: String ->
            composeRule.onAllNodesWithText(line, useUnmergedTree = true).assertCountEquals(0)
        }
    }

    private fun lineOf(text: String): DpRect =
        composeRule.onAllNodesWithText(text, useUnmergedTree = true).onFirst().getUnclippedBoundsInRoot()

    private fun assertEnglishOverSpanish(english: String, spanish: String) {
        assertTrue("$english over $spanish", lineOf(english).bottom <= lineOf(spanish).top)
    }

    @Test
    fun `draws the map in Spanish in the Spanish phase`() {
        show(spanishPhase)

        assertDrawn("Mapa", "Zona 1", "Río", "Zona siguiente", "Sitio 1", "Libre", "Tu pueblo")
        assertDrawn("Sitio con residuos")
        assertDrawn("Trabajo en el sitio 1", "Trabajadores a enviar")
        assertDrawn("Este trabajo paga 120 de dinero y 40 de material")
        assertDrawn("Trabajo", "Región 1, zona 2, sitio 4", "Trabajando", "Pago: 120 de dinero y 40 de material")
        assertNotDrawn("Map", "Area 1", "River", "Next area", "Site 1", "Free", "Your town", "Job at site 1")
        assertNotDrawn("This job pays 120 money and 40 material", "Pay: 120 money and 40 material", "Working")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish("Map", "Mapa")
        assertEnglishOverSpanish("Area 1", "Zona 1")
        assertEnglishOverSpanish("River", "Río")
        assertEnglishOverSpanish("Next area", "Zona siguiente")
        assertEnglishOverSpanish("Site 1", "Sitio 1")
        assertEnglishOverSpanish("Free", "Libre")
        assertEnglishOverSpanish("Your town", "Tu pueblo")
        assertEnglishOverSpanish("Waste site", "Sitio con residuos")
        assertEnglishOverSpanish("Job at site 1", "Trabajo en el sitio 1")
        assertEnglishOverSpanish("Workers to send", "Trabajadores a enviar")
        assertEnglishOverSpanish("Send the team", "Enviar el equipo")
        assertEnglishOverSpanish("Region 1, area 2, site 4", "Región 1, zona 2, sitio 4")
        assertEnglishOverSpanish("Call the team back", "Llamar de vuelta al equipo")
    }

    @Test
    fun `draws a composed pay line English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish(
            english = "This job pays 120 money and 40 material",
            spanish = "Este trabajo paga 120 de dinero y 40 de material",
        )
        assertEnglishOverSpanish(
            english = "Pay: 120 money and 40 material",
            spanish = "Pago: 120 de dinero y 40 de material",
        )
    }

    @Test
    fun `draws the map in English in the English phase`() {
        show(englishPhase)

        assertDrawn("Map", "Area 1", "River", "Next area", "Site 1", "Free", "Your town", "Waste site")
        assertDrawn("Job at site 1", "Workers to send", "This job pays 120 money and 40 material")
        assertDrawn("Job", "Region 1, area 2, site 4", "Working", "Pay: 120 money and 40 material")
        assertNotDrawn("Mapa", "Zona 1", "Río", "Sitio 1", "Libre", "Tu pueblo", "Trabajo en el sitio 1", "Trabajando")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws the map in English under none`() {
        show(noScaffold, refusedSend)

        assertDrawn("Map", "Area 1", "Site 1", "Free", "Job at site 1", "Pay: 120 money and 40 material")
        assertDrawn("Another town is on that site. Choose a free site.")
        assertNotDrawn("Mapa", "Zona 1", "Libre", "Pago: 120 de dinero y 40 de material")
        assertNotDrawn("En ese sitio hay otro pueblo. Elige un sitio libre.")
    }

    @Test
    fun `writes a later finish day the English way in the English phase`() {
        show(englishPhase, riverAreaWithJobOut.copy(jobOut = jobForThreeDays))

        composeRule.onNode(hasText("Nov 8", substring = true), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `writes a later finish day the Spanish way in the Spanish phase`() {
        show(spanishPhase, riverAreaWithJobOut.copy(jobOut = jobForThreeDays))

        composeRule.onNode(hasText("8 nov", substring = true), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, refusedSend)

        assertDrawn("Send the team", "En ese sitio hay otro pueblo. Elige un sitio libre.")
        assertNotDrawn("Another town is on that site. Choose a free site.")
    }

    @Test
    fun `draws the fixed copy in Spanish alone in the both phase`() {
        show(bothPhase, refusedSend)

        assertDrawn("En ese sitio hay otro pueblo. Elige un sitio libre.")
        assertNotDrawn("Another town is on that site. Choose a free site.")
    }

    @Test
    fun `draws the empty team line in Spanish for an es player in the English phase`() {
        show(englishPhase, riverAreaWithJobOut.copy(form = emptyTeamForm))

        assertDrawn("Workers to send", "Elige al menos un trabajador o un camión para el equipo.")
        assertNotDrawn("Choose at least one worker or truck for the team.")
    }

    @Test
    fun `draws the unreachable map in Spanish with the retry in English in the English phase`() {
        show(englishPhase, MapUiState.Failed)

        assertDrawn("Try again", "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("Volver a intentarlo", "We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `draws the area past the end in Spanish with the way back in English in the English phase`() {
        show(englishPhase, MapUiState.AreaNotFound)

        assertDrawn("Back to your area", "Esa zona está más allá del final del mapa.")
        assertNotDrawn("Volver a tu zona", "That area is past the end of the map.")
    }
}
