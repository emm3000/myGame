package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.model.learning.ReviewChoice
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.learning.R

@Composable
internal fun RecognitionCard(
    card: ReviewUiState.ReviewCard.Recognition,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isLocked: Boolean = reviewing.isBusy || reviewing.isRated
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewBlock(
            cue = card.word,
            frame = card.frame.toMyGameFrame(),
            openSpan = card.openSpan,
            reviewing = reviewing,
            onIntent = onIntent,
        )
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            Prompt(text = fixedCopyResource(R.string.review_recognition_prompt))
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.selectableGroup(),
            ) {
                card.choices.forEach { choice: ReviewChoice ->
                    MyGameChoiceRow(
                        label = choice.gloss,
                        isChosen = choice.id == card.chosen,
                        isEnabled = !isLocked,
                        onClick = { onIntent(ReviewIntent.ChoiceChosen(choice.id)) },
                    )
                }
            }
        }
    }
}
