package com.emm.mygame.feature.review

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintWord
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Duration.Companion.days
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class ReviewLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val recognizing: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 3,
        card = ReviewUiState.ReviewCard.Recognition(
            wordId = WordId("lesson-1-2"),
            word = "school",
            frame = plainFrame("The kids walk to school."),
            choices = listOf(
                ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "dinero"),
                ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "escuela"),
            ),
            chosen = null,
            openSpan = null,
        ),
        step = ReviewUiState.ReviewStep.Answering,
        isDealtFromStack = false,
    )

    private val recalling: ReviewUiState.Reviewing = recognizing.copy(
        card = ReviewUiState.ReviewCard.Recall(
            wordId = WordId("lesson-1-1"),
            gloss = "casa",
            gappedFrame = plainFrame("She goes ___ at six."),
            typed = "",
            hint = null,
            openSpan = null,
        ),
    )

    private val wrong: ReviewUiState.Reviewing = recalling.copy(
        card = (recalling.card as ReviewUiState.ReviewCard.Recall).copy(typed = "house"),
        step = ReviewUiState.ReviewStep.Wrong(correct = "home"),
    )

    private val rightWithSkill: ReviewUiState.Reviewing = recognizing.copy(
        card = (recognizing.card as ReviewUiState.ReviewCard.Recognition).copy(chosen = ChoiceId("4e5f6a7b")),
        step = ReviewUiState.ReviewStep.Correct(
            skill = ReviewUiState.SkillLine(
                resource = TownResourceKind.Food,
                level = 2,
                ratePercent = 10,
                rates = ReviewUiState.SkillRates(before = 60L, after = 66L),
                words = listOf("school", "home"),
            ),
        ),
    )

    private val refused: ReviewUiState.Reviewing =
        recognizing.copy(step = ReviewUiState.ReviewStep.Refused(ReviewRefusal.ReviewNotDue))

    private val nothingDueInThreeDays: ReviewUiState.NothingDue = ReviewUiState.NothingDue(
        remaining = 3.days,
        dueAt = Instant.parse("2026-11-08T12:00:00Z"),
        path = ReviewUiState.LessonPath(
            number = 1,
            counts = SchoolPathCounts(held = 5, read = 5, reviewed = 3, learned = 1),
        ),
    )

    private fun show(language: CopyLanguage, state: ReviewUiState) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    ReviewScreen(state = state, onIntent = {}, onLessonOpen = {}, onTownOpen = {})
                }
            }
        }
    }

    private fun assertDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(1) }
    }

    private fun assertNotDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(0) }
    }

    private fun assertPartlyDrawn(part: String) {
        composeRule.onAllNodes(hasText(part, substring = true), useUnmergedTree = true).assertCountEquals(1)
    }

    private fun lineOf(text: String): DpRect =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot()

    @Test
    fun `draws the review in Spanish in the Spanish phase`() {
        show(spanishPhase, recognizing)

        assertDrawn("Repaso", "Por repasar: 3", "¿Qué significa?", "Comprobar")
        assertNotDrawn("Reviews", "Reviews due: 3", "What does it mean?", "Check")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase, recognizing)

        assertDrawn("Reviews", "Repaso", "Reviews due: 3", "Por repasar: 3")
        assertTrue(lineOf("Reviews").bottom <= lineOf("Repaso").top)
        assertTrue(lineOf("Reviews due: 3").bottom <= lineOf("Por repasar: 3").top)
    }

    @Test
    fun `draws the review card in Spanish alone in the both phase`() {
        show(bothPhase, recognizing)

        assertDrawn("¿Qué significa?", "Comprobar")
        assertNotDrawn("What does it mean?", "Check")
    }

    @Test
    fun `draws the review in English in the English phase`() {
        show(englishPhase, recognizing)

        assertDrawn("Reviews", "Reviews due: 3")
        assertNotDrawn("Repaso", "Por repasar: 3")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, recognizing)

        assertDrawn("¿Qué significa?", "Comprobar")
        assertNotDrawn("What does it mean?", "Check")
    }

    @Test
    fun `draws the recall card in Spanish for an es player in the English phase`() {
        show(englishPhase, recalling)

        assertDrawn("¿Cómo se dice en inglés?", "Tu respuesta en inglés", "Pedir una pista")
        assertNotDrawn("How do you say it in English?", "Your answer in English", "Ask for a hint")
    }

    @Test
    fun `draws a wrong verdict in Spanish for an es player in the English phase`() {
        show(englishPhase, wrong)

        assertDrawn("No es correcto.", "Tu respuesta: house", "La correcta: home")
        assertDrawn("Esta palabra volverá en unos minutos.", "Siguiente")
        assertNotDrawn("That is not correct.", "Your answer: house", "Next")
    }

    @Test
    fun `draws the verdict's rates in Spanish beside the earned skill in English in the English phase`() {
        show(englishPhase, rightWithSkill)

        assertDrawn("Correcto.", "Comida: +60 / h, ahora +66 / h", "Skill earned: food, level 2.", "+10 % food / h.")
        assertPartlyDrawn("Palabras:")
        assertNotDrawn("Correct.", "Food: +60 / h, now +66 / h", "Habilidad ganada: comida, nivel 2.")
    }

    @Test
    fun `draws a refusal in Spanish beside its retry in English in the English phase`() {
        show(englishPhase, refused)

        assertDrawn(
            "Esa palabra aún no toca repasarla. Vuelve al repaso para ver las que sí.",
            "Try again",
        )
        assertNotDrawn("Volver a intentarlo")
    }

    @Test
    fun `writes the next review's day the English way in the English phase`() {
        show(englishPhase, nothingDueInThreeDays)

        assertDrawn("No reviews due now.", "Lesson 1", "Back to your town")
        assertPartlyDrawn("Nov 8")
    }

    @Test
    fun `writes the next review's day the Spanish way in the Spanish phase`() {
        show(spanishPhase, nothingDueInThreeDays)

        assertDrawn("No tienes nada que repasar ahora.", "Lección 1", "Volver a tu pueblo")
        assertPartlyDrawn("8 nov")
    }

    @Test
    fun `draws the review in English under none`() {
        show(noScaffold, recognizing)

        assertDrawn("Reviews", "Reviews due: 3", "What does it mean?", "Check")
        assertNotDrawn("Repaso", "Por repasar: 3", "¿Qué significa?", "Comprobar")
    }

    @Test
    fun `draws every verdict line in English under none`() {
        show(noScaffold, rightWithSkill)

        assertDrawn("Correct.", "Food: +60 / h, now +66 / h", "Skill earned: food, level 2.", "+10 % food / h.")
        assertPartlyDrawn("Words:")
        assertNotDrawn("Correcto.", "Comida: +60 / h, ahora +66 / h")
    }

    @Test
    fun `draws a failed read in English in the English phase`() {
        show(englishPhase, ReviewUiState.Failed)

        assertDrawn("We could not read your reviews.", "Try again")
        assertNotDrawn("No hemos podido leer tu repaso.", "Volver a intentarlo")
    }

    @Test
    fun `draws the reading line in English in the English phase`() {
        composeRule.mainClock.autoAdvance = false
        show(englishPhase, ReviewUiState.Loading)
        composeRule.mainClock.advanceTimeBy(2L * MyGameTransitions.REVEAL_MILLIS)

        composeRule.onNode(hasContentDescription("Reading your reviews…")).assertExists()
    }

    @Test
    fun `draws no cards in English in the English phase`() {
        show(englishPhase, ReviewUiState.NoCards)

        assertDrawn("You have no words to review.", "Back to your town")
    }

    @Test
    fun `draws a ready lesson in English in the English phase`() {
        show(englishPhase, ReviewUiState.LessonReady(lesson = LessonId("lesson-2"), number = 2))

        assertDrawn("Lesson 2 is ready", "Read the words")
        assertNotDrawn("La lección 2 está lista", "Leer las palabras")
    }

    @Test
    fun `draws the lesson path in English in the English phase`() {
        show(englishPhase, nothingDueInThreeDays)

        assertDrawn("Studied", "Read", "Reviewed", "Learned", "3 of 5")
        assertNotDrawn("Estudiadas", "Repasadas", "3 de 5")
    }

    @Test
    fun `draws a near miss in Spanish for an es player in the English phase`() {
        show(englishPhase, recalling.copy(step = ReviewUiState.ReviewStep.NearMiss))

        assertDrawn("Casi. Revisa cómo se escribe y vuelve a comprobar.")
    }

    @Test
    fun `draws the check in flight in Spanish beside its wait in English in the English phase`() {
        show(englishPhase, recognizing.copy(step = ReviewUiState.ReviewStep.Checking))

        composeRule.onNode(hasText("Comprobando…") and hasStateDescription("Waiting")).assertExists()
    }

    @Test
    fun `draws the empty recall's block reason in Spanish for an es player in the English phase`() {
        show(englishPhase, recalling)

        composeRule.onNode(hasText("Comprobar") and hasStateDescription("Escribe tu respuesta para comprobarla."))
            .assertExists()
    }

    @Test
    fun `draws a hint in Spanish for an es player in the English phase`() {
        val hinted: ReviewUiState.Reviewing = recalling.copy(
            card = (recalling.card as ReviewUiState.ReviewCard.Recall).copy(
                hint = ReviewHint(words = listOf(ReviewHintWord(firstLetter = "h", letterCount = 4))),
            ),
        )

        show(englishPhase, hinted)

        assertDrawn("Empieza por «h» y tiene 4 letras.")
    }

    @Test
    fun `draws an outage in Spanish for an es player in the English phase`() {
        show(englishPhase, recognizing.copy(step = ReviewUiState.ReviewStep.Unreachable))

        assertDrawn("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `draws the skill's lines in Spanish in the Spanish phase`() {
        show(spanishPhase, rightWithSkill)

        assertDrawn("Habilidad ganada: comida, nivel 2.", "+10 % de comida / h.", "Comida: +60 / h, ahora +66 / h")
    }
}
