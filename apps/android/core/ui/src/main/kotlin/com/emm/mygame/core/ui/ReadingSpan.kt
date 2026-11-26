package com.emm.mygame.core.ui

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.WordSupport

data class ReadingSpan(val sentence: Int, val span: Int)

fun ReadingSpan?.afterTapOn(at: ReadingSpan): ReadingSpan? = if (this == at) null else at

fun List<List<FrameSpan>>.supportOpenAt(tapped: ReadingSpan?): WordSupport? {
    val at: ReadingSpan = tapped ?: return null
    val support: WordSupport = getOrNull(at.sentence)?.getOrNull(at.span)?.support ?: return null
    return support.takeIf { shown: WordSupport -> shown.shown == WordSupport.Shown.OnTap }
}
