package com.emm.mygame.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.art.MyGameAchievement
import com.emm.mygame.core.designsystem.control.MyGameButton
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.frame.MyGameCard
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TodayFirstCard(
    card: TodayUiState.FirstCard,
    eyebrow: MyGameLabel,
    start: TodayUiState.LessonStart,
    onAct: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (card is TodayUiState.FirstCard.CaughtUp) {
        CaughtUpCard(card = card, eyebrow = eyebrow, modifier = modifier)
        return
    }
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameMetaText(label = eyebrow, color = MyGameTheme.colors.inkMuted)
            FirstCardHeading(line = copy.lineOf(card), countdown = copy.countdownOf(card))
            copy.startRefusalOf(start)?.let { refusal: String -> MyGameInlineAlert(message = refusal) }
            copy.actionOf(card)?.let { action: MyGameLabel ->
                MyGameButton(
                    label = action,
                    isBusy = start == TodayUiState.LessonStart.Starting,
                    busyDescription = copy.chrome(R.string.today_waiting),
                    onClick = onAct,
                )
            }
        }
    }
}

@Composable
private fun FirstCardHeading(line: MyGameLabel, countdown: MyGameLabel?, modifier: Modifier = Modifier) {
    if (countdown == null) {
        MyGameText(label = line, style = MyGameTypography.title, color = MyGameTheme.colors.ink, modifier = modifier)
        return
    }
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        itemVerticalAlignment = Alignment.CenterVertically,
        modifier = modifier.semantics(mergeDescendants = true) { heading() },
    ) {
        MyGameWorkingDots(tint = MyGameTheme.colors.ink)
        MyGameText(label = line, style = MyGameTypography.title, color = MyGameTheme.colors.ink)
        MyGameText(
            label = countdown,
            style = MyGameTypography.title.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun CaughtUpCard(card: TodayUiState.FirstCard.CaughtUp, eyebrow: MyGameLabel, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameAchievement(modifier = modifier) {
        MyGameMetaText(label = eyebrow, color = MyGameTheme.colors.onBlockMuted)
        MyGameText(label = copy.lineOf(card), style = MyGameTypography.title, color = MyGameTheme.colors.onBlock)
        card.nextReview?.let { time: TodayUiState.TimeAt ->
            MyGameText(
                label = copy.nextReviewOf(time),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.onBlock,
            )
        }
    }
}
