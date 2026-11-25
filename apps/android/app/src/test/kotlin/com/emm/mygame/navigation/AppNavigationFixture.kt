package com.emm.mygame.navigation

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.NAVIGATION_BAR
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.RetainedWords
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.lessonsDone
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.dependenciesOf
import com.emm.mygame.feature.town.status.TOWN_DOCK
import com.emm.mygame.feature.town.status.TOWN_STATUS
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.robolectric.shadows.ShadowLooper
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal const val TOWN_HEADER: String = "Riverton · Pueblo"
internal const val LESSON_ONE_READY: String = "Lección 1 lista en"
internal const val STUDYING_REFUND: String = "Si lo paras, la lección queda por estudiar y puedes volver a empezarla."
internal const val LESSON_ONE_DONE: String = "La lección 1 terminó."
internal const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
internal const val READS_AVAILABLE: Int = 5
internal const val READS_ON_ARRIVAL: Int = 2
internal const val READS_ON_ARRIVAL_ON_A_TEXT: Int = 1
internal const val SESSION_READS: Int = 2
internal val NEAR_FINISH: Duration = 30.seconds
internal const val WAIT_MILLIS: Long = 5_000

abstract class AppNavigationFixture {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    protected val sessions: FakeSessionRepository = FakeSessionRepository()

    protected val towns: FakeTownRepository = FakeTownRepository()

    protected val learning: FakeLearningRepository = FakeLearningRepository()

    protected val reports: FakeReportRepository = FakeReportRepository()

    protected val placements: FakePlacementRepository = FakePlacementRepository()

    protected val movableClock: MovableClock = MovableClock()

    protected val dependencies: AppDependencies = dependenciesOf(
        clock = movableClock,
        sessions = sessions,
        towns = towns,
        learning = learning,
        reports = reports,
        placements = placements,
    )

    protected val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    protected val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )

    protected val noReviews: ReviewsReadResult.Read = ReviewsReadResult.Read(
        DueReviews(due = emptyList(), readFirst = emptyList(), nextDueAt = null, readAt = readAt),
    )

    protected val threeOfFive: RetainedWords = RetainedWords(count = 3, total = 5)

    protected val firstLesson: LessonId = LessonId("lesson-1")

    protected val secondLesson: LessonId = LessonId("lesson-2")

    protected val waterWord: TownSnapshot.WordReading = wordReadingOf("water", "agua", "I drink water.")

    protected val townWord: TownSnapshot.WordReading = wordReadingOf("town", "pueblo", "We live in a town.")

    protected val walkReviews: ReviewsReadResult.Read = ReviewsReadResult.Read(
        DueReviews(due = emptyList(), readFirst = listOf(firstLesson, secondLesson), nextDueAt = null, readAt = readAt),
    )

    protected val reviewsDueTown: TownSnapshot
        get() = playedTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()))

    protected val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)

    protected val threeDue: TownReport =
        TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)

    protected fun playedTown(
        inLearning: Int = 0,
        retainedWords: RetainedWords? = null,
        lessons: List<TownSnapshot.Lesson> = listOf(lessonOf(firstLesson, listOf(waterWord))),
        nextStep: NextStep = lessonsDone,
    ): TownSnapshot = townOf(
        readAt,
        nextStep = nextStep,
        lessons = lessons,
        inLearning = inLearning,
        retainedWords = retainedWords,
    )

    protected fun signedInAtTown(town: TownSnapshot = playedTown()) {
        signedInReading(TownReadResult.Read(town))
        tab("Pueblo").performClick()
        waitForLine(TOWN_HEADER)
    }

    protected fun tab(label: String): SemanticsNodeInteraction =
        waitedFor(hasContentDescription(label).and(hasAnyAncestor(hasTestTag(NAVIGATION_BAR))).and(hasClickAction()))

    protected fun signedInReading(answer: TownReadResult) {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(READS_AVAILABLE) { towns.answerRead(answer) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow(), mailedLinks = emptyFlow())
            }
        }
    }

    protected fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    protected fun backLink(): SemanticsNodeInteraction = composeRule.onNodeWithText("Pueblo")

    protected fun waitedFor(matcher: SemanticsMatcher): SemanticsNodeInteraction {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(matcher)
    }

    protected fun link(label: String): SemanticsNodeInteraction = waitedFor(hasText(label).and(hasClickAction()))

    protected fun wayToTheReport(): SemanticsNodeInteraction =
        waitedFor(hasClickAction().and(hasText("Informe").or(hasContentDescription("Ir al informe", substring = true))))

    protected fun wayOn(label: String): SemanticsNodeInteraction {
        val go: SemanticsMatcher = hasTestTag(INK_PILL).and(hasText(label)).and(hasAnyAncestor(hasScrollAction()))
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(go).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(go).performScrollTo()
    }

    protected fun dockGo(label: String): SemanticsNodeInteraction {
        val go: SemanticsMatcher = hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true))
            .and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(go).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(go)
    }

    protected fun assertLinksBackToTheTown() {
        backLink().performClick()
        waitForLine(TOWN_HEADER)
        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(0)
    }

    protected fun showingStack(vararg destinations: Destination, town: TownSnapshot = playedTown()) {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(town)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations),
                )
            }
        }
    }

    protected fun openReport(report: TownReport) {
        reports.answerRead(ReportReadResult.Read(report))
        wayToTheReport().performClick()
        waitForLine("NOTICIAS DEL PUEBLO")
    }

    protected fun runningTown(lasting: Duration = 10.minutes): TownSnapshot =
        playedTown(nextStep = NextStep.LessonRunning(goal = null, text = null))
            .copy(lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + lasting))

    protected fun finishedTown(readFirst: List<LessonId>): TownSnapshot = playedTown(
        lessons = listOf(
            lessonOf(firstLesson, listOf(waterWord)).copy(isStudied = true),
            lessonOf(secondLesson, listOf(townWord)),
        ),
        nextStep = NextStep.Reviews(count = 3, readFirst = readFirst),
    )

    protected fun assertStatusShown() {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(statusLine()).fetchSemanticsNodes().isNotEmpty()
        }
    }

    protected fun statusLine(): SemanticsMatcher =
        hasTestTag(TOWN_STATUS).and(hasAnyDescendant(hasText(LESSON_ONE_READY)))

    protected fun assertCloseIsTheNoticeOnlyControl() {
        val noticeControl: SemanticsMatcher = hasClickAction() and hasAnyAncestor(hasTestTag(TOWN_STATUS))
        composeRule.onAllNodes(noticeControl).assertCountEquals(1)
        composeRule.onNode(noticeControl).assert(hasText("Cerrar"))
    }

    protected fun asLessonOneFinishes(finished: TownSnapshot, vararg stack: Destination = onTheReport) {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(runningTown())) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*stack),
                )
            }
        }
        assertStatusShown()
        towns.answerRead(TownReadResult.Read(finished))
        runBlocking { towns.read() }
        waitForLine(LESSON_ONE_DONE)
    }

    protected fun onLessonOneNearItsFinish(vararg destinations: Destination) {
        showLessonOneNearItsFinish(*destinations)
        assertStatusShown()
    }

    protected fun showLessonOneNearItsFinish(vararg destinations: Destination) {
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(runningTown(lasting = NEAR_FINISH))) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations),
                )
            }
        }
    }

    protected fun assertStudyingShownWithoutStatus() {
        waitForLine(STUDYING_REFUND)
        composeRule.onAllNodes(statusLine()).assertCountEquals(0)
    }

    protected fun passingTheFinish(readsOnArrival: Int = READS_ON_ARRIVAL) {
        movableClock.passed += NEAR_FINISH + 1.seconds
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitUntil(WAIT_MILLIS) { towns.readCount > readsOnArrival }
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitForIdle()
    }

    protected fun assertNoStatus() {
        composeRule.onAllNodes(hasTestTag(TOWN_STATUS)).assertCountEquals(0)
    }

    protected fun ring(name: String): SemanticsNodeInteraction = composeRule.onNodeWithText(name)

    protected fun waitForRing(name: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(name)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    protected fun onTheFirstLessonOfTheWalk(secondReadings: List<TownSnapshot.WordReading>) {
        val lessons: List<TownSnapshot.Lesson> =
            listOf(lessonOf(firstLesson, listOf(waterWord)), lessonOf(secondLesson, secondReadings))
        repeat(2) { learning.answerRead(walkReviews) }
        val unreadFirst: NextStep = NextStep.Reviews(count = 3, readFirst = listOf(firstLesson, secondLesson))
        signedInAtTown(town = playedTown(lessons = lessons, nextStep = unreadFirst))
        dockGo("Leer las palabras").performClick()
        waitForLine("I drink water.")
    }
}

class MovableClock : Clock {

    var passed: Duration = Duration.ZERO

    override fun now(): Instant = Clock.System.now() + passed
}

internal val onTheReport: Array<Destination> = arrayOf(Destination.Today, Destination.Town, Destination.Report)

internal fun wordReadingOf(word: String, gloss: String, frame: String): TownSnapshot.WordReading =
    TownSnapshot.WordReading(
        word = word,
        frame = listOf(FrameSpan(text = frame, support = null)),
        support = WordSupport(
            shown = WordSupport.Shown.Beside,
            text = gloss,
            language = WordSupport.Language.Spanish,
        ),
    )

internal fun lessonOf(id: LessonId, readings: List<TownSnapshot.WordReading>): TownSnapshot.Lesson =
    TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 150.seconds,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        enteringWordCount = 5,
        readings = readings,
        standings = emptyList(),
    )
