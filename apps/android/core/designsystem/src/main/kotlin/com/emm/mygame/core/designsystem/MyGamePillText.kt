package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.AnnotatedString

internal data class MyGamePillText(
    val label: MyGameLabel,
    val caption: MyGameLabel?,
    val labelLineOf: (String) -> AnnotatedString,
)
