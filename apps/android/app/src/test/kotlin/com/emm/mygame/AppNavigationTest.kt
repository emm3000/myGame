package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.designsystem.PILL_BADGE
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownNewsReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.hiringOf
import com.emm.mygame.feature.town.TOWN_STATUS
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
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

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val learningFake: FakeLearningRepository = FakeLearningRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val placementsFake: FakePlacementRepository = FakePlacementRepository()

    private val movableClock: MovableClock = MovableClock()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = movableClock
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = learningFake
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = placementsFake
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
    }

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

    private val walkReport: TownReport =
        TownReport(dueCount = 3, readFirst = listOf(firstLesson, secondLesson), nextDueAt = null, news = emptyList())

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

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

    private fun townOf(
        inLearning: Int = 0,
        retainedWords: RetainedWords? = null,
        lessons: List<TownSnapshot.Lesson> = listOf(lessonOf(firstLesson, listOf(waterWord))),
        nextStep: NextStep = NextStep.CaughtUp(goal = null),
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
        lessons = lessons,
        releasedLessons = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = inLearning, retainedWords = retainedWords),
        lessonSlot = null,
        hiring = hiringOf(),
        job = null,
        nextStep = nextStep,
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )

    private fun signedInAtTown(town: TownSnapshot = townOf()) {
        signedInReading(TownReadResult.Read(town))
        waitForLine(TOWN_HEADER)
    }

    private fun signedInReading(answer: TownReadResult) {
        repeat(SESSION_READS) { sessionsFake.answerRestore(verifiedSession) }
        repeat(READS_AVAILABLE) { townsFake.answerRead(answer) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun backLink(): SemanticsNodeInteraction = composeRule.onNodeWithText("PUEBLO")

    private fun door(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasText(label).and(hasTestTag(OUTLINED_PILL)))

    private fun assertLinksBackToTheTown() {
        backLink().performClick()
        waitForLine(TOWN_HEADER)
        composeRule.onAllNodesWithText("PUEBLO").assertCountEquals(0)
    }

    private fun showingStack(vararg destinations: Destination, town: TownSnapshot = townOf()) {
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(town)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, backStack = rememberNavBackStack(*destinations))
            }
        }
    }

    private fun openReport(report: TownReport) {
        reportsFake.answerRead(ReportReadResult.Read(report))
        door("Informe").performClick()
        waitForLine("NOTICIAS DEL PUEBLO")
    }

    private fun runningTown(lasting: Duration = 10.minutes): TownSnapshot =
        townOf(nextStep = NextStep.LessonRunning(producer = null))
            .copy(lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + lasting))

    private fun finishedTown(readFirst: List<LessonId>): TownSnapshot = townOf(
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

    private fun onTheReportAsLessonOneFinishes(finished: TownSnapshot) {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        townsFake.answerRead(TownReadResult.Read(runningTown()))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        assertStatusShown()
        townsFake.answerRead(TownReadResult.Read(finished))
        runBlocking { townsFake.read() }
        waitForLine(LESSON_ONE_DONE)
    }

    private fun onLessonOneNearItsFinish(vararg destinations: Destination) {
        townsFake.answerRead(TownReadResult.Read(runningTown(lasting = NEAR_FINISH)))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, backStack = rememberNavBackStack(*destinations))
            }
        }
        assertStatusShown()
    }

    private fun passingTheFinish() {
        movableClock.passed += NEAR_FINISH + 1.seconds
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitUntil(WAIT_MILLIS) { townsFake.readCount >= 2 }
        ShadowLooper.idleMainLooper(2, TimeUnit.SECONDS)
        composeRule.waitForIdle()
    }

    private fun assertNoStatus() {
        composeRule.onAllNodes(hasTestTag(TOWN_STATUS)).assertCountEquals(0)
    }

    private fun ring(name: String): SemanticsNodeInteraction = composeRule.onNodeWithContentDescription(name)

    private fun waitForRing(name: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription(name)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun onTheFirstLessonOfTheWalk(secondReadings: List<TownSnapshot.WordReading>) {
        val lessons: List<TownSnapshot.Lesson> =
            listOf(lessonOf(firstLesson, listOf(waterWord)), lessonOf(secondLesson, secondReadings))
        signedInAtTown(town = townOf(lessons = lessons))
        openReport(walkReport)
        repeat(2) { reportsFake.answerRead(ReportReadResult.Read(walkReport)) }
        composeRule.onNodeWithText("Leer las palabras").performClick()
        waitForLine("I drink water.")
    }

    @Test
    fun `hides the ring while the count is null`() {
        signedInAtTown(town = townOf(retainedWords = null))

        composeRule.onAllNodesWithContentDescription(RING_WORDS, substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows the retained words in the ring`() {
        signedInAtTown(town = townOf(retainedWords = threeOfFive))

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `shows the ring on a screen under the town home`() {
        signedInAtTown(town = townOf(retainedWords = threeOfFive))

        door("Escuela").performClick()
        waitForLine("Ahora no hay ninguna lección en estudio.")

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `reads the count to TalkBack`() {
        signedInAtTown(town = townOf(retainedWords = threeOfFive))

        ring(THREE_OF_FIVE).assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Image))
    }

    @Test
    fun `names a lesson of one word in the singular`() {
        signedInAtTown(town = townOf(retainedWords = RetainedWords(count = 0, total = 1)))

        ring("0 de 1 palabra aprendida").assertIsDisplayed()
    }

    @Test
    fun `keeps one town read for the frame and the screen under it`() {
        signedInAtTown(town = townOf(retainedWords = threeOfFive))
        composeRule.waitForIdle()
        assertEquals(1, townsFake.readCount)

        door("Escuela").performClick()
        waitForLine("Ahora no hay ninguna lección en estudio.")

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `reads the town for the ring over a screen that reads none`() {
        reportsFake.answerRead(ReportReadResult.Read(TownReport(3, emptyList(), nextDueAt = null, news = emptyList())))
        townsFake.answerRead(TownReadResult.Read(townOf(retainedWords = threeOfFive)))

        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        waitForRing(THREE_OF_FIVE)

        assertEquals(1, townsFake.readCount)
    }

    @Test
    fun `draws a count fallen back on the way home from the Report`() {
        repeat(SESSION_READS) { sessionsFake.answerRestore(verifiedSession) }
        townsFake.answerRead(TownReadResult.Read(townOf(retainedWords = threeOfFive)))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
        waitForRing(THREE_OF_FIVE)
        townsFake.answerRead(TownReadResult.Read(townOf(retainedWords = RetainedWords(count = 2, total = 5))))

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))

        waitForRing("2 de 5 palabras aprendidas")
    }

    @Test
    fun `opens the unread lesson's words from the next step on the town home`() {
        reportsFake.answerRead(
            ReportReadResult.Read(TownReport(1, listOf(firstLesson), nextDueAt = null, news = emptyList())),
        )
        signedInAtTown(town = townOf(nextStep = NextStep.Reviews(1, listOf(firstLesson))))

        composeRule.onNodeWithText("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the Report from the next step on the town home`() {
        reportsFake.answerRead(ReportReadResult.Read(TownReport(0, emptyList(), nextDueAt = null, news = emptyList())))
        signedInAtTown()

        composeRule.onNodeWithText("Ir al informe").performClick()

        waitForLine("No tienes repasos pendientes ahora.")
    }

    @Test
    fun `opens the map from its row on the town home`() {
        val firstArea: RegionMap =
            RegionMap(region = 1, area = 1, lastArea = 2, terrain = Terrain.Fields, sites = emptyList())
        townsFake.regions.answerMap(RegionMapResult.Read(firstArea))
        signedInAtTown()

        composeRule.onNodeWithText("Ir al mapa").performScrollTo().performClick()

        waitForLine("Zona 1")
    }

    @Test
    fun `opens the placement from its row on the town home`() {
        repeat(2) { placementsFake.answerRead(PlacementReadResult.Read(Placement.Offered)) }
        signedInAtTown()
        waitForLine("Hacer la prueba de nivel")

        composeRule.onNodeWithText("Hacer la prueba de nivel").performScrollTo().performClick()

        waitForLine("Empezar la prueba")
    }

    @Test
    fun `opens the Report from its door`() {
        signedInAtTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `opens the news from its row on the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        reportsFake.answerNews(
            TownNewsReadResult.Read(listOf(TownNews.BuildingWorkFinished(readAt, TownBuildingKind.Homes, level = 2))),
        )

        composeRule.onNodeWithText("Leer todas las noticias").performScrollTo().performClick()

        waitForLine("Hogares: ahora en nivel 2.")
    }

    @Test
    fun `opens the unread lesson's words from the Report`() {
        signedInAtTown()
        val unread: TownReport =
            TownReport(dueCount = 3, readFirst = listOf(LessonId("lesson-1")), nextDueAt = null, news = emptyList())
        openReport(unread)
        reportsFake.answerRead(ReportReadResult.Read(unread))

        composeRule.onNodeWithText("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the next lesson of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        composeRule.onNodeWithText("Siguiente lección").performScrollTo().performClick()

        waitForLine("We live in a town.")
    }

    @Test
    fun `opens the reviews at the end of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))
        composeRule.onNodeWithText("Siguiente lección").performScrollTo().performClick()
        waitForLine("We live in a town.")
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performScrollTo().performClick()

        waitForLine("Aún no tienes palabras que repasar.")
    }

    @Test
    fun `goes back to the school from a lesson with nothing to read`() {
        onTheFirstLessonOfTheWalk(secondReadings = emptyList())
        composeRule.onNodeWithText("Siguiente lección").performScrollTo().performClick()
        waitForLine("Ahora no hay palabras para leer.")

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()

        waitForLine("Escuela")
    }

    @Test
    fun `opens the reviews from the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learningFake.readCount)
    }

    @Test
    fun `reads the Report again on the way back from the reviews`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        learningFake.answerRead(noReviews)
        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        val nothingDue: TownReport =
            TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        waitForLine("No tienes repasos pendientes ahora.")

        assertEquals(2, reportsFake.readCount)
    }

    @Test
    fun `opens the reviews from the school past the learning cap`() {
        signedInAtTown(town = townOf(inLearning = 8, nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())))
        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("La siguiente lección trae 5 palabras. Empieza los repasos.")
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performScrollTo().performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learningFake.readCount)
    }

    @Test
    fun `shows a running lesson's time on every signed-in screen`() {
        signedInAtTown(town = runningTown())
        assertStatusShown()

        door("Escuela").performClick()
        assertStatusShown()
        backLink().performClick()
        waitForLine(TOWN_HEADER)

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        assertStatusShown()

        learningFake.answerRead(noReviews)
        composeRule.onNodeWithText("Empezar los repasos").performScrollTo().performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        assertStatusShown()
    }

    @Test
    fun `shows the due count on the Report door`() {
        signedInAtTown(town = townOf(nextStep = NextStep.Reviews(3, emptyList())))

        composeRule.onNodeWithContentDescription("Informe Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `draws the due count on the Report door`() {
        signedInAtTown(town = townOf(nextStep = NextStep.Reviews(3, emptyList())))

        composeRule.onNode(SemanticsMatcher.expectValue(PILL_BADGE, "3")).assertIsDisplayed()
    }

    @Test
    fun `shows no count with nothing due`() {
        signedInAtTown()

        door("Informe").assertIsDisplayed()
        composeRule.onAllNodes(hasContentDescription("Repasos pendientes", substring = true)).assertCountEquals(0)
    }

    @Test
    fun `draws no count on the Report door with nothing due`() {
        signedInAtTown()

        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(PILL_BADGE)).assertCountEquals(0)
    }

    @Test
    fun `reads the town at the lesson's finish on the Report`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        onLessonOneNearItsFinish(Destination.Town, Destination.Report)

        passingTheFinish()

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on the reviews`() {
        learningFake.answerRead(noReviews)
        onLessonOneNearItsFinish(Destination.Town, Destination.Review)

        passingTheFinish()

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the town home`() {
        onLessonOneNearItsFinish(Destination.Town)

        passingTheFinish()

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the school`() {
        onLessonOneNearItsFinish(Destination.Town, Destination.School)

        passingTheFinish()

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the lesson's words`() {
        repeat(2) { reportsFake.answerRead(ReportReadResult.Read(walkReport)) }
        onLessonOneNearItsFinish(Destination.Town, Destination.LessonWords(firstLesson, emptyList()))

        passingTheFinish()

        assertEquals(2, townsFake.readCount)
    }

    @Test
    fun `closes the finish notice on the reviews`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = emptyList()))
        learningFake.answerRead(noReviews)
        townsFake.answerRead(TownReadResult.Read(finishedTown(readFirst = emptyList())))

        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `closes the finish notice on the unread words`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { townsFake.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }
        reportsFake.answerRead(ReportReadResult.Read(walkReport))

        composeRule.onNodeWithText("Leer las palabras").performClick()
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
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        showingStack(Destination.Town, Destination.Report, town = townOf(retainedWords = threeOfFive))
        waitForRing(THREE_OF_FIVE)

        assertNoStatus()
    }

    @Test
    fun `opens the unread lesson from the finish notice`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson, secondLesson)))
        repeat(2) { townsFake.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson, secondLesson)))) }
        reportsFake.answerRead(ReportReadResult.Read(walkReport))

        composeRule.onNodeWithText("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the reviews from the finish notice when no word is unread`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = emptyList()))
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performClick()

        waitForLine("Aún no tienes palabras que repasar.")
    }

    @Test
    fun `closes the finish notice`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))

        composeRule.onNodeWithText("Cerrar").performClick()
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `keeps the finish notice on the way home from the Report`() {
        onTheReportAsLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { townsFake.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }

        backLink().performClick()
        waitForLine(TOWN_HEADER)

        composeRule.onNodeWithText(LESSON_ONE_DONE).assertIsDisplayed()
    }

    @Test
    fun `shows nothing with no town`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        townsFake.answerRead(TownReadResult.NoTown)
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
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

        composeRule.onAllNodesWithText("PUEBLO").assertCountEquals(0)
    }

    @Test
    fun `links back to the town from every screen but the town home`() {
        signedInAtTown()
        door("Escuela").performClick()
        waitForLine("Ahora no hay ninguna lección en estudio.")
        assertLinksBackToTheTown()

        val reportWithReviews: TownReport =

            TownReport(dueCount = 3, readFirst = emptyList(), nextDueAt = null, news = emptyList())
        openReport(reportWithReviews)
        assertLinksBackToTheTown()

        openReport(reportWithReviews)
        learningFake.answerRead(noReviews)
        composeRule.onNodeWithText("Empezar los repasos").performScrollTo().performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        assertLinksBackToTheTown()
    }

    @Test
    fun `links back to the town from a lesson's words`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        assertLinksBackToTheTown()
    }

    @Test
    fun `disables the back link while signing out`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        backLink().assertIsNotEnabled()
    }

    @Test
    fun `signs out from the foot of the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()))
        sessionsFake.answerSignOut()
        sessionsFake.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
    }

    @Test
    fun `signs out from the naming form`() {
        signedInReading(TownReadResult.NoTown)
        waitForLine("Ponle nombre a tu pueblo")
        sessionsFake.answerSignOut()
        sessionsFake.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessionsFake.signOutCount)
    }

    @Test
    fun `signs out from a failed town read`() {
        signedInReading(TownReadResult.Unreachable)
        waitForLine("Volver a intentarlo")
        sessionsFake.answerSignOut()
        sessionsFake.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessionsFake.signOutCount)
    }

    private companion object {
        const val TOWN_HEADER: String = "RIVERTON · PUEBLO"
        const val RING_WORDS: String = "palabra"
        const val LESSON_ONE_READY: String = "Lección 1 lista en"
        const val LESSON_ONE_DONE: String = "La lección 1 terminó."
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
        const val READS_AVAILABLE: Int = 5
        const val SESSION_READS: Int = 2
        val NEAR_FINISH: Duration = 30.seconds
        const val WAIT_MILLIS: Long = 5_000
    }
}

private class MovableClock : Clock {

    var passed: Duration = Duration.ZERO

    override fun now(): Instant = Clock.System.now() + passed
}
