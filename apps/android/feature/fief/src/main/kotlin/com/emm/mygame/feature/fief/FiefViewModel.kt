package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.CancelRefusal
import com.emm.mygame.core.network.CancelResult
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.RecruitRefusal
import com.emm.mygame.core.network.RecruitResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UpgradeResult
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class FiefViewModel(
    private val fiefs: FiefRepository,
    private val sessions: SessionRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<FiefUiState> = MutableStateFlow(FiefUiState.Loading)

    val state: StateFlow<FiefUiState> = _state.asStateFlow()

    private val _effects: Channel<FiefEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<FiefEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var shown: FiefSnapshot? = null

    private var mutations: Mutations = Mutations.none

    private var gap: Duration = Duration.ZERO

    init {
        open()
    }

    fun onIntent(intent: FiefIntent) {
        if (_state.value == FiefUiState.SigningOut) return
        when (intent) {
            FiefIntent.RetryTapped -> open()
            FiefIntent.SignOutTapped -> signOut()
            is FiefIntent.UpgradeTapped -> upgrade(intent.building)
            is FiefIntent.CancelTapped -> cancel(FiefUiState.UpgradeTarget(intent.building, intent.targetLevel))
            is FiefIntent.StudyTapped -> study { fief: FiefSnapshot -> fiefs.startStudy(fief.id, intent.art) }
            is FiefIntent.StudyCancelTapped -> study { fief: FiefSnapshot ->
                fiefs.cancelStudy(fief.id, intent.art, intent.targetLevel)
            }
            is FiefIntent.RecruitEntryChanged -> enter(intent.unit, intent.entry)
            is FiefIntent.RecruitTapped -> recruit(intent.unit)
            is FiefIntent.RecruitCancelTapped -> levy(intent.unit) { fief: FiefSnapshot ->
                fiefs.cancelRecruit(fief.id, intent.unit, intent.startedAt)
            }
        }
    }

    private fun open() {
        projection?.cancel()
        _state.value = FiefUiState.Loading
        projection = viewModelScope.launch {
            when (val answer: FiefReadResult = fiefs.read()) {
                FiefReadResult.Unreachable -> _state.value = FiefUiState.Failed
                is FiefReadResult.Read -> project(answer.fief)
            }
        }
    }

    private fun signOut() {
        viewModelScope.coroutineContext.cancelChildren()
        _state.value = FiefUiState.SigningOut
        viewModelScope.launch {
            sessions.signOut()
            _effects.send(FiefEffect.SignedOut)
        }
    }

    private fun upgrade(building: BuildingKind) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.upgrade is FiefUiState.UpgradeStatus.Waiting) return
        draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Waiting(building)))
        viewModelScope.launch {
            when (val answer: UpgradeResult = fiefs.upgrade(fief.id, building)) {
                is UpgradeResult.Upgraded -> restartFrom(answer.fief, mutations.upgradeAnswered())
                is UpgradeResult.Refused ->
                    draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Refused(building, answer.refusal)))
                UpgradeResult.Unreachable ->
                    draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Unreachable(building)))
            }
        }
    }

    private fun cancel(target: FiefUiState.UpgradeTarget) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.cancel is FiefUiState.CancelStatus.Waiting) return
        draw(mutations.copy(cancel = FiefUiState.CancelStatus.Waiting(target)))
        viewModelScope.launch {
            when (val answer: CancelResult = fiefs.cancel(fief.id, target.building, target.targetLevel)) {
                is CancelResult.Cancelled -> restartFrom(answer.fief, mutations.cancelAnswered())
                is CancelResult.Refused -> answerRefusedCancel(target, answer.refusal)
                CancelResult.Unreachable -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Unreachable(target)))
            }
        }
    }

    private fun study(call: suspend (FiefSnapshot) -> StudyResult) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.study == FiefUiState.StudyStatus.Waiting) return
        draw(mutations.copy(study = FiefUiState.StudyStatus.Waiting))
        viewModelScope.launch {
            when (val answer: StudyResult = call(fief)) {
                is StudyResult.Answered ->
                    restartFrom(answer.fief, mutations.studyAnswered(FiefUiState.StudyStatus.Idle))
                is StudyResult.Refused -> answerRefusedStudy(answer.refusal)
                StudyResult.Unreachable -> draw(mutations.copy(study = FiefUiState.StudyStatus.Unreachable))
            }
        }
    }

    private fun enter(unit: UnitKind, entry: String) {
        mutations = mutations.copy(recruitEntries = mutations.recruitEntries + (unit to entry))
        val fief: FiefSnapshot = shown ?: return
        if (_state.value !is FiefUiState.Content) return
        _state.value = fief.contentAt(now = clock.now() + gap, gap = gap, mutations = mutations)
    }

    private fun recruit(unit: UnitKind) {
        val count: Int = recruitCountOf(mutations.entryOf(unit)) ?: return
        levy(unit) { fief: FiefSnapshot -> fiefs.recruit(fief.id, unit, count) }
    }

    private fun levy(unit: UnitKind, call: suspend (FiefSnapshot) -> RecruitResult) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.recruit == FiefUiState.RecruitStatus.Waiting) return
        draw(mutations.copy(recruit = FiefUiState.RecruitStatus.Waiting))
        viewModelScope.launch {
            when (val answer: RecruitResult = call(fief)) {
                is RecruitResult.Answered ->
                    restartFrom(answer.fief, mutations.recruitAnswered(FiefUiState.RecruitStatus.Idle))
                is RecruitResult.Refused -> answerRefusedLevy(fief, unit, answer.refusal)
                RecruitResult.Unreachable -> draw(mutations.copy(recruit = FiefUiState.RecruitStatus.Unreachable))
            }
        }
    }

    private suspend fun answerRefusedLevy(fief: FiefSnapshot, unit: UnitKind, refusal: RecruitRefusal) {
        val refused: FiefUiState.RecruitStatus =
            FiefUiState.RecruitStatus.Refused(refusal, unit, fief.barracksLevelOf(unit))
        if (refusal != RecruitRefusal.RecruitOrderNotFound) return draw(mutations.copy(recruit = refused))
        when (val answer: FiefReadResult = fiefs.read()) {
            is FiefReadResult.Read -> restartFrom(answer.fief, mutations.recruitAnswered(refused))
            FiefReadResult.Unreachable -> draw(mutations.copy(recruit = refused))
        }
    }

    private suspend fun answerRefusedStudy(refusal: StudyRefusal) {
        val refused: FiefUiState.StudyStatus = FiefUiState.StudyStatus.Refused(refusal)
        if (refusal != StudyRefusal.StudyNotFound) return draw(mutations.copy(study = refused))
        when (val answer: FiefReadResult = fiefs.read()) {
            is FiefReadResult.Read -> restartFrom(answer.fief, mutations.studyAnswered(refused))
            FiefReadResult.Unreachable -> draw(mutations.copy(study = refused))
        }
    }

    private suspend fun answerRefusedCancel(target: FiefUiState.UpgradeTarget, refusal: CancelRefusal) {
        when (refusal) {
            CancelRefusal.UpgradeNotFound -> rereadAfterCancel(target)
            CancelRefusal.Unrecognized -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Refused(target)))
        }
    }

    private suspend fun rereadAfterCancel(target: FiefUiState.UpgradeTarget) {
        when (val answer: FiefReadResult = fiefs.read()) {
            is FiefReadResult.Read -> restartFrom(answer.fief, mutations.cancelAnswered())
            FiefReadResult.Unreachable -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Unreachable(target)))
        }
    }

    private fun restartFrom(snapshot: FiefSnapshot, kept: Mutations) {
        projection?.cancel()
        mutations = kept
        projection = viewModelScope.launch { project(snapshot) }
    }

    private fun draw(next: Mutations) {
        mutations = next
        _state.update { current: FiefUiState ->
            if (current is FiefUiState.Content) current.drawn(next) else current
        }
    }

    private suspend fun project(first: FiefSnapshot) {
        var snapshot: FiefSnapshot = first
        gap = serverGapOf(snapshot)
        while (true) {
            if (snapshot.nextFinishAt(clock.now() + gap) == Duration.ZERO) {
                val answer: FiefReadResult = fiefs.read()
                if (answer is FiefReadResult.Read) {
                    snapshot = answer.fief
                    gap = serverGapOf(snapshot)
                    mutations = mutations.keptAfterRead()
                }
            }
            val now: Instant = clock.now() + gap
            shown = snapshot
            _state.value = snapshot.contentAt(now = now, gap = gap, mutations = mutations)
            delay(repaintDelay(snapshot.nextFinishAt(now)))
        }
    }

    private fun FiefUiState.Content.drawn(next: Mutations): FiefUiState.Content = copy(
        upgrade = next.upgrade,
        cancel = next.cancel,
        library = library?.copy(study = next.study),
        army = army?.copy(recruit = next.recruit),
    )

    private fun serverGapOf(snapshot: FiefSnapshot): Duration = snapshot.readAt - clock.now()
}
