package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
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
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect as Rect
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.CaughtUpReason
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
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
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
import com.emm.mygame.core.testing.FakeThemeSettings
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
import kotlin.time.Duration.Companion.hours
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
        override val themes: ThemeSettings = FakeThemeSettings(ThemePick.System)
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

    private fun townOf(
        nextStep: NextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null),
    ): TownSnapshot = TownSnapshot(
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
        texts = emptyList(),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null, nextInLearningDueAt = null),
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
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true).or(hasText(label)))
            .and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun dockGo(label: String): SemanticsNodeInteraction {
        waitFor(goInTheDock(label))
        return composeRule.onNode(goInTheDock(label))
    }

    private val townLink: SemanticsMatcher =
        hasText(TOWN_LINK).and(hasClickAction()).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private val reportRow: SemanticsMatcher =
        hasText(REPORT_ROW).and(hasClickAction()).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun headerLink(): SemanticsNodeInteraction {
        waitFor(townLink)
        return composeRule.onNode(townLink)
    }

    private fun assertHeaderLinkOpensTown(vararg place: NavKey) {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        showing(Destination.Town, *place)
        headerLink()
        composeRule.onAllNodes(hasText("Pueblo", ignoreCase = true).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
            .assertCountEquals(0)

        headerLink().performClick()

        waitFor(hasText(TOWN_HEADER))
        assertEquals(listOf<NavKey>(Destination.Town), shownStack?.toList())
    }

    @Test
    fun `the town home's Report row opens the Report`() {
        showing(Destination.Town, town = townOf(nextStep = releasedLesson))
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        waitFor(reportRow)
        composeRule.onAllNodes(inTheDock(REPORT_ROW)).assertCountEquals(0)

        composeRule.onNode(reportRow).performClick()

        waitFor(hasText("NOTICIAS DEL PUEBLO"))
    }

    @Test
    fun `the school's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.School)
    }

    @Test
    fun `the Report's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report)
    }

    @Test
    fun `the news' header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report, Destination.News)
    }

    @Test
    fun `the settings' header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report, Destination.Settings)
    }

    @Test
    fun `the map's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Map)
    }

    @Test
    fun `the system back button still pops one entry from a place screen`() {
        showing(Destination.Town, Destination.Report, Destination.News)
        headerLink()

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        composeRule.waitForIdle()

        assertEquals(listOf<NavKey>(Destination.Town, Destination.Report), shownStack?.toList())
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

    private val fullCapTown: TownSnapshot =
        townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null)).copy(
            learning = TownSnapshot.Learning(
                cap = 10,
                inLearning = 8,
                retainedWords = null,
                nextInLearningDueAt = readAt + 3.hours,
            ),
        )

    private val drawnText: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.Text)

    @Test
    fun `the school's dock draws neither the cap's line nor the time the next word is due`() {
        showing(Destination.Town, Destination.School, town = fullCapTown)
        waitFor(hasText(NEXT_WORD_DUE, substring = true).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK))))
        dockGo(REPORT_GO)

        composeRule.onAllNodes(hasText(CAP_FIGURE, substring = true).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
            .assertCountEquals(0)
        composeRule.onAllNodes(drawnText.and(hasAnyAncestor(hasTestTag(TOWN_DOCK))).and(!hasTestTag(INK_PILL)))
            .assertCountEquals(0)
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
    fun `the school's go to read the words opens that lesson's words`() {
        showing(
            Destination.Town,
            Destination.School,
            town = townOf(NextStep.Reviews(count = 3, readFirst = listOf(firstLesson))),
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
    fun `a loading dock stays above the navigation bar`() {
        showing(Destination.Town, townReads = 0)
        composeRule.systemBars(height = NAVIGATION_BAR)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
        composeRule.waitForIdle()

        val dock: SemanticsNode = composeRule.onNode(hasTestTag(TOWN_DOCK)).fetchSemanticsNode()
        val window: Int = composeRule.onRoot().fetchSemanticsNode().size.height
        assertTrue(dock.boundsInRoot.bottom <= window - NAVIGATION_BAR)
    }

    @Test
    fun `a loading dock waits and the header's link still opens the town`() {
        showing(Destination.Town, Destination.Report, townReads = 0)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))

        headerLink().performClick()
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(townOf())) }

        waitFor(hasText(TOWN_HEADER))
    }

    @Test
    fun `a refused dock leaves the Report row at the top of the town home that could not be read`() {
        repeat(TOWN_STATUS_AND_RING_READS) { townsFake.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, townReads = 0)
        dockGo(TRY_AGAIN)

        waitFor(reportRow.and(hasAnyAncestor(hasScrollAction())))
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp-land")
    fun `the dock keeps its go button clear of a side navigation bar and a cutout`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        composeRule.sideBars(navigationBar = SIDE_BAR, cutout = CUTOUT)
        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val window: Dp = composeRule.onRoot().getBoundsInRoot().right

        assertTrue(go.left >= SIDE_BAR.dp && go.right <= window - CUTOUT.dp)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the school reads after the header and before the go button and the school`() {
        assertFoldedOrder(Destination.School, title = "Escuela")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the Report reads after the header and before the go button and the Report`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        assertFoldedOrder(Destination.Report, title = "Informe")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the news reads after the header and before the go button and the news`() {
        assertFoldedOrder(Destination.Report, Destination.News, title = "Noticias del pueblo")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the map reads after the header and before the go button and the map`() {
        assertFoldedOrder(Destination.Map, title = "Mapa")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the settings reads after the header and before the go button and the settings`() {
        assertFoldedOrder(Destination.Report, Destination.Settings, title = "Ajustes")
    }

    private val foldedRefusal: SemanticsMatcher =
        hasText(STUDY_SLOT_BUSY).and(hasAnyAncestor(hasScrollAction())).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun assertFoldedOrder(vararg place: NavKey, title: String) {
        townsFake.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(
            Destination.Town,
            *place,
            town = townOf(nextStep = releasedLesson).copy(learning = learningWithRing),
        )
        dockGo(STUDY_RELEASED).performClick()
        waitFor(foldedRefusal)
        waitFor(hasText(THREE_OF_FIVE))
        waitFor(hasText(title, ignoreCase = true).and(isHeading()))

        val header: Int = composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val refusal: Int = composeRule.onNode(foldedRefusal).fetchSemanticsNode().id
        val go: Int = dockGo(STUDY_RELEASED).fetchSemanticsNode().id
        val screen: Int = composeRule.onNode(hasText(title, ignoreCase = true).and(isHeading())).fetchSemanticsNode().id
        val expected: List<Int> = listOf(header, refusal, go, screen)

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
    fun `the naming screen draws no Report row`() {
        showing(Destination.Town, townReads = 0)
        townsFake.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onAllNodes(reportRow).assertCountEquals(0)
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
    fun `a refused dock offers the retry and the header's link still opens the town`() {
        repeat(STATUS_AND_RING_READS) { townsFake.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, Destination.Report, townReads = 0)
        dockGo(TRY_AGAIN)

        headerLink().performClick()
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
    fun `the end of a holdout check reads the town again`() {
        val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)
        holdoutChecksFake.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        holdoutChecksFake.answerChange(HoldoutCheckChangeResult.Changed(emptyList()))
        showing(Destination.Town, Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth))
        waitFor(hasText(SKIP_PLACEMENT))

        composeRule.onNode(hasText(SKIP_PLACEMENT)).performScrollTo().performClick()

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
        waitFor(hasText(THREE_OF_FIVE))

        val header: Int = composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val go: Int = dockGo(REPORT_GO).fetchSemanticsNode().id

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(order.indexOf(header) + 1, order.indexOf(go))
    }

    @Test
    fun `the town home's dock comes right after the home's header for TalkBack`() {
        showing(Destination.Town, town = townOf().copy(learning = learningWithRing))
        dockGo("Ir al informe")
        waitFor(hasText(THREE_OF_FIVE))

        val header: List<Int> = listOf(TOWN_HEADER, "Edificio 1 de 2").map { line: String ->
            composeRule.onNode(hasText(line)).fetchSemanticsNode().id
        } + composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val go: Int = dockGo(REPORT_GO).fetchSemanticsNode().id

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(header.maxOf { id: Int -> order.indexOf(id) } + 1, order.indexOf(go))
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
    @Config(qualifiers = "+w411dp-h915dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal is drawn above the go button at font scale 1 on a 411 by 915 window`() {
        townsFake.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))

        dockGo(STUDY_RELEASED).performClick()
        waitFor(inTheDock(STUDY_SLOT_BUSY))

        val refusal: Rect = composeRule.onNode(inTheDock(STUDY_SLOT_BUSY)).getBoundsInRoot()
        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        assertTrue(refusal.bottom <= go.top)
        composeRule.onAllNodes(foldedRefusal).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folds to the top of the scrolling area, in view, at font scale 2 on a 360 by 640 window`() {
        townsFake.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))
        waitFor(hasText("Escuela").and(isHeading()))
        composeRule.onAllNodes(hasScrollAction()).onFirst().performTouchInput { swipeUp() }

        dockGo(STUDY_RELEASED).performClick()
        waitFor(foldedRefusal)

        val refusal: Rect = composeRule.onNode(foldedRefusal).assertIsDisplayed().getBoundsInRoot()
        val title: Rect = composeRule.onNode(hasText("Escuela").and(isHeading())).getBoundsInRoot()
        assertTrue(refusal.bottom <= title.top)
        composeRule.onAllNodes(inTheDock(STUDY_SLOT_BUSY)).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `the go button keeps its whole label on screen at font scale 2 on a 360 by 640 window`() {
        showing(Destination.Town, Destination.School, town = townOf(nextStep = releasedLesson))

        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val window: Rect = composeRule.onRoot().getBoundsInRoot()

        assertTrue(go.top >= window.top && go.bottom <= window.bottom)
    }

    private val releasedLesson: NextStep.ReleasedLesson =
        NextStep.ReleasedLesson(LessonId("released-2-1"), PlacementBand.Second, position = 1)

    private val learningWithRing: TownSnapshot.Learning =
        TownSnapshot.Learning(
            cap = 10,
            inLearning = 0,
            retainedWords = RetainedWords(count = 3, total = 5),
            nextInLearningDueAt = null,
        )

    private companion object {
        const val SKIP_PLACEMENT: String = "Saltar la prueba"
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
        const val FRAME_LIMIT: Int = 60
        const val STUDY_SECOND: String = "Estudiar la lección 2 · 5:00"
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
        const val SIGN_OUT: String = "Salir"
        const val REPORT_GO: String = "Ir al informe"
        const val CLOSE_NEWS: String = "Cerrar las noticias"
        const val WAITING: String = "Esperando"
        const val NAVIGATION_BAR: Int = 63
        const val TRY_AGAIN: String = "Volver a intentarlo"
        const val STUDY_RELEASED: String = "Estudiar las palabras que vuelven"
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."

        const val READ_THE_WORDS: String = "Leer las palabras"
        const val NEXT_WORD_DUE: String = "La siguiente palabra en aprendizaje se repasa en"
        const val CAP_FIGURE: String = "8 de 10"
        const val TOWN_HEADER: String = "Riverton · Pueblo"
        const val TOWN_LINK: String = "Pueblo"
        const val REPORT_ROW: String = "Informe"

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
