package com.emm.mygame.feature.school.words

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.school.R

@Composable
internal fun WordActions(
    reading: LessonWordsUiState.Reading,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    when {
        !reading.isLastWord -> wayOn?.let { shown: LessonWordsUiState.WayOn ->
            MyGameNavRow(title = wayOnLabelOf(shown), onClick = { onWayOn(shown) }, modifier = modifier)
        }
        wayOn != null -> Unit
        else -> ReviewsFollow(onSchoolOpen = onSchoolOpen, modifier = modifier)
    }
}

@Composable
private fun ReviewsFollow(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.school_lesson_word_then),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameNavRow(title = chromeResource(R.string.school_go_to_school), onClick = onSchoolOpen)
    }
}
