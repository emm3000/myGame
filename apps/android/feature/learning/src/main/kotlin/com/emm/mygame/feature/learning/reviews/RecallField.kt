package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.model.learning.REVIEW_ANSWER_MAX_LENGTH
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.learning.R

@Composable
internal fun RecallField(
    typed: String,
    isReadOnly: Boolean,
    goIntent: ReviewIntent,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameTextField(
        value = typed,
        label = fixedCopyResource(R.string.review_answer_label),
        isSecret = false,
        isReadOnly = isReadOnly,
        keyboardOptions = KeyboardOptions(
            capitalization = KeyboardCapitalization.None,
            autoCorrectEnabled = false,
            keyboardType = KeyboardType.Text,
            imeAction = ImeAction.Done,
        ),
        onValueChange = { answer: String ->
            onIntent(ReviewIntent.AnswerChanged(answer.take(REVIEW_ANSWER_MAX_LENGTH)))
        },
        keyboardActions = KeyboardActions(onDone = { onIntent(goIntent) }),
        modifier = modifier,
    )
}
