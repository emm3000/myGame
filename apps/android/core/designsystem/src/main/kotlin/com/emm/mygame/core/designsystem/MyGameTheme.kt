package com.emm.mygame.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

private val LocalMyGameColors: ProvidableCompositionLocal<MyGameColors> =
    staticCompositionLocalOf { error("MyGameColors read outside MyGameTheme") }

@Composable
fun MyGameTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors: MyGameColors = if (darkTheme) darkColors else lightColors
    CompositionLocalProvider(LocalMyGameColors provides colors, content = content)
}

object MyGameTheme {

    val colors: MyGameColors
        @Composable
        @ReadOnlyComposable
        get() = LocalMyGameColors.current
}
