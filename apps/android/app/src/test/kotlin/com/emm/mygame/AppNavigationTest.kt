package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
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

    private fun townOf(inLearning: Int = 0): TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null)),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = listOf(
            TownSnapshot.Lesson(
                id = LessonId("lesson-1"),
                theme = "A day in town",
                duration = 150.seconds,
                requiredSchoolLevel = 1,
                skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
                isStudied = false,
                wordCount = 5,
                readings = listOf(TownSnapshot.WordReading("water", "agua", "I drink water.")),
            ),
        ),
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
        waitForLine("Riverton")
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun tab(label: String): SemanticsNodeInteraction = composeRule.onNode(hasText(label).and(isTab()))

    private fun isTab(): SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)

    private fun openReport(report: TownReport) {
        reportsFake.answerRead(ReportReadResult.Read(report))
        tab("Informe").performClick()
        waitForLine("Noticias del pueblo")
    }

    @Test
    fun `draws the town and the Report tabs with no fief listed`() {
        signedInAtTown()

        tab("Pueblo").assertIsDisplayed()
        tab("Informe").assertIsDisplayed()
    }

    @Test
    fun `draws no medieval tab with no fief listed`() {
        signedInAtTown()

        composeRule.onAllNodesWithText("Mapa").assertCountEquals(0)
        composeRule.onAllNodesWithText("Crónica").assertCountEquals(0)
    }

    @Test
    fun `reads the navigation in the order town, Report, map, chronicle`() {
        signedInAtTown(fiefs = listOf(listedFief))
        waitForLine("Mapa")

        val lefts: List<Float> = listOf("Pueblo", "Informe", "Mapa", "Crónica").map { label: String ->
            tab(label).fetchSemanticsNode().boundsInRoot.left
        }

        assertEquals(lefts.sorted(), lefts)
        assertEquals(lefts.size, lefts.toSet().size)
    }

    @Test
    fun `opens the Report from its tab`() {
        signedInAtTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `marks the Report tab current on the Report`() {
        signedInAtTown()

        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))

        tab("Informe").assertIsSelected()
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
    fun `opens the reviews from the Report`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learningFake.readCount)
    }

    @Test
    fun `keeps the Report tab current on the reviews`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 3, readFirst = emptyList(), news = emptyList()))
        learningFake.answerRead(noReviews)

        composeRule.onNodeWithText("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        tab("Informe").assertIsSelected()
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

        tab("Informe").performClick()
        waitForLine("No tienes repasos pendientes ahora.")

        assertEquals(2, reportsFake.readCount)
    }

    @Test
    fun `returns to the town from the Report on its tab`() {
        signedInAtTown()
        openReport(TownReport(dueCount = 0, readFirst = emptyList(), news = emptyList()))

        tab("Pueblo").performClick()
        waitForLine("Riverton")

        tab("Pueblo").assertIsSelected()
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
    fun `disables every tab while signing out`() {
        signedInAtTown(fiefs = listOf(listedFief))
        waitForLine("Mapa")

        composeRule.onNodeWithText("Salir").performClick()
        composeRule.waitForIdle()

        listOf("Pueblo", "Informe", "Mapa", "Crónica").forEach { label: String ->
            tab(label).assertIsNotEnabled()
        }
    }

    private companion object {
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
