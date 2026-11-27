package com.emm.mygame.core.designsystem.frame

import com.emm.mygame.core.designsystem.text.MyGameWordSupport

internal sealed interface FrameRun {
    data class Plain(val text: String) : FrameRun

    data class Word(val pieceIndex: Int, val text: String) : FrameRun

    data class Beside(val support: MyGameWordSupport, val closing: String) : FrameRun
}
