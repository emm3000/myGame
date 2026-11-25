package com.emm.mygame.feature.report.news

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.report.NewsAmounts
import com.emm.mygame.feature.report.amountsLineOf
import com.emm.mygame.feature.report.instantLabelOf
import com.emm.mygame.feature.report.newsAmountsOf
import com.emm.mygame.feature.report.newsLineOf
import java.time.ZoneId
import kotlin.time.Instant

@Composable
internal fun NewsRow(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        NewsLines(news = news, receivedAt = receivedAt)
    }
}

@Composable
private fun NewsLines(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val zone: ZoneId = ZoneId.systemDefault()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            label = copy.chrome { instantLabelOf(news.occurredAt, receivedAt, zone) },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            label = copy.chrome { newsLineOf(news) },
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        newsAmountsOf(news)?.let { paid: NewsAmounts ->
            MyGameText(
                label = copy.chrome { amountsLineOf(paid) },
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}
