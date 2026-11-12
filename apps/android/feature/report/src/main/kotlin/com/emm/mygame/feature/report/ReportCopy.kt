package com.emm.mygame.feature.report

import android.content.res.Resources
import android.icu.text.ListFormatter
import androidx.annotation.StringRes
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.getIcuString
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.time.Instant

private val spanish: Locale = Locale.forLanguageTag("es")

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", spanish)

private val spanishListFormat: ListFormatter = ListFormatter.getInstance(spanish)

internal fun Resources.newsLineOf(news: TownNews): String = when (news) {
    is TownNews.BuildingWorkFinished ->
        workLineOf(R.string.report_news_building_work_finished, news.building, news.level)
    is TownNews.BuildingWorkStopped ->
        workLineOf(R.string.report_news_building_work_stopped, news.building, news.level)
    is TownNews.LessonStudied -> getString(R.string.report_news_lesson_studied)
    is TownNews.LessonStopped -> getString(R.string.report_news_lesson_stopped)
    is TownNews.SkillEarned -> getIcuString(
        R.string.report_news_skill_earned,
        "resource" to getString(resourceNameOf(news.resource)),
        "percent" to news.ratePercent.toString(),
    )
    is TownNews.HiringDelivered -> getIcuString(hiringDeliveredOf(news.hire), "count" to news.count)
    is TownNews.HiringStopped -> getIcuString(
        hiringStoppedOf(news.hire),
        "delivered" to news.delivered,
        "count" to (news.delivered + news.stopped).toString(),
    )
    is TownNews.JobBack -> siteLineOf(R.string.report_news_job_back, news.site)
    is TownNews.JobCalledBack -> siteLineOf(R.string.report_news_job_called_back, news.site)
    is TownNews.CleanUpDone -> siteLineOf(R.string.report_news_clean_up_done, news.site)
    is TownNews.CleanUpFailed -> siteLineOf(R.string.report_news_clean_up_failed, news.site)
    is TownNews.BecameCity -> getString(R.string.report_news_became_city)
}

internal fun Resources.amountsLineOf(news: TownNews): String? = when (news) {
    is TownNews.JobBack -> amountsPhraseOf(R.string.report_news_pay, news.pay)
    is TownNews.JobCalledBack -> amountsPhraseOf(R.string.report_news_pay, news.pay)
    is TownNews.CleanUpDone -> amountsPhraseOf(R.string.report_news_pay, news.reward)
    is TownNews.BuildingWorkStopped -> amountsPhraseOf(R.string.report_news_refund, news.refund)
    is TownNews.HiringStopped -> amountsPhraseOf(R.string.report_news_refund, news.refund)
    is TownNews.BuildingWorkFinished,
    is TownNews.LessonStudied,
    is TownNews.LessonStopped,
    is TownNews.SkillEarned,
    is TownNews.HiringDelivered,
    is TownNews.CleanUpFailed,
    is TownNews.BecameCity,
    -> null
}

internal fun Resources.nextReviewLabelOf(nextReview: Instant, receivedAt: Instant, zone: ZoneId): String {
    val finish: FinishClock = finishClockOf(nextReview, nextReview - receivedAt, zone)
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> getIcuString(R.string.report_next_review_tomorrow, "time" to time)
        FinishClock.Day.Later ->
            getIcuString(R.string.report_next_review_day, "day" to finish.at.format(dayFormat), "time" to time)
    }
}

internal fun Resources.instantLabelOf(occurredAt: Instant, receivedAt: Instant, zone: ZoneId): String {
    val occurred: LocalDateTime = localOf(occurredAt, zone)
    val received: LocalDateTime = localOf(receivedAt, zone)
    val time: String = occurred.format(clockFormat)
    val day: String = occurred.format(dayFormat)
    return when {
        occurred.toLocalDate() == received.toLocalDate() -> getIcuString(R.string.report_today, "time" to time)
        occurred.year == received.year -> getIcuString(R.string.report_day, "day" to day, "time" to time)
        else -> getIcuString(
            R.string.report_day_of_year,
            "day" to day,
            "year" to occurred.year.toString(),
            "time" to time,
        )
    }
}

private fun localOf(instant: Instant, zone: ZoneId): LocalDateTime =
    LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), zone)

private fun Resources.workLineOf(@StringRes line: Int, building: TownBuildingKind, level: Int): String =
    getIcuString(line, "place" to getString(placeNameOf(building)), "level" to level.toString())

private fun Resources.siteLineOf(@StringRes line: Int, site: TownSite): String = getIcuString(
    line,
    "region" to site.region.toString(),
    "area" to site.area.toString(),
    "site" to site.site.toString(),
)

private fun Resources.amountsPhraseOf(@StringRes line: Int, amounts: List<TownAmount>): String? {
    if (amounts.isEmpty()) return null
    val quantities: List<String> = amounts.map { held: TownAmount ->
        getIcuString(
            R.string.report_amount,
            "amount" to formatQuantity(held.amount),
            "resource" to getString(resourceNameOf(held.resource)),
        )
    }
    return getIcuString(line, "amounts" to spanishListFormat.format(quantities))
}

@StringRes
private fun hiringDeliveredOf(hire: TownHireKind): Int = when (hire) {
    TownHireKind.Worker -> R.string.report_news_hiring_delivered_worker
    TownHireKind.Truck -> R.string.report_news_hiring_delivered_truck
}

@StringRes
private fun hiringStoppedOf(hire: TownHireKind): Int = when (hire) {
    TownHireKind.Worker -> R.string.report_news_hiring_stopped_worker
    TownHireKind.Truck -> R.string.report_news_hiring_stopped_truck
}

@StringRes
private fun placeNameOf(building: TownBuildingKind): Int = when (building) {
    TownBuildingKind.Homes -> R.string.report_place_homes
    TownBuildingKind.Farm -> R.string.report_place_farm
    TownBuildingKind.Factory -> R.string.report_place_factory
    TownBuildingKind.PowerStation -> R.string.report_place_power_station
    TownBuildingKind.Storage -> R.string.report_place_storage
    TownBuildingKind.School -> R.string.report_place_school
    TownBuildingKind.Office -> R.string.report_place_office
}

@StringRes
private fun resourceNameOf(resource: TownResourceKind): Int = when (resource) {
    TownResourceKind.Money -> R.string.report_resource_money
    TownResourceKind.Food -> R.string.report_resource_food
    TownResourceKind.Power -> R.string.report_resource_power
    TownResourceKind.Material -> R.string.report_resource_material
}
