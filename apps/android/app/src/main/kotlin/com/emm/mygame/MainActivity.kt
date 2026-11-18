package com.emm.mygame

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.projection.StudyReminderLine
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow

class MainActivity : ComponentActivity() {

    private val reminderTaps: Channel<StudyReminderLine> = Channel(Channel.BUFFERED)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) sendReminderTap(intent)
        val dependencies: AppDependencies = application as AppDependencies
        val taps: Flow<StudyReminderLine> = reminderTaps.receiveAsFlow()
        setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = taps)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        sendReminderTap(intent)
    }

    private fun sendReminderTap(intent: Intent) {
        if (intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY != 0) return
        val tapped: String = intent.getStringExtra(STUDY_REMINDER_LINE) ?: return
        val line: StudyReminderLine =
            StudyReminderLine.entries.firstOrNull { line: StudyReminderLine -> line.name == tapped } ?: return
        reminderTaps.trySend(line)
    }

    companion object {
        const val STUDY_REMINDER_LINE: String = "study_reminder_line"
    }
}
