package com.emm.mygame.feature.report

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import java.time.ZoneId
import kotlin.time.Instant

@Composable
internal fun NewsNote(line: MyGameLabel, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameText(
            label = line,
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

internal val previewReceivedAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal val previewTownNews: List<TownNews> = listOf(
    TownNews.BuildingWorkFinished(
        occurredAt = Instant.parse("2026-11-05T09:40:00Z"),
        building = TownBuildingKind.Farm,
        level = 2,
    ),
    TownNews.BuildingWorkStopped(
        occurredAt = Instant.parse("2026-11-05T09:20:00Z"),
        building = TownBuildingKind.Storage,
        level = 3,
        refund = listOf(TownAmount(TownResourceKind.Money, 300L), TownAmount(TownResourceKind.Material, 150L)),
    ),
    TownNews.JobBack(
        occurredAt = Instant.parse("2026-11-05T08:15:00Z"),
        site = TownSite(region = 1, area = 2, site = 1),
        pay = listOf(TownAmount(TownResourceKind.Money, 120L), TownAmount(TownResourceKind.Material, 40L)),
    ),
    TownNews.SkillEarned(
        occurredAt = Instant.parse("2026-11-04T18:30:00Z"),
        resource = TownResourceKind.Food,
        ratePercent = 5,
    ),
    TownNews.HiringDelivered(
        occurredAt = Instant.parse("2026-11-04T17:00:00Z"),
        hire = TownHireKind.Worker,
        count = 2,
    ),
    TownNews.HiringStopped(
        occurredAt = Instant.parse("2026-11-04T16:10:00Z"),
        hire = TownHireKind.Truck,
        delivered = 1,
        stopped = 2,
        refund = listOf(TownAmount(TownResourceKind.Money, 400L), TownAmount(TownResourceKind.Power, 60L)),
    ),
)
