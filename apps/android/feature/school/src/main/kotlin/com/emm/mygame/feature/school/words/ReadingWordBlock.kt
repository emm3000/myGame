package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameFrame
import com.emm.mygame.core.designsystem.MyGameFramePiece
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameSupportLine
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.MyGameWordArt
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.wordStyle
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.feature.school.toMyGameFrame
import com.emm.mygame.feature.school.toMyGameSupport

internal const val WORD_SILHOUETTE: String = "word_silhouette"

@Composable
internal fun ReadingWordBlock(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val word: TownSnapshot.WordReading = reading.word
    MyGameBlock(
        hue = blockHueOf(reading.index),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        wordArtOf(word.word)?.let { art: MyGameArt ->
            MyGameWordArt(art = art, modifier = Modifier.semantics { testTag = WORD_SILHOUETTE })
        }
        WordHeading(
            word = word,
            isOpen = reading.shownSupport == LessonWordsUiState.ShownSupport.Word,
            onIntent = onIntent,
        )
        MyGameFrameText(
            frame = word.frame.toMyGameFrame(),
            openPiece = (reading.shownSupport as? LessonWordsUiState.ShownSupport.Frame)?.spanIndex,
            style = MyGameTypography.reading,
            onPieceTap = { spanIndex: Int ->
                onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(spanIndex)))
            },
        )
        reading.openSupport?.let { support: WordSupport -> MyGameSupportLine(support = support.toMyGameSupport()) }
    }
}

@Composable
private fun WordHeading(
    word: TownSnapshot.WordReading,
    isOpen: Boolean,
    onIntent: (LessonWordsIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameFrameText(
        frame = MyGameFrame(listOf(MyGameFramePiece(text = word.word, support = word.support?.toMyGameSupport()))),
        openPiece = if (isOpen) 0 else null,
        style = wordStyle(),
        onPieceTap = { onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word)) },
        modifier = modifier.semantics { heading() },
    )
}
