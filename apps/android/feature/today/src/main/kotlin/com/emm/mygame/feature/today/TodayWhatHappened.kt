package com.emm.mygame.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.TownNewsAchievement
import com.emm.mygame.core.ui.TownNewsRow
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TodayWhatHappened(
    whatHappened: TodayUiState.WhatHappened,
    onIntent: (TodayIntent) -> Unit,
    onNewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(label = copy.chrome(R.string.today_news_title))
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            whatHappened.events.forEach { event: TodayUiState.NewsEvent ->
                when (event) {
                    is TodayUiState.NewsEvent.Achievement ->
                        TownNewsAchievement(news = event.news, receivedAt = whatHappened.receivedAt)
                    is TodayUiState.NewsEvent.Plain ->
                        TownNewsRow(news = event.news, receivedAt = whatHappened.receivedAt)
                }
            }
        }
        if (whatHappened.close == TodayUiState.NewsClose.Unreachable) {
            MyGameInlineAlert(message = copy.fixedCopy(R.string.today_refusal_unexpected))
        }
        MyGameOutlinedButton(
            label = copy.chrome(R.string.today_news_close),
            isBusy = whatHappened.close == TodayUiState.NewsClose.Waiting,
            busyDescription = copy.chrome(R.string.today_waiting),
            onClick = { onIntent(TodayIntent.NewsCloseTapped) },
        )
        MyGameNavRow(title = copy.chrome(R.string.today_news_all), onClick = onNewsOpen)
    }
}
