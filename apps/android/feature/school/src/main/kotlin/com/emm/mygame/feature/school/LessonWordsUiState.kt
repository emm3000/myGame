package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport
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
    ) : LessonWordsUiState {

        val word: TownSnapshot.WordReading
            get() = words[index]

        val isLastWord: Boolean
            get() = index == words.lastIndex

        val openSupport: WordSupport?
            get() = shownSupportOf()?.takeIf { support: WordSupport -> support.shown == WordSupport.Shown.OnTap }

        private fun shownSupportOf(): WordSupport? = when (shownSupport) {
            null -> null
            ShownSupport.Word -> word.support
            is ShownSupport.Frame -> word.frame.getOrNull(shownSupport.span)?.support
        }
    }

    sealed interface ShownSupport {

        data object Word : ShownSupport

        data class Frame(val span: Int) : ShownSupport
    }

    sealed interface WayOn {

        data class Lesson(val lesson: LessonId) : WayOn

        data object Reviews : WayOn
    }
}
