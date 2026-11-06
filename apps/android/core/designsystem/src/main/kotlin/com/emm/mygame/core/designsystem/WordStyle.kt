package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp

@Composable
fun wordStyle(): TextStyle = wordStyleAt(LocalWindowInfo.current.containerDpSize.width)

internal fun wordStyleAt(windowWidth: Dp): TextStyle =
    if (windowWidth >= MyGameSizes.widthMd) MyGameTypography.wordFromMd else MyGameTypography.word
