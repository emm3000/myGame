package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameWayOn
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.feature.school.R

@Composable
internal fun LessonWordsWayOn(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onDone: () -> Unit,
) {
    when (state) {
        LessonWordsUiState.Loading, LessonWordsUiState.Failed -> Unit
        is LessonWordsUiState.NothingToRead -> WayBack(nextStep = state.nextStep, onDone = onDone)
        is LessonWordsUiState.Reading ->
            ReadingWayOn(reading = state, onIntent = onIntent, onWayOn = onWayOn, onDone = onDone)
    }
}

@Composable
private fun ReadingWayOn(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onDone: () -> Unit,
) {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    when {
        !reading.isLastWord -> WayOnOf(label = chromeResource(R.string.school_lesson_word_next)) {
            onIntent(LessonWordsIntent.NextWordTapped)
        }
        wayOn != null -> WayOnOf(label = wayOnLabelOf(wayOn)) { onWayOn(wayOn) }
        reading.isReturningToOpener -> WayBack(nextStep = reading.nextStep, onDone = onDone)
        else -> WayOnOf(
            label = chromeResource(R.string.school_start_reviews),
            blockedReason = chromeResource(R.string.school_lesson_word_then),
        ) {}
    }
}

@Composable
private fun WayBack(nextStep: NextStepCard, onDone: () -> Unit) {
    MyGameWayOn(
        label = fixedLabel(R.string.school_continue),
        isBusy = false,
        busyDescription = chromeResource(R.string.school_waiting),
        onClick = onDone,
        verdict = { NextStepLine(nextStep = nextStep) },
    )
}

@Composable
private fun WayOnOf(label: MyGameLabel, blockedReason: MyGameLabel? = null, onClick: () -> Unit) {
    MyGameWayOn(
        label = label,
        isBusy = false,
        busyDescription = chromeResource(R.string.school_waiting),
        onClick = onClick,
        blockedReason = blockedReason,
    )
}
