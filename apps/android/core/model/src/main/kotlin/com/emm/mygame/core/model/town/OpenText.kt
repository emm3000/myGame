package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.TextId

data class OpenText(val id: TextId, val title: String, val sentences: List<List<FrameSpan>>)
