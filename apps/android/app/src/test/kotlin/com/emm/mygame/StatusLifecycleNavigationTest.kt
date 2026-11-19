package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.testing.TestLifecycleOwner
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
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
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownResourceKind
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
import com.emm.mygame.feature.town.TOWN_STATUS
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowLooper

@RunWith(RobolectricTestRunner::class)
class StatusLifecycleNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val movableClock: MovableClock = MovableClock(start = readAt)

    private val appOwner: TestLifecycleOwner = TestLifecycleOwner(Lifecycle.State.RESUMED)

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = movableClock
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

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private val lessonNearItsFinish: TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null)),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = listOf(
            TownSnapshot.Lesson(
                id = FIRST_LESSON,
                theme = "A day in town",
                duration = 150.seconds,
                requiredSchoolLevel = 1,
                skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
                isStudied = false,
                wordCount = 5,
                readings = emptyList(),
                standings = emptyList(),
            ),
        ),
        releasedLessons = emptyList(),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null, nextInLearningDueAt = null),
        stableWordCount = 0,
        retainedWordCount = 0,
        lessonSlot = TownSnapshot.LessonSlot(FIRST_LESSON, readAt, readAt + NEAR_FINISH),
        hiring = hiringOf(),
        job = null,
        nextStep = NextStep.LessonRunning(goal = null),
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )

    private fun onTheReportAsTheLessonNearsItsFinish() {
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        repeat(READS_ON_ARRIVAL) { townsFake.answerRead(TownReadResult.Read(lessonNearItsFinish)) }
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides appOwner) {
                MyGameTheme {
                    AppNavigation(
                        dependencies = dependencies,
                        reminderTaps = emptyFlow(),
                        backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                    )
                }
            }
        }
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasTestTag(TOWN_STATUS).and(hasAnyDescendant(hasText(LESSON_READY))))
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
    }

    private fun passingTheFinishInTheBackground() {
        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.CREATED }
        movableClock.passed += NEAR_FINISH + 1.seconds
        ShadowLooper.idleMainLooper(BACKGROUND_MINUTES, TimeUnit.MINUTES)
        composeRule.waitForIdle()
    }

    @Test
    fun `reads nothing at the lesson's finish while the app is in the background`() {
        onTheReportAsTheLessonNearsItsFinish()

        passingTheFinishInTheBackground()

        assertEquals(READS_ON_ARRIVAL, townsFake.readCount)
    }

    @Test
    fun `follows the lesson's finish again on return from the background`() {
        onTheReportAsTheLessonNearsItsFinish()
        passingTheFinishInTheBackground()
        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.RESUMED }
        composeRule.waitUntil(WAIT_MILLIS) { townsFake.readCount >= READS_ON_RETURN }

        ShadowLooper.idleMainLooper(1, TimeUnit.MINUTES)
        composeRule.waitUntil(WAIT_MILLIS) { townsFake.readCount > READS_ON_RETURN }

        assertEquals(READS_ON_RETURN + 1, townsFake.readCount)
    }

    private class MovableClock(private val start: Instant) : Clock {

        var passed: Duration = Duration.ZERO

        override fun now(): Instant = start + passed
    }

    private companion object {
        val FIRST_LESSON: LessonId = LessonId("lesson-1")
        val NEAR_FINISH: Duration = 30.seconds
        const val LESSON_READY: String = "Lección 1 lista en"
        const val BACKGROUND_MINUTES: Long = 2
        const val READS_ON_ARRIVAL: Int = 2
        const val READS_ON_RETURN: Int = 3
        const val WAIT_MILLIS: Long = 5_000
    }
}
