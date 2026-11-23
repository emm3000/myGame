package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.feature.town.TOWN_STATUS
import com.emm.mygame.feature.town.TownStatusViewModel
import com.emm.mygame.navigation.AppNavigation
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolLessonStatusNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = readAt
    }

    private val schoolTowns: FakeTownRepository = FakeTownRepository()

    private val statusTowns: FakeTownRepository = FakeTownRepository()

    private val dependencies: AppDependencies = dependenciesOf(clock = fixedClock, towns = schoolTowns)

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val idleTown: TownSnapshot = townOf(
        readAt,
        lessons = listOf(
            TownSnapshot.Lesson(
                id = firstLesson,
                theme = "A day in town",
                duration = 150.seconds,
                requiredSchoolLevel = 1,
                skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
                isStudied = false,
                wordCount = 5,
                enteringWordCount = 5,
                readings = emptyList(),
                standings = emptyList(),
            ),
        ),
    )

    private val studyingTown: TownSnapshot = idleTown.copy(
        lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + 10.minutes),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
    )

    private val runningLine: SemanticsMatcher =
        hasTestTag(TOWN_STATUS).and(hasAnyDescendant(hasText("Lección 1 lista en")))

    @Test
    fun `draws the running lesson's line on the school once the school draws no lesson`() {
        statusTowns.answerRead(TownReadResult.Read(studyingTown))
        schoolTowns.answerRead(TownReadResult.Read(studyingTown))
        showingTheSchool()
        waitForLine(STUDYING_REFUND)
        composeRule.onAllNodes(runningLine).assertCountEquals(0)
        schoolTowns.answerRead(TownReadResult.Read(idleTown))

        runBlocking { schoolTowns.read() }

        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(runningLine).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun showingTheSchool() {
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town, Destination.School),
                    status = TownStatusViewModel(statusTowns, fixedClock),
                )
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val STUDYING_REFUND: String = "Si lo paras, la lección queda por estudiar y puedes volver a empezarla."
        const val WAIT_MILLIS: Long = 5_000
    }
}
