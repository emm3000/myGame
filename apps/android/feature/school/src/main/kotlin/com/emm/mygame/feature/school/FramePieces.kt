package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameFrame
import com.emm.mygame.core.designsystem.MyGameFramePiece
import com.emm.mygame.core.designsystem.MyGameWordSupport
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.WordSupport

internal fun List<FrameSpan>.toMyGameFrame(): MyGameFrame = MyGameFrame(map(::toFramePiece))

private fun toFramePiece(span: FrameSpan): MyGameFramePiece =
    MyGameFramePiece(text = span.text, support = span.support?.toMyGameSupport())

internal fun WordSupport.toMyGameSupport(): MyGameWordSupport =
    MyGameWordSupport(isOnTap = shown == WordSupport.Shown.OnTap, text = text, languageTag = language.tag)
