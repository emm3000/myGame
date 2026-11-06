package com.emm.mygame.feature.fief

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.REVIEW_ANSWER_MAX_LENGTH
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun RecognitionCard(
    card: ReviewUiState.ReviewCard.Recognition,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isLocked: Boolean = reviewing.isBusy || reviewing.isRated
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(text = card.word, style = MyGameTypography.word, color = MyGameTheme.colors.ink)
        MyGameText(text = card.frame, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        Prompt(text = stringResource(R.string.review_recognition_prompt))
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.selectableGroup(),
        ) {
            card.choices.forEach { choice: ReviewChoice ->
                ChoiceRow(
                    choice = choice,
                    isChosen = choice.id == card.chosen,
                    isEnabled = !isLocked,
                    onIntent = onIntent,
                )
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(text = card.gloss, style = MyGameTypography.word, color = MyGameTheme.colors.ink)
        MyGameText(text = card.gappedFrame, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        Prompt(text = stringResource(R.string.review_recall_prompt))
        RecallField(
            typed = card.typed,
            isReadOnly = reviewing.isBusy || reviewing.isRated,
            onIntent = onIntent,
        )
        val hint: ReviewHint? = card.hint
        if (hint != null) {
            MyGameText(
                text = icuStringResource(
                    R.string.review_hint_line,
                    "letters" to hint.letterCount,
                    "first" to hint.firstLetter,
                ),
                style = MyGameTypography.button,
                color = MyGameTheme.colors.ink,
            )
        }
        if (hint == null && !reviewing.isRated) {
            MyGameOutlinedButton(
                label = stringResource(R.string.review_hint),
                isBusy = reviewing.isBusy,
                busyDescription = stringResource(R.string.building_waiting),
                onClick = { onIntent(ReviewIntent.HintTapped) },
            )
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
    MyGameText(text = text, style = MyGameTypography.button, color = MyGameTheme.colors.ink, modifier = modifier)
}

@Composable
private fun ChoiceRow(
    choice: ReviewChoice,
    isChosen: Boolean,
    isEnabled: Boolean,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.md)
    val edge: Color = if (isChosen) colors.action else colors.lineStrong
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = MyGameSizes.control)
            .background(colors.surfaceRaised, shape)
            .border(MyGameStrokeWidths.hairline, edge, shape)
            .selectable(
                selected = isChosen,
                enabled = isEnabled,
                role = Role.RadioButton,
                onClick = { onIntent(ReviewIntent.ChoiceChosen(choice.id)) },
            )
            .padding(horizontal = MyGameSpacing.step3),
    ) {
        ChoiceMark(isChosen = isChosen, edge = edge)
        MyGameText(text = choice.gloss, style = MyGameTypography.body, color = colors.ink)
    }
}

@Composable
private fun ChoiceMark(isChosen: Boolean, edge: Color, modifier: Modifier = Modifier) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(MyGameSizes.icon)
            .border(MyGameStrokeWidths.hairline, edge, CircleShape),
    ) {
        if (isChosen) {
            Box(modifier = Modifier.size(MyGameSpacing.step2).background(MyGameTheme.colors.action, CircleShape))
        }
    }
}
