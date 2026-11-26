package com.emm.mygame

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.townOf
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
@Config(application = ReminderTapApplication::class)
class TodayAwayLifecycleTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    @Before
    fun restoreASessionAfterAnHourAway() {
        val player: SignedInPlayer =
            SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish)
        repeat(SESSION_READS) { application.sessions.answerRestore(RestoreResult.SignedIn(player)) }
        repeat(REPORT_READS) { application.reports.answerRead(ReportReadResult.Read(nothingDue())) }
        application.towns.answerRead(TownReadResult.Read(townOf(readAt).copy(away = moneyGained)))
        repeat(LATER_READS) { application.towns.answerRead(TownReadResult.Read(townOf(readAt))) }
    }

    @Test
    fun `Today keeps what the town gained while the activity recreates`() {
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitForLine(EARNED_TITLE)

        composeRule.runOnIdle { activity.recreate() }

        waitForLine(EARNED_TITLE)
    }

    @Test
    fun `Today keeps what the town gained while the activity stops and starts again`() {
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitForLine(EARNED_TITLE)

        composeRule.runOnIdle { activity.pause().stop() }
        composeRule.runOnIdle { activity.restart().resume() }
        composeRule.waitForIdle()

        assertEquals(1, composeRule.onAllNodes(hasText(EARNED_TITLE)).fetchSemanticsNodes().size)
    }

    @Test
    fun `Today drops what the town gained once the player opens Town and comes back`() {
        Robolectric.buildActivity(MainActivity::class.java).setup()
        waitForLine(EARNED_TITLE)

        composeRule.onNodeWithContentDescription(TOWN_TAB).performClick()
        waitForLine(TOWN_HEADER)
        composeRule.onNodeWithContentDescription(TODAY_TAB).performClick()
        waitForLine(TODAY_TITLE)

        assertEquals(0, composeRule.onAllNodes(hasText(EARNED_TITLE)).fetchSemanticsNodes().size)
    }

    private fun nothingDue(): TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 6
        const val REPORT_READS: Int = 6
        const val LATER_READS: Int = 6
        const val EARNED_TITLE: String = "Lo que ganó tu pueblo"
        const val TOWN_TAB: String = "Pueblo"
        const val TODAY_TAB: String = "Hoy"
        const val TOWN_HEADER: String = "Riverton · Pueblo"
        const val TODAY_TITLE: String = "No tienes repasos pendientes ahora."
        val moneyGained: TownSnapshot.Away = TownSnapshot.Away(listOf(TownSnapshot.Cost(TownResourceKind.Money, 120)))
    }
}
