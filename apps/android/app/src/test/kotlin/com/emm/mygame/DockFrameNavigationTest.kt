package com.emm.mygame

import android.accessibilityservice.AccessibilityServiceInfo
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import androidx.activity.ComponentActivity
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.compose.ui.test.onRoot
import org.robolectric.Shadows.shadowOf
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.unit.DpRect as Rect
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.hiringOf
import com.emm.mygame.feature.town.TOWN_DOCK
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class DockFrameNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
        override val studyReminders: StudyReminderSettings =
            FakeStudyReminderSettings(StudyReminderChoice.firstChoice)
        override val reminderNotifications: ReminderNotifications =
            FakeReminderNotifications(areAllowed = true, canAsk = true)
    }

    private val readAt: Instant = Clock.System.now()

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private fun lessonOf(id: LessonId): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 5.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )

    private fun townOf(nextStep: NextStep = NextStep.CaughtUp(goal = null)): TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(
            TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null),
            TownSnapshot.Building(TownBuildingKind.Office, level = 0, next = null),
        ),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = listOf(lessonOf(firstLesson)),
        releasedLessons = emptyList(),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        stableWordCount = 0,
        retainedWordCount = 0,
        lessonSlot = null,
        hiring = hiringOf(),
        job = null,
        nextStep = nextStep,
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )

    private fun showing(vararg destinations: NavKey, town: TownSnapshot = townOf(), townReads: Int = READS_AVAILABLE) {
        repeat(SESSION_READS) { sessionsFake.answerRestore(verifiedSession) }
        repeat(townReads) { townsFake.answerRead(TownReadResult.Read(town)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations),
                )
            }
        }
    }

    private fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun inTheDock(label: String): SemanticsMatcher = hasText(label).and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun goInTheDock(label: String): SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true))
            .and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun dockGo(label: String): SemanticsNodeInteraction {
        waitFor(goInTheDock(label))
        return composeRule.onNode(goInTheDock(label))
    }

    private fun dockNode(label: String): SemanticsNodeInteraction {
        waitFor(inTheDock(label))
        return composeRule.onNode(inTheDock(label))
    }

    @Test
    fun `the town home's door is the Report`() {
        showing(Destination.Town)
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))

        dockNode("Informe").performClick()

        waitFor(hasText("NOTICIAS DEL PUEBLO"))
    }

    @Test
    fun `the school's door is the town and the header has no back link`() {
        showing(Destination.Town, Destination.School)
        waitFor(hasText("Escuela", substring = true))

        composeRule.onAllNodesWithText("PUEBLO").assertCountEquals(0)
        dockNode("Pueblo").performClick()

        waitFor(hasText(TOWN_HEADER))
    }

    @Test
    fun `the Report's own step waits and sends nothing`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        showing(Destination.Town, Destination.Report)
        val go: SemanticsNodeInteraction = dockGo("Ir al informe")
        composeRule.waitForIdle()
        val townReads: Int = townsFake.readCount

        go.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, NO_REVIEWS_DUE)).performClick()

        composeRule.waitForIdle()
        composeRule.onNode(hasText("NOTICIAS DEL PUEBLO")).assertExists()
        assertEquals(townReads, townsFake.readCount)
        assertEquals(1, reportsFake.readCount)
    }

    @Test
    fun `the school's study step studies that lesson in place`() {
        townsFake.answerLesson(TownLessonResult.Unreachable)
        showing(Destination.Town, Destination.School, town = townOf(nextStep = NextStep.LessonToStudy(firstLesson)))

        dockGo("Estudiar la lección 1 · 5:00").performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.lessonStarts == listOf(firstLesson) }
        composeRule.onAllNodesWithText(TOWN_HEADER).assertCountEquals(0)
    }

    private fun assertOneGoButton() {
        dockGo("Ir al informe")
        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
    }

    @Test
    fun `the town home draws one go button`() {
        showing(Destination.Town)

        assertOneGoButton()
    }

    @Test
    fun `the school draws one go button`() {
        showing(Destination.Town, Destination.School)

        assertOneGoButton()
    }

    @Test
    fun `the Report draws one go button`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue.copy(dueCount = 3)))
        val reviewsDue: TownSnapshot = townOf(NextStep.Reviews(count = 3, readFirst = emptyList()))
        showing(Destination.Town, Destination.Report, town = reviewsDue)
        dockGo("Empezar los repasos")
        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
    }

    @Test
    fun `the news draws one go button`() {
        showing(Destination.Town, Destination.Report, Destination.News)

        assertOneGoButton()
    }

    @Test
    fun `the map draws one go button`() {
        showing(Destination.Town, Destination.Map)

        assertOneGoButton()
    }

    @Test
    fun `the settings draw one go button`() {
        showing(Destination.Town, Destination.Report, Destination.Settings)

        assertOneGoButton()
    }

    @Test
    fun `a loading dock waits and its door still opens the town`() {
        showing(Destination.Town, Destination.Report, townReads = 0)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))

        dockNode("Pueblo").performClick()
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(townOf())) }

        waitFor(hasText(TOWN_HEADER))
    }

    @Test
    fun `a refused dock offers the retry and its door still opens the town`() {
        repeat(STATUS_AND_RING_READS) { townsFake.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, Destination.Report, townReads = 0)
        dockGo(TRY_AGAIN)

        dockNode("Pueblo").performClick()
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(townOf())) }

        waitFor(hasText(TOWN_HEADER))
    }

    @Test
    fun `closing the news reads the town again`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue.copy(news = listOf(TownNews.LessonStopped(readAt)))))
        reportsFake.answerClose(ReportCloseResult.Closed)
        showing(Destination.Town, Destination.Report)
        waitFor(hasText(CLOSE_NEWS))

        composeRule.onNode(hasText(CLOSE_NEWS)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.sentAfterNowCount == 1 }
    }

    @Test
    fun `starting a lesson reads the town again`() {
        val studying: TownSnapshot = townOf(nextStep = NextStep.LessonRunning(goal = null))
        townsFake.answerLesson(TownLessonResult.Answered(studying))
        showing(Destination.Town, Destination.School, town = townOf(nextStep = NextStep.LessonToStudy(firstLesson)))

        dockGo("Estudiar la lección 1 · 5:00").performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.sentAfterNowCount == 1 }
    }

    @Test
    fun `the school's read-words step waits while the lesson is studied`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = NextStep.LessonRunning(goal = null)))

        val studying: SemanticsMatcher =
            SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "En estudio")
        dockGo("Leer las palabras").assert(studying)
    }

    @Test
    fun `the dock comes right after the header for TalkBack`() {
        showing(Destination.Town, Destination.School, town = townOf().copy(learning = learningWithRing))
        dockGo("Ir al informe")
        waitFor(hasContentDescription(THREE_OF_FIVE))

        val order: List<String> = traversalOrder()

        assertEquals(DOCK_TITLE, order[order.indexOf(THREE_OF_FIVE) + 1])
    }

    @Test
    fun `the dock hides while the keyboard is open`() {
        showing(Destination.Town, Destination.School)
        dockGo("Ir al informe")

        keyboard(isOpen = true)

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
        keyboard(isOpen = false)
        dockGo("Ir al informe")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock puts its line at the top of the scrolling area`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        dockGo(STUDY_RELEASED)
        val atTheTop: SemanticsMatcher = hasText(RELEASED_LINE).and(hasAnyAncestor(hasScrollAction()))
        waitFor(atTheTop)

        val line: Rect = composeRule.onNode(atTheTop).getBoundsInRoot()
        val title: Rect = composeRule.onNode(hasText("Escuela").and(isHeading())).getBoundsInRoot()

        assertTrue(line.bottom <= title.top)
        composeRule.onAllNodes(inTheDock(RELEASED_LINE)).assertCountEquals(0)
    }

    private fun keyboard(isOpen: Boolean) {
        val compose: View = checkNotNull(composeViewIn(composeRule.activity.window.decorView))
        val insets: WindowInsetsCompat = WindowInsetsCompat.Builder()
            .setInsets(WindowInsetsCompat.Type.ime(), Insets.of(0, 0, 0, if (isOpen) KEYBOARD_HEIGHT else 0))
            .setVisible(WindowInsetsCompat.Type.ime(), isOpen)
            .build()
        composeRule.runOnUiThread { ViewCompat.dispatchApplyWindowInsets(compose, insets) }
        composeRule.waitForIdle()
    }

    private fun traversalOrder(): List<String> {
        val activity: ComponentActivity = composeRule.activity
        val manager: AccessibilityManager = activity.getSystemService(AccessibilityManager::class.java)
        shadowOf(manager).setEnabled(true)
        shadowOf(manager).setTouchExplorationEnabled(true)
        shadowOf(manager).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
        composeRule.waitForIdle()
        val compose: View = checkNotNull(composeViewIn(activity.window.decorView))
        val provider: AccessibilityNodeProvider = compose.accessibilityNodeProvider
        val nodes: Map<Int, AccessibilityNodeInfo> = semanticsIds().mapNotNull { id: Int ->
            provider.createAccessibilityNodeInfo(id)?.let { node: AccessibilityNodeInfo ->
                provider.addExtraDataToAccessibilityNodeInfo(id, node, TRAVERSAL_BEFORE, null)
                id to node
            }
        }.toMap()
        val next: Map<Int, Int> = nodes.mapNotNull { (id: Int, node: AccessibilityNodeInfo) ->
            node.extras.getInt(TRAVERSAL_BEFORE, NO_NODE).takeIf { before: Int -> before != NO_NODE }?.let { id to it }
        }.toMap()
        val first: Int = next.keys.first { id: Int -> id !in next.values }
        return generateSequence(first) { id: Int -> next[id] }
            .mapNotNull { id: Int -> nodes[id]?.let { node: AccessibilityNodeInfo -> labelOf(node) } }
            .toList()
    }

    private fun labelOf(node: AccessibilityNodeInfo): String? =
        node.text?.toString() ?: node.contentDescription?.toString()

    private fun semanticsIds(): List<Int> {
        val ids: MutableList<Int> = mutableListOf()
        fun walk(node: SemanticsNode) {
            ids += node.id
            node.children.forEach(::walk)
        }
        walk(composeRule.onRoot(useUnmergedTree = true).fetchSemanticsNode())
        return ids
    }

    private fun composeViewIn(view: View): View? {
        if (view is ViewRootForTest) return view
        if (view !is ViewGroup) return null
        return (0 until view.childCount).firstNotNullOfOrNull { index: Int -> composeViewIn(view.getChildAt(index)) }
    }

    private val releasedLesson: NextStep.ReleasedLesson =
        NextStep.ReleasedLesson(LessonId("released-2-1"), PlacementBand.Second, position = 1)

    private val learningWithRing: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = RetainedWords(count = 3, total = 5))

    private companion object {
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
        const val DOCK_TITLE: String = "TU SIGUIENTE PASO"
        const val CLOSE_NEWS: String = "Cerrar las noticias"
        const val WAITING: String = "Esperando"
        const val TRY_AGAIN: String = "Volver a intentarlo"
        const val STUDY_RELEASED: String = "Estudiar las palabras que vuelven"
        const val RELEASED_LINE: String = "Palabras que vuelven: banda 2, grupo 1"
        const val TRAVERSAL_BEFORE: String = "android.view.accessibility.extra.EXTRA_DATA_TEST_TRAVERSALBEFORE_VAL"
        const val NO_NODE: Int = -1
        const val KEYBOARD_HEIGHT: Int = 800
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."

        const val TOWN_HEADER: String = "RIVERTON · PUEBLO"

        val verifiedSession: RestoreResult = RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )
        const val READS_AVAILABLE: Int = 5
        const val SESSION_READS: Int = 2
        const val STATUS_AND_RING_READS: Int = 2
        const val WAIT_MILLIS: Long = 5_000
    }
}
