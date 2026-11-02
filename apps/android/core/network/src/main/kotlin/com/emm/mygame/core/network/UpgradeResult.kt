package com.emm.mygame.core.network

sealed interface UpgradeResult {

    data class Upgraded(val fief: FiefSnapshot) : UpgradeResult

    data class Refused(val refusal: UpgradeRefusal) : UpgradeResult

    data object Unreachable : UpgradeResult
}
