package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.withStyle

data class MyGameWordSupport(val isOnTap: Boolean, val text: String, val languageTag: String)

internal fun AnnotatedString.Builder.appendSupport(support: MyGameWordSupport) {
    withStyle(SpanStyle(localeList = LocaleList(support.languageTag))) { append(support.text) }
}

internal fun MyGameWordSupport.spokenText(): AnnotatedString = buildAnnotatedString { appendSupport(this@spokenText) }
