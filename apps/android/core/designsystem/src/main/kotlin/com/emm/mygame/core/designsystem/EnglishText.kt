package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.withStyle

private const val ENGLISH_TAG: String = "en"

fun englishTextOf(text: String): AnnotatedString = buildAnnotatedString { appendInLanguage(text, ENGLISH_TAG) }

internal fun AnnotatedString.Builder.appendInLanguage(text: String, languageTag: String) {
    withStyle(SpanStyle(localeList = LocaleList(languageTag))) { append(text) }
}
