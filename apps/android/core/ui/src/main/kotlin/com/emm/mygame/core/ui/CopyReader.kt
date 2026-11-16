package com.emm.mygame.core.ui

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.icu.text.DateTimePatternGenerator
import android.icu.text.ListFormatter
import android.icu.text.MessageFormat
import android.icu.text.SimpleDateFormat
import android.icu.util.TimeZone
import androidx.annotation.StringRes
import com.emm.mygame.core.projection.FinishClock
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.Date
import java.util.Locale

private const val MONTH_AND_DAY: String = "MMMd"

private const val YEAR_MONTH_AND_DAY: String = "yMMMd"

private const val PREFERRED_HOUR_AND_MINUTE: String = "jmm"

private const val TWO_DIGIT_TWENTY_FOUR_HOUR: String = "HHmm"

private const val TWENTY_FOUR_HOUR_FIELD: Char = 'H'

class CopyReader internal constructor(private val resources: Resources, val locale: Locale) {

    private val patterns: DateTimePatternGenerator by lazy { DateTimePatternGenerator.getInstance(locale) }

    private val dayFormat: SimpleDateFormat by lazy { wallClockFormatOf(patterns.getBestPattern(MONTH_AND_DAY)) }

    private val dayWithYearFormat: SimpleDateFormat by lazy {
        wallClockFormatOf(patterns.getBestPattern(YEAR_MONTH_AND_DAY))
    }

    private val clockFormat: SimpleDateFormat by lazy { wallClockFormatOf(clockPattern()) }

    private val listFormat: ListFormatter by lazy { ListFormatter.getInstance(locale) }

    fun text(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
        MessageFormat(resources.getString(id), locale).format(mapOf(*arguments))

    fun listPhraseOf(items: List<String>): String = listFormat.format(items)

    fun dayOf(at: LocalDateTime): String = dayFormat.format(at.sameWallClockInGmt())

    fun dayWithYearOf(at: LocalDateTime): String = dayWithYearFormat.format(at.sameWallClockInGmt())

    fun timeOf(at: LocalDateTime): String = clockFormat.format(at.sameWallClockInGmt())

    fun clockLabelOf(finish: FinishClock, @StringRes tomorrow: Int, @StringRes later: Int): String {
        val time: String = timeOf(finish.at)
        return when (finish.day) {
            FinishClock.Day.Today -> time
            FinishClock.Day.Tomorrow -> text(tomorrow, "time" to time)
            FinishClock.Day.Later -> text(later, "day" to dayOf(finish.at), "time" to time)
        }
    }

    private fun clockPattern(): String {
        val preferred: String = patterns.getBestPattern(PREFERRED_HOUR_AND_MINUTE)
        val isTwentyFourHour: Boolean = preferred.contains(TWENTY_FOUR_HOUR_FIELD)
        if (!isTwentyFourHour) return preferred
        return patterns.getBestPattern(TWO_DIGIT_TWENTY_FOUR_HOUR, DateTimePatternGenerator.MATCH_HOUR_FIELD_LENGTH)
    }

    private fun wallClockFormatOf(pattern: String): SimpleDateFormat {
        val format: SimpleDateFormat = SimpleDateFormat(pattern, locale)
        format.timeZone = TimeZone.GMT_ZONE
        return format
    }

    private fun LocalDateTime.sameWallClockInGmt(): Date = Date(toInstant(ZoneOffset.UTC).toEpochMilli())
}

internal fun Context.copyReaderIn(locale: Locale): CopyReader = CopyReader(resourcesIn(locale), locale)

internal fun Context.resourcesIn(locale: Locale): Resources {
    val configuration: Configuration = Configuration(resources.configuration)
    configuration.setLocale(locale)
    return createConfigurationContext(configuration).resources
}

internal fun Context.phoneCopyReader(): CopyReader = CopyReader(resources, resources.configuration.locales[0])
