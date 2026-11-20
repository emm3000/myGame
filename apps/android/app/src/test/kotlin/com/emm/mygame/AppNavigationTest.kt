package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.NAV_ROW_CHEVRON
import com.emm.mygame.core.designsystem.PILL_BADGE
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownNewsReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.lessonsDone
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.feature.town.TOWN_DOCK
import com.emm.mygame.feature.town.TOWN_STATUS
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowLooper

@RunWith(RobolectricTestRunner::class)
class AppNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val learning: FakeLearningRepository = FakeLearningRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val placements: FakePlacementRepository = FakePlacementRepository()

    private val movableClock: MovableClock = MovableClock()

    private val dependencies: AppDependencies = dependenciesOf(
        clock = movableClock,
        sessions = sessions,
        towns = towns,
        learning = learning,
        reports = reports,
        placements = placements,
    )

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )

    private val noReviews: ReviewsReadResult.Read = ReviewsReadResult.Read(
        DueReviews(due = emptyList(), readFirst = emptyList(), nextDueAt = null, readAt = readAt),
    )

    private val threeOfFive: RetainedWords = RetainedWords(count = 3, total = 5)

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val waterWord: TownSnapshot.WordReading = wordReadingOf("water", "agua", "I drink water.")

    private val townWord: TownSnapshot.WordReading = wordReadingOf("town", "pueblo", "We live in a town.")

    private val walkReport: TownReport =
        TownReport(dueCount = 3, readFirst = listOf(firstLesson, secondLesson), nextDueAt = null, news = emptyList())

    private val reviewsDueTown: TownSnapshot
        get() = playedTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()))

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private fun playedTown(
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

    private fun signedInAtTown(town: TownSnapshot = playedTown()) {
        signedInReading(TownReadResult.Read(town))
        waitForLine(TOWN_HEADER)
    }

    private fun signedInReading(answer: TownReadResult) {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(READS_AVAILABLE) { towns.answerRead(answer) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow())
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun backLink(): SemanticsNodeInteraction = composeRule.onNodeWithText("Pueblo")

    private fun waitedFor(matcher: SemanticsMatcher): SemanticsNodeInteraction {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(matcher)
    }

    private fun link(label: String): SemanticsNodeInteraction = waitedFor(hasText(label).and(hasClickAction()))

    private fun wayToTheReport(): SemanticsNodeInteraction =
        waitedFor(hasClickAction().and(hasText("Informe").or(hasContentDescription("Ir al informe", substring = true))))

    private fun taskGo(label: String): SemanticsNodeInteraction {
        val go: SemanticsMatcher = hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true))
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(go).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(go)
    }

    private fun dockGo(label: String): SemanticsNodeInteraction {
        val go: SemanticsMatcher = hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true))
            .and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(go).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(go)
    }

    private fun assertLinksBackToTheTown() {
        backLink().performClick()
        waitForLine(TOWN_HEADER)
        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(0)
    }

    private fun showingStack(vararg destinations: Destination, town: TownSnapshot = playedTown()) {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(town)) }
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

    private fun openReport(report: TownReport) {
        reports.answerRead(ReportReadResult.Read(report))
        wayToTheReport().performClick()
        waitForLine("NOTICIAS DEL PUEBLO")
    }

    private fun runningTown(lasting: Duration = 10.minutes): TownSnapshot =
        playedTown(nextStep = NextStep.LessonRunning(goal = null, text = null))
            .copy(lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + lasting))

    private fun finishedTown(readFirst: List<LessonId>): TownSnapshot = playedTown(
        lessons = listOf(
            lessonOf(firstLesson, listOf(waterWord)).copy(isStudied = true),
            lessonOf(secondLesson, listOf(townWord)),
        ),
        nextStep = NextStep.Reviews(count = 3, readFirst = readFirst),
    )

    private fun assertStatusShown() {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(statusLine()).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun statusLine(): SemanticsMatcher =
        hasTestTag(TOWN_STATUS).and(hasAnyDescendant(hasText(LESSON_ONE_READY)))

    private fun asLessonOneFinishes(finished: TownSnapshot, vararg stack: Destination = onTheReport) {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(runningTown())) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    backStack = rememberNavBackStack(*stack),
                )
            }
        }
        assertStatusShown()
        towns.answerRead(TownReadResult.Read(finished))
        runBlocking { towns.read() }
        waitForLine(LESSON_ONE_DONE)
    }

    private fun onLessonOneNearItsFinish(vararg destinations: Destination) {
        showLessonOneNearItsFinish(*destinations)
        assertStatusShown()
    }

    private fun showLessonOneNearItsFinish(vararg destinations: Destination) {
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(runningTown(lasting = NEAR_FINISH))) }
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

    private fun assertStudyingShownWithoutStatus() {
        waitForLine(STUDYING_REFUND)
        composeRule.onAllNodes(statusLine()).assertCountEquals(0)
    }

    private fun passingTheFinish() {
        movableClock.passed += NEAR_FINISH + 1.seconds
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitUntil(WAIT_MILLIS) { towns.readCount > READS_ON_ARRIVAL }
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitForIdle()
    }

    private fun assertNoStatus() {
        composeRule.onAllNodes(hasTestTag(TOWN_STATUS)).assertCountEquals(0)
    }

    private fun ring(name: String): SemanticsNodeInteraction = composeRule.onNodeWithText(name)

    private fun waitForRing(name: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(name)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun onTheFirstLessonOfTheWalk(secondReadings: List<TownSnapshot.WordReading>) {
        val lessons: List<TownSnapshot.Lesson> =
            listOf(lessonOf(firstLesson, listOf(waterWord)), lessonOf(secondLesson, secondReadings))
        repeat(2) { reports.answerRead(ReportReadResult.Read(walkReport)) }
        val unreadFirst: NextStep = NextStep.Reviews(count = 3, readFirst = listOf(firstLesson, secondLesson))
        signedInAtTown(town = playedTown(lessons = lessons, nextStep = unreadFirst))
        dockGo("Leer las palabras").performClick()
        waitForLine("I drink water.")
    }

    @Test
    fun `hides the ring while the count is null`() {
        signedInAtTown(town = playedTown(retainedWords = null))

        composeRule.onAllNodes(ringLine).assertCountEquals(0)
    }

    @Test
    fun `shows the retained words in the ring`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `shows the ring on a screen under the town home`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("Ahora no hay ninguna lección en estudio.")

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `reads the count to TalkBack once`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))

        composeRule.onAllNodesWithText(THREE_OF_FIVE).assertCountEquals(1)
    }

    @Test
    fun `names a lesson of one word in the singular`() {
        signedInAtTown(town = playedTown(retainedWords = RetainedWords(count = 0, total = 1)))

        ring("0 de 1 palabra aprendida").assertIsDisplayed()
    }

    @Test
    fun `adds no ring read to a screen that reads the town`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))
        composeRule.waitForIdle()
        assertEquals(READS_ON_ARRIVAL, towns.readCount)

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("Ahora no hay ninguna lección en estudio.")

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town for the ring over a screen that reads none`() {
        reports.answerRead(ReportReadResult.Read(TownReport(3, emptyList(), nextDueAt = null, news = emptyList())))
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(playedTown(retainedWords = threeOfFive))) }

        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        waitForRing(THREE_OF_FIVE)

        assertEquals(READS_ON_ARRIVAL, towns.readCount)
    }

    @Test
    fun `draws a count fallen back on the way home from the Report`() {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(playedTown(retainedWords = threeOfFive))) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow())
            }
        }
        waitForRing(THREE_OF_FIVE)
        towns.answerRead(TownReadResult.Read(playedTown(retainedWords = RetainedWords(count = 2, total = 5))))

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))

        waitForRing("2 de 5 palabras aprendidas")
    }

    @Test
    fun `opens the unread lesson's words from the next step on the town home`() {
        reports.answerRead(
            ReportReadResult.Read(TownReport(1, listOf(firstLesson), nextDueAt = null, news = emptyList())),
        )
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(1, listOf(firstLesson))))

        dockGo("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the Report from the next step on the town home`() {
        reports.answerRead(ReportReadResult.Read(TownReport(0, emptyList(), nextDueAt = null, news = emptyList())))
        signedInAtTown()

        dockGo("Ir al informe").performClick()

        waitForLine("No tienes repasos pendientes ahora.")
    }

    @Test
    fun `opens the map from its row on the town home`() {
        val firstArea: RegionMap =
            RegionMap(region = 1, area = 1, lastArea = 2, terrain = Terrain.Fields, sites = emptyList())
        towns.regions.answerMap(RegionMapResult.Read(firstArea))
        signedInAtTown()
        composeRule
            .onNode(
                SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)
                    .and(hasContentDescription("Oficina", substring = true)),
            )
            .performScrollTo()
            .performClick()

        composeRule.onNodeWithText("Ir al mapa").performScrollTo().performClick()

        waitForLine("Zona 1")
    }

    @Test
    fun `opens the placement from its row on the town home`() {
        repeat(2) { placements.answerRead(PlacementReadResult.Read(Placement.Offered)) }
        signedInAtTown()
        waitForLine("Hacer la prueba de nivel")

        composeRule.onNodeWithText("Hacer la prueba de nivel").performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription("Empezar la prueba", substring = true))
                .fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun `opens the Report from its row on the town home`() {
        signedInAtTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `opens the news from its row on the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        reports.answerNews(
            TownNewsReadResult.Read(listOf(TownNews.BuildingWorkFinished(readAt, TownBuildingKind.Homes, level = 2))),
        )

        composeRule.onNodeWithText("Leer todas las noticias").performScrollTo().performClick()

        waitForLine("Hogares: ahora en nivel 2.")
    }

    @Test
    fun `opens the next lesson of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        taskGo("Siguiente lección").performClick()

        waitForLine("We live in a town.")
    }

    @Test
    fun `opens the reviews at the end of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))
        taskGo("Siguiente lección").performClick()
        waitForLine("We live in a town.")
        learning.answerRead(noReviews)

        taskGo("Empezar los repasos").performClick()

        waitForLine("Aún no tienes palabras que repasar.")
    }

    @Test
    fun `goes back to the school from a lesson with nothing to read`() {
        onTheFirstLessonOfTheWalk(secondReadings = emptyList())
        taskGo("Siguiente lección").performClick()
        waitForLine("Ahora no hay palabras para leer.")

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()

        waitForLine("Escuela")
    }

    @Test
    fun `opens the reviews from the Report`() {
        signedInAtTown(town = reviewsDueTown)
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        learning.answerRead(noReviews)

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learning.readCount)
    }

    @Test
    fun `opens the reviews from the school's dock past the learning cap`() {
        signedInAtTown(
            town = playedTown(inLearning = 8, nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())),
        )
        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("La siguiente lección trae 5 palabras. Empieza los repasos.")
        learning.answerRead(noReviews)

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learning.readCount)
    }

    @Test
    fun `shows a running lesson's time in the status strip on every signed-in screen but the school`() {
        signedInAtTown(town = runningTown().copy(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())))
        assertStatusShown()

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        assertStudyingShownWithoutStatus()
        link("Pueblo").performClick()
        wayToTheReport().performScrollTo()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        assertStatusShown()

        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        assertStatusShown()
    }

    @Test
    fun `draws the due count on the go button`() {
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(3, emptyList())))

        composeRule.onNode(SemanticsMatcher.expectValue(PILL_BADGE, "3")).assertIsDisplayed()
    }

    @Test
    fun `shows no count with nothing due`() {
        signedInAtTown()

        wayToTheReport().assertIsDisplayed()
        composeRule.onAllNodes(hasContentDescription("Repasos pendientes", substring = true)).assertCountEquals(0)
    }

    @Test
    fun `draws no count on the go button with nothing due`() {
        signedInAtTown()

        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(PILL_BADGE)).assertCountEquals(0)
    }

    @Test
    fun `reads the town at the lesson's finish on the Report`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        onLessonOneNearItsFinish(Destination.Town, Destination.Report)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on the reviews`() {
        learning.answerRead(noReviews)
        onLessonOneNearItsFinish(Destination.Town, Destination.Review)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on a text`() {
        onLessonOneNearItsFinish(Destination.Town, Destination.School, Destination.SchoolText(TextId("text-1")))

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the town home`() {
        onLessonOneNearItsFinish(Destination.Town)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the school`() {
        showLessonOneNearItsFinish(Destination.Town, Destination.School)
        waitForLine(STUDYING_REFUND)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the lesson's words`() {
        repeat(2) { reports.answerRead(ReportReadResult.Read(walkReport)) }
        onLessonOneNearItsFinish(Destination.Town, Destination.LessonWords(firstLesson, emptyList()))

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `closes the finish notice on the reviews`() {
        asLessonOneFinishes(finishedTown(readFirst = emptyList()))
        learning.answerRead(noReviews)
        towns.answerRead(TownReadResult.Read(finishedTown(readFirst = emptyList())))

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `closes the finish notice on the unread words`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { towns.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }
        reports.answerRead(ReportReadResult.Read(walkReport))

        dockGo("Leer las palabras").performClick()
        waitForLine("I drink water.")

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `draws no status on the town home with no lesson running`() {
        signedInAtTown()

        assertNoStatus()
    }

    @Test
    fun `draws no status on the Report with no lesson running`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        showingStack(Destination.Town, Destination.Report, town = playedTown(retainedWords = threeOfFive))
        waitForRing(THREE_OF_FIVE)

        assertNoStatus()
    }

    @Test
    fun `draws no way on in the finish notice beside the dock's go to the same words`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson, secondLesson)))
        dockGo("Leer las palabras")

        composeRule.onAllNodes(noticeWayOn("Leer las palabras"), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws no way on in the finish notice on the town home beside the dock's go to the same words`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)), Destination.Town)
        dockGo("Leer las palabras")

        composeRule.onAllNodes(noticeWayOn("Leer las palabras"), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws no way on in the finish notice beside the dock's go to the reviews`() {
        asLessonOneFinishes(finishedTown(readFirst = emptyList()))
        dockGo("Empezar los repasos")

        composeRule.onAllNodes(noticeWayOn("Empezar los repasos"), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `closes the finish notice`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))

        composeRule.onNodeWithText("Cerrar").performClick()
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `keeps the finish notice on the way home from the Report`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { towns.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }

        link("Pueblo").performClick()
        waitForLine(TOWN_HEADER)

        composeRule.onNodeWithText(LESSON_ONE_DONE).assertIsDisplayed()
    }

    @Test
    fun `shows nothing with no town`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        towns.answerRead(TownReadResult.NoTown)
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        waitForLine("NOTICIAS DEL PUEBLO")

        assertNoStatus()
    }

    @Test
    fun `draws no back link on the town home`() {
        signedInAtTown()

        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(0)
    }

    @Test
    fun `links back to the town from the reviews`() {
        signedInAtTown(town = reviewsDueTown)
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        assertLinksBackToTheTown()
    }

    @Test
    fun `links back to the town from a lesson's words`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        assertLinksBackToTheTown()
    }

    @Test
    fun `signs out from the foot of the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
    }

    @Test
    fun `signs out from the naming form`() {
        signedInReading(TownReadResult.NoTown)
        waitForLine("Ponle nombre a tu pueblo")
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `signs out from a failed town read`() {
        signedInReading(TownReadResult.Unreachable)
        waitForLine("Volver a intentarlo")
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `reads the Report again on the way back from the reviews`() {
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())))
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        reports.answerRead(ReportReadResult.Read(nothingDue))

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        waitForLine("No tienes repasos pendientes ahora.")

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `keeps the Report shown when the header's town link is tapped while signing out`() {
        signedInAtTown()
        openReport(nothingDue)
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        link("Pueblo").performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Informe").and(isHeading())).assertExists()
    }

    private companion object {
        const val TOWN_HEADER: String = "Riverton · Pueblo"
        const val LESSON_ONE_READY: String = "Lección 1 lista en"
        const val STUDYING_REFUND: String = "Si lo paras, la lección queda por estudiar y puedes volver a empezarla."
        const val LESSON_ONE_DONE: String = "La lección 1 terminó."
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
        const val READS_AVAILABLE: Int = 5
        const val READS_ON_ARRIVAL: Int = 2
        const val SESSION_READS: Int = 2
        val NEAR_FINISH: Duration = 30.seconds
        const val WAIT_MILLIS: Long = 5_000
    }
}

private class MovableClock : Clock {

    var passed: Duration = Duration.ZERO

    override fun now(): Instant = Clock.System.now() + passed
}

private val onTheReport: Array<Destination> = arrayOf(Destination.Town, Destination.Report)

private fun noticeWayOn(label: String): SemanticsMatcher = hasClickAction()
    .and(hasAnyDescendant(hasText(label)))
    .and(hasAnyDescendant(hasTestTag(NAV_ROW_CHEVRON)))
    .and(hasAnyAncestor(hasTestTag(TOWN_STATUS)))

private val ringWording: Regex = Regex("\\d+ de \\d+ palabras? aprendidas?")

private val ringLine: SemanticsMatcher = SemanticsMatcher("the ring's line") { node ->
    node.config.getOrElseNullable(SemanticsProperties.Text) { null }
        .orEmpty()
        .any { line -> ringWording.matches(line.text) }
}

private fun wordReadingOf(word: String, gloss: String, frame: String): TownSnapshot.WordReading =
    TownSnapshot.WordReading(
        word = word,
        frame = listOf(FrameSpan(text = frame, support = null)),
        support = WordSupport(
            shown = WordSupport.Shown.Beside,
            text = gloss,
            language = WordSupport.Language.Spanish,
        ),
    )

private fun lessonOf(id: LessonId, readings: List<TownSnapshot.WordReading>): TownSnapshot.Lesson =
    TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 150.seconds,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        readings = readings,
        standings = emptyList(),
    )
