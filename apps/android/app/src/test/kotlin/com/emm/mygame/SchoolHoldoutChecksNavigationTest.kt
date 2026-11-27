package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.holdout.HoldoutChecksReadResult
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class SchoolHoldoutChecksNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val holdoutChecks: FakeHoldoutCheckRepository = FakeHoldoutCheckRepository()

    private val dependencies: AppDependencies =
        dependenciesOf(sessions = sessions, towns = towns, holdoutChecks = holdoutChecks)

    private val verifiedSession: RestoreResult = RestoreResult.SignedIn(
        SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
    )

    @Test
    fun `the school draws the holdout checks that are due`() {
        val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        showing(Destination.Today, Destination.Town, Destination.School)

        waitFor(hasText("Tienes pendiente una prueba de palabras de la banda 1, semana 8."))
    }

    private fun showing(vararg destinations: NavKey) {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(townOf(readAt))) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations),
                )
            }
        }
    }

    private fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
    }

    private companion object {
        const val READS_AVAILABLE: Int = 5
        const val SESSION_READS: Int = 2
        const val WAIT_MILLIS: Long = 5_000
    }
}
