package com.emm.mygame.core.ui

import androidx.annotation.StringRes
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.TownAmount
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.news.TownNews
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Instant

internal fun CopyReader.newsLineOf(news: TownNews): String = when (news) {
    is TownNews.BuildingWorkFinished ->
        workLineOf(R.string.ui_news_building_work_finished, news.building, news.level)
    is TownNews.BuildingWorkStopped ->
        workLineOf(R.string.ui_news_building_work_stopped, news.building, news.level)
    is TownNews.LessonStudied -> text(R.string.ui_news_lesson_studied)
    is TownNews.LessonStopped -> text(R.string.ui_news_lesson_stopped)
    is TownNews.SkillEarned -> text(
        R.string.ui_news_skill_earned,
        "resource" to text(resourceNameOf(news.resource)),
        "percent" to news.ratePercent.toString(),
    )
    is TownNews.HiringDelivered -> text(hiringDeliveredOf(news.hire), "count" to news.count)
    is TownNews.HiringStopped -> text(
        hiringStoppedOf(news.hire),
        "delivered" to news.delivered,
        "count" to (news.delivered + news.stopped).toString(),
    )
    is TownNews.JobBack -> siteLineOf(R.string.ui_news_job_back, news.site)
    is TownNews.JobCalledBack -> siteLineOf(R.string.ui_news_job_called_back, news.site)
    is TownNews.CleanUpDone -> siteLineOf(R.string.ui_news_clean_up_done, news.site)
    is TownNews.CleanUpFailed -> siteLineOf(R.string.ui_news_clean_up_failed, news.site)
    is TownNews.BecameCity -> text(R.string.ui_news_became_city)
}

internal fun newsAmountsOf(news: TownNews): NewsAmounts? = when (news) {
    is TownNews.JobBack -> paid(R.string.ui_news_pay, news.pay)
    is TownNews.JobCalledBack -> paid(R.string.ui_news_pay, news.pay)
    is TownNews.CleanUpDone -> paid(R.string.ui_news_pay, news.reward)
    is TownNews.BuildingWorkStopped -> paid(R.string.ui_news_refund, news.refund)
    is TownNews.HiringStopped -> paid(R.string.ui_news_refund, news.refund)
    is TownNews.BuildingWorkFinished,
    is TownNews.LessonStudied,
    is TownNews.LessonStopped,
    is TownNews.SkillEarned,
    is TownNews.HiringDelivered,
    is TownNews.CleanUpFailed,
    is TownNews.BecameCity,
    -> null
}

internal class NewsAmounts(@param:StringRes val line: Int, val amounts: List<TownAmount>)

private fun paid(@StringRes line: Int, amounts: List<TownAmount>): NewsAmounts? =
    if (amounts.isEmpty()) null else NewsAmounts(line, amounts)

internal fun CopyReader.amountsLineOf(paid: NewsAmounts): String {
    val quantities: List<String> = paid.amounts.map { held: TownAmount ->
        text(
            R.string.ui_news_amount,
            "amount" to formatQuantity(held.amount),
            "resource" to text(resourceNameOf(held.resource)),
        )
    }
    return text(paid.line, "amounts" to listPhraseOf(quantities))
}

internal fun CopyReader.instantLabelOf(occurredAt: Instant, receivedAt: Instant, zone: ZoneId): String {
    val occurred: LocalDateTime = localOf(occurredAt, zone)
    val received: LocalDateTime = localOf(receivedAt, zone)
    val time: String = timeOf(occurred)
    if (occurred.toLocalDate() == received.toLocalDate()) return text(R.string.ui_news_today, "time" to time)
    val day: String = if (occurred.year == received.year) dayOf(occurred) else dayWithYearOf(occurred)
    return text(R.string.ui_news_day, "day" to day, "time" to time)
}

private fun localOf(instant: Instant, zone: ZoneId): LocalDateTime =
    LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), zone)

private fun CopyReader.workLineOf(@StringRes line: Int, building: TownBuildingKind, level: Int): String =
    text(line, "place" to text(placeNameOf(building)), "level" to level.toString())

private fun CopyReader.siteLineOf(@StringRes line: Int, site: TownSite): String = text(
    line,
    "region" to site.region.toString(),
    "area" to site.area.toString(),
    "site" to site.site.toString(),
)

@StringRes
private fun hiringDeliveredOf(hire: TownHireKind): Int = when (hire) {
    TownHireKind.Worker -> R.string.ui_news_hiring_delivered_worker
    TownHireKind.Truck -> R.string.ui_news_hiring_delivered_truck
}

@StringRes
private fun hiringStoppedOf(hire: TownHireKind): Int = when (hire) {
    TownHireKind.Worker -> R.string.ui_news_hiring_stopped_worker
    TownHireKind.Truck -> R.string.ui_news_hiring_stopped_truck
}

@StringRes
private fun placeNameOf(building: TownBuildingKind): Int = when (building) {
    TownBuildingKind.Homes -> R.string.ui_news_place_homes
    TownBuildingKind.Farm -> R.string.ui_news_place_farm
    TownBuildingKind.Factory -> R.string.ui_news_place_factory
    TownBuildingKind.PowerStation -> R.string.ui_news_place_power_station
    TownBuildingKind.Storage -> R.string.ui_news_place_storage
    TownBuildingKind.School -> R.string.ui_news_place_school
    TownBuildingKind.Office -> R.string.ui_news_place_office
}

@StringRes
private fun resourceNameOf(resource: TownResourceKind): Int = when (resource) {
    TownResourceKind.Money -> R.string.ui_news_resource_money
    TownResourceKind.Food -> R.string.ui_news_resource_food
    TownResourceKind.Power -> R.string.ui_news_resource_power
    TownResourceKind.Material -> R.string.ui_news_resource_material
}
