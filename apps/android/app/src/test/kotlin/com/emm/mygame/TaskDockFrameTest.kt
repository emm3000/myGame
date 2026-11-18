package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
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
import com.emm.mygame.core.ui.FoldedTaskEnd
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Clock

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

    private fun showingFakeTask(
        isFilled: Boolean = true,
        isFollowingTown: Boolean = false,
        status: TownStatusUiState = TownStatusUiState.none,
    ) {
        composeRule.setContent {
            MyGameTheme {
                val backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.Town, Destination.Review)
                FramedScreen(
                    kind = FrameKind.Task,
                    doesScreenReadTown = false,
                    chrome = SignedInChrome(
                        dependencies = dependencies,
                        navigator = Navigator(backStack, NavigationLinks()),
                        status = mutableStateOf(status),
                        onStatusIntent = sent::add,
                        banner = {},
                    ),
                ) { frame: ScreenFrame ->
                    FakeTaskRoute(frame = frame, isFilled = isFilled, isFollowingTown = isFollowingTown)
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
    fun `the folded dock rides above the keyboard`() {
        showingFakeTask()

        composeRule.keyboard(isOpen = true, height = PORTRAIT_KEYBOARD)

        val keyboardTop: Dp = composeRule.onRoot().getUnclippedBoundsInRoot().bottom - PORTRAIT_KEYBOARD.dp
        val go: SemanticsNodeInteraction =
            composeRule.onNode(hasContentDescription(CHECK, substring = true) and isPlaced)
        go.assertIsDisplayed()
        assertTrue(go.getUnclippedBoundsInRoot().bottom <= keyboardTop)
        composeRule.onAllNodes(hasText(VERDICT) and isPlaced and !hasAnyAncestor(hasScrollAction()))
            .assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp")
    fun `a task's dock hides when even its folded dock does not fit above the keyboard`() {
        showingFakeTask()

        composeRule.keyboard(isOpen = true, height = LANDSCAPE_KEYBOARD)

        composeRule.onAllNodes(hasContentDescription(CHECK, substring = true) and isPlaced).assertCountEquals(0)
    }

    @Test
    fun `a task's dock comes back once the keyboard closes`() {
        showingFakeTask()
        composeRule.keyboard(isOpen = true)

        composeRule.keyboard(isOpen = false)

        composeRule.onNode(hasContentDescription(CHECK, substring = true) and isPlaced).assertIsDisplayed()
    }

    @Test
    fun `a task route that follows the town draws the town's step with no door`() {
        showingFakeTask(isFilled = false, isFollowingTown = true, status = refusedTown)

        composeRule.onNode(hasTestTag(INK_PILL)).performClick()

        composeRule.waitForIdle()
        composeRule.onAllNodesWithTag(OUTLINED_PILL).assertCountEquals(0)
        assertEquals(listOf<TownStatusIntent>(TownStatusIntent.TryAgainTapped), sent)
    }

    @Test
    fun `a task's town step comes after its content for TalkBack`() {
        showingFakeTask(isFilled = false, isFollowingTown = true, status = refusedTown)

        val order: List<String> = composeRule.traversalOrder()

        val line: Int = order.indexOfFirst { label: String -> label.equals(TOWN_LINE_TITLE, ignoreCase = true) }
        assertTrue(order.indexOf(CARD) in 0 until line)
    }

    @Test
    @Config(qualifiers = "+w360dp-h320dp", fontScale = 2.0f)
    fun `a task's folded town step reads after its content and before its go button`() {
        showingFakeTask(isFilled = false, isFollowingTown = true, status = refusedTown)
        val foldedLine: SemanticsMatcher =
            hasContentDescription(TOWN_LINE_TITLE) and isPlaced and hasAnyAncestor(hasScrollAction())
        composeRule.onNode(foldedLine).assertExists()

        val read: List<Int> = readInOrder(hasText(CARD), foldedLine, placedGo)

        assertEquals(listOf(idOf(hasText(CARD)), idOf(foldedLine), idOf(placedGo)), read)
    }

    @Test
    @Config(qualifiers = "+w360dp-h480dp", fontScale = 2.0f)
    fun `a task's folded dock hands its line to the content, read after the card and before the go button`() {
        showingFakeTask()

        val read: List<Int> = readInOrder(hasText(CARD), hasText(PROGRESS), placedGo)

        assertEquals(listOf(idOf(hasText(CARD)), idOf(hasText(PROGRESS)), idOf(placedGo)), read)
    }

    @Test
    fun `a task route that does not follow the town hides the town's step`() {
        showingFakeTask(isFilled = false, status = refusedTown)

        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(0)
    }

    private fun idOf(matcher: SemanticsMatcher): Int =
        composeRule.onAllNodes(matcher and isPlaced, useUnmergedTree = true).onFirst().fetchSemanticsNode().id

    private fun readInOrder(vararg matchers: SemanticsMatcher): List<Int> {
        val ids: Set<Int> = matchers.map(::idOf).toSet()
        return composeRule.traversalIds().filter { id: Int -> id in ids }
    }

    private companion object {
        val refusedTown: TownStatusUiState = TownStatusUiState.none.copy(dock = TownStatusUiState.Dock.Refused)

        const val CARD: String = "The card"
        const val TOWN_LINE_TITLE: String = "Tu siguiente paso"
        const val TASK_TITLE: String = "REVIEW"
        const val CHECK: String = "Check"
        const val PROGRESS: String = "Card 2 of 5"
        const val VERDICT: String = "Correct."
        const val PORTRAIT_KEYBOARD: Int = 600
        const val LANDSCAPE_KEYBOARD: Int = 250
    }
}

private val placedGo: SemanticsMatcher = SemanticsMatcher("the placed go button") { node ->
    node.layoutInfo.isPlaced && node.config.getOrElseNullable(SemanticsProperties.TestTag) { null } == INK_PILL
}

private val isPlaced: SemanticsMatcher = SemanticsMatcher("is placed") { node -> node.layoutInfo.isPlaced }

@Composable
private fun FakeTaskRoute(frame: ScreenFrame, isFilled: Boolean, isFollowingTown: Boolean) {
    val hook: TaskDockHook = frame.task
    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        MyGameText(text = "The card", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        FoldedTaskEnd(hook = hook, foldedDock = frame.foldedDock, scrollKey = null)
    }
    if (isFollowingTown) FollowTownDock(hook = hook)
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
