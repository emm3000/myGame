package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
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
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.NAV_ROW_CHEVRON
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FoldedTaskEnd
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.feature.town.TownStatus
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusUiState
import com.emm.mygame.feature.town.TownUiState
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

    private val dependencies: AppDependencies = dependenciesOf()

    private val sent: MutableList<TownStatusIntent> = mutableListOf()

    private fun showingFakeTask(
        kind: FrameKind = FrameKind.Task,
        isFilled: Boolean = true,
        isFollowingTown: Boolean = false,
        status: TownStatusUiState = TownStatusUiState.none,
        cardHeight: Dp = 0.dp,
        banner: @Composable (TownStatusUiState.Dock?) -> Unit = {},
    ) {
        composeRule.setContent {
            MyGameTheme {
                val backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.Town, Destination.Review)
                FramedScreen(
                    kind = kind,
                    doesScreenReadTown = false,
                    chrome = SignedInChrome(
                        dependencies = dependencies,
                        navigator = Navigator(backStack, NavigationLinks()),
                        status = mutableStateOf(status),
                        onStatusIntent = sent::add,
                        banner = banner,
                    ),
                ) { frame: ScreenFrame ->
                    if (kind == FrameKind.Home) frame.status()
                    FakeTaskRoute(
                        frame = frame,
                        isFilled = isFilled,
                        isFollowingTown = isFollowingTown,
                        cardHeight = cardHeight,
                    )
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

        val read: List<Int> = readInOrder(hasText(CARD), placedGo)

        assertEquals(listOf(idOf(hasText(CARD)), idOf(placedGo)), read)
    }

    @Test
    fun `a task screen draws no dock until its route fills it`() {
        showingFakeTask(isFilled = false)

        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(0)
    }

    @Test
    fun `the dock rides above the keyboard`() {
        showingFakeTask()

        composeRule.keyboard(isOpen = true, height = PORTRAIT_KEYBOARD)

        val keyboardTop: Dp = composeRule.onRoot().getUnclippedBoundsInRoot().bottom - PORTRAIT_KEYBOARD.dp
        val go: SemanticsNodeInteraction =
            composeRule.onNode(hasContentDescription(CHECK, substring = true) and isPlaced)
        go.assertIsDisplayed()
        assertTrue(go.getUnclippedBoundsInRoot().bottom <= keyboardTop)
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp")
    fun `a task's dock hides when even its folded dock does not fit above the keyboard`() {
        showingFakeTask()

        composeRule.keyboard(isOpen = true, height = LANDSCAPE_KEYBOARD)

        composeRule.onAllNodes(hasContentDescription(CHECK, substring = true) and isPlaced).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp", fontScale = 2.0f)
    fun `a task's folded end leaves the card in view while the keyboard is open`() {
        showingFakeTask(cardHeight = TALL_CARD.dp)

        composeRule.keyboard(isOpen = true, height = LANDSCAPE_KEYBOARD)

        composeRule.onNode(hasText(CARD)).assertIsDisplayed()
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
    fun `a task's town notice comes after its content for TalkBack`() {
        showingFakeTask(isFilled = false, isFollowingTown = true, status = refusedTown)

        val read: List<Int> = readInOrder(hasText(CARD), hasText(TOWN_UNREACHABLE))

        assertEquals(listOf(idOf(hasText(CARD)), idOf(hasText(TOWN_UNREACHABLE))), read)
    }

    @Test
    @Config(qualifiers = "+w360dp-h320dp", fontScale = 2.0f)
    fun `a task's folded town notice reads after its content and before its go button`() {
        showingFakeTask(isFilled = false, isFollowingTown = true, status = refusedTown)
        val foldedNotice: SemanticsMatcher =
            hasText(TOWN_UNREACHABLE) and isPlaced and hasAnyAncestor(hasScrollAction())
        composeRule.onNode(foldedNotice, useUnmergedTree = true).assertExists()

        val read: List<Int> = readInOrder(hasText(CARD), foldedNotice, placedGo)

        assertEquals(listOf(idOf(hasText(CARD)), idOf(foldedNotice), idOf(placedGo)), read)
    }

    @Test
    @Config(qualifiers = "+w360dp-h480dp", fontScale = 2.0f)
    fun `a task's folded dock hands its notice to the content, read after the card and before the go button`() {
        showingFakeTask()

        val read: List<Int> = readInOrder(hasText(CARD), hasText(VERDICT), placedGo)

        assertEquals(listOf(idOf(hasText(CARD)), idOf(hasText(VERDICT)), idOf(placedGo)), read)
    }

    @Test
    fun `a task's dock draws no line, and its notice above its go button`() {
        showingFakeTask()

        composeRule.onAllNodes(hasText(PROGRESS) and isPlaced, useUnmergedTree = true).assertCountEquals(0)
        val notice: DpRect = placedBounds(hasText(VERDICT) and !hasAnyAncestor(hasScrollAction()))
        val go: DpRect = placedBounds(placedGo)
        assertTrue(notice.bottom <= go.top)
    }

    @Test
    fun `a task route that does not follow the town hides the town's step`() {
        showingFakeTask(isFilled = false, status = refusedTown)

        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(0)
    }

    @Test
    fun `a task screen with its own dock draws the finish notice's way on`() {
        showingFakeTask(status = finishedWithWordsToRead, banner = finishNotice)

        composeRule.onNode(wayOnToTheWords, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `a place frame draws the finish notice's way on while the keyboard hides the dock`() {
        showingFakeTask(
            kind = FrameKind.Place,
            isFilled = false,
            status = finishedWithWordsToRead,
            banner = finishNotice,
        )

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(wayOnToTheWords, useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `the town home's frame draws the finish notice's way on while the keyboard hides the dock`() {
        showingFakeTask(
            kind = FrameKind.Home,
            isFilled = false,
            status = finishedWithWordsToRead,
            banner = finishNotice,
        )

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(wayOnToTheWords, useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `a task screen that follows the town draws no way on beside the town's go to the same words`() {
        showingFakeTask(
            isFilled = false,
            isFollowingTown = true,
            status = finishedWithWordsToRead,
            banner = finishNotice,
        )

        composeRule.onAllNodes(wayOnToTheWords, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `a task screen that follows the town draws no way on while the keyboard is open`() {
        showingFakeTask(
            isFilled = false,
            isFollowingTown = true,
            status = finishedWithWordsToRead,
            banner = finishNotice,
        )

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(wayOnToTheWords, useUnmergedTree = true).assertCountEquals(0)
    }

    private val finishNotice: @Composable (TownStatusUiState.Dock?) -> Unit = { dock: TownStatusUiState.Dock? ->
        TownStatus(
            state = finishedWithWordsToRead,
            dock = dock,
            onNoticeClose = {},
            onLessonOpen = {},
            onReviewsOpen = {},
        )
    }

    private fun placedBounds(matcher: SemanticsMatcher): DpRect =
        composeRule.onAllNodes(matcher and isPlaced).onFirst().getUnclippedBoundsInRoot()

    private fun idOf(matcher: SemanticsMatcher): Int =
        composeRule.onAllNodes(matcher and isPlaced).onFirst().fetchSemanticsNode().id

    private fun readInOrder(vararg matchers: SemanticsMatcher): List<Int> {
        val ids: Set<Int> = matchers.map(::idOf).toSet()
        return composeRule.traversalIds().filter { id: Int -> id in ids }
    }

    private companion object {
        val refusedTown: TownStatusUiState = TownStatusUiState.none.copy(dock = TownStatusUiState.Dock.Refused)

        val unreadLesson: LessonId = LessonId("lesson-2")

        val finishedWithWordsToRead: TownStatusUiState = TownStatusUiState(
            running = null,
            notice = TownStatusUiState.FinishNotice(LessonName.Shelved(number = 2), firstUnread = unreadLesson),
            dock = TownStatusUiState.Dock.Step(
                line = NextStepCard.Line.Lesson(number = 3),
                detail = null,
                countdown = null,
                go = TownStatusUiState.Go.Acts(NextStepCard.Action.ReadWords(unreadLesson), isBusy = false),
                lessonStart = TownUiState.LessonStartStatus.Idle,
                capWait = null,
            ),
        )

        val wayOnToTheWords: SemanticsMatcher = hasClickAction() and
            hasAnyDescendant(hasText("Leer las palabras")) and
            hasAnyDescendant(hasTestTag(NAV_ROW_CHEVRON))

        const val CARD: String = "The card"
        const val TOWN_UNREACHABLE: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val CHECK: String = "Check"
        const val PROGRESS: String = "Card 2 of 5"
        const val VERDICT: String = "Correct."
        const val PORTRAIT_KEYBOARD: Int = 600
        const val LANDSCAPE_KEYBOARD: Int = 250
        const val TALL_CARD: Int = 300
    }
}

private val placedGo: SemanticsMatcher = SemanticsMatcher("the placed go button") { node ->
    node.layoutInfo.isPlaced && node.config.getOrElseNullable(SemanticsProperties.TestTag) { null } == INK_PILL
}

private val isPlaced: SemanticsMatcher = SemanticsMatcher("is placed") { node -> node.layoutInfo.isPlaced }

@Composable
private fun FakeTaskRoute(frame: ScreenFrame, isFilled: Boolean, isFollowingTown: Boolean, cardHeight: Dp) {
    val hook: TaskDockHook = frame.task
    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        MyGameText(text = "The card", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        Spacer(modifier = Modifier.height(cardHeight))
        FoldedTaskEnd(hook = hook, foldedDock = frame.foldedDock, shownNotice = null)
    }
    if (isFollowingTown) FollowTownDock(hook = hook)
    if (!isFilled) return
    FillTaskDock(
        hook = hook,
        dock = TaskDock(
            step = MyGameLabel(text = "Card 2 of 5", translation = null),
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
