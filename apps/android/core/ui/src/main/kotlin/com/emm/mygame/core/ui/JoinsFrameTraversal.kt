package com.emm.mygame.core.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics

fun Modifier.joinsFrameTraversal(): Modifier = semantics { isTraversalGroup = false }
