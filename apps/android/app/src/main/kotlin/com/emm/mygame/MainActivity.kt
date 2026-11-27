package com.emm.mygame

import android.app.UiModeManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.navigation.AppNavigation
import com.emm.mygame.navigation.mailedLinkOf
import com.emm.mygame.theme.PickedTheme
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val reminderTaps: Channel<Unit> = Channel(Channel.BUFFERED)

    private val mailedLinks: Channel<Destination.MailedLink> = Channel(Channel.BUFFERED)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) take(intent)
        val dependencies: AppDependencies = application as AppDependencies
        val taps: Flow<Unit> = reminderTaps.receiveAsFlow()
        val links: Flow<Destination.MailedLink> = mailedLinks.receiveAsFlow()
        lifecycleScope.launch { dependencies.themes.pick.collect(::followNightMode) }
        setContent {
            val pick: ThemePick by dependencies.themes.pick.collectAsStateWithLifecycle()
            PickedTheme(pick = pick) {
                AppNavigation(dependencies = dependencies, reminderTaps = taps, mailedLinks = links)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        take(intent)
    }

    private fun followNightMode(pick: ThemePick) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        getSystemService(UiModeManager::class.java).setApplicationNightMode(nightModeOf(pick))
    }

    private fun take(intent: Intent) {
        if (intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY != 0) return
        if (intent.getBooleanExtra(STUDY_REMINDER_TAP, false)) reminderTaps.trySend(Unit)
        mailedLinkOf(intent)?.let(mailedLinks::trySend)
    }

    companion object {
        const val STUDY_REMINDER_TAP: String = "study_reminder_tap"
    }
}

private fun nightModeOf(pick: ThemePick): Int = when (pick) {
    ThemePick.System -> UiModeManager.MODE_NIGHT_AUTO
    ThemePick.Light -> UiModeManager.MODE_NIGHT_NO
    ThemePick.Dark -> UiModeManager.MODE_NIGHT_YES
}
