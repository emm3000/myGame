package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownGuidanceResult
import com.emm.mygame.core.network.TownRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class TownGuidance(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val onClosed: () -> Unit,
) {

    var closed: ClosedGuidance = ClosedGuidance.none
        private set

    private var waiting: Set<GuidanceClose> = emptySet()

    private var unsent: Set<GuidanceClose> = emptySet()

    fun closeTip(tip: TipKind) {
        if (tip in closed.tips) return
        closed = closed.copy(tips = closed.tips + tip)
        onClosed()
        send(GuidanceClose.Tip(tip))
    }

    fun closeGoal() {
        if (closed.isGoalClosed) return
        closed = closed.copy(isGoalClosed = true)
        onClosed()
        send(GuidanceClose.Goal)
    }

    fun resendUnsent() {
        unsent.forEach(::send)
    }

    private fun send(close: GuidanceClose) {
        if (close in waiting) return
        waiting = waiting + close
        unsent = unsent - close
        scope.launch {
            val answer: TownGuidanceResult = when (close) {
                is GuidanceClose.Tip -> towns.markTipSeen(close.tip)
                GuidanceClose.Goal -> towns.dismissGuidance()
            }
            waiting = waiting - close
            if (answer == TownGuidanceResult.Unreachable) unsent = unsent + close
        }
    }

    private sealed interface GuidanceClose {

        data class Tip(val tip: TipKind) : GuidanceClose

        data object Goal : GuidanceClose
    }
}

internal data class ClosedGuidance(val tips: Set<TipKind>, val isGoalClosed: Boolean) {

    companion object {
        val none: ClosedGuidance = ClosedGuidance(tips = emptySet(), isGoalClosed = false)
    }
}
