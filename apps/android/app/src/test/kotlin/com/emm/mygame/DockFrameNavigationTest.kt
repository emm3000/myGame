package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect as Rect
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.DueReview
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckChangeResult
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.HoldoutChecksReadResult
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChangeResult
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordId
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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class DockFrameNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val placementsFake: FakePlacementRepository = FakePlacementRepository()

    private val holdoutChecksFake: FakeHoldoutCheckRepository = FakeHoldoutCheckRepository()

    private val learningFake: FakeLearningRepository = FakeLearningRepository()

    private var shownStack: NavBackStack<NavKey>? = null

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = learningFake
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = placementsFake
        override val holdoutChecks: HoldoutCheckRepository = holdoutChecksFake
        override val studyReminders: StudyReminderSettings =
            FakeStudyReminderSettings(StudyReminderChoice.firstChoice)
        override val reminderNotifications: ReminderNotifications =
            FakeReminderNotifications(areAllowed = true, canAsk = true)
    }

    private val readAt: Instant = Clock.System.now()

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val noCards: DueReviews =
        DueReviews(due = emptyList(), readFirst = emptyList(), nextDueAt = null, readAt = readAt)

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
                    backStack = rememberNavBackStack(*destinations).also { shown: NavBackStack<NavKey> ->
                        shownStack = shown
                    },
                )
            }
        }
    }

    private fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun firstFrameShowing(matcher: SemanticsMatcher) {
        repeat(FRAME_LIMIT) {
            composeRule.mainClock.advanceTimeByFrame()
            if (composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()) return
        }
        fail("no frame drew $matcher")
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

    @Test
    fun `the school studies the lesson the status shows when its own read is older`() {
        val older: TownSnapshot = townOf()
        val newer: TownSnapshot = townOf(nextStep = NextStep.LessonToStudy(secondLesson))
            .copy(lessons = listOf(lessonOf(firstLesson).copy(isStudied = true), lessonOf(secondLesson)))
        showing(Destination.Town, Destination.School, townReads = 0)
        townsFake.answerRead(TownReadResult.Read(older))
        townsFake.answerRead(TownReadResult.Read(newer))

        dockGo(STUDY_SECOND).performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.lessonStarts == listOf(secondLesson) }
    }

    @Test
    fun `a refused start of the lesson the status shows draws its line on the school`() {
        val older: TownSnapshot = townOf()
        val newer: TownSnapshot = townOf(nextStep = NextStep.LessonToStudy(secondLesson))
            .copy(lessons = listOf(lessonOf(firstLesson).copy(isStudied = true), lessonOf(secondLesson)))
        townsFake.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Town, Destination.School, townReads = 0)
        townsFake.answerRead(TownReadResult.Read(older))
        townsFake.answerRead(TownReadResult.Read(newer))

        dockGo(STUDY_SECOND).performClick()

        waitFor(hasText(STUDY_SLOT_BUSY))
    }

    private fun assertOneGoButton() {
        dockGo("Ir al informe")
        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
    }

    @Test
    fun `a review answer reads the town again`() {
        val recall: DueReview.Recall = DueReview.Recall(
            wordId = WordId("lesson-1-1"),
            lesson = firstLesson,
            dueAt = readAt,
            gloss = "casa",
            gappedFrame = listOf(FrameSpan(text = "She goes ___ at six.", support = null)),
        )
        learningFake.answerRead(ReviewsReadResult.Read(noCards.copy(due = listOf(recall))))
        learningFake.answerReview(
            ReviewAnswerResult.Answered(ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = readAt)),
        )
        showing(Destination.Town, Destination.Review)
        waitFor(hasSetTextAction())

        composeRule.onNode(hasSetTextAction()).performTextInput("house")
        composeRule.onNode(hasTestTag(INK_PILL).and(hasContentDescription("Comprobar", substring = true)))
            .performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.sentAfterNowCount == 1 }
    }

    @Test
    fun `after the last card read the words opens that lesson`() {
        learningFake.answerRead(ReviewsReadResult.Read(noCards))
        showing(
            Destination.Town,
            Destination.Review,
            town = townOf(NextStep.Reviews(count = 0, readFirst = listOf(firstLesson))),
        )

        dockGo(READ_THE_WORDS).performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() is Destination.LessonWords }
        assertEquals(Destination.LessonWords(firstLesson, walked = emptyList()), shownStack?.lastOrNull())
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
    @Config(qualifiers = "+w411dp-h914dp-420dpi")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a loading dock that draws its line stays above the navigation bar`() {
        showing(Destination.Town, townReads = 0)
        composeRule.systemBars(height = NAVIGATION_BAR)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))

        composeRule.mainClock.advanceTimeBy(SKELETON_REVEAL_MILLIS)
        composeRule.waitForIdle()

        val dock: SemanticsNode = composeRule.onNode(hasTestTag(TOWN_DOCK)).fetchSemanticsNode()
        val window: Int = composeRule.onRoot().fetchSemanticsNode().size.height
        assertTrue(dock.boundsInRoot.bottom <= window - NAVIGATION_BAR)
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
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded refused dock puts its door at the top of the town home that could not be read`() {
        repeat(TOWN_STATUS_AND_RING_READS) { townsFake.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, townReads = 0)
        dockGo(TRY_AGAIN)

        waitFor(hasText("Informe").and(hasAnyAncestor(hasScrollAction())))
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp-land")
    fun `the dock keeps its buttons clear of a side navigation bar and a cutout`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        composeRule.sideBars(navigationBar = SIDE_BAR, cutout = CUTOUT)
        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val door: Rect = dockNode("Pueblo").getBoundsInRoot()
        val window: Dp = composeRule.onRoot().getBoundsInRoot().right

        assertTrue(go.left >= SIDE_BAR.dp && door.right <= window - CUTOUT.dp)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock on the school reads the header, its line, its go button, then the school`() {
        assertFoldedOrder(Destination.School, title = "Escuela")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock on the Report reads the header, its line, its go button, then the Report`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        assertFoldedOrder(Destination.Report, title = "Informe")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock on the news reads the header, its line, its go button, then the news`() {
        assertFoldedOrder(Destination.Report, Destination.News, title = "Noticias del pueblo")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock on the map reads the header, its line, its go button, then the map`() {
        assertFoldedOrder(Destination.Map, title = "Mapa")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock on the settings reads the header, its line, its go button, then the settings`() {
        assertFoldedOrder(Destination.Report, Destination.Settings, title = "Ajustes")
    }

    private fun assertFoldedOrder(vararg place: NavKey, title: String) {
        showing(
            Destination.Town,
            *place,
            town = townOf(nextStep = releasedLesson).copy(learning = learningWithRing),
        )
        waitFor(hasText(RELEASED_LINE).and(hasAnyAncestor(hasScrollAction())))
        waitFor(hasContentDescription(THREE_OF_FIVE))
        waitFor(hasText(title, ignoreCase = true).and(isHeading()))

        val header: Int = composeRule.onNode(hasContentDescription(THREE_OF_FIVE)).fetchSemanticsNode().id
        val line: Int = composeRule.onNode(hasText(RELEASED_LINE)).fetchSemanticsNode().id
        val go: Int = dockGo(STUDY_RELEASED).fetchSemanticsNode().id
        val screen: Int = composeRule.onNode(hasText(title, ignoreCase = true).and(isHeading())).fetchSemanticsNode().id
        val expected: List<Int> = listOf(header, line, go, screen)

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(expected, order.filter { id: Int -> id in expected })
    }

    @Test
    fun `the naming screen draws no dock while the status read waits`() {
        showing(Destination.Town, townReads = 0)
        townsFake.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock on its first frame`() {
        showing(Destination.Town, townReads = 0)
        waitFor(hasTestTag(TOWN_DOCK))
        composeRule.mainClock.autoAdvance = false

        townsFake.answerRead(TownReadResult.NoTown)
        firstFrameShowing(hasText(NAMING_TITLE))

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock while it signs out`() {
        showing(Destination.Town, townReads = 0)
        townsFake.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onNodeWithText(SIGN_OUT).performScrollTo().performClick()
        composeRule.waitUntil(WAIT_MILLIS) { sessionsFake.signOutCount == 1 }
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock once the status read is refused`() {
        showing(Destination.Town, townReads = 0)
        townsFake.answerRead(TownReadResult.NoTown)
        repeat(STATUS_AND_RING_READS) { townsFake.answerRead(TownReadResult.Unreachable) }
        waitFor(hasText(NAMING_TITLE))
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
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

    private fun skippingThePlacement() {
        placementsFake.answerRead(PlacementReadResult.Read(Placement.Offered))
        placementsFake.answerChange(PlacementChangeResult.Changed(Placement.Closed(emptyList())))
        showing(Destination.Town, Destination.Placement)
        waitFor(hasText(SKIP_PLACEMENT))
        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)

        composeRule.onNode(hasText(SKIP_PLACEMENT)).performScrollTo().performClick()
    }

    @Test
    fun `the end of the placement reads the town again`() {
        skippingThePlacement()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.sentAfterNowCount == 1 }
    }

    @Test
    fun `after the placement the dock is the town's with no door`() {
        skippingThePlacement()

        waitFor(hasTestTag(INK_PILL).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
        composeRule.onAllNodes(hasTestTag(OUTLINED_PILL).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
            .assertCountEquals(0)
    }

    @Test
    fun `the end of a holdout check reads the town again`() {
        val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)
        holdoutChecksFake.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        holdoutChecksFake.answerChange(HoldoutCheckChangeResult.Changed(emptyList()))
        showing(Destination.Town, Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth))
        waitFor(hasText(SKIP_PLACEMENT))

        composeRule.onNode(hasText(SKIP_PLACEMENT)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { townsFake.sentAfterNowCount == 1 }
    }

    private fun waitForTheContent(matcher: SemanticsMatcher) {
        waitFor(matcher.and(hasAnyAncestor(hasScrollAction())))
    }

    @Test
    @Config(qualifiers = "+w360dp-h320dp", fontScale = 2.0f)
    fun `a folded placement draws its dock's line at the end of its content`() {
        placementsFake.answerRead(PlacementReadResult.Read(Placement.Offered))

        showing(Destination.Town, Destination.Placement)

        waitForTheContent(hasText(PLACEMENT_OFFER_LINE))
    }

    @Test
    @Config(qualifiers = "+w360dp-h320dp", fontScale = 2.0f)
    fun `a folded holdout check draws its dock's line at the end of its content`() {
        val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)
        holdoutChecksFake.answerRead(HoldoutChecksReadResult.Read(listOf(due)))

        showing(Destination.Town, Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth))

        waitForTheContent(hasText(FIRST_BAND))
    }

    @Test
    @Config(qualifiers = "+w360dp-h320dp", fontScale = 2.0f)
    fun `a folded town step draws at the end of the placement's content once it ends`() {
        skippingThePlacement()

        waitForTheContent(hasText(DOCK_TITLE))
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

        val order: List<String> = composeRule.traversalOrder()

        assertEquals(DOCK_TITLE, order[order.indexOf(THREE_OF_FIVE) + 1])
    }

    @Test
    fun `the town home's dock comes right after the home's header for TalkBack`() {
        showing(Destination.Town, town = townOf().copy(learning = learningWithRing))
        dockGo("Ir al informe")
        waitFor(hasContentDescription(THREE_OF_FIVE))

        val order: List<String> = composeRule.traversalOrder()

        assertEquals(DOCK_TITLE, order[order.indexOf(THREE_OF_FIVE) + 1])
    }

    @Test
    fun `the dock hides while the keyboard is open`() {
        showing(Destination.Town, Destination.School)
        dockGo("Ir al informe")

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
        composeRule.keyboard(isOpen = false)
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

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock puts its door at the top of the scrolling area`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        dockGo(STUDY_RELEASED)

        waitFor(hasText("Pueblo").and(hasAnyAncestor(hasScrollAction())))

        composeRule.onAllNodes(inTheDock("Pueblo")).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a folded dock keeps its go button's whole label on screen`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        waitFor(hasText(RELEASED_LINE).and(hasAnyAncestor(hasScrollAction())))

        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val window: Rect = composeRule.onRoot().getBoundsInRoot()

        assertTrue(go.top >= window.top && go.bottom <= window.bottom)
    }

    private val releasedLesson: NextStep.ReleasedLesson =
        NextStep.ReleasedLesson(LessonId("released-2-1"), PlacementBand.Second, position = 1)

    private val learningWithRing: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = RetainedWords(count = 3, total = 5))

    private companion object {
        const val SKIP_PLACEMENT: String = "Saltar la prueba"
        const val PLACEMENT_OFFER_LINE: String =
            "¿Ya sabes algo de inglés? Una prueba corta te deja empezar más adelante."
        const val FIRST_BAND: String = "Banda 1"
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
        const val FRAME_LIMIT: Int = 60
        const val STUDY_SECOND: String = "Estudiar la lección 2 · 5:00"
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
        const val SIGN_OUT: String = "Salir"
        const val DOCK_TITLE: String = "TU SIGUIENTE PASO"
        const val CLOSE_NEWS: String = "Cerrar las noticias"
        const val WAITING: String = "Esperando"
        const val NAVIGATION_BAR: Int = 63
        const val SKELETON_REVEAL_MILLIS: Long = 1_000
        const val TRY_AGAIN: String = "Volver a intentarlo"
        const val STUDY_RELEASED: String = "Estudiar las palabras que vuelven"
        const val RELEASED_LINE: String = "Palabras que vuelven: banda 2, grupo 1"
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."

        const val READ_THE_WORDS: String = "Leer las palabras"
        const val TOWN_HEADER: String = "RIVERTON · PUEBLO"

        val verifiedSession: RestoreResult = RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )
        const val READS_AVAILABLE: Int = 5
        const val SESSION_READS: Int = 2
        const val STATUS_AND_RING_READS: Int = 2
        const val SIDE_BAR: Int = 48
        const val CUTOUT: Int = 30
        const val TOWN_STATUS_AND_RING_READS: Int = 3
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
        const val WAIT_MILLIS: Long = 5_000
    }
}
