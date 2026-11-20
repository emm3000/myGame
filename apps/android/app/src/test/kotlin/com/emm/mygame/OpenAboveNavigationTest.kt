package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.CaughtUpReason
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownNewsReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
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
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class OpenAboveNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = readAt
    }

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = fixedClock
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)
        override val sessions: SessionRepository = FakeSessionRepository()
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
        override val studyReminders: StudyReminderSettings =
            FakeStudyReminderSettings(StudyReminderChoice.firstChoice)
        override val reminderNotifications: ReminderNotifications =
            FakeReminderNotifications(areAllowed = true, canAsk = true)
        override val themes: ThemeSettings = FakeThemeSettings(ThemePick.System)
    }

    private val newShop: TownSnapshot.OpenText = TownSnapshot.OpenText(
        id = TextId("text-31"),
        title = "The New Shop",
        sentences = listOf(listOf(FrameSpan("We open a shop on the river.", null))),
    )

    private val townWithTheShop: TownSnapshot = TownSnapshot(
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
        lessons = emptyList(),
        releasedLessons = emptyList(),
        texts = listOf(newShop),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null, nextInLearningDueAt = null),
        stableWordCount = 0,
        retainedWordCount = 0,
        lessonSlot = null,
        hiring = hiringOf(),
        job = null,
        nextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null),
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private var shownStack: NavBackStack<NavKey>? = null

    @Test
    fun `opens the news above the Report`() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        reportsFake.answerNews(TownNewsReadResult.Read(emptyList()))
        showing(Destination.Town, Destination.Report)

        waitedForLink("Leer todas las noticias").performScrollTo().performClick()

        assertStackEndsWith(Destination.Report, Destination.News)
    }

    @Test
    fun `opens a text above the school from its row`() {
        showing(Destination.Town, Destination.School)

        waitedForLink(newShop.title).performScrollTo().performClick()

        assertStackEndsWith(Destination.School, Destination.SchoolText(newShop.id))
    }

    private fun showing(vararg destinations: Destination) {
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.Read(townWithTheShop)) }
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

    private fun waitedForLink(label: String): SemanticsNodeInteraction {
        val link: SemanticsMatcher = hasText(label).and(hasClickAction())
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(link).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(link)
    }

    private fun assertStackEndsWith(vararg destinations: Destination) {
        composeRule.waitForIdle()
        assertEquals(destinations.toList(), shownStack.orEmpty().takeLast(destinations.size))
    }

    private companion object {
        const val READS_AVAILABLE: Int = 6
        const val WAIT_MILLIS: Long = 5_000
    }
}
