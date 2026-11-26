package com.emm.mygame.feature.town.guidance

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownRequests
import com.emm.mygame.feature.town.TownScreen
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.contentAt
import com.emm.mygame.feature.town.readInstant
import com.emm.mygame.feature.town.townOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TownGuidanceScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val intents: MutableList<TownIntent> = mutableListOf()

    private val factoryGoal: TownGoal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Underway,
    )

    private val closedGoal: ClosedGuidance = ClosedGuidance(tips = emptySet(), isGoalClosed = true)

    private fun lessonsDoneWith(goal: TownGoal): NextStep =
        NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal, text = null)

    private fun pendingGoal(resources: List<TownSnapshot.Cost>, people: Int): TownGoal =
        factoryGoal.copy(state = TownGoal.State.Pending(resources = resources, people = people))

    @Test
    fun `shows no goal when none is left`() {
        show(
            townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)),
            place = TownBuildingKind.Factory,
        )

        composeRule.onAllNodesWithText("En construcción").assertCountEquals(0)
    }

    @Test
    fun `shows no goal beside any other next step`() {
        val otherSteps: List<NextStep> = listOf(
            NextStep.Reviews(3, readFirst = emptyList()),
            NextStep.LessonToStudy(secondLesson),
        )

        val goalLines: List<Int> = otherSteps.map { step: NextStep ->
            val content: TownUiState.Content = contentOf(townOf(nextStep = step))
            listOfNotNull(content.goal).size
        }

        assertEquals(listOf(0, 0), goalLines)
    }

    @Test
    fun `draws the goal under a running lesson`() {
        show(townOf(nextStep = NextStep.LessonRunning(factoryGoal, text = null)), place = TownBuildingKind.Factory)

        composeRule.onNodeWithText("En construcción").assertExists()
    }

    @Test
    fun `draws no goal under a running lesson once the goal is closed`() {
        show(
            townOf(nextStep = NextStep.LessonRunning(factoryGoal, text = null)),
            place = TownBuildingKind.Factory,
            closed = closedGoal,
        )

        composeRule.onAllNodesWithText("En construcción").assertCountEquals(0)
    }

    @Test
    fun `shows a goal underway as in work`() {
        show(
            townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)),
            place = TownBuildingKind.Factory,
        )

        composeRule.onNodeWithText("En construcción").assertExists()
    }

    @Test
    fun `shows the resources a pending goal misses`() {
        val missing: List<TownSnapshot.Cost> = listOf(
            TownSnapshot.Cost(TownResourceKind.Money, 40),
            TownSnapshot.Cost(TownResourceKind.Material, 15),
        )
        show(townOf(nextStep = lessonsDoneWith(pendingGoal(missing, people = 0))), place = TownBuildingKind.Factory)

        composeRule.onNodeWithText("Necesitas 40 de dinero y 15 de material más.").assertExists()
    }

    @Test
    fun `shows the free people a pending goal misses`() {
        show(
            townOf(nextStep = lessonsDoneWith(pendingGoal(resources = emptyList(), people = 3))),
            place = TownBuildingKind.Factory,
        )

        composeRule.onNodeWithText("Gente libre necesaria: 3.").assertExists()
    }

    @Test
    fun `shows a pending goal with nothing missing as ready`() {
        show(
            townOf(nextStep = lessonsDoneWith(pendingGoal(resources = emptyList(), people = 0))),
            place = TownBuildingKind.Factory,
        )

        composeRule.onNodeWithText("Tienes lo que hace falta.").assertExists()
    }

    @Test
    fun `closes the goal`() {
        show(
            townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)),
            place = TownBuildingKind.Factory,
        )

        composeRule.onNodeWithText("Cerrar la meta").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoalClosed), intents)
    }

    @Test
    fun `offers no goal close with no goal`() {
        show(
            townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)),
            place = TownBuildingKind.Factory,
        )

        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(0)
    }

    @Test
    fun `shows the tip under its heading`() {
        show(townOf(tip = TipKind.Office), place = TownBuildingKind.Office)

        composeRule.onNodeWithText("CONSEJO").performScrollTo().assertExists()
        composeRule.onNodeWithText(
            "En la oficina puedes contratar trabajadores y camiones. Envíalos a trabajos en el mapa.",
        ).assertExists()
    }

    @Test
    fun `shows no tip when the api names none`() {
        show(townOf(tip = null), place = TownBuildingKind.School)

        composeRule.onAllNodesWithText("CONSEJO").assertCountEquals(0)
    }

    @Test
    fun `shows each tip by its own line`() {
        val home: MutableState<TownUiState> = mutableStateOf(contentOf(townOf()))
        val opened: MutableState<TownBuildingKind?> = mutableStateOf(null)
        composeRule.setContent { MyGameTheme { Screen(home.value, opened.value) } }

        val lines: Set<String> = TipKind.entries.map { tip: TipKind ->
            home.value = contentOf(townOf(tip = tip))
            opened.value = tipPageOf(tip)
            composeRule.waitForIdle()
            composeRule.onAllNodesWithText("CONSEJO").assertCountEquals(1)
            tipLineOf(tip)
        }.toSet()

        assertEquals(TipKind.entries.size, lines.size)
    }

    @Test
    fun `closes the tip it shows`() {
        show(townOf(tip = TipKind.Jobs), place = TownBuildingKind.Office)

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.TipClosed(TipKind.Jobs)), intents)
    }

    private fun tipPageOf(tip: TipKind): TownBuildingKind = when (tip) {
        TipKind.People -> TownBuildingKind.Homes
        TipKind.Seasons, TipKind.FullStore -> TownBuildingKind.Storage
        TipKind.Office, TipKind.Jobs -> TownBuildingKind.Office
        TipKind.WaitingList -> TownBuildingKind.School
    }

    private fun tipLineOf(tip: TipKind): String {
        val line: String = when (tip) {
            TipKind.People -> "Las obras necesitan gente libre. Construye los hogares para tener más gente."
            TipKind.Seasons -> "En primavera, verano, otoño e invierno, tu pueblo puede ganar más o menos."
            TipKind.WaitingList ->
                "Mientras haya una obra en marcha, otras obras pueden esperar en la lista de espera. " +
                    "Empiezan cuando esa obra esté lista."
            TipKind.Office -> "En la oficina puedes contratar trabajadores y camiones. Envíalos a trabajos en el mapa."
            TipKind.Jobs ->
                "Tus trabajadores y camiones están libres. Envía un equipo a un trabajo en el mapa a cambio de un pago."
            TipKind.FullStore ->
                "Cuando el dinero, la comida, la energía o el material están llenos, tu pueblo no gana más. " +
                    "Construye el almacén para guardar más."
        }
        composeRule.onNodeWithText(line).assertExists()
        return line
    }

    private fun contentOf(
        town: TownSnapshot,
        closed: ClosedGuidance = ClosedGuidance.none,
    ): TownUiState.Content = town.copy(lessons = listOf(lessonOf(secondLesson)))
        .contentAt(
            now = readInstant,
            gap = Duration.ZERO,
            requests = TownRequests.none,
            registered = TownRegistered.nothing,
            hiringEntries = emptyMap(),
            closed = closed,
        )

    private fun show(
        town: TownSnapshot,
        place: TownBuildingKind,
        closed: ClosedGuidance = ClosedGuidance.none,
    ) {
        composeRule.setContent { MyGameTheme { Screen(contentOf(town, closed), place) } }
    }

    @Composable
    private fun Screen(state: TownUiState, place: TownBuildingKind?) {
        TownScreen(
            place = place,
            onPlaceOpen = {},
            onNewsOpen = {},
            state = state,
            onIntent = { intent: TownIntent -> intents += intent },
            onSchoolOpen = {},
            onMapOpen = {},
        )
    }

    private fun lessonOf(id: LessonId): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 10.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        enteringWordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )
}
