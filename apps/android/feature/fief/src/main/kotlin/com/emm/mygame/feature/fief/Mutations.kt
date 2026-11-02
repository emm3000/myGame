package com.emm.mygame.feature.fief

internal data class Mutations(val upgrade: FiefUiState.UpgradeStatus, val cancel: FiefUiState.CancelStatus) {

    fun keptAfterRead(): Mutations = Mutations(
        upgrade = if (upgrade is FiefUiState.UpgradeStatus.Waiting) upgrade else FiefUiState.UpgradeStatus.Idle,
        cancel = if (cancel is FiefUiState.CancelStatus.Waiting) cancel else FiefUiState.CancelStatus.Idle,
    )

    fun upgradeAnswered(): Mutations = keptAfterRead().copy(upgrade = FiefUiState.UpgradeStatus.Idle)

    fun cancelAnswered(): Mutations = keptAfterRead().copy(cancel = FiefUiState.CancelStatus.Idle)

    companion object {
        val none: Mutations = Mutations(FiefUiState.UpgradeStatus.Idle, FiefUiState.CancelStatus.Idle)
    }
}
