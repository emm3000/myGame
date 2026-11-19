package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.ui.rememberRevealOnce

@Composable
internal fun RevealedAlert(message: String, modifier: Modifier = Modifier) {
    MyGameInlineAlert(message = message, modifier = modifier.then(rememberRevealOnce(message)))
}
