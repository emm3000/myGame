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
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.feature.town.TOWN_STATUS
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
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

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val movableClock: MovableClock = MovableClock(start = readAt)

    private val appOwner: TestLifecycleOwner = TestLifecycleOwner(Lifecycle.State.RESUMED)

    private val dependencies: AppDependencies = dependenciesOf(
        clock = movableClock,
        towns = towns,
        reports = reports,
    )

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private val lessonNearItsFinish: TownSnapshot = townOf(
        readAt,
        nextStep = NextStep.LessonRunning(goal = null, text = null),
        hasOffice = false,
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
        lessonSlot = TownSnapshot.LessonSlot(FIRST_LESSON, readAt, readAt + NEAR_FINISH),
    )

    private fun onTheReportAsTheLessonNearsItsFinish() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(lessonNearItsFinish)) }
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides appOwner) {
                MyGameTheme {
                    AppNavigation(
                        dependencies = dependencies,
                        reminderTaps = emptyFlow(),
                        mailedLinks = emptyFlow(),
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

        assertEquals(READS_ON_ARRIVAL, towns.readCount)
    }

    @Test
    fun `follows the lesson's finish again on return from the background`() {
        onTheReportAsTheLessonNearsItsFinish()
        passingTheFinishInTheBackground()
        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.RESUMED }
        composeRule.waitUntil(WAIT_MILLIS) { towns.readCount >= READS_ON_RETURN }

        ShadowLooper.idleMainLooper(1, TimeUnit.MINUTES)
        composeRule.waitUntil(WAIT_MILLIS) { towns.readCount > READS_ON_RETURN }

        assertEquals(READS_ON_RETURN + 1, towns.readCount)
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
