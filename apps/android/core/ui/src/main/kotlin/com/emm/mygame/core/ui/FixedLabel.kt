package com.emm.mygame.core.ui

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.text.MyGameLabel

@Composable
fun fixedLabel(@StringRes id: Int, vararg arguments: Pair<String, Any>): MyGameLabel =
    MyGameLabel(text = fixedCopyResource(id, *arguments), translation = null)

fun fixedLabel(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)
