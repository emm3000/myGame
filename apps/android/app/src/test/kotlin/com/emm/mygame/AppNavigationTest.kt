package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
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
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.ChronicleRepository
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.FiefAddress
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FiefListResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ListedFief
import com.emm.mygame.core.network.MapRepository
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeChronicleRepository
import com.emm.mygame.core.testing.FakeFiefListRepository
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeMapRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AppNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val listingsFake: FakeFiefListRepository = FakeFiefListRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val learningFake: FakeLearningRepository = FakeLearningRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val sessions: SessionRepository = sessionsFake
        override val listings: FiefListRepository = listingsFake
        override val fiefs: FiefRepository = FakeFiefRepository()
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = learningFake
        override val reports: ReportRepository = reportsFake
        override val maps: MapRepository = FakeMapRepository()
        override val chronicles: ChronicleRepository = FakeChronicleRepository()
    }

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val noReviews: ReviewsReadResult.Read =
        ReviewsReadResult.Read(DueReviews(due = emptyList(), nextDueAt = null, readAt = readAt))

    private val listedFief: ListedFief = ListedFief(
        id = FiefId("509eadd5-6b34-4ea3-8e91-2b38744bd385"),
        name = "Sotoverde",
        address = FiefAddress(kingdom = 1, province = 3, plot = 12),
        freeSlots = emptyList(),
        fullStores = emptyList(),
    )

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val waterWord: TownSnapshot.WordReading = TownSnapshot.WordReading("water", "agua", "I drink water.")

    private val townWord: TownSnapshot.WordReading = TownSnapshot.WordReading("town", "pueblo", "We live in a town.")

    private val walkReport: TownReport =
        TownReport(dueCount = 3, readFirst = listOf(firstLesson, secondLesson), news = emptyList())

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
        )

    private fun townOf(
        inLearning: Int = 0,
        lessons: List<TownSnapshot.Lesson> = listOf(lessonOf(firstLesson, listOf(waterWord))),
    ): TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null)),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = lessons,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = inLearning),
        lessonSlot = null,
        readAt = readAt,
    )

    private fun signedInAtTown(fiefs: List<ListedFief> = emptyList(), town: TownSnapshot = townOf()) {
        sessionsFake.answerRestore(RestoreResult.SignedIn(SignedInPlayer("player@example.com")))
        listingsFake.answerListed(FiefListResult.Listed(fiefs))
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(town)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
        waitForLine(TOWN_HEADER)
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

    private fun showingStack(vararg destinations: Destination) {
        listingsFake.answerListed(FiefListResult.Listed(listOf(listedFief)))
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(townOf())) }
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
    fun `opens the Report from its door`() {
        signedInAtTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `opens the unread lesson's words from the Report`() {
        signedInAtTown()
        val unread: TownReport = TownReport(dueCount = 3, readFirst = listOf(LessonId("lesson-1")), news = emptyList())
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
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learningFake.readCount)
    }

    @Test
    fun `reads the Report again on the way back from the reviews`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))
        learningFake.answerRead(noReviews)
        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        val nothingDue: TownReport = TownReport(dueCount = 0, readFirst = emptyList(), news = emptyList())
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        waitForLine("No tienes repasos pendientes ahora.")

        assertEquals(2, reportsFake.readCount)
    }

    @Test
    fun `opens the reviews from the school past the learning cap`() {
        signedInAtTown(town = townOf(inLearning = 8))
        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("La siguiente lección trae 5 palabras. Empieza los repasos.")
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performScrollTo().performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learningFake.readCount)
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
        waitForLine("Lecciones")
        assertLinksBackToTheTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))
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
    fun `links back to the town from the map`() {
        showingStack(Destination.Town, Destination.Map(listedFief.id))
        waitForLine("PUEBLO")

        assertLinksBackToTheTown()
    }

    @Test
    fun `links back to the town from the chronicle`() {
        showingStack(Destination.Town, Destination.Chronicle(listedFief.id))
        waitForLine("PUEBLO")

        assertLinksBackToTheTown()
    }

    @Test
    fun `keeps the fief switcher under the back link on a medieval screen`() {
        showingStack(Destination.Town, Destination.Map(listedFief.id))
        waitForLine("Sotoverde")

        assertTrue(
            backLink().fetchSemanticsNode().boundsInRoot.top <
                composeRule.onNodeWithText("Sotoverde").fetchSemanticsNode().boundsInRoot.top,
        )
    }

    @Test
    fun `disables the back link while signing out`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), news = emptyList()))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        backLink().assertIsNotEnabled()
    }

    @Test
    fun `signs out from the foot of the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), news = emptyList()))
        sessionsFake.answerSignOut()
        sessionsFake.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
    }

    private companion object {
        const val TOWN_HEADER: String = "RIVERTON · PUEBLO"
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
