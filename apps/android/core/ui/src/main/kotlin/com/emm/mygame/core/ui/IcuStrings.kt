package com.emm.mygame.core.ui

import android.content.res.Resources
import android.icu.text.MessageFormat
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import java.util.Locale

private val spanish: Locale = Locale.forLanguageTag("es")

fun String.formatIcu(vararg arguments: Pair<String, Any>): String =
    MessageFormat(this, spanish).format(mapOf(*arguments))

fun Resources.getIcuString(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
    getString(id).formatIcu(*arguments)

@Composable
fun icuStringResource(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
    stringResource(id).formatIcu(*arguments)
