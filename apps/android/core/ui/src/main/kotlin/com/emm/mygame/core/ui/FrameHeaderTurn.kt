package com.emm.mygame.core.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex

private const val FRAME_HEADER_TURN: Float = -2f

fun Modifier.frameHeaderTurn(): Modifier = semantics {
    isTraversalGroup = true
    traversalIndex = FRAME_HEADER_TURN
}
