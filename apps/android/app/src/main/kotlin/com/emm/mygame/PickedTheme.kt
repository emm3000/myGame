package com.emm.mygame

import android.graphics.Color
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.LocalActivity
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.graphics.toArgb
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ThemePick

@Composable
fun PickedTheme(pick: ThemePick, content: @Composable () -> Unit) {
    val isDark: Boolean = isDarkUnder(pick)
    MyGameTheme(darkTheme = isDark) {
        val activity: ComponentActivity? = LocalActivity.current as? ComponentActivity
        val scrim: Int = MyGameTheme.colors.surface.toArgb()
        LaunchedEffect(activity, isDark, scrim) {
            activity?.enableEdgeToEdge(
                statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { isDark },
                navigationBarStyle = SystemBarStyle.auto(scrim, scrim) { isDark },
            )
        }
        content()
    }
}

@Composable
private fun isDarkUnder(pick: ThemePick): Boolean = when (pick) {
    ThemePick.System -> isSystemInDarkTheme()
    ThemePick.Light -> false
    ThemePick.Dark -> true
}
