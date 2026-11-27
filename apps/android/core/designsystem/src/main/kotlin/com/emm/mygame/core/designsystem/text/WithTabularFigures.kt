package com.emm.mygame.core.designsystem.text

import androidx.compose.ui.text.TextStyle

fun TextStyle.withTabularFigures(): TextStyle = copy(fontFeatureSettings = "tnum")
