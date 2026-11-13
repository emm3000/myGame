package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

enum class ScaffoldLanguage {
    Spanish,
    None,
}

enum class ChromePhase {
    Scaffold,
    Both,
    English,
}

data class CopyLanguage(val scaffold: ScaffoldLanguage, val chromePhase: ChromePhase)

private val LocalCopyLanguage: ProvidableCompositionLocal<CopyLanguage?> = staticCompositionLocalOf { null }

@Composable
fun ProvideCopyLanguage(language: CopyLanguage?, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalCopyLanguage provides language, content = content)
}

internal val currentCopyLanguage: CopyLanguage?
    @Composable
    @ReadOnlyComposable
    get() = LocalCopyLanguage.current
