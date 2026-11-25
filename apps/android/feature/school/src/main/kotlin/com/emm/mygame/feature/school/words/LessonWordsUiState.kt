package com.emm.mygame.feature.school.words

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration

sealed interface LessonWordsUiState {

    data object Loading : LessonWordsUiState

    data object Failed : LessonWordsUiState

    data object NothingToRead : LessonWordsUiState

    data class Reading(
        val name: LessonName,
        val theme: String?,
        val words: List<TownSnapshot.WordReading>,
        val index: Int,
        val remaining: Duration?,
        val wayOn: WayOn?,
        val shownSupport: ShownSupport?,
        val isNextStepThisLesson: Boolean,
    ) : LessonWordsUiState {

        val word: TownSnapshot.WordReading
            get() = words[index]

        val isLastWord: Boolean
            get() = index == words.lastIndex

        val isReturningToOpener: Boolean
            get() = isLastWord && wayOn == null && !isNextStepThisLesson

        val openSupport: WordSupport?
            get() = shownSupportOf()?.takeIf { support: WordSupport -> support.shown == WordSupport.Shown.OnTap }

        private fun shownSupportOf(): WordSupport? = when (shownSupport) {
            null -> null
            ShownSupport.Word -> word.support
            is ShownSupport.Frame -> word.frame.getOrNull(shownSupport.spanIndex)?.support
        }
    }

    sealed interface ShownSupport {

        data object Word : ShownSupport

        data class Frame(val spanIndex: Int) : ShownSupport
    }

    sealed interface WayOn {

        data class Lesson(val lesson: LessonId) : WayOn

        data object Reviews : WayOn
    }
}
