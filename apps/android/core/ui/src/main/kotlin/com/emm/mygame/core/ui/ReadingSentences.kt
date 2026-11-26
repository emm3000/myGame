package com.emm.mygame.core.ui

import androidx.compose.runtime.Immutable
import com.emm.mygame.core.model.learning.FrameSpan

@Immutable
data class ReadingSentences(val sentences: List<List<FrameSpan>>)
