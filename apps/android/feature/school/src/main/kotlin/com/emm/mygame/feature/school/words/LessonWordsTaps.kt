package com.emm.mygame.feature.school.words

internal data class LessonWordsTaps(val wordIndex: Int, val shownSupport: LessonWordsUiState.ShownSupport?) {

    companion object {
        val none: LessonWordsTaps = LessonWordsTaps(wordIndex = 0, shownSupport = null)
    }
}
