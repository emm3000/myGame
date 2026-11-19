package com.emm.mygame.feature.school

import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport

sealed interface SchoolTextUiState {

    data object Loading : SchoolTextUiState

    data object Failed : SchoolTextUiState

    data object NotOpen : SchoolTextUiState

    data class Reading(val text: TownSnapshot.OpenText, val tapped: SpanAt?) : SchoolTextUiState {

        val openSupport: WordSupport?
            get() = tapped?.let(::supportAt)?.takeIf(::isOnTap)

        private fun supportAt(at: SpanAt): WordSupport? =
            text.sentences.getOrNull(at.sentence)?.getOrNull(at.span)?.support

        private fun isOnTap(support: WordSupport): Boolean = support.shown == WordSupport.Shown.OnTap
    }

    data class SpanAt(val sentence: Int, val span: Int)
}
