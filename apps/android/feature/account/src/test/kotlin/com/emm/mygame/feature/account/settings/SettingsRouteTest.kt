package com.emm.mygame.feature.account.settings

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeThemeSettings
import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SIGN_OUT: String = "Salir"

@RunWith(RobolectricTestRunner::class)
class SettingsRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val playerScaffold: MutableStateFlow<PlayerScaffold?> = MutableStateFlow(PlayerScaffold.Spanish)

    private val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(StudyReminderChoice.firstChoice)

    private val notifications: FakeReminderNotifications = FakeReminderNotifications(areAllowed = true, canAsk = true)

    private val reports: FakeReportRepository = FakeReportRepository()

    private var signingOuts: Int = 0

    private var signedOuts: Int = 0

    private fun routeShowing(viewModel: SettingsViewModel): @Composable () -> Unit = {
        MyGameTheme {
            SettingsRoute(
                sources = SettingsSources(
                    sessions = sessions,
                    playerScaffold = playerScaffold,
                    reminders = reminders,
                    notifications = notifications,
                    reports = reports,
                    themes = FakeThemeSettings(ThemePick.System),
                ),
                rememberNotificationAsk = { { } },
                navigation = SettingsNavigation(
                    onNotificationSettingsOpen = {},
                    onSigningOut = { signingOuts += 1 },
                    onSignedOut = { signedOuts += 1 },
                ),
                viewModel = viewModel,
            )
        }
    }

    private fun shownSettings(): StateRestorationTester {
        sessions.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)))
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        restoration.setContent(
            routeShowing(SettingsViewModel(sessions, playerScaffold, reminders, notifications, reports)),
        )
        return restoration
    }

    private fun tapSignOut() {
        composeRule.onNode(hasText(SIGN_OUT) and hasClickAction()).performScrollTo().performClick()
        composeRule.waitForIdle()
    }

    @Test
    fun `calls onSigningOut once when the screen is rebuilt mid-sign-out`() {
        val restoration: StateRestorationTester = shownSettings()
        tapSignOut()

        restoration.emulateSavedInstanceStateRestore()
        composeRule.waitForIdle()

        assertEquals(1, signingOuts)
    }

    @Test
    fun `calls onSignedOut once the session has ended`() {
        shownSettings()
        sessions.answerSignOut()

        tapSignOut()

        assertEquals(1, signedOuts)
    }
}
