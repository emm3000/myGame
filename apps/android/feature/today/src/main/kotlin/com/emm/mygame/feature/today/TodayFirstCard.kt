package com.emm.mygame.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameAchievement
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
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
            MyGameText(label = copy.lineOf(card), style = MyGameTypography.title, color = MyGameTheme.colors.ink)
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
