package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.toMyGameFrame
import com.emm.mygame.feature.learning.R

@Composable
internal fun RecallCard(
    card: ReviewUiState.ReviewCard.Recall,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewBlock(
            cue = card.gloss,
            frame = card.gappedFrame.toMyGameFrame(),
            openSpan = card.openSpan,
            reviewing = reviewing,
            onIntent = onIntent,
        )
        Prompt(text = fixedCopyResource(R.string.review_recall_prompt))
        RecallField(
            typed = card.typed,
            isReadOnly = reviewing.isBusy || reviewing.isRated,
            goIntent = reviewing.goIntent(),
            onIntent = onIntent,
        )
    }
}
