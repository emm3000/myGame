package com.emm.mygame

import android.Manifest
import androidx.activity.compose.ManagedActivityResultLauncher
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

@Composable
internal fun rememberNotificationAsk(onAnswer: (Boolean) -> Unit): () -> Unit {
    val launcher: ManagedActivityResultLauncher<String, Boolean> =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission(), onAnswer)
    return remember(launcher) { { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) } }
}
