package com.emm.mygame.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameFrameGround
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedDoor
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.englishTextOf
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.ui.ReadingBlock
import com.emm.mygame.core.ui.ReadingSentences
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.ui.chromeResource

@Composable
internal fun TodayKeepGoing(
    keepGoing: TodayUiState.KeepGoing,
    onIntent: (TodayIntent) -> Unit,
    onTextOpen: (TextId) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(label = chromeResource(R.string.today_keep_going))
        when (keepGoing) {
            is TodayUiState.KeepGoing.Text -> MyGameOutlinedDoor(
                label = MyGameLabel(text = keepGoing.title, translation = null),
                labelLineOf = ::englishTextOf,
                onClick = { onTextOpen(keepGoing.text) },
            )
            is TodayUiState.KeepGoing.Frames -> ReadingBlock(
                sentences = ReadingSentences(keepGoing.sentences),
                tapped = keepGoing.tapped,
                onSpanTap = { at: ReadingSpan -> onIntent(TodayIntent.FrameWordTapped(at)) },
                ground = MyGameFrameGround.Sunken,
            )
        }
    }
}
