package com.emm.mygame.core.ui

import com.emm.mygame.core.designsystem.MyGameFrame
import com.emm.mygame.core.designsystem.MyGameFramePiece
import com.emm.mygame.core.designsystem.MyGameWordSupport
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.WordSupport

fun List<FrameSpan>.toMyGameFrame(): MyGameFrame = MyGameFrame(map(::toFramePiece))

private fun toFramePiece(span: FrameSpan): MyGameFramePiece =
    MyGameFramePiece(text = span.text, support = span.support?.toMyGameSupport())

fun WordSupport.toMyGameSupport(): MyGameWordSupport =
    MyGameWordSupport(isOnTap = shown == WordSupport.Shown.OnTap, text = text, languageTag = language.tag)
