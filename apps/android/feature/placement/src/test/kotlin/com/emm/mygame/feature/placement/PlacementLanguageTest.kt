package com.emm.mygame.feature.placement

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class PlacementLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val offered: PlacementUiState.Offered = PlacementUiState.Offered(PlacementRequest.Idle)

    private val lastWordChosen: PlacementUiState.Asking = PlacementUiState.Asking(
        band = PlacementBand.First,
        items = listOf(house, walk),
        scores = emptyList(),
        shownIndex = 1,
        chosen = mapOf(walk.word to walkMeaning),
        request = PlacementRequest.Idle,
    )

    private val result: PlacementUiState.Closed = PlacementUiState.Closed(listOf(firstBandPassed))

    private fun show(language: CopyLanguage, state: PlacementUiState) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    PlacementScreen(state = state, onIntent = {}, onTownOpen = {})
                }
            }
        }
    }

    private fun showOffer(language: CopyLanguage, state: PlacementOfferUiState) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    PlacementOfferRow(state = state, onPlacementOpen = {})
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

    @Test
    fun `draws the placement in Spanish in the Spanish phase`() {
        show(spanishPhase, offered)

        assertDrawn("Prueba de nivel", "Si la saltas, empiezas por la lección 1.")
        assertDrawn("Empezar la prueba", "Saltar la prueba")
        assertNotDrawn("Placement", "Skip it, and you start at lesson 1.", "Start the placement", "Skip the placement")
    }

    @Test
    fun `draws the placement in Spanish alone in the both phase`() {
        show(bothPhase, offered)

        assertDrawn("Prueba de nivel", "Si la saltas, empiezas por la lección 1.")
        assertDrawn("Empezar la prueba", "Saltar la prueba")
        assertNotDrawn("Placement", "Skip it, and you start at lesson 1.", "Start the placement", "Skip the placement")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, offered)

        assertDrawn("Prueba de nivel", "Si la saltas, empiezas por la lección 1.")
        assertDrawn("Empezar la prueba", "Saltar la prueba")
        assertNotDrawn("Placement", "Skip it, and you start at lesson 1.", "Start the placement", "Skip the placement")
    }

    @Test
    fun `draws the placement in English under none`() {
        show(noScaffold, offered)

        assertDrawn("Placement", "Skip it, and you start at lesson 1.", "Start the placement", "Skip the placement")
        assertNotDrawn("Prueba de nivel", "Si la saltas, empiezas por la lección 1.", "Empezar la prueba")
    }

    @Test
    fun `draws the asked band in Spanish for an es player in the English phase`() {
        show(englishPhase, lastWordChosen)

        assertDrawn("BANDA 1", "Palabra 2 de 2", "¿Qué significa?", "Enviar la banda 1")
        assertNotDrawn("BAND 1", "Word 2 of 2", "What does it mean?", "Send band 1")
    }

    @Test
    fun `draws the asked band in English under none`() {
        show(noScaffold, lastWordChosen)

        assertDrawn("BAND 1", "Word 2 of 2", "What does it mean?", "Send band 1")
        assertNotDrawn("BANDA 1", "Palabra 2 de 2", "¿Qué significa?", "Enviar la banda 1")
    }

    @Test
    fun `draws the result in Spanish for an es player in the English phase`() {
        show(englishPhase, result)

        assertDrawn("Tu resultado", "Banda 1: 30 aciertos", "Superada: sus lecciones cuentan como sabidas.")
        assertDrawn("Volver a tu pueblo")
        assertNotDrawn("Your result", "Band 1: 30 right", "Back to your town")
    }

    @Test
    fun `draws the result in English under none`() {
        show(noScaffold, result)

        assertDrawn("Your result", "Band 1: 30 right", "Placed out: its lessons count as known.", "Back to your town")
        assertNotDrawn("Tu resultado", "Banda 1: 30 aciertos", "Volver a tu pueblo")
    }

    @Test
    fun `draws the unreadable placement in Spanish for an es player in the English phase`() {
        show(englishPhase, PlacementUiState.Failed)

        assertDrawn("No hemos podido leer tu prueba de nivel.", "Volver a intentarlo")
        assertNotDrawn("We couldn't read your placement.", "Try again")
    }

    @Test
    fun `draws the offer row in Spanish for an es player in the English phase`() {
        showOffer(englishPhase, PlacementOfferUiState.Offered)

        assertDrawn("Prueba de nivel", "Hacer la prueba de nivel")
        assertNotDrawn("Placement", "Take the placement")
    }

    @Test
    fun `draws the offer row in English under none`() {
        showOffer(noScaffold, PlacementOfferUiState.Asking)

        assertDrawn("Placement", "Go on with the placement")
        assertNotDrawn("Prueba de nivel", "Seguir con la prueba de nivel")
    }
}
