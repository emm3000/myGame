package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val readyLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val secondCard: SchoolUiState.LessonCard =
        readyLesson.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        schoolLevel = 1,
        learning = SchoolUiState.LearningLine(inLearning = 0, cap = 10, wordsPastCap = null),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(readyLesson),
        releasedLessons = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        nextStepTime = null,
        start = SchoolUiState.LessonRequest.Idle,
        stop = SchoolUiState.LessonRequest.Idle,
    )

    private fun busySlot(remaining: Duration): SchoolUiState.SlotLine.Busy =
        SchoolUiState.SlotLine.Busy(firstLesson, firstLessonName, remaining = remaining, total = 150.seconds)

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private fun showSlowRead() {
        show(SchoolUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
    }

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onReviewsOpen = { },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onReportOpen = { },
                    onHoldoutCheckOpen = { _, _ -> },
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

    private fun refusedStart(refusal: TownLessonRefusal): SchoolUiState.Content =
        idleSchool.copy(start = SchoolUiState.LessonRequest.Refused(firstLesson, refusal))

    @Test
    fun `draws the due checks the school is handed`() {
        val firstBandDue: HoldoutCheckRow = HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = idleSchool,
                    onIntent = {},
                    onReviewsOpen = {},
                    onLessonOpen = {},
                    onReportOpen = {},
                    onHoldoutCheckOpen = { _, _ -> },
                    holdoutChecks = {
                        HoldoutCheckRows(HoldoutCheckRowsUiState(listOf(firstBandDue)), onHoldoutCheckOpen = {})
                    },
                )
            }
        }

        showing("Tienes pendiente una prueba de palabras de la banda 1, semana 8.")
    }

    @Test
    fun `draws the skeleton's blocks while a slow read loads`() {
        showSlowRead()

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(5)
    }

    @Test
    fun `never draws the reading line`() {
        showSlowRead()

        composeRule.onAllNodesWithText(READING_LINE).assertCountEquals(0)
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
    fun `names the school with its level`() {
        show(idleSchool.copy(schoolLevel = 2))

        composeRule.onNodeWithText("Escuela").assertIsDisplayed()
        composeRule.onNodeWithText("Nivel 2").assertIsDisplayed()
    }

    @Test
    fun `draws the words in learning and the cap`() {
        show(idleSchool.copy(learning = SchoolUiState.LearningLine(8, 10, wordsPastCap = null)))

        showing("Palabras en aprendizaje: 8 de 10")
    }

    @Test
    fun `names one word past the cap in the singular`() {
        show(idleSchool.copy(learning = SchoolUiState.LearningLine(8, 10, wordsPastCap = 1)))

        showing("La siguiente lección trae 1 palabra. Empieza los repasos.")
    }

    @Test
    fun `names several words past the cap in the plural`() {
        show(idleSchool.copy(learning = SchoolUiState.LearningLine(8, 10, wordsPastCap = 5)))

        showing("La siguiente lección trae 5 palabras. Empieza los repasos.")
    }

    @Test
    fun `draws no line past the cap while the next lesson fits`() {
        show(idleSchool)

        composeRule.onAllNodesWithText("Empieza los repasos.", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws an idle slot`() {
        show(idleSchool)

        showing("Ahora no hay ninguna lección en estudio.")
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
    fun `draws the ink pill on the first open lesson alone`() {
        show(idleSchool.copy(lessons = listOf(readyLesson, secondCard)))

        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(hasText("Estudiar la lección 1 · 2:30"))
        composeRule.onAllNodesWithTag(OUTLINED_PILL).assertCountEquals(0)
    }

    @Test
    fun `starts a ready lesson from its button`() {
        show(idleSchool)

        composeRule.onNodeWithText("Estudiar la lección 1 · 2:30").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(firstLesson)), intents)
    }

    @Test
    fun `announces a start while it waits`() {
        show(idleSchool.copy(start = SchoolUiState.LessonRequest.Waiting))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Esperando"))
            .assertExists()
    }

    @Test
    fun `names a school too low for a lesson`() {
        show(blocked(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)))

        announcing("Necesita la escuela en nivel 2")
    }

    @Test
    fun `names the count in learning on a lesson past the cap`() {
        show(blocked(SchoolUiState.LessonBlock.CapReached(inLearning = 8, cap = 10, wordCount = 5)))

        announcing("Palabras en aprendizaje: 8 de 10. Esta lección trae 5.")
    }

    @Test
    fun `names the running lesson on a busy school`() {
        show(blocked(SchoolUiState.LessonBlock.SlotBusy(name = firstLessonName)))

        announcing("La escuela está estudiando la lección 1.")
    }

    @Test
    fun `draws the block of a lesson under its button`() {
        show(blocked(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)))

        composeRule.onNodeWithTag(LESSON_BLOCK_LINE).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws no block on a ready lesson`() {
        show(idleSchool)

        composeRule.onNodeWithTag(LESSON_BLOCK_LINE).assertDoesNotExist()
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
        show(idleSchool.copy(start = SchoolUiState.LessonRequest.Unreachable(firstLesson)))

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `keeps a refusal off the lesson that did not ask`() {
        show(
            idleSchool.copy(
                lessons = listOf(readyLesson, secondCard),
                start = SchoolUiState.LessonRequest.Refused(secondLesson, TownLessonRefusal.LessonUnderStudy),
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
                start = SchoolUiState.LessonRequest.Unreachable(secondLesson),
            ),
        )

        composeRule
            .onAllNodesWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertCountEquals(0)
    }

    @Test
    fun `opens the words of the running lesson`() {
        show(idleSchool.copy(slot = busySlot(150.seconds)))

        composeRule.onNodeWithText("Leer las palabras").performScrollTo().performClick()

        assertEquals(listOf(firstLesson), lessonOpens)
    }

    @Test
    fun `draws a running lesson's countdown in seconds in its last minute`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        showing("0:42")
    }

    @Test
    fun `draws a running lesson's countdown in minutes`() {
        show(idleSchool.copy(slot = busySlot(150.seconds)))

        showing("2 min")
    }

    @Test
    fun `rounds a running lesson's countdown up to the whole second`() {
        show(idleSchool.copy(slot = busySlot(42.5.seconds)))

        showing("0:43")
    }

    @Test
    fun `rounds a lesson's duration up to the whole second`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(duration = 149.5.seconds))))

        showing("Estudiar la lección 1 · 2:30")
    }

    @Test
    fun `fills the track with the share of the lesson already run`() {
        show(idleSchool.copy(slot = busySlot(37.5.seconds)))

        composeRule
            .onNode(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.ProgressBarRangeInfo,
                    ProgressBarRangeInfo(current = 0.75f, range = 0f..1f),
                ),
            )
            .assertExists()
    }

    @Test
    fun `keeps a refused stop beside an idle slot`() {
        show(
            idleSchool.copy(
                stop = SchoolUiState.LessonRequest.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a refused stop beside a finished lesson`() {
        show(
            idleSchool.copy(
                slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName),
                stop = SchoolUiState.LessonRequest.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a stop's outage beside an idle slot`() {
        show(idleSchool.copy(stop = SchoolUiState.LessonRequest.Unreachable(firstLesson)))

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `draws a countdown of whole hours`() {
        show(idleSchool.copy(slot = busySlot(2.hours)))

        showing("2 h")
    }

    @Test
    fun `draws a countdown of hours and minutes`() {
        show(idleSchool.copy(slot = busySlot(1.hours + 20.minutes)))

        showing("1 h 20 min")
    }

    @Test
    fun `names the running lesson in the slot`() {
        show(idleSchool.copy(slot = busySlot(42.seconds), lessons = emptyList()))

        showing("Lección 1")
    }

    @Test
    fun `says what a stop leaves`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        showing("Si lo paras, la lección queda por estudiar y puedes volver a empezarla.")
    }

    @Test
    fun `stops a running lesson from its button`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        composeRule.onNodeWithContentDescription("Parar el estudio de la lección 1").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StopTapped(firstLesson)), intents)
    }

    @Test
    fun `names the lesson a stop button stops`() {
        show(idleSchool.copy(slot = busySlot(42.seconds)))

        composeRule.onNodeWithContentDescription("Parar el estudio de la lección 1").assertExists()
    }

    @Test
    fun `announces a stop while it waits`() {
        show(idleSchool.copy(slot = busySlot(42.seconds), stop = SchoolUiState.LessonRequest.Waiting))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Esperando"))
            .assertExists()
    }

    @Test
    fun `keeps a refused stop beside the slot`() {
        show(
            idleSchool.copy(
                slot = busySlot(42.seconds),
                stop = SchoolUiState.LessonRequest.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            ),
        )

        showing("La escuela ya no estudia esa lección. No queda nada que parar.")
    }

    @Test
    fun `keeps a stop's outage beside the slot`() {
        show(
            idleSchool.copy(
                slot = busySlot(42.seconds),
                stop = SchoolUiState.LessonRequest.Unreachable(firstLesson),
            ),
        )

        showing("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }

    @Test
    fun `draws a finished lesson while the town reads again`() {
        show(idleSchool.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName), lessons = emptyList()))

        showing("Lección 1")
        showing("La lección está lista. Estamos leyendo tu pueblo otra vez…")
    }

    @Test
    fun `marks a studied lesson and offers no button`() {
        show(idleSchool.copy(lessons = listOf(readyLesson.copy(state = SchoolUiState.LessonState.Studied))))

        showing("Estudiada")
        composeRule.onAllNodesWithText("Estudiar la lección 1", substring = true).assertCountEquals(0)
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
        const val REVEAL_MARGIN_MILLIS: Long = 50
    }
}
