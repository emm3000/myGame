package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Immutable

@Immutable
data class MyGameFrame(val pieces: List<MyGameFramePiece>) {

    fun openedSupportOf(piece: Int?): MyGameWordSupport? = piece
        ?.let { index: Int -> pieces.getOrNull(index)?.support }
        ?.takeIf(MyGameWordSupport::isOnTap)
}
