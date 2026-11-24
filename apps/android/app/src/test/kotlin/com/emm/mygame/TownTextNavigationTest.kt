package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.OpenText
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.TownTextResult
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.FakeTownTextRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.AppNavigation
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownTextNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = readAt
    }

    private val towns: FakeTownRepository = FakeTownRepository()

    private val texts: FakeTownTextRepository = FakeTownTextRepository()

    private val dependencies: AppDependencies = dependenciesOf(clock = fixedClock, towns = towns, texts = texts)

    private val newestText: OpenText = OpenText(
        id = TextId("text-31"),
        title = "The New Shop",
        sentences = listOf(listOf(FrameSpan("We open a shop on the river.", null))),
    )

    private val caughtUpWithANewestText: TownSnapshot = townOf(
        readAt,
        nextStep = NextStep.CaughtUp(
            CaughtUpReason.LessonsDone,
            goal = null,
            text = NextStepText(newestText.id, newestText.title),
        ),
        texts = listOf(TownSnapshot.TextTitle(newestText.id, newestText.title)),
    )

    @Test
    fun `opens the newest text from its line on the town home`() {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(caughtUpWithANewestText)) }
        texts.answerText(TownTextResult.Read(newestText))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town),
                )
            }
        }
        waitForLine("Lee: The New Shop")

        composeRule.onNodeWithText("Lee: The New Shop").performScrollTo().performClick()

        waitForLine("We open a shop on the river.")
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val READS_AVAILABLE: Int = 6
        const val WAIT_MILLIS: Long = 5_000
    }
}
