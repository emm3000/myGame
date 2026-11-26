package com.emm.mygame.feature.school.text

import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.OpenText
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.ui.supportOpenAt

sealed interface SchoolTextUiState {

    data object Loading : SchoolTextUiState

    data object Failed : SchoolTextUiState

    data object NotOpen : SchoolTextUiState

    data class Reading(val text: OpenText, val tapped: ReadingSpan?) : SchoolTextUiState {

        val openSupport: WordSupport?
            get() = text.sentences.supportOpenAt(tapped)
    }
}
