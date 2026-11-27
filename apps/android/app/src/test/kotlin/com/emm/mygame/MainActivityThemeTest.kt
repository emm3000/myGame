package com.emm.mygame

import android.app.UiModeManager
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.theme.ThemePick
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(application = ReminderTapApplication::class)
class MainActivityThemeTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    @Before
    fun answerNoSession() {
        application.sessions.answerRestore(RestoreResult.SignedOut)
    }

    @Test
    fun `the stored pick themes the app from its start`() {
        application.themes.choose(ThemePick.Dark)

        val activity: MainActivity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        composeRule.waitForIdle()

        assertEquals(listOf(false, false), darkIconsOf(activity))
    }

    @Test
    fun `a new pick themes the open app`() {
        val activity: MainActivity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        composeRule.waitForIdle()

        application.themes.choose(ThemePick.Dark)
        composeRule.waitForIdle()

        assertEquals(listOf(false, false), darkIconsOf(activity))
    }

    @Test
    fun `a stored dark pick sets the application night mode at start`() {
        application.themes.choose(ThemePick.Dark)

        Robolectric.buildActivity(MainActivity::class.java).setup()
        composeRule.waitForIdle()

        assertEquals(UiModeManager.MODE_NIGHT_YES, applicationNightMode())
    }

    @Test
    fun `a new light pick sets the application night mode`() {
        Robolectric.buildActivity(MainActivity::class.java).setup()
        composeRule.waitForIdle()

        application.themes.choose(ThemePick.Light)
        composeRule.waitForIdle()

        assertEquals(UiModeManager.MODE_NIGHT_NO, applicationNightMode())
    }

    @Test
    fun `the system pick lets the application night mode follow the phone`() {
        application.themes.choose(ThemePick.Dark)
        Robolectric.buildActivity(MainActivity::class.java).setup()
        composeRule.waitForIdle()

        application.themes.choose(ThemePick.System)
        composeRule.waitForIdle()

        assertEquals(UiModeManager.MODE_NIGHT_AUTO, applicationNightMode())
    }

    @Test
    @Config(sdk = [30])
    fun `below API 31 a stored dark pick leaves the application night mode to the phone`() {
        application.themes.choose(ThemePick.Dark)

        Robolectric.buildActivity(MainActivity::class.java).setup()
        composeRule.waitForIdle()

        assertEquals(UiModeManager.MODE_NIGHT_AUTO, applicationNightMode())
    }

    private fun applicationNightMode(): Int =
        shadowOf(application.getSystemService(UiModeManager::class.java)).applicationNightMode

    private fun darkIconsOf(activity: MainActivity): List<Boolean> {
        val bars: WindowInsetsControllerCompat =
            WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        return listOf(bars.isAppearanceLightStatusBars, bars.isAppearanceLightNavigationBars)
    }
}
