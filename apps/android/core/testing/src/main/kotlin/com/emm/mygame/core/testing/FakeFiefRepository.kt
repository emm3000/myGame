package com.emm.mygame.core.testing

import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.UpgradeResult
import kotlinx.coroutines.channels.Channel

class FakeFiefRepository : FiefRepository {

    private val answers: Channel<FiefReadResult> = Channel(Channel.UNLIMITED)

    private val upgradeAnswers: Channel<UpgradeResult> = Channel(Channel.UNLIMITED)

    private val _upgrades: MutableList<Pair<FiefId, BuildingKind>> = mutableListOf()

    var readCount: Int = 0
        private set

    val upgrades: List<Pair<FiefId, BuildingKind>>
        get() = _upgrades.toList()

    fun answerRead(result: FiefReadResult) {
        answers.trySend(result)
    }

    fun answerUpgrade(result: UpgradeResult) {
        upgradeAnswers.trySend(result)
    }

    override suspend fun read(): FiefReadResult {
        readCount += 1
        return answers.receive()
    }

    override suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult {
        _upgrades += fief to building
        return upgradeAnswers.receive()
    }
}
