package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class SchoolLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val secondSet: LessonId = LessonId("released-2-2")

    private val spanishReleasedTitle: String = "Palabras que vuelven: banda 2, grupo\u00A02"

    private val englishReleasedTitle: String = "Returning words: band 2, set\u00A02"

    private val spanishReleasedStudy: String = "$spanishReleasedTitle · Estudiar las palabras que vuelven · 2:30"

    private val shelvedAndReleased: TownSnapshot = townOf(
        lessons = listOf(lessonOf()),
        releasedLessons = listOf(releasedLessonOf(secondSet, position = 2)),
    )

    private val lessonUnderStudy: TownSnapshot = shelvedAndReleased.copy(
        lessonSlot = slotOf(),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
    )

    private val releasedUnderStudy: TownSnapshot = shelvedAndReleased.copy(
        lessonSlot = slotOf(lesson = secondSet),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
    )

    private val refusedStart: SchoolUiState.Content = contentOf(shelvedAndReleased).copy(
        start = SchoolUiState.LessonRequestStatus.Refused(firstLesson, TownLessonRefusal.StudySlotBusy),
    )

    private fun contentOf(town: TownSnapshot): SchoolUiState.Content = town.contentAt(
        now = readInstant + 30.seconds,
        gap = Duration.ZERO,
        requests = SchoolRequests.none,
        selected = null,
    )

    private fun show(language: CopyLanguage, state: SchoolUiState = contentOf(shelvedAndReleased)) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    SchoolScreen(
                        state = state,
                        onIntent = {},
                        onLessonOpen = {},
                        onTextOpen = {},
                        onReviewsOpen = {},
                    )
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

    private fun assertDescribed(vararg descriptions: String) {
        descriptions.forEach { description: String ->
            composeRule.onAllNodesWithContentDescription(description).onFirst().assertExists()
        }
    }

    private fun lineOf(text: String): DpRect =
        composeRule.onAllNodesWithText(text, useUnmergedTree = true).onFirst().getUnclippedBoundsInRoot()

    private fun assertEnglishOverSpanish(english: String, spanish: String) {
        assertTrue("$english over $spanish", lineOf(english).bottom <= lineOf(spanish).top)
    }

    @Test
    fun `draws Learn in Spanish in the Spanish phase`() {
        show(spanishPhase)

        assertDrawn("Aprender", "Lección 1", "5 palabras · Habilidad: comida +5\u00A0%")
        assertDrawn("Estudiar la lección 1 · 2:30", "Palabras en aprendizaje: 0 de 10", "Lecciones", "5 palabras")
        assertDrawn("Tus habilidades")
        assertDrawn("Aún no tienes habilidades.")
        assertNotDrawn("Learn", "Lesson 1", "Study lesson 1 · 2:30", "Lessons", "Your skills")
        assertNotDrawn("Words in learning: 0 of 10", "You have no skills.", "5 words")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish("Learn", "Aprender")
        assertEnglishOverSpanish("Lesson 1", "Lección 1")
        assertEnglishOverSpanish("5 words · food skill: +5\u00A0%", "5 palabras · Habilidad: comida +5\u00A0%")
        assertEnglishOverSpanish("Study lesson 1 · 2:30", "Estudiar la lección 1 · 2:30")
        assertEnglishOverSpanish("Words in learning: 0 of 10", "Palabras en aprendizaje: 0 de 10")
        assertEnglishOverSpanish("Lessons", "Lecciones")
        assertEnglishOverSpanish("Your skills", "Tus habilidades")
        assertEnglishOverSpanish("You have no skills.", "Aún no tienes habilidades.")
    }

    @Test
    fun `reads the lessons' section title as one heading, English then Spanish, in the both phase`() {
        show(bothPhase)

        composeRule.onNode(isHeading() and hasText("Lessons")).assertTextEquals("Lessons", "Lecciones")
    }

    @Test
    fun `reads the studying section title as one heading, English then Spanish, in the both phase`() {
        show(bothPhase, contentOf(lessonUnderStudy))

        composeRule.onNode(isHeading() and hasText("Studying") and !hasText("Lesson 1"))
            .assertTextEquals("Studying", "En estudio")
    }

    @Test
    fun `draws Learn in English in the English phase`() {
        show(englishPhase)

        assertDrawn("Learn", "Lesson 1", "5 words · food skill: +5\u00A0%", "Study lesson 1 · 2:30")
        assertDrawn("Words in learning: 0 of 10", "Lessons", "5 words")
        assertDrawn("Your skills", "You have no skills.")
        assertNotDrawn("Aprender", "Lección 1", "Lecciones", "Tus habilidades")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws Learn in English under none`() {
        show(noScaffold)

        assertDrawn("Learn", "Lesson 1", "Lessons", "Your skills", englishReleasedTitle)
        assertDescribed("$englishReleasedTitle · Study the returning words · 2:30")
        assertNotDrawn("Aprender", "Lección 1", "Lecciones", spanishReleasedTitle)
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, refusedStart)

        assertDrawn(spanishReleasedTitle)
        assertDescribed(spanishReleasedStudy)
        assertDrawn("La escuela ya tiene un estudio en marcha. Espera a que termine.")
        assertNotDrawn(englishReleasedTitle)
        assertNotDrawn("The school is already studying a lesson. Wait for it to finish.")
    }

    @Test
    fun `draws the fixed copy in Spanish alone in the both phase`() {
        show(bothPhase, refusedStart)

        assertDrawn(spanishReleasedTitle)
        assertDrawn("La escuela ya tiene un estudio en marcha. Espera a que termine.")
        assertNotDrawn(englishReleasedTitle)
        assertNotDrawn("The school is already studying a lesson. Wait for it to finish.")
    }

    @Test
    fun `draws the released lesson under study in Spanish for an es player in the English phase`() {
        show(englishPhase, contentOf(releasedUnderStudy))

        assertDrawn(
            "La escuela está estudiando las palabras que vuelven de la banda 2, grupo 2. Queda libre en 2\u00A0min.",
        )
        assertDescribed("Parar el estudio de las palabras que vuelven de la banda 2, grupo 2")
        assertNotDrawn(
            "The school is studying the returning words of band 2, set 2. It frees up in 2\u00A0min.",
        )
    }

    @Test
    fun `draws the lesson under study in English in the English phase`() {
        show(englishPhase, contentOf(lessonUnderStudy))

        assertDrawn("Read the words", "Stop it and you can study it again.", "2\u00A0min")
        assertDescribed("Stop studying lesson 1")
        assertNotDrawn("Leer las palabras", "En estudio")
    }

    @Test
    fun `draws the lesson under study English over Spanish in the both phase`() {
        show(bothPhase, contentOf(lessonUnderStudy))

        assertEnglishOverSpanish("Read the words", "Leer las palabras")
        assertEnglishOverSpanish(
            english = "Stop it and you can study it again.",
            spanish = "Si lo paras, la lección queda por estudiar y puedes volver a empezarla.",
        )
        assertDescribed("Stop studying lesson 1\nParar el estudio de la lección 1")
    }

    @Test
    fun `draws an unreachable Learn in Spanish with the retry in English in the English phase`() {
        show(englishPhase, SchoolUiState.Failed)

        assertDrawn("Learn", "Try again", "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("Volver a intentarlo", "We could not reach the server. Try again in a moment.")
    }
}
