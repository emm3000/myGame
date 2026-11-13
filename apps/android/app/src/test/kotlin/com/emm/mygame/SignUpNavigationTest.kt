package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignUpResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SignUpNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = FakeReportRepository()
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
    }

    @Test
    fun `opens Name your town after sign-up`() {
        sessionsFake.answerRestore(RestoreResult.SignedOut)
        sessionsFake.answerSignUp(SignUpResult.SignedIn(SignedInPlayer("elena@example.com", isEmailVerified = true)))
        repeat(READS_AVAILABLE) { townsFake.answerRead(TownReadResult.NoTown) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
        waitForLine("Crea tu cuenta")
        composeRule.onNodeWithText("Crea tu cuenta").performScrollTo().performClick()
        waitForLine("Crear cuenta")

        textField("Correo").performTextInput("elena@example.com")
        textField("Contraseña").performTextInput("hierro-y-lana")
        composeRule.onNodeWithText("Crear cuenta").performScrollTo().performClick()

        waitForLine("Ponle nombre a tu pueblo")
    }

    private fun textField(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
