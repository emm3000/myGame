package com.emm.mygame

import android.graphics.Color
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.LocalActivity
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ThemePick

@Composable
fun PickedTheme(pick: ThemePick, content: @Composable () -> Unit) {
    val isDark: Boolean = isDarkUnder(pick)
    val activity: ComponentActivity? = LocalActivity.current as? ComponentActivity
    LaunchedEffect(activity, isDark) {
        val bars: SystemBarStyle = barsFor(isDark)
        activity?.enableEdgeToEdge(statusBarStyle = bars, navigationBarStyle = bars)
    }
    MyGameTheme(darkTheme = isDark, content = content)
}

@Composable
private fun isDarkUnder(pick: ThemePick): Boolean = when (pick) {
    ThemePick.System -> isSystemInDarkTheme()
    ThemePick.Light -> false
    ThemePick.Dark -> true
}

private fun barsFor(isDark: Boolean): SystemBarStyle =
    if (isDark) SystemBarStyle.dark(Color.TRANSPARENT) else SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
