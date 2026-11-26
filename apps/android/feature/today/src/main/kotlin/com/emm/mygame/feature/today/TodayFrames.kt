package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.KeepGoingResult
import com.emm.mygame.core.model.learning.KeepGoingWord
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.ui.afterTapOn
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal class TodayFrames(
    private val frames: KeepGoingRepository,
    private val scope: CoroutineScope,
    private val onChange: () -> Unit,
    private val onNoTown: suspend () -> Unit,
) {

    private var isFresh: Boolean = false

    private var sentences: List<List<FrameSpan>> = emptyList()

    private var tapped: ReadingSpan? = null

    private var reading: Job? = null

    fun read(step: NextStep) {
        if (isFresh || !step.offersFrames() || reading?.isActive == true) return
        reading = scope.launch {
            when (val answer: KeepGoingResult = frames.readFrames()) {
                is KeepGoingResult.Read -> held(answer.words)
                KeepGoingResult.NoTown -> onNoTown()
                KeepGoingResult.Unreachable -> Unit
            }
            onChange()
        }
    }

    fun expire() {
        isFresh = false
    }

    fun tap(at: ReadingSpan) {
        tapped = tapped.afterTapOn(at)
        onChange()
    }

    fun offeredOn(step: NextStep): TodayUiState.KeepGoing? {
        val caughtUp: NextStep.CaughtUp = step as? NextStep.CaughtUp ?: return null
        caughtUp.text?.let { text: NextStepText -> return TodayUiState.KeepGoing.Text(text.id, text.title) }
        return if (sentences.isEmpty()) null else TodayUiState.KeepGoing.Frames(sentences, tapped)
    }

    private fun held(words: List<KeepGoingWord>) {
        isFresh = true
        sentences = words.flatMap(KeepGoingWord::frames)
        tapped = null
    }

    private fun NextStep.offersFrames(): Boolean = this is NextStep.CaughtUp && text == null
}
