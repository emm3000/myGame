package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
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

    private val spanishHoldoutRow: String = "Tienes pendiente una prueba de palabras de la banda 1, semana 8."

    private val englishHoldoutRow: String = "A word check for band 1, week 8 is due."

    private val shelvedAndReleased: TownSnapshot = townOf(
        lessons = listOf(lessonOf()),
        releasedLessons = listOf(releasedLessonOf(secondSet, position = 2)),
    )

    private val lessonUnderStudy: TownSnapshot = shelvedAndReleased.copy(
        lessonSlot = slotOf(),
        nextStep = NextStep.LessonRunning(producer = null),
    )

    private val releasedUnderStudy: TownSnapshot = shelvedAndReleased.copy(
        lessonSlot = slotOf(lesson = secondSet),
        nextStep = NextStep.LessonRunning(producer = null),
    )

    private val holdoutAhead: TownSnapshot =
        shelvedAndReleased.copy(nextStep = NextStep.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth))

    private val releasedAhead: TownSnapshot =
        shelvedAndReleased.copy(nextStep = NextStep.ReleasedLesson(secondSet, PlacementBand.Second, 2))

    private val dueCheck: HoldoutCheckRowsUiState =
        HoldoutCheckRowsUiState(listOf(HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth)))

    private val localNoonOnNovemberEighth: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 8, 12, 0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private val lessonReadyInThreeDays: SchoolUiState.Content = contentOf(shelvedAndReleased).copy(
        lessons = emptyList(),
        nextStep = NextStepCard(
            line = NextStepCard.Line.Studying,
            detail = null,
            countdown = NextStepCard.Countdown.LessonReady(number = 2, at = localNoonOnNovemberEighth),
            action = NextStepCard.Action.GoToReport,
        ),
        nextStepTime = SchoolUiState.NextStepTime(remaining = 3.days, finishesAt = localNoonOnNovemberEighth),
    )

    private val refusedStart: SchoolUiState.Content = contentOf(shelvedAndReleased).copy(
        start = SchoolUiState.LessonRequest.Refused(firstLesson, TownLessonRefusal.StudySlotBusy),
    )

    private fun contentOf(town: TownSnapshot): SchoolUiState.Content = town.contentAt(
        now = readInstant + 30.seconds,
        gap = Duration.ZERO,
        mutations = SchoolMutations.none,
        selected = null,
    )

    private fun show(language: CopyLanguage, state: SchoolUiState = contentOf(shelvedAndReleased)) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    SchoolScreen(
                        state = state,
                        onIntent = {},
                        onReviewsOpen = {},
                        onLessonOpen = {},
                        onReportOpen = {},
                        onHoldoutCheckOpen = { _: PlacementBand, _: HoldoutCheckWeek -> },
                        holdoutChecks = { HoldoutCheckRows(state = dueCheck, onHoldoutCheckOpen = {}) },
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
    fun `draws the school in Spanish in the Spanish phase`() {
        show(spanishPhase)

        assertDrawn("Escuela", "Nivel 1", "Lección 1", "5 palabras · Habilidad: comida +5\u00A0%")
        assertDrawn("Estudiar la lección 1 · 2:30", "Palabras en aprendizaje: 0 de 10", "Lecciones", "5 palabras")
        assertDrawn("En estudio", "Ahora no hay ninguna lección en estudio.", "Tus habilidades")
        assertDrawn("Aún no tienes habilidades.")
        assertNotDrawn("School", "Level 1", "Lesson 1", "Study lesson 1 · 2:30", "Lessons", "Your skills")
        assertNotDrawn("Words in learning: 0 of 10", "No lesson now.", "You have no skills.", "5 words")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish("School", "Escuela")
        assertEnglishOverSpanish("Level 1", "Nivel 1")
        assertEnglishOverSpanish("Lesson 1", "Lección 1")
        assertEnglishOverSpanish("5 words · food skill: +5\u00A0%", "5 palabras · Habilidad: comida +5\u00A0%")
        assertEnglishOverSpanish("Study lesson 1 · 2:30", "Estudiar la lección 1 · 2:30")
        assertEnglishOverSpanish("Words in learning: 0 of 10", "Palabras en aprendizaje: 0 de 10")
        assertEnglishOverSpanish("Lessons", "Lecciones")
        assertEnglishOverSpanish("Studying", "En estudio")
        assertEnglishOverSpanish("No lesson now.", "Ahora no hay ninguna lección en estudio.")
        assertEnglishOverSpanish("Your skills", "Tus habilidades")
        assertEnglishOverSpanish("You have no skills.", "Aún no tienes habilidades.")
    }

    @Test
    fun `draws the school in English in the English phase`() {
        show(englishPhase)

        assertDrawn("School", "Level 1", "Lesson 1", "5 words · food skill: +5\u00A0%", "Study lesson 1 · 2:30")
        assertDrawn("Words in learning: 0 of 10", "Lessons", "5 words", "Studying", "No lesson now.")
        assertDrawn("Your skills", "You have no skills.")
        assertNotDrawn("Escuela", "Nivel 1", "Lección 1", "Lecciones", "En estudio", "Tus habilidades")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws the school in English under none`() {
        show(noScaffold)

        assertDrawn("School", "Lesson 1", "Lessons", "Your skills", englishReleasedTitle, englishHoldoutRow)
        assertDrawn("Open the check")
        assertDescribed("$englishReleasedTitle · Study the returning words · 2:30")
        assertNotDrawn("Escuela", "Lección 1", "Lecciones", spanishReleasedTitle, spanishHoldoutRow, "Abrir la prueba")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, refusedStart)

        assertDrawn(spanishReleasedTitle, spanishHoldoutRow)
        assertDescribed(spanishReleasedStudy)
        assertDrawn("Abrir la prueba", "La escuela ya tiene un estudio en marcha. Espera a que termine.")
        assertNotDrawn(englishReleasedTitle, englishHoldoutRow, "Open the check")
        assertNotDrawn("The school is already studying a lesson. Wait for it to finish.")
    }

    @Test
    fun `draws the fixed copy in Spanish alone in the both phase`() {
        show(bothPhase, refusedStart)

        assertDrawn(spanishReleasedTitle, spanishHoldoutRow, "Abrir la prueba")
        assertDrawn("La escuela ya tiene un estudio en marcha. Espera a que termine.")
        assertNotDrawn(englishReleasedTitle, englishHoldoutRow, "Open the check")
        assertNotDrawn("The school is already studying a lesson. Wait for it to finish.")
    }

    @Test
    fun `draws the released next step's fixed copy in Spanish under an English title in the English phase`() {
        show(englishPhase, contentOf(releasedAhead))

        assertDescribed("What is next")
        assertDrawn(spanishReleasedTitle, "Estudiar las palabras que vuelven")
        assertNotDrawn("TU SIGUIENTE PASO", englishReleasedTitle, "Study the returning words")
    }

    @Test
    fun `draws the released lesson under study in Spanish for an es player in the English phase`() {
        show(englishPhase, contentOf(releasedUnderStudy))

        assertDrawn("La escuela está estudiando las palabras que vuelven de la banda 2, grupo 2.")
        assertDescribed("Parar el estudio de las palabras que vuelven de la banda 2, grupo 2")
        assertNotDrawn("The school is studying the returning words of band 2, set 2.")
    }

    @Test
    fun `draws the holdout next step in Spanish for an es player in the English phase`() {
        show(englishPhase, contentOf(holdoutAhead))

        assertDrawn("Prueba de palabras de la banda 1")
        assertNotDrawn("Word check for band 1")
        composeRule.onAllNodesWithText("Abrir la prueba", useUnmergedTree = true).assertCountEquals(2)
    }

    @Test
    fun `draws the lesson under study in English in the English phase`() {
        show(englishPhase, contentOf(lessonUnderStudy))

        assertDrawn("Read the words", "Stop it and you can study it again.", "2 min")
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
    fun `draws the unreachable school in Spanish with the retry in English in the English phase`() {
        show(englishPhase, SchoolUiState.Failed)

        assertDrawn("School", "Try again", "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("Volver a intentarlo", "We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `writes a later finish day the English way in the English phase`() {
        show(englishPhase, lessonReadyInThreeDays)

        composeRule.onNode(hasText("Nov 8", substring = true), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `writes a later finish day the Spanish way in the Spanish phase`() {
        show(spanishPhase, lessonReadyInThreeDays)

        composeRule.onNode(hasText("8 nov", substring = true), useUnmergedTree = true).assertExists()
    }
}
