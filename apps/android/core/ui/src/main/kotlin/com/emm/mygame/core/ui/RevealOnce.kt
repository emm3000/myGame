package com.emm.mygame.core.ui

import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier

@Composable
fun rememberRevealOnce(key: Any): Modifier {
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    val isRevealed: MutableState<Boolean> = rememberSaveable(key) { mutableStateOf(false) }
    LaunchedEffect(key) {
        if (isRevealed.value) return@LaunchedEffect
        requester.bringIntoView()
        isRevealed.value = true
    }
    return Modifier.bringIntoViewRequester(requester)
}
