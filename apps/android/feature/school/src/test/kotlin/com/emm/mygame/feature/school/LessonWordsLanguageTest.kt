package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class LessonWordsLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val firstWordWhileStudying: LessonWordsUiState.Reading = LessonWordsUiState.Reading(
        name = firstLessonName,
        theme = "A day in town",
        words = listOf(homeWord, waterWord),
        index = 0,
        remaining = 3.minutes,
        wayOn = null,
    )

    private val lastWordOfAReleasedLesson: LessonWordsUiState.Reading = firstWordWhileStudying.copy(
        name = LessonName.Released(PlacementBand.Second, set = 1),
        theme = null,
        index = 1,
        remaining = null,
    )

    private fun show(language: CopyLanguage, state: LessonWordsUiState = firstWordWhileStudying) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    LessonWordsScreen(state = state, onIntent = {}, onWayOn = {}, onSchoolOpen = {})
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
    fun `draws the lesson's words in Spanish in the Spanish phase`() {
        show(spanishPhase)

        assertDrawn("Lección 1", "En estudio", "3 min", "Palabra 1 de 2", "Siguiente palabra")
        assertNotDrawn("Lesson 1", "Studying", "Word 1 of 2", "Next word")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish("Lesson 1", "Lección 1")
        assertEnglishOverSpanish("Studying", "En estudio")
        assertEnglishOverSpanish("Word 1 of 2", "Palabra 1 de 2")
        assertEnglishOverSpanish("Next word", "Siguiente palabra")
    }

    @Test
    fun `draws the lesson's words in English in the English phase`() {
        show(englishPhase)

        assertDrawn("Lesson 1", "Studying", "3 min", "Word 1 of 2", "Next word", "home", "hogar")
        assertNotDrawn("Lección 1", "En estudio", "Palabra 1 de 2", "Siguiente palabra")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws the lesson's words in English under none`() {
        show(noScaffold, lastWordOfAReleasedLesson)

        assertDrawn("Returning words: band 2, set\u00A01", "Word 2 of 2", "When the lesson ends, the reviews start.")
        assertDrawn("Go to the school")
        assertNotDrawn("Palabras que vuelven: banda 2, grupo\u00A01", "Palabra 2 de 2", "Ir a la escuela")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, lastWordOfAReleasedLesson)

        assertDrawn("Palabras que vuelven: banda 2, grupo\u00A01", "Word 2 of 2", "Go to the school")
        assertNotDrawn("Returning words: band 2, set\u00A01")
    }

    @Test
    fun `draws the unreachable words in Spanish with the retry in English in the English phase`() {
        show(englishPhase, LessonWordsUiState.Failed)

        assertDrawn("Try again", "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("Volver a intentarlo", "We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `draws nothing to read English over Spanish in the both phase`() {
        show(bothPhase, LessonWordsUiState.NothingToRead)

        assertEnglishOverSpanish("No words to read now.", "Ahora no hay palabras para leer.")
        assertEnglishOverSpanish("Go to the school", "Ir a la escuela")
    }
}
