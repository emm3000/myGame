package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameSupportLine
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.WordSupport

@Composable
fun ReadingBlock(
    sentences: ReadingSentences,
    tapped: ReadingSpan?,
    onSpanTap: (ReadingSpan) -> Unit,
    modifier: Modifier = Modifier,
) {
    val openSupport: WordSupport? = sentences.sentences.supportOpenAt(tapped)
    MyGameBlock(hue = MyGameBlockHue.Peach, modifier = modifier) {
        sentences.sentences.forEachIndexed { sentence: Int, spans: List<FrameSpan> ->
            val tappedSpan: Int? = tapped?.takeIf { at: ReadingSpan -> at.sentence == sentence }?.span
            MyGameFrameText(
                frame = spans.toMyGameFrame(),
                openPiece = tappedSpan,
                style = MyGameTypography.reading,
                onPieceTap = { span: Int -> onSpanTap(ReadingSpan(sentence, span)) },
            )
            if (tappedSpan != null) {
                openSupport?.let { support: WordSupport -> MyGameSupportLine(support = support.toMyGameSupport()) }
            }
        }
    }
}
