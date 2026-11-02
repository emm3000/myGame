package com.emm.mygame.core.testing

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.CancelResult
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.UpgradeResult
import kotlinx.coroutines.channels.Channel

class FakeFiefRepository : FiefRepository {

    private val answers: Channel<FiefReadResult> = Channel(Channel.UNLIMITED)

    private val upgradeAnswers: Channel<UpgradeResult> = Channel(Channel.UNLIMITED)

    private val cancelAnswers: Channel<CancelResult> = Channel(Channel.UNLIMITED)

    private val studyAnswers: Channel<StudyResult> = Channel(Channel.UNLIMITED)

    private val _studies: MutableList<StudyRequest> = mutableListOf()

    private val _upgrades: MutableList<Pair<FiefId, BuildingKind>> = mutableListOf()

    private val _cancels: MutableList<CancelRequest> = mutableListOf()

    var readCount: Int = 0
        private set

    val upgrades: List<Pair<FiefId, BuildingKind>>
        get() = _upgrades.toList()

    val cancels: List<CancelRequest>
        get() = _cancels.toList()

    val studies: List<StudyRequest>
        get() = _studies.toList()

    fun answerStudy(result: StudyResult) {
        studyAnswers.trySend(result)
    }

    fun answerRead(result: FiefReadResult) {
        answers.trySend(result)
    }

    fun answerUpgrade(result: UpgradeResult) {
        upgradeAnswers.trySend(result)
    }

    fun answerCancel(result: CancelResult) {
        cancelAnswers.trySend(result)
    }

    override suspend fun read(): FiefReadResult {
        readCount += 1
        return answers.receive()
    }

    override suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult {
        _upgrades += fief to building
        return upgradeAnswers.receive()
    }

    override suspend fun cancel(fief: FiefId, building: BuildingKind, targetLevel: Int): CancelResult {
        _cancels += CancelRequest(fief, building, targetLevel)
        return cancelAnswers.receive()
    }

    override suspend fun startStudy(fief: FiefId, art: ArtKind): StudyResult {
        _studies += StudyRequest.Start(fief, art)
        return studyAnswers.receive()
    }

    override suspend fun cancelStudy(fief: FiefId, art: ArtKind, targetLevel: Int): StudyResult {
        _studies += StudyRequest.Cancel(fief, art, targetLevel)
        return studyAnswers.receive()
    }

    sealed interface StudyRequest {

        data class Start(val fief: FiefId, val art: ArtKind) : StudyRequest

        data class Cancel(val fief: FiefId, val art: ArtKind, val targetLevel: Int) : StudyRequest
    }

    data class CancelRequest(val fief: FiefId, val building: BuildingKind, val targetLevel: Int)
}
