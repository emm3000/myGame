package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolNextStepTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val releasedLesson: LessonId = LessonId("released-2-3")

    private val dueCheck: NextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)

    private val releasedStep: NextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.Second, position = 3)

    private val waiting: SemanticsMatcher =
        SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Esperando")

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val holdoutCheckOpens: MutableList<Pair<PlacementBand, HoldoutCheckWeek>> = mutableListOf()

    @Test
    fun `names the band of a due check`() {
        show(contentOf(dueCheck))

        composeRule.onNodeWithText("Prueba de palabras de la banda 2").assertExists()
    }

    @Test
    fun `opens the due check by its band and week`() {
        show(contentOf(dueCheck))

        composeRule.onNode(hasText("Abrir la prueba")).performClick()

        assertEquals(listOf(PlacementBand.Second to HoldoutCheckWeek.TwentyFourth), holdoutCheckOpens)
    }

    @Test
    fun `numbers the released lesson by its set in the band`() {
        show(contentOf(releasedStep))

        composeRule.onNodeWithText("Palabras que vuelven: banda 2, grupo\u00A03").assertExists()
    }

    @Test
    fun `starts the released lesson from the pill`() {
        show(contentOf(releasedStep))

        composeRule.onNode(hasText("Estudiar las palabras que vuelven")).performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(releasedLesson)), intents)
    }

    @Test
    fun `draws a refused released lesson start under the pill`() {
        val refused: SchoolUiState.Content = contentOf(releasedStep)
            .copy(start = SchoolUiState.LessonRequest.Refused(releasedLesson, TownLessonRefusal.StudySlotBusy))
        show(refused)

        composeRule.onNodeWithText("La escuela ya tiene un estudio en marcha. Espera a que termine.").assertExists()
    }

    @Test
    fun `draws the released lesson pill busy while its start waits`() {
        show(contentOf(releasedStep).copy(start = SchoolUiState.LessonRequest.Waiting))

        composeRule.onAllNodes(waiting).assertCountEquals(1)
    }

    @Test
    fun `draws the released lesson pill idle while no start waits`() {
        show(contentOf(releasedStep))

        composeRule.onAllNodes(waiting).assertCountEquals(0)
    }

    @Test
    fun `draws the check pill idle while a start waits`() {
        show(contentOf(dueCheck).copy(start = SchoolUiState.LessonRequest.Waiting))

        composeRule.onAllNodes(waiting).assertCountEquals(0)
    }

    @Test
    fun `draws the server's step in place of the next shelved lesson`() {
        show(contentOf(dueCheck))

        composeRule.onNode(hasTestTag(INK_PILL) and hasText("Abrir la prueba")).assertExists()
    }

    @Test
    fun `keeps the lesson the player selected over the server's step`() {
        show(contentOf(dueCheck).copy(selected = firstLesson))

        composeRule.onAllNodesWithText("Prueba de palabras de la banda 2").assertCountEquals(0)
    }

    @Test
    fun `holds one strong button with either step`() {
        val school = mutableStateOf<SchoolUiState>(contentOf(dueCheck))
        composeRule.setContent { MyGameTheme { Screen(school.value) } }

        listOf(dueCheck, releasedStep).forEach { step: NextStep ->
            school.value = contentOf(step)
            composeRule.waitForIdle()

            composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
        }
    }

    private fun contentOf(step: NextStep): SchoolUiState.Content = townOf(nextStep = step)
        .contentAt(now = readInstant, gap = Duration.ZERO, mutations = SchoolMutations.none, selected = null)

    private fun show(state: SchoolUiState) {
        composeRule.setContent { MyGameTheme { Screen(state) } }
    }

    @Composable
    private fun Screen(state: SchoolUiState) {
        SchoolScreen(
            state = state,
            onIntent = { intent: SchoolIntent -> intents += intent },
            onReviewsOpen = {},
            onLessonOpen = {},
            onReportOpen = {},
            onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek -> holdoutCheckOpens += band to week },
        )
    }
}
