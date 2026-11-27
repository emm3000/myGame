package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.emm.mygame.core.designsystem.art.MyGameAchievement
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.news.TownNews
import java.time.ZoneId
import kotlin.time.Instant

@Composable
fun TownNewsRow(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        NewsLines(
            news = news,
            receivedAt = receivedAt,
            ink = MyGameTheme.colors.ink,
            inkMuted = MyGameTheme.colors.inkMuted,
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        )
    }
}

@Composable
fun TownNewsAchievement(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    MyGameAchievement(modifier = modifier) {
        NewsLines(
            news = news,
            receivedAt = receivedAt,
            ink = MyGameTheme.colors.onBlock,
            inkMuted = MyGameTheme.colors.onBlockMuted,
        )
    }
}

@Composable
private fun NewsLines(
    news: TownNews,
    receivedAt: Instant,
    ink: Color,
    inkMuted: Color,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val zone: ZoneId = ZoneId.systemDefault()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = copy.chrome { instantLabelOf(news.occurredAt, receivedAt, zone) },
            style = MyGameTypography.caption,
            color = inkMuted,
        )
        MyGameText(label = copy.chrome { newsLineOf(news) }, style = MyGameTypography.body, color = ink)
        newsAmountsOf(news)?.let { paid: NewsAmounts ->
            MyGameText(
                label = copy.chrome { amountsLineOf(paid) },
                style = MyGameTypography.caption,
                color = inkMuted,
            )
        }
    }
}
