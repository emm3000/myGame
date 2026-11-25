package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewHintWord
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.feature.learning.R

@Composable
internal fun HintLine(
    card: ReviewUiState.ReviewCard.Recall,
    isBusy: Boolean,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val hint: ReviewHint? = card.hint
    if (hint == null) {
        MyGameOutlinedButton(
            label = fixedLabel(R.string.review_hint),
            isBusy = isBusy,
            busyDescription = chromeResource(R.string.review_waiting),
            onClick = { onIntent(ReviewIntent.HintTapped) },
            modifier = modifier,
        )
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        hint.words.forEach { word: ReviewHintWord ->
            MyGameText(
                text = fixedCopyResource(
                    R.string.review_hint_line,
                    "letters" to word.letterCount,
                    "first" to word.firstLetter,
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}
