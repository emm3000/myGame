package com.emm.mygame.core.designsystem.frame

import androidx.compose.runtime.Immutable
import com.emm.mygame.core.designsystem.text.MyGameWordSupport

@Immutable
data class MyGameFrame(val pieces: List<MyGameFramePiece>) {

    fun openedSupportOf(pieceIndex: Int?): MyGameWordSupport? = pieceIndex
        ?.let { index: Int -> pieces.getOrNull(index)?.support }
        ?.takeIf(MyGameWordSupport::isOnTap)
}
