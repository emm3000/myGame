package com.emm.mygame.feature.signin

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import com.emm.mygame.core.network.StudyReminderChoice

internal val firstReminder: SettingsUiState.Reminder = SettingsUiState.Reminder(
    isOn = StudyReminderChoice.firstChoice.isOn,
    time = StudyReminderChoice.firstChoice.time,
    ask = SettingsUiState.NotificationAsk.Untouched,
)

internal fun textStyleOf(composeRule: ComposeContentTestRule, text: String): TextStyle {
    val results: MutableList<TextLayoutResult> = mutableListOf()
    composeRule.onNode(hasText(text) and isHeading(), useUnmergedTree = true).fetchSemanticsNode()
        .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
    return results.first().layoutInput.style
}
