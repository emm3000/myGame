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
import com.emm.mygame.core.designsystem.MyGameSunkenCard
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.TownNewsAchievement
import com.emm.mygame.core.ui.TownNewsRow
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TodayWhatHappened(
    content: TodayUiState.Content,
    onIntent: (TodayIntent) -> Unit,
    onNewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        if (content.gained.isNotEmpty()) Gains(content = content)
        content.whatHappened?.let { news: TodayUiState.WhatHappened ->
            News(whatHappened = news, onIntent = onIntent, onNewsOpen = onNewsOpen)
        }
    }
}

@Composable
private fun Gains(content: TodayUiState.Content) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
        MyGameSectionTitle(label = copy.chrome(R.string.today_gained_title))
        MyGameSunkenCard {
            content.gained.forEach { gain: TownSnapshot.Cost ->
                MyGameText(label = copy.gainOf(gain), style = MyGameTypography.body, color = MyGameTheme.colors.ink)
            }
        }
    }
}

@Composable
private fun News(
    whatHappened: TodayUiState.WhatHappened,
    onIntent: (TodayIntent) -> Unit,
    onNewsOpen: () -> Unit,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
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
