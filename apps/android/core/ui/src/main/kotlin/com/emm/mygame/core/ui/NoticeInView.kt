package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier

@Composable
fun NoticeInView(shownNotice: Any?, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    val lastNotice: MutableState<Any?> = remember { mutableStateOf(null) }
    LaunchedEffect(shownNotice) {
        val isNewNotice: Boolean = shownNotice != null && shownNotice != lastNotice.value
        lastNotice.value = shownNotice
        if (isNewNotice) requester.bringIntoView()
    }
    Box(modifier = modifier.bringIntoViewRequester(requester)) {
        content()
    }
}
