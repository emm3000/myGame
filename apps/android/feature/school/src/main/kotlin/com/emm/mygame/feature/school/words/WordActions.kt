package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameOutlinedDoor
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.school.R

@Composable
internal fun WordActions(
    reading: LessonWordsUiState.Reading,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    modifier: Modifier = Modifier,
) {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    when {
        !reading.isLastWord -> wayOn?.let { shown: LessonWordsUiState.WayOn ->
            MyGameOutlinedDoor(label = wayOnLabelOf(shown), onClick = { onWayOn(shown) }, modifier = modifier)
        }
        reading.isWaitingForLessonEnd -> MyGameText(
            label = chromeResource(R.string.school_lesson_word_then),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
            modifier = modifier,
        )
        else -> Unit
    }
}
