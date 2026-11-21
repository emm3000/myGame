package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.buildAnnotatedString

data class MyGameWordSupport(val isOnTap: Boolean, val text: String, val languageTag: String)

internal fun AnnotatedString.Builder.appendSupport(support: MyGameWordSupport) {
    appendInLanguage(support.text, support.languageTag)
}

internal fun MyGameWordSupport.spokenText(): AnnotatedString = buildAnnotatedString { appendSupport(this@spokenText) }
