package com.emm.mygame.feature.school

import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnySibling
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import com.emm.mygame.core.designsystem.BLOCKED_LOCK
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class SchoolScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val readyLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        enteringWordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val secondCard: SchoolUiState.LessonCard =
        readyLesson.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(readyLesson),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        start = SchoolUiState.LessonRequestStatus.Idle,
        stop = SchoolUiState.LessonRequestStatus.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
    )

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private fun showSlowRead() {
        show(SchoolUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
    }

    private fun drawnReadingLines(): Int =
        composeRule.onAllNodesWithText(READING_LINE, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onTextOpen = {},
                )
            }
        }
    }

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
    }

    private fun announcing(state: String) {
        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, state))
            .performScrollTo()
            .assertIsDisplayed()
    }

    private fun blocked(block: SchoolUiState.LessonBlock): SchoolUiState.Content =
        idleSchool.copy(lessons = listOf(readyLesson.copy(state = SchoolUiState.LessonState.Open(block))))

    private val busyForAQuarter: SchoolUiState.LessonBlock = SchoolUiState.LessonBlock.SlotBusy(
        name = firstLessonName,
        remaining = 15.minutes,
        freesAt = Instant.parse("2026-11-05T10:15:00Z"),
    )

    private fun refusedStart(refusal: TownLessonRefusal): SchoolUiState.Content =
        idleSchool.copy(start = SchoolUiState.LessonRequestStatus.Refused(firstLesson, refusal))

    private val handedSlot: String = "Handed slot"

    @Test
    fun `draws the holdout checks slot it is handed`() {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = idleSchool,
                    onIntent = {},
                    onLessonOpen = {},
                    onTextOpen = {},
                    holdoutChecks = { BasicText(handedSlot) },
                )
            }
        }

        showing(handedSlot)
    }

    @Test
    fun `draws the holdout note once a band has started`() {
        show(idleSchool.copy(isHoldoutNoteShown = true))

        showing(HOLDOUT_NOTE)
    }

    @Test
    fun `draws no holdout note while no band has started`() {
        show(idleSchool)

        composeRule.onAllNodesWithText(HOLDOUT_NOTE).assertCountEquals(0)
    }

    @Test
    fun `draws the holdout note under the lessons`() {
        show(idleSchool.copy(lessons = listOf(readyLesson, secondCard), isHoldoutNoteShown = true))

        val lessonRow: SemanticsNode =
            composeRule.onNodeWithText("Work and money", substring = true).fetchSemanticsNode()
        val lessonsBottom: Float = lessonRow.positionInRoot.y + lessonRow.size.height
        val noteTop: Float = composeRule.onNodeWithText(HOLDOUT_NOTE).fetchSemanticsNode().positionInRoot.y

        assertTrue("note at $noteTop under the lessons ending at $lessonsBottom", noteTop > lessonsBottom)
    }

    @Test
    fun `draws the skeleton's blocks while a slow read loads`() {
        showSlowRead()

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(5)
    }

    @Test
    fun `draws the reading line once the read is slower than the reveal delay`() {
        composeRule.mainClock.autoAdvance = false
        show(SchoolUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS - REVEAL_MARGIN_MILLIS)
        val drawnBeforeTheReveal: Int = drawnReadingLines()

        composeRule.mainClock.advanceTimeBy(2 * REVEAL_MARGIN_MILLIS)

        assertEquals(listOf(0, 1), listOf(drawnBeforeTheReveal, drawnReadingLines()))
    }

    @Test
    fun `speaks the reading line in a polite live region`() {
        showSlowRead()

        composeRule.onNodeWithContentDescription(READING_LINE)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `draws a failed read with its reason`() {
        show(SchoolUiState.Failed)

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
    }

    @Test
    fun `offers a retry on a failed read`() {
        show(SchoolUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.RetryTapped), intents)
    }

    @Test
    fun `draws lesson 1 with its theme`() {
        show(idleSchool)

        showing("Lección 1")
        showing("A day in town")
    }

    @Test
    fun `sums up a lesson with its words and skill`() {
        show(idleSchool)

        showing("5 palabras · Habilidad: comida +5\u00A0%")
    }

    @Test
    fun `counts one word in the singular`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(wordCount = 1))))

        showing("1 palabra · Habilidad: comida +5\u00A0%")
    }

    @Test
    fun `draws the study pill on the first open lesson alone`() {
        show(idleSchool.copy(lessons = listOf(readyLesson, secondCard)))

        composeRule
            .onNodeWithTag(OUTLINED_PILL)
            .assert(hasText("Estudiar la lección 1 · 2:30"))
    }

    @Test
    fun `starts a ready lesson from its button`() {
        show(idleSchool)

        composeRule.onNodeWithText("Estudiar la lección 1 · 2:30").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(firstLesson)), intents)
    }

    @Test
    fun `announces a start while it waits`() {
        show(idleSchool.copy(start = SchoolUiState.LessonRequestStatus.Waiting))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Enviando…"))
            .assertExists()
    }

    @Test
    fun `names a school too low for a lesson`() {
        show(blocked(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)))

        announcing("Necesita la escuela en nivel 2")
    }

    @Test
    fun `says how many more words a lesson past the cap needs room for`() {
        show(blocked(SchoolUiState.LessonBlock.CapReached(shortWords = 3)))

        announcing("Necesita espacio para 3 palabras más en tu aprendizaje.")
    }

    @Test
    fun `says room for one more word in the singular`() {
        show(blocked(SchoolUiState.LessonBlock.CapReached(shortWords = 1)))

        announcing("Necesita espacio para 1 palabra más en tu aprendizaje.")
    }

    @Test
    fun `says when a busy school frees its slot`() {
        show(blocked(busyForAQuarter))

        announcing("La escuela está estudiando la lección 1. Queda libre en 15\u00A0min.")
    }

    @Test
    fun `draws the time a busy school frees under the blocked button`() {
        show(blocked(busyForAQuarter))

        composeRule.onNodeWithText("Queda libre en 15\u00A0min.", substring = true, useUnmergedTree = true)
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws the block of a lesson under its button`() {
        show(blocked(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)))

        composeRule.onNodeWithText("Necesita la escuela en nivel 2", useUnmergedTree = true)
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws no block on a ready lesson`() {
        show(idleSchool)

        composeRule.onNodeWithTag(BLOCKED_LOCK, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `keeps a blocked lesson's button sending`() {
        show(blocked(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)))

        composeRule.onNodeWithText("Estudiar la lección 1 · 2:30").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(firstLesson)), intents)
    }

    @Test
    fun `refuses past the cap with the api's cap and count`() {
        show(refusedStart(TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 8)))

        showing("Palabras en aprendizaje: 8 de 10. Repásalas antes de empezar otra lección.")
    }

    @Test
    fun `reads a lesson already studied`() {
        show(refusedStart(TownLessonRefusal.LessonAlreadyStudied))

        showing("Ya estudiaste esa lección: sus palabras están en tu repaso.")
    }

    @Test
    fun `reads a school too low from the api`() {
        show(refusedStart(TownLessonRefusal.LessonSchoolTooLow))

        showing("Esa lección necesita una escuela de más nivel. Súbela primero.")
    }

    @Test
    fun `reads a lesson under study`() {
        show(refusedStart(TownLessonRefusal.LessonUnderStudy))

        showing("La escuela ya está estudiando esa lección. Espera a que termine.")
    }

    @Test
    fun `reads a busy study slot in the school's words`() {
        show(refusedStart(TownLessonRefusal.StudySlotBusy))

        showing("La escuela ya tiene un estudio en marcha. Espera a que termine.")
    }

    @Test
    fun `reads a refusal for a player with no town`() {
        show(refusedStart(TownLessonRefusal.TownNotFound))

        showing("Aún no tienes pueblo. Ponle nombre para fundarlo.")
    }

    @Test
    fun `reads an unrecognized refusal as an outage`() {
        show(refusedStart(TownLessonRefusal.Unrecognized))

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `keeps an outage beside the lesson that asked`() {
        show(idleSchool.copy(start = SchoolUiState.LessonRequestStatus.Unreachable(firstLesson)))

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `keeps a refusal off the lesson that did not ask`() {
        show(
            idleSchool.copy(
                lessons = listOf(readyLesson, secondCard),
                start = SchoolUiState.LessonRequestStatus.Refused(secondLesson, TownLessonRefusal.LessonUnderStudy),
            ),
        )

        composeRule
            .onAllNodesWithText("La escuela ya está estudiando esa lección. Espera a que termine.")
            .assertCountEquals(0)
    }

    @Test
    fun `keeps an outage off the lesson that did not ask`() {
        show(
            idleSchool.copy(
                lessons = listOf(readyLesson, secondCard),
                start = SchoolUiState.LessonRequestStatus.Unreachable(secondLesson),
            ),
        )

        composeRule
            .onAllNodesWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertCountEquals(0)
    }

    @Test
    fun `rounds a lesson's duration up to the whole second`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(duration = 149.5.seconds))))

        showing("Estudiar la lección 1 · 2:30")
    }

    @Test
    fun `marks a studied lesson and offers no button`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(state = SchoolUiState.LessonState.Studied))))

        showing("Estudiada")
        composeRule.onAllNodesWithText("Estudiar la lección 1", substring = true).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a studied lesson's row at font scale 2 keeps its title on one line beside its status`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(state = SchoolUiState.LessonState.Studied))))

        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNode(hasText("Lección 1") and hasAnySibling(hasText("Estudiada")), useUnmergedTree = true)
            .fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)

        assertEquals("the title's lines", 1, results.first().lineCount)
    }

    @Test
    fun `marks a running lesson and offers no button`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(state = SchoolUiState.LessonState.Studying))))

        composeRule.onAllNodesWithText("Estudiar la lección 1", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("En estudio").assertCountEquals(2)
    }

    @Test
    fun `says when no skill is earned`() {
        show(idleSchool)

        showing("Aún no tienes habilidades.")
    }

    @Test
    fun `lists each earned skill with its resource and percent`() {
        show(
            idleSchool.copy(
                skills = listOf(
                    SchoolUiState.SkillLine(firstLesson, TownResourceKind.Food, level = 1, ratePercent = 5),
                    SchoolUiState.SkillLine(secondLesson, TownResourceKind.Power, level = 2, ratePercent = 7),
                ),
            ),
        )

        showing("Habilidad de comida, nivel 1")
        showing("+5 % de comida")
        showing("Habilidad de energía, nivel 2")
        showing("+7 % de energía")
    }

    @Test
    fun `keeps a skill's rate in tabular figures`() {
        show(
            idleSchool.copy(
                skills = listOf(
                    SchoolUiState.SkillLine(firstLesson, TownResourceKind.Food, level = 1, ratePercent = 5),
                ),
            ),
        )

        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        val rate: SemanticsNode = composeRule.onNodeWithText("+5 % de comida").fetchSemanticsNode()
        rate.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)

        assertEquals("tnum", layouts.single().layoutInput.style.fontFeatureSettings)
    }

    @Test
    fun `names the other two resources of a skill`() {
        show(
            idleSchool.copy(
                skills = listOf(
                    SchoolUiState.SkillLine(firstLesson, TownResourceKind.Money, level = 1, ratePercent = 5),
                    SchoolUiState.SkillLine(secondLesson, TownResourceKind.Material, level = 1, ratePercent = 5),
                ),
            ),
        )

        showing("+5 % de dinero")
        showing("+5 % de material")
    }

    private companion object {
        const val READING_LINE: String = "Estamos leyendo tu pueblo…"
        const val HOLDOUT_NOTE: String =
            "1 de cada 10 palabras se aparta para dos pruebas posteriores y vuelve después de la última."
        const val REVEAL_MARGIN_MILLIS: Long = 50
    }
}
