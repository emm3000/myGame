package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameFrameGround
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameSunkenCard
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
    ground: MyGameFrameGround = MyGameFrameGround.Block,
) {
    val content: @Composable ColumnScope.() -> Unit = {
        ReadingSentenceLines(sentences = sentences, tapped = tapped, ground = ground, onSpanTap = onSpanTap)
    }
    when (ground) {
        MyGameFrameGround.Block -> MyGameBlock(hue = MyGameBlockHue.Peach, modifier = modifier, content = content)
        MyGameFrameGround.Sunken -> MyGameSunkenCard(modifier = modifier, content = content)
    }
}

@Composable
private fun ReadingSentenceLines(
    sentences: ReadingSentences,
    tapped: ReadingSpan?,
    ground: MyGameFrameGround,
    onSpanTap: (ReadingSpan) -> Unit,
) {
    val openSupport: WordSupport? = sentences.sentences.supportOpenAt(tapped)
    sentences.sentences.forEachIndexed { sentence: Int, spans: List<FrameSpan> ->
        val tappedSpan: Int? = tapped?.takeIf { at: ReadingSpan -> at.sentence == sentence }?.span
        MyGameFrameText(
            frame = spans.toMyGameFrame(),
            openPiece = tappedSpan,
            style = MyGameTypography.reading,
            onPieceTap = { span: Int -> onSpanTap(ReadingSpan(sentence, span)) },
            ground = ground,
        )
        if (tappedSpan != null) {
            openSupport?.let { support: WordSupport ->
                MyGameSupportLine(support = support.toMyGameSupport(), ground = ground)
            }
        }
    }
}
