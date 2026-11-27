package com.emm.mygame.core.designsystem.control

import androidx.compose.ui.text.AnnotatedString
import com.emm.mygame.core.designsystem.text.MyGameLabel

internal data class MyGamePillText(
    val label: MyGameLabel,
    val caption: MyGameLabel?,
    val labelLineOf: (String) -> AnnotatedString,
)
