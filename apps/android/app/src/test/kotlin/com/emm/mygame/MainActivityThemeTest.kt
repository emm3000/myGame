package com.emm.mygame

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ThemePick
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(application = ReminderTapApplication::class)
class MainActivityThemeTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    @Before
    fun answerNoSession() {
        application.sessionsFake.answerRestore(RestoreResult.SignedOut)
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

    private fun darkIconsOf(activity: MainActivity): List<Boolean> {
        val bars: WindowInsetsControllerCompat =
            WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        return listOf(bars.isAppearanceLightStatusBars, bars.isAppearanceLightNavigationBars)
    }
}
