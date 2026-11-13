package com.emm.mygame.core.ui

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.icu.text.ListFormatter
import android.icu.text.MessageFormat
import androidx.annotation.StringRes
import java.util.Locale

class CopyReader internal constructor(private val resources: Resources, val locale: Locale) {

    fun text(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
        MessageFormat(resources.getString(id), locale).format(mapOf(*arguments))

    fun listPhraseOf(items: List<String>): String = ListFormatter.getInstance(locale).format(items)
}

internal fun Context.copyReaderIn(locale: Locale): CopyReader = CopyReader(resourcesIn(locale), locale)

internal fun Context.resourcesIn(locale: Locale): Resources {
    val configuration: Configuration = Configuration(resources.configuration)
    configuration.setLocale(locale)
    return createConfigurationContext(configuration).resources
}

internal fun Context.phoneCopyReader(): CopyReader = CopyReader(resources, resources.configuration.locales[0])
