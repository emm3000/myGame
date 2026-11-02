package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.UnitKind

internal data class Mutations(
    val upgrade: FiefUiState.UpgradeStatus,
    val cancel: FiefUiState.CancelStatus,
    val study: FiefUiState.StudyStatus,
    val recruit: FiefUiState.RecruitStatus,
    val recruitEntries: Map<UnitKind, String>,
) {

    fun keptAfterRead(): Mutations = Mutations(
        upgrade = if (upgrade is FiefUiState.UpgradeStatus.Waiting) upgrade else FiefUiState.UpgradeStatus.Idle,
        cancel = if (cancel is FiefUiState.CancelStatus.Waiting) cancel else FiefUiState.CancelStatus.Idle,
        study = if (study == FiefUiState.StudyStatus.Waiting) study else FiefUiState.StudyStatus.Idle,
        recruit = if (recruit == FiefUiState.RecruitStatus.Waiting) recruit else FiefUiState.RecruitStatus.Idle,
        recruitEntries = recruitEntries,
    )

    fun upgradeAnswered(): Mutations = keptAfterRead().copy(upgrade = FiefUiState.UpgradeStatus.Idle)

    fun cancelAnswered(): Mutations = keptAfterRead().copy(cancel = FiefUiState.CancelStatus.Idle)

    fun studyAnswered(status: FiefUiState.StudyStatus): Mutations = keptAfterRead().copy(study = status)

    fun recruitAnswered(status: FiefUiState.RecruitStatus): Mutations = keptAfterRead().copy(recruit = status)

    fun entryOf(unit: UnitKind): String = recruitEntries[unit] ?: FIRST_ENTRY

    companion object {
        val none: Mutations = Mutations(
            upgrade = FiefUiState.UpgradeStatus.Idle,
            cancel = FiefUiState.CancelStatus.Idle,
            study = FiefUiState.StudyStatus.Idle,
            recruit = FiefUiState.RecruitStatus.Idle,
            recruitEntries = emptyMap(),
        )

        private const val FIRST_ENTRY: String = "1"
    }
}
