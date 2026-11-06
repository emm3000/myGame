package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.TextStyle

fun TextStyle.withTabularFigures(): TextStyle = copy(fontFeatureSettings = "tnum")
