package com.emm.mygame.feature.fief

internal data class Mutations(
    val upgrade: FiefUiState.UpgradeStatus,
    val cancel: FiefUiState.CancelStatus,
    val study: FiefUiState.StudyStatus,
) {

    fun keptAfterRead(): Mutations = Mutations(
        upgrade = if (upgrade is FiefUiState.UpgradeStatus.Waiting) upgrade else FiefUiState.UpgradeStatus.Idle,
        cancel = if (cancel is FiefUiState.CancelStatus.Waiting) cancel else FiefUiState.CancelStatus.Idle,
        study = if (study == FiefUiState.StudyStatus.Waiting) study else FiefUiState.StudyStatus.Idle,
    )

    fun upgradeAnswered(): Mutations = keptAfterRead().copy(upgrade = FiefUiState.UpgradeStatus.Idle)

    fun cancelAnswered(): Mutations = keptAfterRead().copy(cancel = FiefUiState.CancelStatus.Idle)

    fun studyAnswered(status: FiefUiState.StudyStatus): Mutations = keptAfterRead().copy(study = status)

    companion object {
        val none: Mutations = Mutations(
            upgrade = FiefUiState.UpgradeStatus.Idle,
            cancel = FiefUiState.CancelStatus.Idle,
            study = FiefUiState.StudyStatus.Idle,
        )
    }
}
