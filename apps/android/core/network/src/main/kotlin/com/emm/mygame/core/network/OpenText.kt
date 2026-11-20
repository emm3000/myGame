package com.emm.mygame.core.network

data class OpenText(val id: TextId, val title: String, val sentences: List<List<FrameSpan>>)
