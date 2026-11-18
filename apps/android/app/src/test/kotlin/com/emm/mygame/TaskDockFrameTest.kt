package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.performClick
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameDockLine
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusUiState
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w411dp-h891dp")
class TaskDockFrameTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)
        override val sessions: SessionRepository = FakeSessionRepository()
        override val towns: TownRepository = FakeTownRepository()
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = FakeReportRepository()
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
        override val studyReminders: StudyReminderSettings =
            FakeStudyReminderSettings(StudyReminderChoice.firstChoice)
        override val reminderNotifications: ReminderNotifications =
            FakeReminderNotifications(areAllowed = true, canAsk = true)
    }

    private val sent: MutableList<TownStatusIntent> = mutableListOf()

    private fun showingFakeTask(isFilled: Boolean = true) {
        composeRule.setContent {
            MyGameTheme {
                val backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.Town, Destination.Review)
                FramedScreen(
                    kind = FrameKind.Task,
                    doesScreenReadTown = false,
                    chrome = SignedInChrome(
                        dependencies = dependencies,
                        navigator = Navigator(backStack, NavigationLinks()),
                        status = mutableStateOf(TownStatusUiState.none),
                        onStatusIntent = sent::add,
                        banner = {},
                    ),
                ) { frame: ScreenFrame ->
                    FakeTaskRoute(hook = frame.task, isFilled = isFilled)
                }
            }
        }
    }

    @Test
    fun `a task route fills the dock with no door`() {
        showingFakeTask()

        composeRule.onNode(hasText(VERDICT)).assertExists()
        composeRule.onNode(hasTestTag(INK_PILL).and(hasContentDescription("$CHECK, $PROGRESS"))).assertExists()
        composeRule.onAllNodesWithTag(OUTLINED_PILL).assertCountEquals(0)
    }

    @Test
    fun `a task route's dock sends the status's read request`() {
        showingFakeTask()

        composeRule.onNode(hasTestTag(INK_PILL)).performClick()

        composeRule.waitForIdle()
        assertEquals(listOf<TownStatusIntent>(TownStatusIntent.ScreenAnswered), sent)
    }

    @Test
    fun `a task route's dock comes after its content for TalkBack`() {
        showingFakeTask()

        val order: List<String> = composeRule.traversalOrder()

        assertTrue(order.indexOf(CARD) in 0 until order.indexOf(TASK_TITLE))
    }

    @Test
    fun `a task screen draws no dock until its route fills it`() {
        showingFakeTask(isFilled = false)

        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(0)
    }

    @Test
    fun `a task route's dock hides while the keyboard is open`() {
        showingFakeTask()

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(hasContentDescription(CHECK, substring = true)).assertCountEquals(0)
    }

    private companion object {
        const val CARD: String = "The card"
        const val TASK_TITLE: String = "REVIEW"
        const val CHECK: String = "Check"
        const val PROGRESS: String = "Card 2 of 5"
        const val VERDICT: String = "Correct."
    }
}

@Composable
private fun FakeTaskRoute(hook: TaskDockHook, isFilled: Boolean) {
    MyGameText(text = "The card", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
    if (!isFilled) return
    FillTaskDock(
        hook = hook,
        dock = TaskDock(
            line = MyGameDockLine(
                title = MyGameLabel(text = "Review", translation = null),
                step = MyGameLabel(text = "Card 2 of 5", translation = null),
            ),
            go = MyGameDockGo(
                label = MyGameLabel(text = "Check", translation = null),
                isBusy = false,
                busyDescription = "Checking",
                onClick = hook.onAnswered,
            ),
            notice = { MyGameText(text = "Correct.", style = MyGameTypography.body, color = MyGameTheme.colors.ink) },
        ),
    )
}
