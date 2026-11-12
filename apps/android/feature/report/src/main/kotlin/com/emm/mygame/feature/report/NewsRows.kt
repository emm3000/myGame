package com.emm.mygame.feature.report

import android.content.res.Resources
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownNews
import java.time.ZoneId
import kotlin.time.Instant

@Composable
internal fun NewsNote(line: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameText(
            text = line,
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        )
    }
}

@Composable
internal fun NewsRow(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        NewsLines(news = news, receivedAt = receivedAt)
    }
}

@Composable
private fun NewsLines(news: TownNews, receivedAt: Instant, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val zone: ZoneId = ZoneId.systemDefault()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = resources.instantLabelOf(news.occurredAt, receivedAt, zone),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(text = resources.newsLineOf(news), style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        resources.payLineOf(news)?.let { pay: String ->
            MyGameText(text = pay, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
        }
    }
}
