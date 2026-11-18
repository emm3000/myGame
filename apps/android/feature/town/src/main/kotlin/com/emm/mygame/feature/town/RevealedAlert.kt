package com.emm.mygame.feature.town

import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert

@Composable
internal fun RevealedAlert(message: String, modifier: Modifier = Modifier) {
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    val isRevealed: MutableState<Boolean> = rememberSaveable(message) { mutableStateOf(false) }
    LaunchedEffect(message) {
        if (isRevealed.value) return@LaunchedEffect
        requester.bringIntoView()
        isRevealed.value = true
    }
    MyGameInlineAlert(message = message, modifier = modifier.bringIntoViewRequester(requester))
}
