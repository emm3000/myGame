package com.emm.mygame.feature.holdout

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand
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
class HoldoutCheckRowsLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val spanishHoldoutRow: String = "Tienes pendiente una prueba de palabras de la banda 1, semana 8."

    private val englishHoldoutRow: String = "A word check for band 1, week 8 is due."

    private val dueCheck: HoldoutCheckRowsUiState =
        HoldoutCheckRowsUiState(listOf(HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth)))

    private fun showInPhoneLanguage() {
        composeRule.setContent {
            MyGameTheme {
                HoldoutCheckRows(state = dueCheck, onHoldoutCheckOpen = {})
            }
        }
    }

    private fun show(language: CopyLanguage) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    HoldoutCheckRows(state = dueCheck, onHoldoutCheckOpen = {})
                }
            }
        }
    }

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).assertIsDisplayed()
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
    @Config(qualifiers = "es")
    fun `draws the due check in the phone's Spanish`() {
        showInPhoneLanguage()

        showing("Tienes pendiente una prueba de palabras de la banda 1, semana 8.")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws the due check in English under none`() {
        show(noScaffold)

        assertDrawn(englishHoldoutRow)
        assertDrawn("Open the check")
        assertNotDrawn(spanishHoldoutRow, "Abrir la prueba")
    }

    @Test
    fun `draws the due check in Spanish for an es player in the English phase`() {
        show(englishPhase)

        assertDrawn(spanishHoldoutRow)
        assertDrawn("Abrir la prueba")
        assertNotDrawn(englishHoldoutRow, "Open the check")
    }

    @Test
    fun `draws the due check in Spanish alone in the both phase`() {
        show(bothPhase)

        assertDrawn(spanishHoldoutRow, "Abrir la prueba")
        assertNotDrawn(englishHoldoutRow, "Open the check")
    }
}
