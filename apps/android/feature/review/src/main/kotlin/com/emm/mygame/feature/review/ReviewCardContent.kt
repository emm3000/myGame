package com.emm.mygame.feature.review

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockStack
import com.emm.mygame.core.designsystem.MyGameChoiceRow
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.wordStyle
import com.emm.mygame.core.network.REVIEW_ANSWER_MAX_LENGTH
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintWord
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun RecognitionCard(
    card: ReviewUiState.ReviewCard.Recognition,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isLocked: Boolean = reviewing.isBusy || reviewing.isRated
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewBlock(cue = card.word, frame = card.frame, reviewing = reviewing)
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            Prompt(text = stringResource(R.string.review_recognition_prompt))
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

@Composable
internal fun RecallCard(
    card: ReviewUiState.ReviewCard.Recall,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewBlock(cue = card.gloss, frame = card.gappedFrame, reviewing = reviewing)
        Prompt(text = stringResource(R.string.review_recall_prompt))
        RecallField(
            typed = card.typed,
            isReadOnly = reviewing.isBusy || reviewing.isRated,
            onIntent = onIntent,
        )
    }
}

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
            label = stringResource(R.string.review_hint),
            isBusy = isBusy,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(ReviewIntent.HintTapped) },
            modifier = modifier,
        )
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        hint.words.forEach { word: ReviewHintWord ->
            MyGameText(
                text = icuStringResource(
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

@Composable
private fun ReviewBlock(
    cue: String,
    frame: String,
    reviewing: ReviewUiState.Reviewing,
    modifier: Modifier = Modifier,
) {
    val walked: Int = reviewing.walked
    val dueAfter: Int = reviewing.dueCount - 1
    MyGameBlockStack(
        nearHue = blockHueOf(walked + 1).takeIf { dueAfter >= 1 },
        farHue = blockHueOf(walked + 2).takeIf { dueAfter >= 2 },
        dealtKey = walked.takeIf { reviewing.isDealtFromStack },
        modifier = modifier,
    ) {
        MyGameBlock(
            hue = blockHueOf(walked),
            modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
        ) {
            MyGameText(
                text = cue,
                style = wordStyle(),
                color = MyGameTheme.colors.onBlock,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(text = frame, style = MyGameTypography.reading, color = MyGameTheme.colors.onBlock)
        }
    }
}

@Composable
internal fun RecallField(
    typed: String,
    isReadOnly: Boolean,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameTextField(
        value = typed,
        label = stringResource(R.string.review_answer_label),
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
        keyboardActions = KeyboardActions(onDone = { onIntent(ReviewIntent.CheckTapped) }),
        modifier = modifier,
    )
}

@Composable
private fun Prompt(text: String, modifier: Modifier = Modifier) {
    MyGameText(text = text, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}
