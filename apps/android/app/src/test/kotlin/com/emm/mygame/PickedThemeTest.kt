package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ThemePick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class PickedThemeTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val pick: MutableState<ThemePick> = mutableStateOf(ThemePick.System)

    private var drawnSurface: Color = Color.Unspecified

    private var daySurface: Color = Color.Unspecified

    private var nightSurface: Color = Color.Unspecified

    private fun show(first: ThemePick) {
        pick.value = first
        composeRule.runOnUiThread { composeRule.activity.enableEdgeToEdge() }
        composeRule.setContent {
            MyGameTheme(darkTheme = false) { daySurface = MyGameTheme.colors.surface }
            MyGameTheme(darkTheme = true) { nightSurface = MyGameTheme.colors.surface }
            PickedTheme(pick = pick.value) { DrawnSurface() }
        }
        composeRule.waitForIdle()
    }

    @Composable
    private fun DrawnSurface() {
        drawnSurface = MyGameTheme.colors.surface
    }

    private fun barIcons(): BarIcons {
        val activity: ComponentActivity = composeRule.activity
        val bars: WindowInsetsControllerCompat =
            WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        return BarIcons(
            areStatusIconsDark = bars.isAppearanceLightStatusBars,
            areNavigationIconsDark = bars.isAppearanceLightNavigationBars,
        )
    }

    private data class BarIcons(val areStatusIconsDark: Boolean, val areNavigationIconsDark: Boolean)

    @Test
    fun `system draws the day colors on a light phone`() {
        show(ThemePick.System)

        assertEquals(daySurface, drawnSurface)
    }

    @Test
    @Config(qualifiers = "night")
    fun `system draws the night colors on a dark phone`() {
        show(ThemePick.System)

        assertEquals(nightSurface, drawnSurface)
    }

    @Test
    fun `dark draws the night colors on a light phone`() {
        show(ThemePick.Dark)

        assertEquals(nightSurface, drawnSurface)
    }

    @Test
    @Config(qualifiers = "night")
    fun `light draws the day colors on a dark phone`() {
        show(ThemePick.Light)

        assertEquals(daySurface, drawnSurface)
    }

    @Test
    fun `a new pick redraws the app at once`() {
        show(ThemePick.System)

        pick.value = ThemePick.Dark
        composeRule.waitForIdle()

        assertEquals(nightSurface, drawnSurface)
    }

    @Test
    fun `dark draws light system bar icons on a light phone`() {
        show(ThemePick.Dark)

        assertEquals(BarIcons(areStatusIconsDark = false, areNavigationIconsDark = false), barIcons())
    }

    @Test
    @Config(qualifiers = "night")
    fun `light draws dark system bar icons on a dark phone`() {
        show(ThemePick.Light)

        assertEquals(BarIcons(areStatusIconsDark = true, areNavigationIconsDark = true), barIcons())
    }

    @Test
    fun `a forced pick keeps the system's contrast scrim on three-button navigation`() {
        show(ThemePick.Dark)

        assertEquals(true, composeRule.activity.window.isNavigationBarContrastEnforced)
    }

    @Test
    fun `system bar icons follow a new pick`() {
        show(ThemePick.Light)

        pick.value = ThemePick.Dark
        composeRule.waitForIdle()

        assertEquals(BarIcons(areStatusIconsDark = false, areNavigationIconsDark = false), barIcons())
    }
}
