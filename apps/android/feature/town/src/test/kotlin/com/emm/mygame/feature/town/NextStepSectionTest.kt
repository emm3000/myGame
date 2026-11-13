package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NextStepSectionTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val thirdLesson: LessonId = LessonId("lesson-3")

    private val lessonsHeld: List<TownSnapshot.Lesson> =
        listOf(lessonOf(firstLesson, wordCount = 5), lessonOf(secondLesson, wordCount = 6), lessonOf(thirdLesson))

    private val runningLesson: TownSnapshot.LessonSlot =
        TownSnapshot.LessonSlot(secondLesson, readInstant, readInstant + 7.minutes)

    private val releasedLesson: LessonId = LessonId("released-2-3")

    private val dueCheck: NextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)

    private val releasedStep: NextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.Second, position = 3)

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private val intents: MutableList<TownIntent> = mutableListOf()

    private var reviewsOpens: Int = 0

    private var schoolOpens: Int = 0

    private var reportOpens: Int = 0

    @Test
    fun `opens the unread lesson first from the reviews state`() {
        show(townOf(nextStep = NextStep.Reviews(3, listOf(secondLesson, thirdLesson))))

        pill("Leer las palabras").performClick()

        assertEquals(listOf(secondLesson), lessonOpens)
    }

    @Test
    fun `opens the reviews when no word is unread`() {
        show(townOf(nextStep = NextStep.Reviews(3, readFirst = emptyList())))

        pill("Empezar los repasos").performClick()

        assertEquals(1, reviewsOpens)
    }

    @Test
    fun `counts the reviews due`() {
        show(townOf(nextStep = NextStep.Reviews(1200, readFirst = emptyList())))

        composeRule.onNodeWithText("Repasos pendientes: 1 200").assertExists()
    }

    @Test
    fun `shows the running lesson's time beside the reviews`() {
        show(townOf(nextStep = NextStep.Reviews(3, readFirst = emptyList()), lessonSlot = runningLesson))

        composeRule.onNodeWithText("Lección 2 lista en").assertExists()
        composeRule.onNodeWithText("7 min").assertExists()
    }

    @Test
    fun `shows no time beside the reviews with no lesson running`() {
        show(townOf(nextStep = NextStep.Reviews(3, readFirst = emptyList())))

        composeRule.onAllNodesWithText("Lección", substring = true).assertCountEquals(0)
    }

    @Test
    fun `opens the words of the running lesson`() {
        show(townOf(nextStep = NextStep.LessonRunning(producer = null), lessonSlot = runningLesson))

        pill("Leer las palabras").performClick()

        assertEquals(listOf(secondLesson), lessonOpens)
    }

    @Test
    fun `names the producer to build`() {
        show(townOf(nextStep = NextStep.LessonRunning(NextStep.Producer.Farm), lessonSlot = runningLesson))

        composeRule.onNodeWithText("Construye la granja").assertExists()
    }

    @Test
    fun `names the factory and the power station by their own lines`() {
        val shown: List<Pair<NextStep.Producer, String>> = listOf(
            NextStep.Producer.Factory to "Construye la fábrica",
            NextStep.Producer.PowerStation to "Construye la central eléctrica",
        )
        val home = mutableStateOf<TownUiState>(contentOf(townOf()))
        composeRule.setContent { MyGameTheme { Screen(home.value) } }

        shown.forEach { (producer: NextStep.Producer, line: String) ->
            home.value = contentOf(townOf(nextStep = NextStep.LessonRunning(producer), lessonSlot = runningLesson))
            composeRule.waitForIdle()

            composeRule.onNodeWithText(line).assertExists()
        }
    }

    @Test
    fun `names no producer when the step names none`() {
        show(townOf(nextStep = NextStep.LessonRunning(producer = null), lessonSlot = runningLesson))

        composeRule.onAllNodesWithText("Construye", substring = true).assertCountEquals(0)
        composeRule.onNodeWithText("En estudio").assertExists()
    }

    @Test
    fun `opens the school with the next review's time`() {
        show(townOf(nextStep = NextStep.LessonToStudy(secondLesson), nextDueAt = readInstant + 9.minutes))

        composeRule.onNodeWithText("Siguiente repaso:").assertExists()
        composeRule.onNodeWithText("9 min").assertExists()
        pill("Estudiar la lección 2").performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `titles the lesson to study with its words`() {
        show(townOf(nextStep = NextStep.LessonToStudy(secondLesson)))

        composeRule.onNodeWithText("Lección 2").assertExists()
        composeRule.onNodeWithText("6 palabras").assertExists()
    }

    @Test
    fun `shows no time on a lesson to study with no review ahead`() {
        show(townOf(nextStep = NextStep.LessonToStudy(secondLesson)))

        composeRule.onAllNodesWithText("Siguiente repaso:").assertCountEquals(0)
    }

    @Test
    fun `names the band of a due check`() {
        show(townOf(nextStep = dueCheck))

        composeRule.onNodeWithText("Prueba de palabras de la banda 2").assertExists()
    }

    @Test
    fun `opens the due check by its band and week`() {
        show(townOf(nextStep = dueCheck))

        pill("Abrir la prueba").performClick()

        assertEquals(
            listOf<TownIntent>(TownIntent.HoldoutCheckTapped(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)),
            intents,
        )
    }

    @Test
    fun `numbers the released lesson by its set in the band`() {
        show(townOf(nextStep = releasedStep))

        composeRule.onNodeWithText("Palabras que vuelven: banda 2, grupo 3").assertExists()
    }

    @Test
    fun `starts the released lesson from the pill`() {
        show(townOf(nextStep = releasedStep))

        pill("Estudiar las palabras que vuelven").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.ReleasedLessonTapped(releasedLesson)), intents)
    }

    @Test
    fun `draws a refused released lesson start under the pill`() {
        val refused: TownUiState.Content = contentOf(townOf(nextStep = releasedStep))
            .copy(lessonStart = TownUiState.LessonStartStatus.Refused(TownLessonRefusal.StudySlotBusy))
        composeRule.setContent { MyGameTheme { Screen(refused) } }

        composeRule.onNodeWithText("La escuela ya tiene un estudio en marcha. Espera a que termine.").assertExists()
    }

    @Test
    fun `draws no lesson number while a released lesson runs`() {
        val runningReleased: TownSnapshot.LessonSlot =
            TownSnapshot.LessonSlot(releasedLesson, readInstant, readInstant + 7.minutes)
        show(townOf(nextStep = NextStep.LessonRunning(producer = null), lessonSlot = runningReleased))

        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `opens the school for the words of a running released lesson`() {
        val runningReleased: TownSnapshot.LessonSlot =
            TownSnapshot.LessonSlot(releasedLesson, readInstant, readInstant + 7.minutes)
        show(townOf(nextStep = NextStep.LessonRunning(producer = null), lessonSlot = runningReleased))

        pill("Leer las palabras").performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `opens the Report when caught up`() {
        show(townOf(nextStep = NextStep.CaughtUp(goal = null)))

        pill("Ir al informe").performClick()

        assertEquals(1, reportOpens)
    }

    @Test
    fun `tells when the next review is due once caught up`() {
        show(townOf(nextStep = NextStep.CaughtUp(goal = null), nextDueAt = readInstant + 30.seconds))

        composeRule.onNodeWithText("No tienes repasos pendientes ahora.").assertExists()
        composeRule.onNodeWithText("Siguiente repaso:").assertExists()
        composeRule.onNodeWithText("0:30").assertExists()
    }

    @Test
    fun `holds one strong button on the town home`() {
        val home = mutableStateOf<TownUiState>(contentOf(townOf()))
        composeRule.setContent { MyGameTheme { Screen(home.value) } }
        val steps: List<TownSnapshot> = listOf(
            townOf(nextStep = NextStep.Reviews(3, listOf(secondLesson))),
            townOf(nextStep = NextStep.Reviews(3, readFirst = emptyList())),
            townOf(nextStep = NextStep.LessonRunning(NextStep.Producer.Farm), lessonSlot = runningLesson),
            townOf(nextStep = NextStep.LessonToStudy(secondLesson)),
            townOf(nextStep = dueCheck),
            townOf(nextStep = releasedStep),
            townOf(nextStep = NextStep.CaughtUp(goal = null)),
        )

        steps.forEach { town: TownSnapshot ->
            home.value = contentOf(town)
            composeRule.waitForIdle()

            composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
        }
    }

    @Test
    fun `draws the school first`() {
        show(townOf())

        assertTrue(lastTopOf("Escuela") < lastTopOf("Hogares"))
    }

    @Test
    fun `writes the title on the peach block`() {
        show(townOf())

        composeRule.onNode(hasText("TU SIGUIENTE PASO") and blockOf(MyGameBlockHue.Peach)).assertExists()
    }

    @Test
    fun `reads the title as written to TalkBack`() {
        show(townOf())

        composeRule.onNodeWithContentDescription("Tu siguiente paso").assertExists()
    }

    @Test
    fun `stacks two blocks behind the next step`() {
        show(townOf())

        composeRule.onAllNodes(blockOf(MyGameBlockHue.Mint), useUnmergedTree = true).assertCountEquals(1)
        composeRule.onAllNodes(blockOf(MyGameBlockHue.Lavender), useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `sets the pill under the block on paper`() {
        show(townOf())

        composeRule.onNode(hasText("Ir al informe") and blockOf(MyGameBlockHue.Peach)).assertDoesNotExist()
        assertTrue(bottomOfBlock() <= composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().top)
    }

    @Test
    fun `sets the next step above the doors`() {
        show(townOf())

        assertTrue(composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().bottom <= topOf("Informe"))
    }

    private fun blockOf(hue: MyGameBlockHue): SemanticsMatcher =
        SemanticsMatcher.expectValue(BLOCK_HUE, hue)

    private fun bottomOfBlock(): Dp =
        composeRule.onNode(blockOf(MyGameBlockHue.Peach)).getUnclippedBoundsInRoot().bottom

    private fun pill(label: String) = composeRule.onNode(hasText(label))

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text)[0].getUnclippedBoundsInRoot().top

    private fun lastTopOf(text: String): Dp =
        composeRule.onAllNodesWithText(text).onLast().getUnclippedBoundsInRoot().top

    private fun contentOf(town: TownSnapshot): TownUiState.Content =
        town.copy(lessons = lessonsHeld)
            .contentAt(
                now = readInstant,
                gap = Duration.ZERO,
                mutations = TownMutations.none,
                registered = TownRegistered.nothing,
                hireEntries = emptyMap(),
                closed = ClosedGuidance.none,
            )

    private fun show(town: TownSnapshot) {
        composeRule.setContent { MyGameTheme { Screen(contentOf(town)) } }
    }

    @Composable
    private fun Screen(state: TownUiState) {
        TownScreen(
            state = state,
            onIntent = { intent: TownIntent -> intents += intent },
            onSchoolOpen = { schoolOpens += 1 },
            onReportOpen = { reportOpens += 1 },
            onMapOpen = {},
            onReviewsOpen = { reviewsOpens += 1 },
            onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
        )
    }

    private fun lessonOf(id: LessonId, wordCount: Int = 5): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 10.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = wordCount,
        readings = emptyList(),
        standings = emptyList(),
    )
}
